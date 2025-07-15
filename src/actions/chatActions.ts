
'use server';

import { connectToDatabase } from '@/lib/mongodb';
import type { ChatSession, ChatMessage, UserDocument, ChatSessionListItem } from '@/types';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const SendMessageInputSchema = z.object({
  sessionId: z.string().refine(val => ObjectId.isValid(val), { message: "Invalid session ID" }),
  senderId: z.string().refine(val => ObjectId.isValid(val), { message: "Invalid sender ID" }),
  senderType: z.enum(['admin', 'customer']),
  text: z.string().min(1, "Message text cannot be empty.").max(2000, "Message too long."),
});

const EnsureAdminSessionInputSchema = z.object({
  customerId: z.string().refine(val => ObjectId.isValid(val), { message: "Invalid customer ID" }),
  adminId: z.string().refine(val => ObjectId.isValid(val), { message: "Invalid admin ID" }),
});

const EnsureCustomerSessionInputSchema = z.object({
  customerId: z.string().refine(val => ObjectId.isValid(val), { message: "Invalid customer ID" }),
});

const MarkMessagesAsReadInputSchema = z.object({
  sessionId: z.string().refine(val => ObjectId.isValid(val), { message: "Invalid session ID" }),
  userId: z.string().refine(val => ObjectId.isValid(val), { message: "Invalid user ID" }), // Generic user ID
});


export type SendMessageActionResponse = {
  success: boolean;
  message: string;
  chatMessage?: ChatMessage;
};

export type EnsureSessionActionResponse = {
  success: boolean;
  message: string;
  sessionId?: string;
  isNew?: boolean;
};

export async function getAdminChatSessions(): Promise<ChatSessionListItem[]> {
  try {
    const { db } = await connectToDatabase();
    const sessionsCollection = db.collection<ChatSession>('chatSessions');
    
    const sessions = await sessionsCollection.find({})
      .sort({ updatedAt: -1 })
      .toArray();

    return sessions.map(s => ({
      ...s,
      _id: s._id!.toString(),
      customerId: s.customerId.toString(),
      adminId: s.adminId ? s.adminId.toString() : null,
    }));
  } catch (error) {
    console.error("Error fetching admin chat sessions:", error);
    return [];
  }
}

export async function getCustomerChatSessions(customerId: string): Promise<ChatSessionListItem[]> {
  if (!ObjectId.isValid(customerId)) {
    console.error("Invalid customer ID for getCustomerChatSessions:", customerId);
    return [];
  }
  try {
    const { db } = await connectToDatabase();
    const sessionsCollection = db.collection<ChatSession>('chatSessions');
    
    const sessions = await sessionsCollection.find({ customerId: new ObjectId(customerId) })
      .sort({ updatedAt: -1 })
      .toArray();

    return sessions.map(s => ({
      ...s,
      _id: s._id!.toString(),
      customerId: s.customerId.toString(),
      adminId: s.adminId ? s.adminId.toString() : null,
    }));
  } catch (error) {
    console.error(`Error fetching chat sessions for customer ${customerId}:`, error);
    return [];
  }
}


export async function getMessagesForSession(sessionId: string): Promise<ChatMessage[]> {
  if (!ObjectId.isValid(sessionId)) {
    console.error("Invalid session ID for getMessagesForSession:", sessionId);
    return [];
  }
  try {
    const { db } = await connectToDatabase();
    const messagesCollection = db.collection('chatMessages'); // Use raw collection
    const messages = await messagesCollection.find({ sessionId: new ObjectId(sessionId) })
      .sort({ timestamp: 1 })
      .toArray();
    
    return messages.map(m => ({
      ...m,
      _id: m._id.toString(),
      sessionId: m.sessionId.toString(),
      senderId: m.senderId.toString(),
    })) as ChatMessage[];
  } catch (error) {
    console.error(`Error fetching messages for session ${sessionId}:`, error);
    return [];
  }
}

