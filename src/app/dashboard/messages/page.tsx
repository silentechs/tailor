'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, MessageSquare, MoreVertical, Phone, Search, Send, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VoiceInput } from '@/components/ui/voice-input';
import { fetchApi } from '@/lib/fetch-api';
import { cn, formatRelativeTime } from '@/lib/utils';

// --- API Helpers ---
async function getConversations() {
  const res = await fetchApi('/api/messages/conversations');
  if (!res.ok) throw new Error('Failed to fetch conversations');
  const data = await res.json();
  return data.data;
}

async function getMessages(orderId: string) {
  const res = await fetchApi(`/api/messages?orderId=${orderId}`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  const data = await res.json();
  return data.data;
}

async function sendMessage(data: { orderId: string; message: string }) {
  const res = await fetchApi('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export default function MessagesPage() {
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', selectedOrderId],
    queryFn: () => getMessages(selectedOrderId!),
    enabled: !!selectedOrderId,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedOrderId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!messageInput.trim() || !selectedOrderId) return;

    sendMutation.mutate({
      orderId: selectedOrderId,
      message: messageInput.trim(),
    });
  };

  // Select first conversation by default if none selected
  useEffect(() => {
    if (conversations && conversations.length > 0 && !selectedOrderId) {
      setSelectedOrderId(conversations[0].id);
    }
  }, [conversations, selectedOrderId]);

  const selectedConversation = conversations?.find((c: any) => c.id === selectedOrderId);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-500">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold font-heading text-primary">Messages</h1>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-hidden">
        {/* Conversation List */}
        <Card className="h-full flex flex-col">
          <div className="p-4 border-b space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search messages..." className="pl-9" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            {isLoadingConversations ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : conversations?.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">No active conversations.</div>
            ) : (
              <div className="flex flex-col">
                {conversations?.map((conv: any) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setSelectedOrderId(conv.id)}
                    className={cn(
                      'p-4 flex items-start gap-3 border-b hover:bg-muted/50 transition-colors text-left relative',
                      selectedOrderId === conv.id && 'bg-muted/50'
                    )}
                  >
                    <Avatar>
                      <AvatarImage src={conv.client.profileImage} />
                      <AvatarFallback>{conv.client.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold truncate">{conv.client.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {conv.messages[0] && formatRelativeTime(conv.messages[0].createdAt)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground truncate pr-2">
                          <span className="font-mono text-xs bg-muted px-1 rounded mr-1">
                            #{conv.orderNumber}
                          </span>
                          {conv.messages[0]?.message || 'No messages'}
                        </p>
                        {conv._count.messages > 0 && (
                          <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center shrink-0">
                            {conv._count.messages}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2 h-full flex flex-col overflow-hidden">
          {selectedOrderId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex justify-between items-center bg-card z-10">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation?.client.profileImage} />
                    <AvatarFallback>{selectedConversation?.client.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {selectedConversation?.client.name}
                      <Badge variant="outline" className="font-normal">
                        Order #{selectedConversation?.orderNumber}
                      </Badge>
                    </h3>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-600 block animate-pulse" />
                      Active Order
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <User className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-muted/10" ref={scrollRef}>
                {isLoadingMessages ? (
                  <div className="flex justify-center h-full items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : messages?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                    <p>No messages yet.</p>
                    <p className="text-sm">Start the conversation about this order.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages?.map((msg: any) => {
                      const isMe = msg.senderType === 'tailor';
                      return (
                        <div
                          key={msg.id}
                          className={cn('flex w-full', isMe ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[70%] rounded-lg p-3 text-sm',
                              isMe
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-muted rounded-bl-none'
                            )}
                          >
                            <p>{msg.message}</p>
                            <p
                              className={cn(
                                'text-[10px] mt-1 text-right',
                                isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              )}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t bg-card">
                <form onSubmit={handleSend} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type your message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      className="pr-10"
                    />
                    <VoiceInput
                      onTranscript={(text) => {
                        setMessageInput((prev) => (prev ? `${prev} ${text}` : text));
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!messageInput.trim() || sendMutation.isPending}
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a conversation</p>
              <p>Choose an order from the left to view messages.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
