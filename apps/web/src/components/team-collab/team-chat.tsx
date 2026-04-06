"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { 
    Send, Pin, Search, Trash2, Edit2, X, Check, Paperclip, 
    Hash, MoreHorizontal, Smile, Plus, Download, Clock,
    ShieldCheck, MessageSquare, CornerDownRight, User, Loader2
} from 'lucide-react';
import { teamChatApi } from '@/lib/team-chat-api';
import { io, Socket } from 'socket.io-client';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    body: string;
    type: string;
    sender_id: string;
    sender: { id: string; name: string; avatar_url?: string };
    is_pinned: boolean;
    is_edited: boolean;
    deleted_at: string | null;
    file_url?: string;
    file_name?: string;
    file_size?: number;
    created_at: string;
}

interface Props {
    teamId: string;
    currentUser: any;
    members: any[];
    isLeader: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function formatTime(date: string) {
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString())
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
        d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
        ' ' +
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
}

function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function TeamChat({ teamId, currentUser, members, isLeader }: Props) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editBody, setEditBody] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Message[]>([]);
    const [showPinned, setShowPinned] = useState(false);
    const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; msg: Message } | null>(null);
    const [connected, setConnected] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<Socket | null>(null);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = useCallback(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    // Load initial messages
    const loadMessages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await teamChatApi.getMessages(teamId);
            setMessages(res.data);
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [teamId]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // WebSocket connection
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const socket = io(`${API_URL}/team-chat`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('join_team', teamId);
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        socket.on('new_message', (msg: Message) => {
            setMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        });

        socket.on('message_updated', (updated: Message) => {
            setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
            setPinnedMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
        });

        socket.on('message_deleted', ({ id }: { id: string }) => {
            setMessages(prev =>
                prev.map(m => m.id === id ? { ...m, deleted_at: new Date().toISOString() } : m)
            );
        });

        socket.on('user_typing', ({ userId }: { userId: string }) => {
            if (userId !== currentUser?.id) {
                setTypingUsers(prev => new Set([...prev, userId]));
            }
        });

        socket.on('user_stopped_typing', ({ userId }: { userId: string }) => {
            setTypingUsers(prev => {
                const s = new Set(prev);
                s.delete(userId);
                return s;
            });
        });

        socket.on('user_online', ({ userId }: { userId: string }) => {
            setOnlineUsers(prev => new Set([...prev, userId]));
        });

        socket.on('user_offline', ({ userId }: { userId: string }) => {
            setOnlineUsers(prev => {
                const s = new Set(prev);
                s.delete(userId);
                return s;
            });
        });

        return () => {
            socket.emit('leave_team', teamId);
            socket.disconnect();
            socketRef.current = null;
        };
    }, [teamId, currentUser?.id]);

    const stopTyping = useCallback(() => {
        socketRef.current?.emit('typing_stop', { teamId });
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }, [teamId]);

    const handleSend = async () => {
        const body = input.trim();
        if (!body || sending) return;
        setSending(true);
        setInput('');
        if (textareaRef.current) textareaRef.current.style.height = '40px';
        stopTyping();
        try {
            const res = await teamChatApi.sendMessage(teamId, { body });
            setMessages(prev => {
                if (prev.some(m => m.id === res.data.id)) return prev;
                return [...prev, res.data];
            });
        } catch {
            setInput(body);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        const t = e.target;
        t.style.height = 'auto';
        t.style.height = Math.min(t.scrollHeight, 128) + 'px';
        socketRef.current?.emit('typing_start', { teamId });
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(stopTyping, 2000);
    };

    const handleEdit = async (msg: Message) => {
        if (!editBody.trim()) return;
        setEditingId(null);
        try {
            const res = await teamChatApi.editMessage(teamId, msg.id, editBody);
            setMessages(prev => prev.map(m => m.id === res.data.id ? { ...m, ...res.data } : m));
        } catch { }
    };

    const handleDelete = async (msg: Message) => {
        if (!confirm('Delete this message?')) return;
        setContextMenu(null);
        try {
            await teamChatApi.deleteMessage(teamId, msg.id);
            setMessages(prev =>
                prev.map(m => m.id === msg.id ? { ...m, deleted_at: new Date().toISOString() } : m)
            );
        } catch { }
    };

    const handlePin = async (msg: Message) => {
        setContextMenu(null);
        try {
            const res = msg.is_pinned
                ? await teamChatApi.unpinMessage(teamId, msg.id)
                : await teamChatApi.pinMessage(teamId, msg.id);
            setMessages(prev => prev.map(m => m.id === res.data.id ? { ...m, ...res.data } : m));
        } catch { }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            const res = await teamChatApi.search(teamId, searchQuery);
            setSearchResults(res.data);
        } catch { }
    };

    const loadPinned = async () => {
        try {
            const res = await teamChatApi.getPinned(teamId);
            setPinnedMessages(res.data);
        } catch { }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/teams/${teamId}/files/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            const msgRes = await teamChatApi.sendMessage(teamId, {
                body: `Shared a file: ${file.name}`,
                type: 'FILE',
                file_url: data.file_url,
                file_name: file.name,
                file_size: file.size,
            });
            setMessages(prev => {
                if (prev.some(m => m.id === msgRes.data.id)) return prev;
                return [...prev, msgRes.data];
            });
        } catch {
            alert('File upload failed. Please try again.');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const typingNames = Array.from(typingUsers)
        .map(uid => members.find(m => m.user_id === uid)?.user?.name)
        .filter(Boolean) as string[];

    const groupedMessages = messages.reduce(
        (groups: { date: string; msgs: Message[] }[], msg) => {
            const date = new Date(msg.created_at).toDateString();
            const last = groups[groups.length - 1];
            if (last && last.date === date) {
                last.msgs.push(msg);
            } else {
                groups.push({ date, msgs: [msg] });
            }
            return groups;
        },
        [],
    );

    return (
        <div
            className="flex flex-col bg-white rounded-[3px] border border-[var(--border)] overflow-hidden shadow-sm animate-in fade-in duration-300"
            style={{ height: 'calc(100vh - 340px)', minHeight: '520px' }}
            onClick={() => setContextMenu(null)}
        >
            {/* Header Section */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-2)] shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[3px] bg-[var(--color-primary)] flex items-center justify-center text-white">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Mission Control Communications</span>
                            <div className={cn("w-2 h-2 rounded-full", connected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500")} />
                        </div>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
                            {members.length} Personnel Active · Secure Channel
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setShowSearch(s => !s); setShowPinned(false); }}
                        className={cn(
                            "jira-button border border-[var(--border)] bg-white text-[var(--text-secondary)] h-8 px-3 gap-2 font-bold uppercase text-[10px]",
                            showSearch && "bg-blue-50 text-[var(--color-primary)] border-[var(--color-primary)]"
                        )}
                    >
                        <Search className="h-4 w-4" /> Trace
                    </button>
                    <button
                        onClick={() => { setShowPinned(s => { if (!s) loadPinned(); return !s; }); setShowSearch(false); }}
                        className={cn(
                            "jira-button border border-[var(--border)] bg-white text-[var(--text-secondary)] h-8 px-3 gap-2 font-bold uppercase text-[10px]",
                            showPinned && "bg-blue-50 text-[var(--color-primary)] border-[var(--color-primary)]"
                        )}
                    >
                        <Pin className="h-4 w-4" /> Intel
                    </button>
                </div>
            </div>

            {/* Panels Container */}
            <div className="relative">
                {/* Search Panel */}
                {showSearch && (
                    <div className="absolute inset-x-0 top-0 z-20 px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-2)] animate-in slide-in-from-top-4 duration-200">
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                                <input
                                    className="w-full pl-9 pr-4 py-2 border border-[var(--border)] rounded-[3px] text-sm font-medium focus:border-[var(--color-primary)] outline-none transition-all"
                                    placeholder="Search comms history..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                className="jira-button jira-button-primary h-10 px-6 font-bold uppercase text-[11px]"
                            >
                                Execute Search
                            </button>
                        </div>
                        {searchResults.length > 0 && (
                            <div className="mt-4 space-y-2 max-h-60 overflow-y-auto no-scrollbar pb-2">
                                {searchResults.map(m => (
                                    <div key={m.id} className="card p-3 border-[var(--border)] hover:border-[var(--color-primary)] transition-all cursor-pointer">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-widest">{m.sender.name}</span>
                                            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{formatTime(m.created_at)}</span>
                                        </div>
                                        <p className="text-sm text-[var(--text-primary)] font-medium">{m.body}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Pinned Panel */}
                {showPinned && (
                    <div className="absolute inset-x-0 top-0 z-20 px-6 py-4 border-b border-amber-200 bg-amber-50 animate-in slide-in-from-top-4 duration-200">
                        <p className="text-[10px] font-bold text-amber-700 mb-3 flex items-center gap-2 uppercase tracking-widest">
                            <Pin className="h-3.5 w-3.5" /> High Priority Intel (Pinned)
                        </p>
                        {pinnedMessages.length === 0 ? (
                            <p className="text-xs text-[var(--text-muted)] italic font-medium">No intel currently pinned to high priority.</p>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar pb-2">
                                {pinnedMessages.map(m => (
                                    <div key={m.id} className="bg-white border border-amber-200 p-3 rounded-[3px] shadow-sm">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">{m.sender.name}</span>
                                            <button onClick={() => handlePin(m)} className="text-amber-400 hover:text-amber-600"><X className="h-3 w-3" /></button>
                                        </div>
                                        <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">{m.body}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 no-scrollbar bg-slate-50/30">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Synchronizing Encrypted Channel...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                        <MessageSquare className="h-16 w-16 text-[var(--text-muted)] mb-6" />
                        <h3 className="text-lg font-bold text-[var(--text-primary)] uppercase tracking-wider">Channel Silence</h3>
                        <p className="text-xs font-bold text-[var(--text-muted)] mt-2 uppercase tracking-tight">Initiate communication sequence to begin collaboration.</p>
                    </div>
                ) : (
                    groupedMessages.map(group => (
                        <div key={group.date} className="space-y-1">
                            {/* Date divider */}
                            <div className="flex items-center gap-6 my-8">
                                <div className="flex-1 h-[1px] bg-[var(--border)]" />
                                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.2em] whitespace-nowrap">
                                    {new Date(group.date).toDateString() === new Date().toDateString()
                                        ? 'TDR - TODAY'
                                        : new Date(group.date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
                                </span>
                                <div className="flex-1 h-[1px] bg-[var(--border)]" />
                            </div>

                            {group.msgs.map((msg, i) => {
                                const isMine = msg.sender_id === currentUser?.id;
                                const prevMsg = group.msgs[i - 1];
                                const showHeader = !prevMsg || prevMsg.sender_id !== msg.sender_id;

                                if (msg.deleted_at) {
                                    return (
                                        <div key={msg.id} className="py-2 pl-14">
                                            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase italic tracking-widest opacity-60 flex items-center gap-2">
                                                <X className="h-3 w-3" /> Communication Decrypted & Purged
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "group flex gap-4 px-2 py-1 rounded-[3px] hover:bg-white transition-colors relative",
                                            isMine ? "flex-row-reverse text-right" : "flex-row"
                                        )}
                                        onContextMenu={e => {
                                            e.preventDefault();
                                            setContextMenu({ x: e.clientX, y: e.clientY, msg });
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div className={cn(
                                            "w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold border-2 border-white shrink-0 shadow-sm transition-transform group-hover:scale-105",
                                            showHeader ? "opacity-100" : "opacity-0",
                                            isMine ? "bg-[var(--color-primary)] text-white order-last" : "bg-white text-[var(--color-primary)]"
                                        )}>
                                            {msg.sender.name?.charAt(0)?.toUpperCase()}
                                        </div>

                                        <div className={cn(
                                            "flex flex-col max-w-[75%] min-w-0",
                                            isMine ? "items-end" : "items-start"
                                        )}>
                                            {showHeader && (
                                                <div className={cn("flex items-center gap-3 mb-1.5", isMine && "flex-row-reverse")}>
                                                    <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-tight">{msg.sender.name}</span>
                                                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter opacity-60">{formatTime(msg.created_at)}</span>
                                                    {onlineUsers.has(msg.sender_id) && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    )}
                                                </div>
                                            )}

                                            {/* Edit mode or Message Bubble */}
                                            {editingId === msg.id ? (
                                                <div className="flex items-center gap-2 w-full max-w-md bg-white p-2 border-2 border-[var(--color-primary)] rounded-[3px] shadow-lg">
                                                    <input
                                                        className="flex-1 bg-transparent border-none text-sm font-medium outline-none"
                                                        value={editBody}
                                                        onChange={e => setEditBody(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') handleEdit(msg);
                                                            if (e.key === 'Escape') setEditingId(null);
                                                        }}
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-1 shrink-0">
                                                        <button onClick={() => handleEdit(msg)} className="p-1 px-2 bg-emerald-500 text-white rounded-[2px] transition-colors"><Check className="h-3.5 w-3.5" /></button>
                                                        <button onClick={() => setEditingId(null)} className="p-1 px-2 bg-slate-200 text-slate-600 rounded-[2px] transition-colors"><X className="h-3.5 w-3.5" /></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={cn(
                                                    "relative p-3 rounded-[3px] text-sm leading-relaxed font-medium transition-all group-hover:shadow-md",
                                                    isMine 
                                                        ? "bg-[var(--color-primary)] text-white" 
                                                        : "bg-white border border-[var(--border)] text-[var(--text-primary)]",
                                                    msg.is_pinned && "border-2 border-amber-300"
                                                )}>
                                                    {msg.type === 'FILE' && msg.file_url ? (
                                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                                            <div className={cn("p-2 rounded-[2px] flex items-center gap-3", isMine ? "bg-white/10" : "bg-slate-50")}>
                                                                <Paperclip className={cn("h-4 w-4", isMine ? "text-white" : "text-[var(--color-primary)]")} />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-bold truncate">{msg.file_name}</p>
                                                                    <p className={cn("text-[9px] uppercase font-bold", isMine ? "text-white/60" : "text-[var(--text-muted)]")}>{formatFileSize(msg.file_size || 0)}</p>
                                                                </div>
                                                                <a href={msg.file_url} target="_blank" rel="noreferrer" className={cn("p-1.5 rounded-[2px] transition-colors", isMine ? "hover:bg-white/20" : "hover:bg-slate-200")}>
                                                                    <Download className="h-3.5 w-3.5" />
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="whitespace-pre-wrap">{msg.body}</p>
                                                    )}
                                                    
                                                    {/* Status Indicators bottom of bubble */}
                                                    <div className={cn("flex items-center gap-2 mt-1", isMine ? "justify-end" : "justify-start")}>
                                                        {msg.is_edited && (
                                                            <span className={cn("text-[8px] font-bold uppercase tracking-widest", isMine ? "text-white/40" : "text-[var(--text-muted)]")}>
                                                                MODIFIED
                                                            </span>
                                                        )}
                                                        {msg.is_pinned && (
                                                            <span className={cn("text-[8px] font-bold uppercase tracking-widest flex items-center gap-1", isMine ? "text-amber-300" : "text-amber-600")}>
                                                                <Pin className="h-2 w-2" /> INTEL
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Context Button placeholder for hover */}
                                                    <div className={cn(
                                                        "absolute top-2 opacity-0 group-hover:opacity-100 transition-all",
                                                        isMine ? "-left-8" : "-right-8"
                                                    )}>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setContextMenu({ x: e.clientX, y: e.clientY, msg });
                                                            }}
                                                            className="p-1.5 bg-white border border-[var(--border)] rounded-[3px] text-[var(--text-muted)] hover:text-[var(--color-primary)] shadow-sm"
                                                        >
                                                            <MoreHorizontal className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}

                {/* Typing status bar */}
                {typingNames.length > 0 && (
                    <div className="flex items-center gap-3 px-14 py-2 mt-2 bg-blue-50/50 rounded-[3px] border border-blue-100 w-fit animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex gap-1">
                            {[0, 150, 300].map(delay => (
                                <div key={delay} className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                            ))}
                        </div>
                        <span className="text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-tight">
                            {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} transmitting data...
                        </span>
                    </div>
                )}

                <div ref={bottomRef} className="h-4" />
            </div>

            {/* Input Section */}
            <div className="px-6 py-6 border-t border-[var(--border)] bg-white shrink-0">
                <div className="flex items-center gap-4 bg-[var(--bg-surface-2)] border-2 border-[var(--border)] p-2 rounded-[3px] focus-within:border-[var(--color-primary)] transition-all">
                    <input ref= {fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-white rounded-[3px] transition-all"
                            title="Attach Mission Asset"
                        >
                            <Paperclip className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-[var(--text-muted)] hover:text-amber-500 hover:bg-white rounded-[3px] transition-all">
                            <Smile className="h-4 w-4" />
                        </button>
                        <div className="w-[1px] h-6 bg-[var(--border)] mx-1" />
                    </div>

                    <textarea
                        ref={textareaRef}
                        rows={1}
                        className="flex-1 bg-transparent py-2 text-sm font-medium text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none resize-none no-scrollbar"
                        placeholder="Transmit intelligence..."
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        style={{ minHeight: '40px', maxHeight: '128px' }}
                    />

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || sending}
                            className={cn(
                                "jira-button jira-button-primary h-10 px-4 gap-2",
                                (!input.trim() || sending) && "opacity-40"
                            )}
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span className="font-bold uppercase text-[10px]">Send</span>
                        </button>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-3 px-1">
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1">
                             <ShieldCheck className="h-3 w-3" /> End-to-end Encrypted
                        </span>
                    </div>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        Press [Enter] to transmit · [Shift+Enter] for split line
                    </span>
                </div>
            </div>

            {/* Context Menu Overlay */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-white border border-[var(--border)] rounded-[3px] shadow-xl py-1 min-w-[180px] animate-in zoom-in-95 duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="px-3 py-1.5 border-b border-[var(--border)] mb-1 bg-[var(--bg-surface-2)]">
                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-[0.1em]">Intelligence Ops</p>
                    </div>
                    {contextMenu.msg.sender_id === currentUser?.id && (
                        <button
                            onClick={() => {
                                setEditingId(contextMenu.msg.id);
                                setEditBody(contextMenu.msg.body);
                                setContextMenu(null);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-2 text-xs font-bold text-[var(--text-primary)] hover:bg-blue-50 hover:text-[var(--color-primary)] transition-colors"
                        >
                            <Edit2 className="h-3.5 w-3.5" /> Modify Comms
                        </button>
                    )}
                    {(isLeader || contextMenu.msg.sender_id === currentUser?.id) && (
                        <button
                            onClick={() => handlePin(contextMenu.msg)}
                            className="flex items-center gap-3 w-full px-4 py-2 text-xs font-bold text-[var(--text-primary)] hover:bg-amber-50 hover:text-amber-700 transition-colors"
                        >
                            <Pin className="h-3.5 w-3.5" /> 
                            {contextMenu.msg.is_pinned ? 'Declassify (Unpin)' : 'Elevate to Intel (Pin)'}
                        </button>
                    )}
                    {(contextMenu.msg.sender_id === currentUser?.id || isLeader) && (
                        <button
                            onClick={() => handleDelete(contextMenu.msg)}
                            className="flex items-center gap-3 w-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5" /> Purge Metadata
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
