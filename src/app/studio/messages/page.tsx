'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Send, ShoppingBag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type Message = {
    id: string;
    message: string;
    senderType: 'CLIENT' | 'TAILOR' | 'SYSTEM';
    createdAt: string;
};

type OrderThread = {
    id: string;
    orderNumber: string;
    garmentType: string;
    status: string;
    messages: Message[];
    organization: { name: string; logo: string | null };
};

export default function StudioMessagesPage() {
    const queryClient = useQueryClient();
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data: threads, isLoading } = useQuery({
        queryKey: ['studio', 'messages'],
        queryFn: async () => {
            const res = await fetch('/api/studio/messages');
            if (!res.ok) throw new Error('Failed to load messages');
            return (await res.json()).data as OrderThread[];
        }
    });

    // Sort threads by latest message or updated at
    const sortedThreads = threads?.sort((a, b) => {
        const lastMsgA = a.messages[a.messages.length - 1]?.createdAt || '0';
        const lastMsgB = b.messages[b.messages.length - 1]?.createdAt || '0';
        return new Date(lastMsgB).getTime() - new Date(lastMsgA).getTime();
    }) || [];

    const activeThread = sortedThreads.find(t => t.id === selectedOrderId);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [activeThread?.messages, selectedOrderId]);

    const sendMessageMutation = useMutation({
        mutationFn: async ({ orderId, content }: { orderId: string, content: string }) => {
            const res = await fetch('/api/studio/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, content }),
            });
            if (!res.ok) throw new Error('Failed to send');
            return res.json();
        },
        onSuccess: () => {
            setNewMessage('');
            queryClient.invalidateQueries({ queryKey: ['studio', 'messages'] });
        },
        onError: () => toast.error('Failed to send message')
    });

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrderId || !newMessage.trim()) return;
        sendMessageMutation.mutate({ orderId: selectedOrderId, content: newMessage });
    };

    if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-ghana-gold" /></div>;

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 max-h-[800px]">
            {/* Sidebar Threads List */}
            <div className="w-80 flex flex-col gap-4">
                <div className="px-2">
                    <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Messages</h1>
                    <p className="text-sm text-zinc-400">Chat with your tailors.</p>
                </div>

                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-2">
                        {sortedThreads.map((thread) => (
                            <button
                                key={thread.id}
                                onClick={() => setSelectedOrderId(thread.id)}
                                className={cn(
                                    "w-full text-left p-4 rounded-xl transition-all border border-transparent",
                                    selectedOrderId === thread.id
                                        ? "bg-white/10 border-white/10 shadow-lg"
                                        : "hover:bg-white/5 border-white/5"
                                )}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-white text-sm">#{thread.orderNumber}</span>
                                    <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 px-1.5 py-0.5 rounded">
                                        {thread.status}
                                    </span>
                                </div>
                                <div className="text-xs text-ghana-gold font-bold uppercase tracking-wider mb-2">
                                    {thread.garmentType.replace(/_/g, ' ')}
                                </div>
                                <p className="text-sm text-zinc-400 line-clamp-1">
                                    {thread.messages.length > 0
                                        ? thread.messages[thread.messages.length - 1].message
                                        : 'No messages yet'}
                                </p>
                            </button>
                        ))}

                        {sortedThreads.length === 0 && (
                            <div className="p-8 text-center text-zinc-500 border border-dashed border-white/10 rounded-xl">
                                <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No active orders</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl flex flex-col overflow-hidden relative">
                {!activeThread ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
                        <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Send className="h-8 w-8 opacity-50" />
                        </div>
                        <p>Select an order to start messaging</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                            <div>
                                <h2 className="font-bold text-white text-lg">Order #{activeThread.orderNumber}</h2>
                                <p className="text-xs text-ghana-gold uppercase tracking-widest font-bold">
                                    {activeThread.organization.name}
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10"
                            ref={scrollRef}
                        >
                            {activeThread.messages.length === 0 && (
                                <div className="text-center text-zinc-500 py-12">
                                    <p>No messages yet. Start the conversation!</p>
                                </div>
                            )}

                            {activeThread.messages.map((msg, i) => {
                                const isMe = msg.senderType === 'CLIENT';
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={cn(
                                            "flex gap-3 max-w-[80%]",
                                            isMe ? "ml-auto flex-row-reverse" : ""
                                        )}
                                    >
                                        <Avatar className="h-8 w-8 border border-white/10">
                                            <AvatarFallback className={cn("text-xs font-bold", isMe ? "bg-ghana-gold text-ghana-black" : "bg-zinc-800 text-zinc-400")}>
                                                {isMe ? 'ME' : 'SC'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={cn(
                                            "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                                            isMe
                                                ? "bg-ghana-gold text-ghana-black rounded-tr-sm"
                                                : "bg-zinc-800 text-white rounded-tl-sm"
                                        )}>
                                            {msg.message}
                                        </div>
                                        <span className="text-[10px] text-zinc-600 self-end opacity-50 min-w-max">
                                            {formatDistanceToNow(new Date(msg.createdAt))} ago
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSend} className="p-4 bg-black/20 border-t border-white/10 flex gap-3">
                            <Input
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 h-12 rounded-xl"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                                className="h-12 w-12 rounded-xl bg-ghana-gold text-ghana-black hover:bg-ghana-gold/90"
                            >
                                {sendMessageMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
