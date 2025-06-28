
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Search, Users, Phone, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { ChatSessionListItem, ChatMessage } from "@/types";
import { 
  getAdminChatSessions, 
  getMessagesForSession, 
  sendAdminMessageAction,
  markMessagesAsReadByAdminAction
} from "@/actions/chatActions";

const POLLING_INTERVAL_MS = 5000; // Poll every 5 seconds

export default function AdminSupportPage() {
  const { data: session } = useSession();
  const adminId = session?.user?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [chatSessions, setChatSessions] = useState<ChatSessionListItem[]>([]);
  const [activeChatSession, setActiveChatSession] = useState<ChatSessionListItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const messagesRef = useRef<ChatMessage[]>(messages);
  const chatSessionsRef = useRef<ChatSessionListItem[]>(chatSessions);
  const activeChatSessionRef = useRef<ChatSessionListItem | null>(activeChatSession);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    chatSessionsRef.current = chatSessions;
  }, [chatSessions]);

  useEffect(() => {
    activeChatSessionRef.current = activeChatSession;
  }, [activeChatSession]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSelectChat = useCallback((sessionItem: ChatSessionListItem) => {
    setActiveChatSession(sessionItem);
    if (searchParams.get('chatId') !== sessionItem._id) {
      router.push(`/admin/support?chatId=${sessionItem._id}`, { scroll: false });
    }
  }, [router, searchParams]);


  const fetchMessages = useCallback(async (sessionId: string) => {
    if (!adminId) return;
    if (!messagesRef.current || !Array.isArray(messagesRef.current) || messagesRef.current.length === 0 || activeChatSessionRef.current?._id !== sessionId) {
      setIsLoadingMessages(true);
    }
    
    try {
      const newFetchedMessages = await getMessagesForSession(sessionId);
      if (JSON.stringify(newFetchedMessages) !== JSON.stringify(messagesRef.current)) {
        setMessages(newFetchedMessages || []);
      }
      
      const currentActiveSession = activeChatSessionRef.current;
      if (currentActiveSession && currentActiveSession._id === sessionId && currentActiveSession.adminUnreadCount > 0) {
         await markMessagesAsReadByAdminAction(sessionId, adminId);
         setChatSessions(prev => Array.isArray(prev) ? prev.map(s => s._id === sessionId ? {...s, adminUnreadCount: 0} : s) : []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({ title: "Error", description: "Could not fetch messages.", variant: "destructive" });
    } finally {
      setIsLoadingMessages(false);
    }
  }, [adminId, toast]);

  const fetchSessions = useCallback(async (isInitialLoad = false) => {
    if (!adminId) return;
    if (isInitialLoad) setIsLoadingSessions(true);

    try {
      const newSessions = await getAdminChatSessions();
      if (JSON.stringify(newSessions) !== JSON.stringify(chatSessionsRef.current)) {
        setChatSessions(newSessions || []);
      }

      const urlChatId = searchParams.get('chatId');
      const currentSessions = newSessions || chatSessionsRef.current || [];

      if (urlChatId) {
        const currentActiveId = activeChatSessionRef.current?._id;
        const sessionToSelect = Array.isArray(currentSessions) ? currentSessions.find(s => s._id === urlChatId) : undefined;

        if (sessionToSelect && urlChatId !== currentActiveId) {
            handleSelectChat(sessionToSelect);
        } else if (!activeChatSessionRef.current && sessionToSelect) {
            handleSelectChat(sessionToSelect);
        }
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({ title: "Error", description: "Could not fetch chat sessions.", variant: "destructive" });
    } finally {
      if (isInitialLoad) setIsLoadingSessions(false);
    }
  }, [adminId, toast, searchParams, handleSelectChat]);


  useEffect(() => {
    if (adminId) {
      fetchSessions(true);
    }
  }, [adminId, fetchSessions]);

  useEffect(() => {
    if (!adminId) return;
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
         fetchSessions(false);
      }
    }, POLLING_INTERVAL_MS + 1000);
    return () => clearInterval(intervalId);
  }, [adminId, fetchSessions]);

  useEffect(() => {
    if (!adminId || !activeChatSession?._id) {
      setMessages([]);
      return;
    }
    
    let intervalId: NodeJS.Timeout;
    const currentSessionId = activeChatSession._id;

    fetchMessages(currentSessionId);

    const pollMessages = () => {
      if (document.visibilityState === 'visible' && activeChatSessionRef.current?._id === currentSessionId) {
        fetchMessages(currentSessionId);
      }
    };
    intervalId = setInterval(pollMessages, POLLING_INTERVAL_MS);
    
    return () => clearInterval(intervalId);
  }, [adminId, activeChatSession?._id, fetchMessages]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatSession?._id || !adminId) return;
    
    setIsSendingMessage(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      _id: tempId,
      sessionId: activeChatSession._id,
      senderId: adminId,
      senderType: 'admin',
      text: newMessage,
      timestamp: new Date(),
    };
    setMessages(prev => Array.isArray(prev) ? [...prev, optimisticMessage] : [optimisticMessage]);
    const messageToSend = newMessage;
    setNewMessage("");

    try {
      const response = await sendAdminMessageAction({
        sessionId: activeChatSession._id,
        adminId: adminId,
        text: messageToSend,
      });

      if (response.success && response.chatMessage) {
        setMessages(prev => Array.isArray(prev) ? prev.map(m => m._id === tempId ? response.chatMessage! : m) : [response.chatMessage]);
        setChatSessions(prevSessions => Array.isArray(prevSessions) ? prevSessions.map(s => 
            s._id === activeChatSession._id 
            ? {...s, lastMessage: response.chatMessage!.text.substring(0,50), lastMessageAt: response.chatMessage!.timestamp, lastMessageSenderType: 'admin', status: 'pending_customer_reply' } 
            : s
        ) : []);
      } else {
        toast({ title: "Error", description: response.message || "Failed to send message.", variant: "destructive" });
        setMessages(prev => Array.isArray(prev) ? prev.filter(m => m._id !== tempId) : []); 
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
      setMessages(prev => Array.isArray(prev) ? prev.filter(m => m._id !== tempId) : []); 
    } finally {
      setIsSendingMessage(false);
    }
  };

  const filteredChatSessions = Array.isArray(chatSessions) ? chatSessions.filter(session =>
    session.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];
  
  const getInitials = (name?: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  if (!adminId && session?.status !== "loading") {
    return <div className="flex items-center justify-center h-full"><p>User session not found. Please login.</p></div>;
  }
  if (session?.status === "loading") {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-accent" /> <p className="ml-2">Loading user session...</p></div>;
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      <Card className="w-1/3 shadow-lg flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5 text-accent" /> Customer Chats</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <ScrollArea className="flex-grow">
          <CardContent className="p-0">
            {isLoadingSessions && <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin text-accent mx-auto" /></div>}
            {!isLoadingSessions && (!Array.isArray(filteredChatSessions) || filteredChatSessions.length === 0) && (
              <p className="p-4 text-center text-muted-foreground">No chat sessions found.</p>
            )}
            {Array.isArray(filteredChatSessions) && filteredChatSessions.map(chat => (
              <div 
                key={chat._id} 
                className={`flex items-center gap-3 p-3 border-b border-border cursor-pointer hover:bg-muted/50 ${chat._id === activeChatSession?._id ? 'bg-secondary' : ''}`}
                onClick={() => handleSelectChat(chat)}
              >
                <Avatar>
                  <AvatarImage src={`https://placehold.co/40x40.png?text=${getInitials(chat.customerName)}`} alt={chat.customerName || 'Customer'} data-ai-hint="avatar person"/>
                  <AvatarFallback>{getInitials(chat.customerName)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow overflow-hidden">
                  <p className="font-medium text-sm truncate">{chat.customerName || 'Unknown Customer'}</p>
                  <p className="text-xs text-muted-foreground truncate">{chat.lastMessage || 'No messages yet'}</p>
                </div>
                {chat.adminUnreadCount > 0 && <Badge className="bg-accent text-accent-foreground">{chat.adminUnreadCount}</Badge>}
              </div>
            ))}
          </CardContent>
        </ScrollArea>
      </Card>

      <Card className="w-2/3 shadow-lg flex flex-col">
        {activeChatSession ? (
          <>
            <CardHeader className="flex flex-row justify-between items-center border-b border-border">
              <div>
                <CardTitle>{activeChatSession.customerName || 'Unknown Customer'}</CardTitle>
                <CardDescription>{activeChatSession.customerEmail || 'No Email'} - Status: {activeChatSession.status}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" disabled><Phone className="h-5 w-5 text-muted-foreground" /></Button>
            </CardHeader>
            <ScrollArea className="flex-grow p-4 space-y-4 bg-muted/20">
              {isLoadingMessages && (!Array.isArray(messages) || messages.length === 0) && <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin text-accent mx-auto" /></div>}
              {!isLoadingMessages && (!Array.isArray(messages) || messages.length === 0) && <p className="text-center text-muted-foreground">No messages in this chat yet.</p>}
              {Array.isArray(messages) && messages.map((msg) => (
                <div key={msg._id} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-lg shadow ${msg.senderType === 'admin' ? 'bg-accent text-accent-foreground' : 'bg-card'}`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${msg.senderType === 'admin' ? 'text-accent-foreground/70 text-right' : 'text-muted-foreground text-left'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </ScrollArea>
            <CardContent className="p-4 border-t border-border">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Textarea 
                  placeholder="Type your message..." 
                  className="flex-grow resize-none" 
                  rows={1}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={isSendingMessage || (isLoadingMessages && (!Array.isArray(messages) || messages.length === 0))}
                />
                <Button type="submit" size="icon" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSendingMessage || (isLoadingMessages && (!Array.isArray(messages) || messages.length === 0)) || !newMessage.trim()}>
                  {isSendingMessage ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
                </Button>
              </form>
            </CardContent>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4" />
            <p className="text-lg">Select a chat to start messaging</p>
             {isLoadingSessions && <Loader2 className="mt-4 h-8 w-8 animate-spin text-accent"/>}
          </div>
        )}
      </Card>
    </div>
  );
}

    