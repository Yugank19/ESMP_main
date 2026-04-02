"use client";

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, MessageSquare, Search, Phone, Video, MoreVertical, Paperclip, Smile } from 'lucide-react';

const defaultRooms = [
    { id: 'general', name: 'General', lastMsg: 'Project update incoming...' },
    { id: 'dev-team', name: 'Dev Team', lastMsg: 'Bug fixed in auth' },
    { id: 'client-apex', name: 'Client: Apex Corp', lastMsg: 'Budget approved' },
];

export default function ChatPage() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [user, setUser] = useState<any>(null);
    const [activeRoom, setActiveRoom] = useState('general');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));

        const s = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', {
            auth: { token: localStorage.getItem('token') }
        });
        s.on('connect', () => s.emit('joinRoom', 'general'));
        s.on('newMessage', (msg: any) => setMessages(prev => [...prev, msg]));
        setSocket(s);
        return () => { s.disconnect(); };
    }, []);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const sendMessage = () => {
        if (!input.trim() || !socket || !user) return;
        socket.emit('sendMessage', { roomId: activeRoom, senderId: user.id, body: input });
        setInput('');
    };

    const switchRoom = (roomId: string) => {
        if (socket) {
            socket.emit('leaveRoom', activeRoom);
            socket.emit('joinRoom', roomId);
        }
        setActiveRoom(roomId);
        setMessages([]);
    };

    const activeRoomData = defaultRooms.find(r => r.id === activeRoom);

    return (
        <div className="flex h-[calc(100vh-7rem)] rounded-xl border border-[#E2E8F0] overflow-hidden bg-white">
            {/* Sidebar */}
            <div className="w-64 border-r border-[#E2E8F0] flex flex-col bg-[#F8FAFC] shrink-0">
                <div className="p-4 border-b border-[#E2E8F0]">
                    <h2 className="text-sm font-semibold text-[#0F172A] mb-3">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-[#94A3B8]" />
                        <input placeholder="Search..." className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                    {defaultRooms.map(room => (
                        <button key={room.id} onClick={() => switchRoom(room.id)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-3 ${activeRoom === room.id ? 'bg-[#1D4ED8] text-white' : 'hover:bg-white text-[#0F172A]'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${activeRoom === room.id ? 'bg-white/20 text-white' : 'bg-[#EFF6FF] text-[#1D4ED8]'}`}>
                                {room.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                                <p className={`text-xs font-semibold truncate ${activeRoom === room.id ? 'text-white' : 'text-[#0F172A]'}`}>{room.name}</p>
                                <p className={`text-xs truncate mt-0.5 ${activeRoom === room.id ? 'text-white/70' : 'text-[#94A3B8]'}`}>{room.lastMsg}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Chat header */}
                <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white text-xs font-bold">
                            {activeRoomData?.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[#0F172A]">{activeRoomData?.name}</p>
                            <p className="text-xs text-green-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Online
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors"><Phone className="h-4 w-4 text-[#64748B]" /></button>
                        <button className="p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors"><Video className="h-4 w-4 text-[#64748B]" /></button>
                        <button className="p-2 rounded-lg hover:bg-[#F1F5F9] transition-colors"><MoreVertical className="h-4 w-4 text-[#64748B]" /></button>
                    </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#F8FAFC]">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center mb-3">
                                <MessageSquare className="h-6 w-6 text-[#94A3B8]" />
                            </div>
                            <p className="text-sm font-medium text-[#64748B]">No messages yet</p>
                            <p className="text-xs text-[#94A3B8] mt-1">Start the conversation</p>
                        </div>
                    )}
                    {messages.map((msg, idx) => {
                        const isOwn = msg.sender_id === user?.id;
                        return (
                            <div key={idx} className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                <div className="w-7 h-7 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#1D4ED8] text-xs font-bold shrink-0">
                                    {msg.sender?.name?.charAt(0) || 'U'}
                                </div>
                                <div className={`max-w-xs ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${isOwn ? 'bg-[#1D4ED8] text-white rounded-tr-sm' : 'bg-white border border-[#E2E8F0] text-[#0F172A] rounded-tl-sm'}`}>
                                        {msg.body}
                                    </div>
                                    <span className="text-[10px] text-[#94A3B8] px-1">{msg.sender?.name || 'User'}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Input */}
                <div className="p-4 bg-white border-t border-[#E2E8F0] shrink-0">
                    <div className="flex items-center gap-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] px-3 py-2 focus-within:ring-2 focus-within:ring-[#1D4ED8] focus-within:border-transparent transition">
                        <button className="p-1 rounded-md hover:bg-[#E2E8F0] transition-colors"><Paperclip className="h-4 w-4 text-[#94A3B8]" /></button>
                        <input
                            className="flex-1 bg-transparent border-none outline-none text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
                            placeholder="Type a message..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                        />
                        <button className="p-1 rounded-md hover:bg-[#E2E8F0] transition-colors"><Smile className="h-4 w-4 text-[#94A3B8]" /></button>
                        <button onClick={sendMessage}
                            className="w-8 h-8 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] flex items-center justify-center transition-colors shrink-0">
                            <Send className="h-3.5 w-3.5 text-white" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