export async function sendAdminMessageAction(input: {
  sessionId: string;
  adminId: string; 
  text: string;
}): Promise<SendMessageActionResponse> {
  
  const parsedInput = SendMessageInputSchema.safeParse({
    sessionId: input.sessionId,
    senderId: input.adminId,
    senderType: 'admin',
    text: input.text,
  });

  if (!parsedInput.success) {
    return { success: false, message: "Invalid input: " + parsedInput.error.flatten().fieldErrors };
  }
  const { sessionId, senderId, senderType, text } = parsedInput.data;

  try {
    const { db } = await connectToDatabase();
    const messagesCollection = db.collection('chatMessages');
    const sessionsCollection = db.collection<ChatSession>('chatSessions');

    const sessionObjectId = new ObjectId(sessionId);
    const senderObjectId = new ObjectId(senderId);

    const session = await sessionsCollection.findOne({ _id: sessionObjectId });
    if (!session) {
      return { success: false, message: "Chat session not found." };
    }

    const newMessageDocument = {
      sessionId: sessionObjectId,
      senderId: senderObjectId,
      senderType: senderType,
      text: text,
      timestamp: new Date(),
    };
    const messageResult = await messagesCollection.insertOne(newMessageDocument);
    if (!messageResult.insertedId) {
      return { success: false, message: "Failed to send message." };
    }

    const updateSessionResult = await sessionsCollection.updateOne(
      { _id: sessionObjectId },
      {
        $set: {
          lastMessage: text.substring(0, 100), 
          lastMessageAt: newMessageDocument.timestamp,
          lastMessageSenderType: senderType,
          status: 'pending_customer_reply', 
          updatedAt: new Date(),
          adminId: senderObjectId, 
          customerUnreadCount: 0, // Admin clears customer's unread when replying effectively
        },
        $inc: {
          customerUnreadCount: 1, 
        }
      }
    );

    if (updateSessionResult.modifiedCount === 0) {
        console.warn("Session last message details might not have been updated for session:", sessionId);
    }
    
    revalidatePath(`/admin/support`); 
    revalidatePath(`/admin/support?chatId=${sessionId}`);
    revalidatePath(`/profile/support`);
    revalidatePath(`/profile/support?chatId=${sessionId}`);


    const insertedMessage: ChatMessage = {
      _id: messageResult.insertedId.toString(),
      sessionId: newMessageDocument.sessionId.toString(),
      senderId: newMessageDocument.senderId.toString(),
      senderType: newMessageDocument.senderType,
      text: newMessageDocument.text,
      timestamp: newMessageDocument.timestamp,
    };

    return { success: true, message: "Message sent.", chatMessage: insertedMessage };

  } catch (error) {
    console.error("Error in sendAdminMessageAction:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function sendCustomerMessageAction(input: {
  sessionId: string;
  customerId: string; 
  text: string;
}): Promise<SendMessageActionResponse> {
  
  const parsedInput = SendMessageInputSchema.safeParse({
    sessionId: input.sessionId,
    senderId: input.customerId,
    senderType: 'customer',
    text: input.text,
  });

  if (!parsedInput.success) {
    return { success: false, message: "Invalid input: " + parsedInput.error.flatten().fieldErrors };
  }
  const { sessionId, senderId, senderType, text } = parsedInput.data;

  try {
    const { db } = await connectToDatabase();
    const messagesCollection = db.collection('chatMessages');
    const sessionsCollection = db.collection<ChatSession>('chatSessions');

    const sessionObjectId = new ObjectId(sessionId);
    const senderObjectId = new ObjectId(senderId);

    const session = await sessionsCollection.findOne({ _id: sessionObjectId, customerId: senderObjectId });
    if (!session) {
      return { success: false, message: "Chat session not found or you do not have access." };
    }

    const newMessageDocument = {
      sessionId: sessionObjectId,
      senderId: senderObjectId,
      senderType: senderType,
      text: text,
      timestamp: new Date(),
    };
    const messageResult = await messagesCollection.insertOne(newMessageDocument);
    if (!messageResult.insertedId) {
      return { success: false, message: "Failed to send message." };
    }

    const updateSessionResult = await sessionsCollection.updateOne(
      { _id: sessionObjectId },
      {
        $set: {
          lastMessage: text.substring(0, 100),
          lastMessageAt: newMessageDocument.timestamp,
          lastMessageSenderType: senderType,
          status: 'pending_admin_reply', 
          updatedAt: new Date(),
          adminUnreadCount: 0, // Customer clears admin unread when replying effectively
        },
        $inc: {
          adminUnreadCount: 1, 
        }
      }
    );

    if (updateSessionResult.modifiedCount === 0) {
        console.warn("Session last message details might not have been updated for session:", sessionId);
    }
    
    revalidatePath(`/admin/support`);
    revalidatePath(`/admin/support?chatId=${sessionId}`);
    revalidatePath(`/profile/support`); 
    revalidatePath(`/profile/support?chatId=${sessionId}`);

    const insertedMessage: ChatMessage = {
      _id: messageResult.insertedId.toString(),
      sessionId: newMessageDocument.sessionId.toString(),
      senderId: newMessageDocument.senderId.toString(),
      senderType: newMessageDocument.senderType,
      text: newMessageDocument.text,
      timestamp: newMessageDocument.timestamp,
    };

    return { success: true, message: "Message sent.", chatMessage: insertedMessage };

  } catch (error) {
    console.error("Error in sendCustomerMessageAction:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}


export async function ensureChatSessionWithCustomer(input: {
  customerId: string;
  adminId: string; 
}): Promise<EnsureSessionActionResponse> {

  const parsedInput = EnsureAdminSessionInputSchema.safeParse(input);
  if (!parsedInput.success) {
     return { success: false, message: "Invalid input: " + parsedInput.error.flatten().fieldErrors };
  }
  const { customerId, adminId } = parsedInput.data;

  try {
    const { db } = await connectToDatabase();
    const sessionsCollection = db.collection<ChatSession>('chatSessions');
    const usersCollection = db.collection<UserDocument>('users');

    const customerObjectId = new ObjectId(customerId);
    const adminObjectId = new ObjectId(adminId);

    const customer = await usersCollection.findOne({ _id: customerObjectId });
    if (!customer) {
      return { success: false, message: "Customer not found." };
    }

    let session = await sessionsCollection.findOne({ customerId: customerObjectId, status: { $ne: 'closed_by_customer' as any } }); // Find active or admin-closed sessions

    if (session) {
      await sessionsCollection.updateOne(
        { _id: session._id },
        { $set: { adminId: adminObjectId, adminUnreadCount: 0, updatedAt: new Date(), status: session.status === 'closed_by_admin' ? 'open' : session.status } } 
      );
      return { success: true, message: "Existing session found.", sessionId: session._id!.toString(), isNew: false };
    } else {
      const newSessionDocument = {
        customerId: customerObjectId,
        customerName: customer.name,
        customerEmail: customer.email,
        adminId: adminObjectId,
        lastMessage: "Chat initiated by admin.",
        lastMessageAt: new Date(),
        lastMessageSenderType: 'admin' as const,
        customerUnreadCount: 1, 
        adminUnreadCount: 0,
        status: 'pending_customer_reply' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await sessionsCollection.insertOne(newSessionDocument);
      if (!result.insertedId) {
        return { success: false, message: "Failed to create chat session." };
      }
      revalidatePath('/admin/support');
      revalidatePath('/profile/support');
      return { success: true, message: "Chat session created.", sessionId: result.insertedId.toString(), isNew: true };
    }
  } catch (error) {
    console.error("Error in ensureChatSessionWithCustomer (admin initiating):", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function ensureCustomerChatSession(input: { customerId: string }): Promise<EnsureSessionActionResponse> {
    const parsedInput = EnsureCustomerSessionInputSchema.safeParse(input);
    if (!parsedInput.success) {
        return { success: false, message: "Invalid input: " + parsedInput.error.flatten().fieldErrors };
    }
    const { customerId } = parsedInput.data;

    try {
        const { db } = await connectToDatabase();
        const sessionsCollection = db.collection<ChatSession>('chatSessions');
        const usersCollection = db.collection<UserDocument>('users');

        const customerObjectId = new ObjectId(customerId);

        const customer = await usersCollection.findOne({ _id: customerObjectId });
        if (!customer) {
            return { success: false, message: "Customer not found." };
        }

        let session = await sessionsCollection.findOne({ 
            customerId: customerObjectId, 
            status: { $in: ['open', 'pending_admin_reply', 'pending_customer_reply'] } 
        });

        if (session) {
            await sessionsCollection.updateOne(
                { _id: session._id },
                { $set: { customerUnreadCount: 0, updatedAt: new Date() } }
            );
            return { success: true, message: "Active session found.", sessionId: session._id!.toString(), isNew: false };
        } else {
            const newSessionDocument = {
                customerId: customerObjectId,
                customerName: customer.name,
                customerEmail: customer.email,
                adminId: null, 
                lastMessage: "Chat session started.",
                lastMessageAt: new Date(),
                lastMessageSenderType: 'customer' as const, 
                customerUnreadCount: 0,
                adminUnreadCount: 1, 
                status: 'pending_admin_reply' as const, 
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            const result = await sessionsCollection.insertOne(newSessionDocument);
            if (!result.insertedId) {
                return { success: false, message: "Failed to create chat session." };
            }
            revalidatePath('/admin/support');
            revalidatePath('/profile/support');
            return { success: true, message: "New chat session created.", sessionId: result.insertedId.toString(), isNew: true };
        }
    } catch (error) {
        console.error("Error in ensureCustomerChatSession:", error);
        return { success: false, message: "An unexpected error occurred while starting chat." };
    }
}


export async function markMessagesAsReadByAdminAction(sessionId: string, adminId: string): Promise<{success: boolean, message: string}> {
    const parsedInput = MarkMessagesAsReadInputSchema.safeParse({ sessionId, userId: adminId });
    if (!parsedInput.success) {
        return { success: false, message: "Invalid input: " + parsedInput.error.flatten().fieldErrors };
    }
    
    try {
        const { db } = await connectToDatabase();
        const sessionsCollection = db.collection<ChatSession>('chatSessions');
        
        const sessionUpdateResult = await sessionsCollection.updateOne(
            { _id: new ObjectId(parsedInput.data.sessionId) },
            { 
                $set: { adminUnreadCount: 0, updatedAt: new Date() },
            }
        );

        if (sessionUpdateResult.matchedCount === 0) {
            return { success: false, message: "Session not found for marking messages as read." };
        }
        
        revalidatePath(`/admin/support`);
        revalidatePath(`/admin/support?chatId=${parsedInput.data.sessionId}`);
        revalidatePath(`/profile/support`);
        revalidatePath(`/profile/support?chatId=${parsedInput.data.sessionId}`);

        return { success: true, message: "Messages marked as read by admin." };
    } catch (error) {
        console.error("Error in markMessagesAsReadByAdmin:", error);
        return { success: false, message: "Failed to mark messages as read." };
    }
}

export async function markMessagesAsReadByCustomerAction(sessionId: string, customerId: string): Promise<{success: boolean, message: string}> {
    const parsedInput = MarkMessagesAsReadInputSchema.safeParse({ sessionId, userId: customerId });
    if (!parsedInput.success) {
        return { success: false, message: "Invalid input: " + parsedInput.error.flatten().fieldErrors };
    }

    try {
        const { db } = await connectToDatabase();
        const sessionsCollection = db.collection<ChatSession>('chatSessions');
        
        const sessionUpdateResult = await sessionsCollection.updateOne(
            { _id: new ObjectId(parsedInput.data.sessionId), customerId: new ObjectId(parsedInput.data.userId) },
            { 
                $set: { customerUnreadCount: 0, updatedAt: new Date() }
            }
        );

        if (sessionUpdateResult.matchedCount === 0) {
            return { success: false, message: "Session not found or not authorized." };
        }
        
        revalidatePath(`/admin/support`);
        revalidatePath(`/admin/support?chatId=${parsedInput.data.sessionId}`);
        revalidatePath(`/profile/support`);
        revalidatePath(`/profile/support?chatId=${parsedInput.data.sessionId}`);

        return { success: true, message: "Messages marked as read by customer." };
    } catch (error) {
        console.error("Error in markMessagesAsReadByCustomer:", error);
        return { success: false, message: "Failed to mark messages as read." };
    }
}
