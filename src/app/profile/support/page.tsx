
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // AvatarImage removed as not used for customer
import { MessageSquare, Send, Search, LifeBuoy, Loader2, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { ChatSessionListItem, ChatMessage } from "@/types";
import { 
  getCustomerChatSessions, 
  getMessagesForSession, 
  sendCustomerMessageAction,
  markMessagesAsReadByCustomerAction,
  ensureCustomerChatSession
} from "@/actions/chatActions";

const POLLING_INTERVAL_MS = 5000; 

export default function CustomerSupportPage() {
  const { data: session, status: sessionStatus } = useSession();
  const customerId = session?.user?.id;
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
  const [isStartingNewChat, setIsStartingNewChat] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const messagesRef = useRef<ChatMessage[]>(messages);
  const chatSessionsRef = useRef<ChatSessionListItem[]>(chatSessions);
  const activeChatSessionRef = useRef<ChatSessionListItem | null>(activeChatSession);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { chatSessionsRef.current = chatSessions; }, [chatSessions]);
  useEffect(() => { activeChatSessionRef.current = activeChatSession; }, [activeChatSession]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const handleSelectChat = useCallback((sessionItem: ChatSessionListItem) => {
    setActiveChatSession(sessionItem);
    if (searchParams.get('chatId') !== sessionItem._id) {
      router.push(`/profile/support?chatId=${sessionItem._id}`, { scroll: false });
    }
  }, [router, searchParams]);

  const fetchMessages = useCallback(async (sessionId: string) => {
    if (!customerId) return;
    if (!messagesRef.current.length || activeChatSessionRef.current?._id !== sessionId) {
      setIsLoadingMessages(true);
    }
    
    try {
      const newFetchedMessages = await getMessagesForSession(sessionId);
      if (JSON.stringify(newFetchedMessages) !== JSON.stringify(messagesRef.current)) {
        setMessages(newFetchedMessages);
      }
      
      const currentActiveSession = activeChatSessionRef.current;
      if (currentActiveSession && currentActiveSession._id === sessionId && currentActiveSession.customerUnreadCount > 0) {
         await markMessagesAsReadByCustomerAction(sessionId, customerId);
         setChatSessions(prev => prev.map(s => s._id === sessionId ? {...s, customerUnreadCount: 0} : s));
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({ title: "Error", description: "Could not fetch messages.", variant: "destructive" });
    } finally {
      setIsLoadingMessages(false);
    }
  }, [customerId, toast]);

  const fetchSessions = useCallback(async (isInitialLoad = false) => {
    if (!customerId) return;
    if (isInitialLoad) setIsLoadingSessions(true);

    try {
      const newSessions = await getCustomerChatSessions(customerId);
      if (JSON.stringify(newSessions) !== JSON.stringify(chatSessionsRef.current)) {
        setChatSessions(newSessions);
      }

      const urlChatId = searchParams.get('chatId');
      if (urlChatId) {
        const currentActiveId = activeChatSessionRef.current?._id;
        const sessionToSelect = newSessions.find(s => s._id === urlChatId);

        if (sessionToSelect && urlChatId !== currentActiveId) {
            handleSelectChat(sessionToSelect);
        } else if (!activeChatSessionRef.current && newSessions.length > 0 && !sessionToSelect) {
             // If no chatId in URL but sessions exist, select the first one
             // handleSelectChat(newSessions[0]); 
             // Or, if a specific one was intended from URL and it's found:
            if (sessionToSelect) handleSelectChat(sessionToSelect);
        } else if (!activeChatSessionRef.current && sessionToSelect) {
             handleSelectChat(sessionToSelect);
        }
      } else if (isInitialLoad && newSessions.length > 0 && !activeChatSessionRef.current) {
        // If no chat ID in URL on initial load, and sessions exist, select the first one
        // handleSelectChat(newSessions[0]); // Commented out to avoid auto-selecting first chat
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast({ title: "Error", description: "Could not fetch your chat sessions.", variant: "destructive" });
    } finally {
      if (isInitialLoad) setIsLoadingSessions(false);
    }
  }, [customerId, toast, searchParams, handleSelectChat]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && customerId) {
      fetchSessions(true);
    } else if (sessionStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile/support');
    }
  }, [sessionStatus, customerId, fetchSessions, router]);

  useEffect(() => {
    if (!customerId) return;
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
         fetchSessions(false);
      }
    }, POLLING_INTERVAL_MS + 1000); 
    return () => clearInterval(intervalId);
  }, [customerId, fetchSessions]);

  useEffect(() => {
    if (!customerId || !activeChatSession?._id) {
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
  }, [customerId, activeChatSession?._id, fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatSession?._id || !customerId) return;
    
    setIsSendingMessage(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      _id: tempId,
      sessionId: activeChatSession._id,
      senderId: customerId,
      senderType: 'customer',
      text: newMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, optimisticMessage]);
    const messageToSend = newMessage;
    setNewMessage("");

    try {
      const response = await sendCustomerMessageAction({
        sessionId: activeChatSession._id,
        customerId: customerId,
        text: messageToSend,
      });

      if (response.success && response.chatMessage) {
        setMessages(prev => prev.map(m => m._id === tempId ? response.chatMessage! : m));
        setChatSessions(prevSessions => prevSessions.map(s => 
            s._id === activeChatSession._id 
            ? {...s, lastMessage: response.chatMessage!.text.substring(0,50), lastMessageAt: response.chatMessage!.timestamp, lastMessageSenderType: 'customer', status: 'pending_admin_reply' } 
            : s
        ));
      } else {
        toast({ title: "Error", description: response.message || "Failed to send message.", variant: "destructive" });
        setMessages(prev => prev.filter(m => m._id !== tempId)); 
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
      setMessages(prev => prev.filter(m => m._id !== tempId)); 
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleStartNewChat = async () => {
    if (!customerId) return;
    setIsStartingNewChat(true);
    try {
      const response = await ensureCustomerChatSession({ customerId });
      if (response.success && response.sessionId) {
        toast({ title: response.isNew ? "New Chat Started" : "Existing Chat Opened", description: response.message });
        // Fetch sessions again to update the list, then select the new/existing one
        await fetchSessions(false);
        const newSession = chatSessionsRef.current.find(s => s._id === response.sessionId);
        if (newSession) {
            handleSelectChat(newSession);
        } else {
            // If not immediately found, push to URL, useEffect will pick it up.
            router.push(`/profile/support?chatId=${response.sessionId}`, { scroll: false });
        }
      } else {
        toast({ title: "Error", description: response.message || "Could not start chat.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsStartingNewChat(false);
    }
  };


  const filteredChatSessions = chatSessions.filter(session =>
    session.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(session.lastMessageAt || session.createdAt).toLocaleDateString().includes(searchTerm)
  );
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  if (sessionStatus === "loading") {
    return <div className="flex items-center justify-center h-[calc(100vh-10rem)]"><Loader2 className="h-12 w-12 animate-spin text-accent" /> <p className="ml-3 text-lg">Loading your support hub...</p></div>;
  }
  if (sessionStatus === 'unauthenticated') {
     // router.push handled in useEffect
    return <div className="flex items-center justify-center h-[calc(100vh-10rem)]"><p className="text-lg">Please log in to access support.</p></div>;
  }


  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-headline font-bold text-gray-700 mb-8">My Support Chats</h1>
      <div className="flex flex-col md:flex-row h-[calc(100vh-15rem)] gap-6">
        <Card className="w-full md:w-1/3 shadow-lg flex flex-col">
          <CardHeader className="flex-row justify-between items-center">
            <CardTitle className="flex items-center"><LifeBuoy className="mr-2 h-5 w-5 text-accent" /> Your Conversations</CardTitle>
            <Button size="sm" onClick={handleStartNewChat} disabled={isStartingNewChat} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isStartingNewChat ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="mr-1.5 h-4 w-4"/>} New Chat
            </Button>
          </CardHeader>
          <div className="px-4 pb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search chats..." 
                  className="pl-8 h-9" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
          </div>
          <ScrollArea className="flex-grow">
            <CardContent className="p-0">
              {isLoadingSessions && <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin text-accent mx-auto" /></div>}
              {!isLoadingSessions && filteredChatSessions.length === 0 && (
                <p className="p-4 text-center text-muted-foreground">No chat sessions yet. Start a new one!</p>
              )}
              {filteredChatSessions.map(chat => (
                <div 
                  key={chat._id} 
                  className={`flex items-center gap-3 p-3 border-b border-border cursor-pointer hover:bg-muted/50 ${chat._id === activeChatSession?._id ? 'bg-secondary' : ''}`}
                  onClick={() => handleSelectChat(chat)}
                >
                  <Avatar className="bg-accent text-accent-foreground">
                    <AvatarFallback>TY</AvatarFallback> 
                  </Avatar>
                  <div className="flex-grow overflow-hidden">
                    <p className="font-medium text-sm truncate">Support Chat #{chat._id.slice(-6)}</p>
                    <p className="text-xs text-muted-foreground truncate">{chat.lastMessageSenderType === 'customer' ? 'You: ' : 'Support: '}{chat.lastMessage || 'New session'}</p>
                  </div>
                  {chat.customerUnreadCount > 0 && <Badge className="bg-accent text-accent-foreground">{chat.customerUnreadCount}</Badge>}
                </div>
              ))}
            </CardContent>
          </ScrollArea>
        </Card>

        <Card className="w-full md:w-2/3 shadow-lg flex flex-col">
          {activeChatSession ? (
            <>
              <CardHeader className="flex flex-row justify-between items-center border-b border-border">
                <div>
                  <CardTitle>Chat with Support</CardTitle>
                  <CardDescription>Session ID: ...{activeChatSession._id.slice(-6)} - Status: {activeChatSession.status}</CardDescription>
                </div>
              </CardHeader>
              <ScrollArea className="flex-grow p-4 space-y-4 bg-muted/20">
                {isLoadingMessages && messages.length === 0 && <div className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin text-accent mx-auto" /></div>}
                {!isLoadingMessages && messages.length === 0 && <p className="text-center text-muted-foreground">No messages yet. Type below to start!</p>}
                {messages.map((msg) => (
                  <div key={msg._id} className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-lg shadow ${msg.senderType === 'customer' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.senderType === 'customer' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground text-left'}`}>
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
                    placeholder="Type your message to support..." 
                    className="flex-grow resize-none" 
                    rows={1}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={isSendingMessage || (isLoadingMessages && messages.length === 0)}
                  />
                  <Button type="submit" size="icon" className="bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isSendingMessage || (isLoadingMessages && messages.length === 0) || !newMessage.trim()}>
                    {isSendingMessage ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5" />}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-muted-foreground p-6">
              <MessageSquare className="h-16 w-16 mb-4" />
              <p className="text-lg text-center">Select a conversation or <Button variant="link" className="p-0 h-auto text-lg" onClick={handleStartNewChat} disabled={isStartingNewChat}>start a new one</Button>.</p>
              {isLoadingSessions && <Loader2 className="mt-4 h-8 w-8 animate-spin text-accent"/>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
