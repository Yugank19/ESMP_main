"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Pin, Search, Trash2, Edit2, X, Check, Paperclip, Hash } from 'lucide-react';
import { teamChatApi } from '@/lib/team-chat-api';
import { io, Socket } from 'socket.io-client';

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

    // WebSocket connection — only for receiving real-time events
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const socket = io(`${API_URL}/team-chat`, {
            auth: { token },
            transports: ['websocket', 'polling'], // fallback to polling if ws fails
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

        socket.on('connect_error', () => {
            setConnected(false);
        });

        // New message from any user (including self via broadcast)
        socket.on('new_message', (msg: Message) => {
            setMessages(prev => {
                // Deduplicate by id
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        });

        // Message edited
        socket.on('message_updated', (updated: Message) => {
            setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
            setPinnedMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
        });

        // Message deleted
        socket.on('message_deleted', ({ id }: { id: string }) => {
            setMessages(prev =>
                prev.map(m => m.id === id ? { ...m, deleted_at: new Date().toISOString() } : m)
            );
        });

        // Typing indicators
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

        // Online status
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
            // HTTP send → controller saves to DB → broadcasts via socket to all members
            const res = await teamChatApi.sendMessage(teamId, { body });
            // Optimistically add the message for the sender immediately.
            // The socket 'new_message' broadcast will also arrive — deduplication
            // by id in the socket handler prevents duplicates.
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
        // Auto-resize
        const t = e.target;
        t.style.height = 'auto';
        t.style.height = Math.min(t.scrollHeight, 128) + 'px';
        // Typing indicator
        socketRef.current?.emit('typing_start', { teamId });
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(stopTyping, 2000);
    };

    const handleEdit = async (msg: Message) => {
        if (!editBody.trim()) return;
        setEditingId(null);
        try {
            const res = await teamChatApi.editMessage(teamId, msg.id, editBody);
            // Optimistically update; socket 'message_updated' will also arrive (deduped)
            setMessages(prev => prev.map(m => m.id === res.data.id ? { ...m, ...res.data } : m));
        } catch {
            // ignore
        }
    };

    const handleDelete = async (msg: Message) => {
        if (!confirm('Delete this message?')) return;
        setContextMenu(null);
        try {
            await teamChatApi.deleteMessage(teamId, msg.id);
            // Optimistically mark deleted; socket 'message_deleted' will also arrive (deduped)
            setMessages(prev =>
                prev.map(m => m.id === msg.id ? { ...m, deleted_at: new Date().toISOString() } : m)
            );
        } catch {
            // ignore
        }
    };

    const handlePin = async (msg: Message) => {
        setContextMenu(null);
        try {
            const res = msg.is_pinned
                ? await teamChatApi.unpinMessage(teamId, msg.id)
                : await teamChatApi.pinMessage(teamId, msg.id);
            // Optimistically update; socket 'message_updated' will also arrive (deduped)
            setMessages(prev => prev.map(m => m.id === res.data.id ? { ...m, ...res.data } : m));
        } catch {
            // ignore
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            const res = await teamChatApi.search(teamId, searchQuery);
            setSearchResults(res.data);
        } catch {
            // ignore
        }
    };

    const loadPinned = async () => {
        try {
            const res = await teamChatApi.getPinned(teamId);
            setPinnedMessages(res.data);
        } catch {
            // ignore
        }
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
            // Optimistically add the file message
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

    // Group messages by date
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
            className="flex flex-col bg-white rounded-xl border border-[#E2E8F0] overflow-hidden"
            style={{ height: 'calc(100vh - 280px)', minHeight: '520px' }}
            onClick={() => setContextMenu(null)}
        >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] shrink-0">
                <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-[#1D4ED8]" />
                    <span className="text-sm font-semibold text-[#0F172A]">Team Chat</span>
                    <span className="text-xs text-[#94A3B8]">· {members.length} members</span>
                    <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-400'}`} title={connected ? 'Connected' : 'Disconnected'} />
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => { setShowSearch(s => !s); setShowPinned(false); }}
                        className={`p-1.5 rounded-lg transition ${showSearch ? 'bg-[#EFF6FF] text-[#1D4ED8]' : 'text-[#64748B] hover:bg-[#F1F5F9]'}`}
                    >
                        <Search className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => { setShowPinned(s => { if (!s) loadPinned(); return !s; }); setShowSearch(false); }}
                        className={`p-1.5 rounded-lg transition ${showPinned ? 'bg-[#EFF6FF] text-[#1D4ED8]' : 'text-[#64748B] hover:bg-[#F1F5F9]'}`}
                    >
                        <Pin className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* ── Search Panel ── */}
            {showSearch && (
                <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
                    <div className="flex gap-2">
                        <input
                            className="flex-1 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            className="px-3 py-2 bg-[#1D4ED8] text-white text-sm rounded-lg hover:bg-[#1E40AF] transition"
                        >
                            Search
                        </button>
                    </div>
                    {searchResults.length > 0 && (
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                            {searchResults.map(m => (
                                <div key={m.id} className="text-xs p-2 bg-white rounded-lg border border-[#E2E8F0]">
                                    <span className="font-semibold text-[#1D4ED8]">{m.sender.name}: </span>
                                    <span className="text-[#0F172A]">{m.body}</span>
                                    <span className="text-[#94A3B8] ml-2">{formatTime(m.created_at)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Pinned Panel ── */}
            {showPinned && (
                <div className="px-4 py-3 border-b border-[#E2E8F0] bg-amber-50 shrink-0">
                    <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
                        <Pin className="h-3 w-3" /> Pinned Messages
                    </p>
                    {pinnedMessages.length === 0 ? (
                        <p className="text-xs text-[#94A3B8]">No pinned messages.</p>
                    ) : (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {pinnedMessages.map(m => (
                                <div key={m.id} className="text-xs p-2 bg-white rounded-lg border border-amber-200">
                                    <span className="font-semibold text-[#1D4ED8]">{m.sender.name}: </span>
                                    <span className="text-[#0F172A]">{m.body}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Messages Area ── */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="h-6 w-6 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <Hash className="h-10 w-10 text-[#CBD5E1] mb-3" />
                        <p className="text-sm font-medium text-[#64748B]">No messages yet</p>
                        <p className="text-xs text-[#94A3B8] mt-1">Be the first to say something</p>
                    </div>
                ) : (
                    groupedMessages.map(group => (
                        <div key={group.date}>
                            {/* Date divider */}
                            <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-[#E2E8F0]" />
                                <span className="text-[10px] text-[#94A3B8] font-semibold uppercase tracking-wide px-2">
                                    {new Date(group.date).toDateString() === new Date().toDateString()
                                        ? 'Today'
                                        : new Date(group.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                <div className="flex-1 h-px bg-[#E2E8F0]" />
                            </div>

                            {group.msgs.map((msg, i) => {
                                const isMine = msg.sender_id === currentUser?.id;
                                const prevMsg = group.msgs[i - 1];
                                const showHeader = !prevMsg || prevMsg.sender_id !== msg.sender_id;

                                if (msg.deleted_at) {
                                    return (
                                        <div key={msg.id} className="py-0.5 px-10">
                                            <span className="text-xs text-[#94A3B8] italic">This message was deleted</span>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex gap-2.5 py-0.5 group ${isMine ? 'flex-row-reverse' : ''}`}
                                        onContextMenu={e => {
                                            e.preventDefault();
                                            setContextMenu({ x: e.clientX, y: e.clientY, msg });
                                        }}
                                    >
                                        {/* Avatar */}
                                        <div
                                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1
                                                ${showHeader ? 'opacity-100' : 'opacity-0'}
                                                ${isMine ? 'bg-[#1D4ED8] text-white' : 'bg-[#E2E8F0] text-[#475569]'}`}
                                        >
                                            {msg.sender.name?.charAt(0)?.toUpperCase()}
                                        </div>

                                        <div className={`flex flex-col max-w-[68%] ${isMine ? 'items-end' : 'items-start'}`}>
                                            {/* Name + time */}
                                            {showHeader && (
                                                <div className={`flex items-center gap-2 mb-1 ${isMine ? 'flex-row-reverse' : ''}`}>
                                                    <span className="text-xs font-semibold text-[#0F172A]">{msg.sender.name}</span>
                                                    <span className="text-[10px] text-[#94A3B8]">{formatTime(msg.created_at)}</span>
                                                    {onlineUsers.has(msg.sender_id) && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    )}
                                                </div>
                                            )}

                                            {/* Edit mode */}
                                            {editingId === msg.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        className="px-3 py-1.5 rounded-lg border border-[#1D4ED8] text-sm focus:outline-none min-w-[200px]"
                                                        value={editBody}
                                                        onChange={e => setEditBody(e.target.value)}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') handleEdit(msg);
                                                            if (e.key === 'Escape') setEditingId(null);
                                                        }}
                                                        autoFocus
                                                    />
                                                    <button onClick={() => handleEdit(msg)} className="p-1 text-green-600 hover:bg-green-50 rounded-lg">
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-1 text-[#94A3B8] hover:bg-[#F1F5F9] rounded-lg">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                /* Bubble */
                                                <div
                                                    className={`relative px-3 py-2 rounded-2xl text-sm leading-relaxed break-words
                                                        ${isMine
                                                            ? 'bg-[#1D4ED8] text-white rounded-tr-sm'
                                                            : 'bg-[#F1F5F9] text-[#0F172A] rounded-tl-sm'}
                                                        ${msg.is_pinned ? 'ring-1 ring-amber-400' : ''}`}
                                                >
                                                    {msg.type === 'FILE' && msg.file_url ? (
                                                        <div>
                                                            <a
                                                                href={msg.file_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className={`flex items-center gap-2 underline ${isMine ? 'text-blue-200' : 'text-[#1D4ED8]'}`}
                                                            >
                                                                <Paperclip className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate max-w-[200px]">{msg.file_name}</span>
                                                            </a>
                                                            {msg.file_size && (
                                                                <p className={`text-[10px] mt-0.5 ${isMine ? 'text-blue-200' : 'text-[#94A3B8]'}`}>
                                                                    {formatFileSize(msg.file_size)}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="whitespace-pre-wrap">{msg.body}</span>
                                                    )}
                                                    {msg.is_edited && (
                                                        <span className={`text-[10px] ml-1 ${isMine ? 'text-blue-200' : 'text-[#94A3B8]'}`}>
                                                            (edited)
                                                        </span>
                                                    )}
                                                    {msg.is_pinned && (
                                                        <Pin className={`h-3 w-3 absolute -top-1.5 -right-1.5 ${isMine ? 'text-amber-400' : 'text-amber-500'}`} />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}

                {/* Typing indicator */}
                {typingNames.length > 0 && (
                    <div className="flex items-center gap-2 px-10 py-1">
                        <div className="flex gap-0.5">
                            {[0, 150, 300].map(delay => (
                                <span
                                    key={delay}
                                    className="w-1.5 h-1.5 bg-[#94A3B8] rounded-full animate-bounce"
                                    style={{ animationDelay: `${delay}ms` }}
                                />
                            ))}
                        </div>
                        <span className="text-xs text-[#94A3B8]">
                            {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing...
                        </span>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* ── Input Bar ── */}
            <div className="px-4 py-3 border-t border-[#E2E8F0] shrink-0">
                <div className="flex items-end gap-2">
                    <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-[#64748B] hover:text-[#1D4ED8] hover:bg-[#EFF6FF] rounded-lg transition shrink-0 mb-0.5"
                    >
                        <Paperclip className="h-4 w-4" />
                    </button>
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        className="flex-1 px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] resize-none overflow-y-auto"
                        placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        style={{ minHeight: '40px', maxHeight: '128px' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className="p-2 bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition shrink-0 mb-0.5"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* ── Context Menu ── */}
            {contextMenu && (
                <div
                    className="fixed z-50 bg-white border border-[#E2E8F0] rounded-xl shadow-xl py-1 min-w-[160px]"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={e => e.stopPropagation()}
                >
                    {contextMenu.msg.sender_id === currentUser?.id && (
                        <button
                            onClick={() => {
                                setEditingId(contextMenu.msg.id);
                                setEditBody(contextMenu.msg.body);
                                setContextMenu(null);
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC]"
                        >
                            <Edit2 className="h-3.5 w-3.5" /> Edit
                        </button>
                    )}
                    {isLeader && (
                        <button
                            onClick={() => handlePin(contextMenu.msg)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#0F172A] hover:bg-[#F8FAFC]"
                        >
                            <Pin className="h-3.5 w-3.5" />
                            {contextMenu.msg.is_pinned ? 'Unpin' : 'Pin'}
                        </button>
                    )}
                    {(contextMenu.msg.sender_id === currentUser?.id || isLeader) && (
                        <button
                            onClick={() => handleDelete(contextMenu.msg)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
