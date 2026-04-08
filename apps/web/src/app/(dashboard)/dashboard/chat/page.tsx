"use client";
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  Send, MessageSquare, Search, MoreVertical, UserPlus, Users, Bell,
  Check, X, Plus, Loader2, CheckCheck, Pencil, Trash2, LogOut,
  UserMinus, UserCog, ChevronRight, ArrowLeft, Phone, Mail, Building2
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const tok = () => typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

async function api(path: string, opts: RequestInit = {}) {
  const r = await fetch(`${API}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}`, ...(opts.headers || {}) },
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.message || 'Request failed');
  return d;
}

type Modal = 'addContact' | 'createGroup' | 'requests' | 'groupInfo' | 'profile' | 'addMember' | 'renameGroup' | null;

export default function ChatPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [user, setUser] = useState<any>(null);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [modal, setModal] = useState<Modal>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupEmails, setGroupEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingMsg, setEditingMsg] = useState<any>(null);
  const [editBody, setEditBody] = useState('');
  const [msgMenu, setMsgMenu] = useState<string | null>(null);
  const [viewProfile, setViewProfile] = useState<any>(null);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [renameVal, setRenameVal] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRoomRef = useRef<string | null>(null);
  useEffect(() => { activeRoomRef.current = activeRoom; }, [activeRoom]);

  // Socket setup
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    setUser(JSON.parse(stored));
    const s = io(API, { auth: { token: tok() } });
    s.on('newMessage', (msg: any) => {
      if (msg.room_id === activeRoomRef.current) setMessages(prev => [...prev, msg]);
      setRooms(prev => prev.map(r => r.id === msg.room_id ? { ...r, messages: [msg] } : r));
    });
    s.on('messageDeleted', ({ messageId }: any) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });
    s.on('messageEdited', (updated: any) => {
      setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
    });
    setSocket(s);
    return () => { s.disconnect(); };
  }, []);

  useEffect(() => { if (user) { fetchRooms(); fetchRequests(); } }, [user]);
  useEffect(() => {
    if (activeRoom && socket && user) {
      fetchMessages(activeRoom);
      socket.emit('joinRoom', { roomId: activeRoom, userId: user.id });
    }
  }, [activeRoom, socket]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const fetchRooms = async () => {
    try { const d = await api('/chat/rooms'); if (Array.isArray(d)) { setRooms(d); if (d.length > 0 && !activeRoomRef.current) setActiveRoom(d[0].id); } } catch {}
  };
  const fetchRequests = async () => {
    try { const d = await api('/chat/requests/pending'); if (Array.isArray(d)) setRequests(d); } catch {}
  };
  const fetchMessages = async (roomId: string) => {
    try { const d = await api(`/chat/rooms/${roomId}/messages`); if (Array.isArray(d)) setMessages(d); } catch {}
  };

  const sendMessage = () => {
    if (!input.trim() || !socket || !user || !activeRoom) return;
    socket.emit('sendMessage', { roomId: activeRoom, senderId: user.id, body: input.trim() });
    setInput('');
  };

  const handleDeleteMsg = (msg: any) => {
    if (!socket) return;
    socket.emit('deleteMessage', { messageId: msg.id, roomId: msg.room_id, userId: user.id });
    setMsgMenu(null);
  };

  const handleEditMsg = async () => {
    if (!editingMsg || !editBody.trim() || !socket) return;
    socket.emit('editMessage', { messageId: editingMsg.id, roomId: editingMsg.room_id, userId: user.id, body: editBody.trim() });
    setEditingMsg(null); setEditBody('');
  };

  const handleSendRequest = async () => {
    if (!searchEmail.trim()) return;
    setError(''); setLoading(true);
    try {
      await api('/chat/requests', { method: 'POST', body: JSON.stringify({ email: searchEmail }) });
      setSuccess('Request sent! They need to accept before you can chat.');
      closeModal(); setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const handleRespondRequest = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try { await api(`/chat/requests/${requestId}`, { method: 'PATCH', body: JSON.stringify({ status }) }); fetchRequests(); fetchRooms(); } catch {}
  };

  const handleCreateGroup = async () => {
    const emails = groupEmails.split(',').map(e => e.trim()).filter(Boolean);
    if (!groupName.trim() || !emails.length) return;
    setLoading(true);
    try {
      const room = await api('/chat/rooms/group', { method: 'POST', body: JSON.stringify({ name: groupName, emails }) });
      setRooms(prev => [room, ...prev]); setActiveRoom(room.id); closeModal();
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const handleAddMember = async () => {
    if (!addMemberEmail.trim() || !activeRoom) return;
    setLoading(true);
    try {
      await api(`/chat/rooms/${activeRoom}/members`, { method: 'POST', body: JSON.stringify({ email: addMemberEmail }) });
      setAddMemberEmail(''); fetchRooms(); closeModal();
      setSuccess('Member added!'); setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeRoom) return;
    try { await api(`/chat/rooms/${activeRoom}/members/${memberId}`, { method: 'DELETE' }); fetchRooms(); } catch (e: any) { setError(e.message); }
  };

  const handleLeaveGroup = async () => {
    if (!activeRoom) return;
    try {
      const r = await api(`/chat/rooms/${activeRoom}/leave`, { method: 'POST' });
      setActiveRoom(null); setMessages([]); fetchRooms(); closeModal();
    } catch (e: any) { setError(e.message); }
  };

  const handleDeleteRoom = async () => {
    if (!activeRoom) return;
    try { await api(`/chat/rooms/${activeRoom}`, { method: 'DELETE' }); setActiveRoom(null); setMessages([]); fetchRooms(); closeModal(); } catch (e: any) { setError(e.message); }
  };

  const handleRenameGroup = async () => {
    if (!renameVal.trim() || !activeRoom) return;
    setLoading(true);
    try { await api(`/chat/rooms/${activeRoom}/rename`, { method: 'PATCH', body: JSON.stringify({ name: renameVal }) }); fetchRooms(); closeModal(); } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const openProfile = async (userId: string) => {
    try { const p = await api(`/chat/users/${userId}/profile`); setViewProfile(p); setModal('profile'); } catch {}
  };

  const closeModal = () => { setModal(null); setError(''); setSearchEmail(''); setGroupName(''); setGroupEmails(''); setAddMemberEmail(''); setRenameVal(''); };

  const currentRoom = rooms.find(r => r.id === activeRoom) || null;
  const otherMember = currentRoom?.type === 'DIRECT' ? currentRoom.members?.find((m: any) => m.user_id !== user?.id)?.user : null;
  const roomName = currentRoom?.type === 'DIRECT' ? (otherMember?.name || 'User') : (currentRoom?.name || 'Group');
  const myMembership = currentRoom?.members?.find((m: any) => m.user_id === user?.id);
  const isAdmin = myMembership?.role === 'ADMIN';

  const filteredRooms = rooms.filter(r => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (r.type === 'DIRECT') { const o = r.members?.find((m: any) => m.user_id !== user?.id)?.user; return o?.name?.toLowerCase().includes(q) || o?.email?.toLowerCase().includes(q); }
    return r.name?.toLowerCase().includes(q);
  });

  return (
    <div className="flex h-[calc(100vh-7rem)] rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
      onClick={() => setMsgMenu(null)}>

      {/* ── Sidebar ── */}
      <div className="w-72 border-r flex flex-col shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Messages</h2>
            <div className="flex gap-1">
              <button onClick={() => setModal('requests')} className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">
                <Bell className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                {requests.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
              </button>
              <button onClick={() => setModal('addContact')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10" title="Add contact">
                <UserPlus className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              </button>
              <button onClick={() => setModal('createGroup')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10" title="New group">
                <Plus className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-primary)' }} />
          </div>
        </div>
        {success && <div className="mx-3 mt-2 px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: '#ecfdf5', color: '#059669' }}>{success}</div>}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredRooms.length === 0 && (
            <div className="text-center py-10 px-4">
              <MessageSquare className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No conversations yet</p>
              <button onClick={() => setModal('addContact')} className="mt-2 text-xs font-bold text-[#2563eb] hover:underline">Start a chat</button>
            </div>
          )}
          {filteredRooms.map(room => {
            const isDirect = room.type === 'DIRECT';
            const other = isDirect ? room.members?.find((m: any) => m.user_id !== user?.id)?.user : null;
            const lastMsg = room.messages?.[0];
            const isActive = activeRoom === room.id;
            return (
              <button key={room.id} onClick={() => setActiveRoom(room.id)}
                className="w-full text-left p-3 rounded-xl transition-all flex items-center gap-3"
                style={{ background: isActive ? '#2563eb' : 'transparent' }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-surface-2)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: isActive ? 'rgba(255,255,255,0.2)' : '#eff6ff', color: isActive ? '#fff' : '#2563eb' }}>
                  {isDirect ? (other?.name?.[0] || 'U') : <Users className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="text-sm font-semibold truncate" style={{ color: isActive ? '#fff' : 'var(--text-primary)' }}>
                      {isDirect ? (other?.name || 'User') : (room.name || 'Group')}
                    </p>
                    <span className="text-[10px] shrink-0 ml-1" style={{ color: isActive ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
                      {lastMsg ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-xs truncate" style={{ color: isActive ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)' }}>
                    {lastMsg ? (lastMsg.sender_id === user?.id ? 'You: ' : '') + lastMsg.body : 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeRoom && currentRoom ? (
          <>
            {/* Header */}
            <div className="px-5 py-3 border-b flex items-center justify-between shrink-0"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
              <button className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                onClick={() => currentRoom.type === 'DIRECT' ? openProfile(otherMember?.id) : setModal('groupInfo')}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                  {currentRoom.type === 'DIRECT' ? (otherMember?.name?.[0] || 'U') : <Users className="h-4 w-4" />}
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{roomName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {currentRoom.type === 'DIRECT' ? 'Click to view profile' : `${currentRoom.members?.length || 0} members · click to manage`}
                  </p>
                </div>
              </button>
              <div className="flex items-center gap-1">
                {currentRoom.type === 'GROUP' && isAdmin && (
                  <button onClick={() => setModal('addMember')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10" title="Add member">
                    <UserPlus className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                  </button>
                )}
                <button onClick={() => currentRoom.type === 'GROUP' ? setModal('groupInfo') : openProfile(otherMember?.id)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10">
                  <MoreVertical className="h-4 w-4" style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3" style={{ background: 'var(--bg-base)' }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-10 w-10 mb-3" style={{ color: 'var(--text-muted)' }} />
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>No messages yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Send the first message</p>
                </div>
              )}
              {messages.map((msg, idx) => {
                const isOwn = msg.sender_id === user?.id;
                const showAvatar = idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id;
                const isEdited = (msg.attachments as any)?.edited;
                return (
                  <div key={msg.id || idx} className={`flex gap-2.5 group ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {showAvatar ? (
                      <button onClick={() => !isOwn && openProfile(msg.sender_id)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 self-end"
                        style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                        {msg.sender?.avatar_url
                          ? <img src={msg.sender.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                          : msg.sender?.name?.[0] || 'U'}
                      </button>
                    ) : <div className="w-8 shrink-0" />}
                    <div className={`max-w-sm flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}>
                      {showAvatar && !isOwn && (
                        <button onClick={() => openProfile(msg.sender_id)} className="text-[10px] font-semibold px-1 hover:underline" style={{ color: 'var(--text-muted)' }}>
                          {msg.sender?.name}
                        </button>
                      )}
                      <div className="relative flex items-end gap-1">
                        {/* Message actions — show on hover */}
                        {isOwn && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 mb-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setEditingMsg(msg); setEditBody(msg.body); setMsgMenu(null); }}
                              className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-white/10" title="Edit">
                              <Pencil className="h-3 w-3" style={{ color: 'var(--text-muted)' }} />
                            </button>
                            <button onClick={() => handleDeleteMsg(msg)}
                              className="p-1 rounded-md hover:bg-red-100" title="Delete">
                              <Trash2 className="h-3 w-3 text-red-400" />
                            </button>
                          </div>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                          style={{
                            background: isOwn ? '#2563eb' : 'var(--bg-surface)',
                            color: isOwn ? '#fff' : 'var(--text-primary)',
                            border: isOwn ? 'none' : '1px solid var(--border)',
                          }}>
                          {msg.body}
                          {isEdited && <span className="text-[10px] ml-1 opacity-60">(edited)</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-1">
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOwn && <CheckCheck className="h-3 w-3" style={{ color: '#94a3b8' }} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Edit bar */}
            {editingMsg && (
              <div className="px-4 py-2 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)', background: '#fffbeb' }}>
                <Pencil className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-xs text-amber-700 flex-1 truncate">Editing: {editingMsg.body}</span>
                <button onClick={() => { setEditingMsg(null); setEditBody(''); }} className="text-xs text-amber-600 hover:underline">Cancel</button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
              <div className="flex items-center gap-2 rounded-xl border px-3 py-2"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}>
                <input className="flex-1 bg-transparent border-none outline-none text-sm" style={{ color: 'var(--text-primary)' }}
                  placeholder={editingMsg ? 'Edit message...' : 'Type a message...'}
                  value={editingMsg ? editBody : input}
                  onChange={e => editingMsg ? setEditBody(e.target.value) : setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); editingMsg ? handleEditMsg() : sendMessage(); } }} />
                <button onClick={editingMsg ? handleEditMsg : sendMessage}
                  disabled={editingMsg ? !editBody.trim() : !input.trim()}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white disabled:opacity-40"
                  style={{ background: editingMsg ? '#d97706' : '#2563eb' }}>
                  {editingMsg ? <Check className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10" style={{ background: 'var(--bg-base)' }}>
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <MessageSquare className="h-10 w-10" style={{ color: '#2563eb' }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Global Messenger</h3>
            <p className="text-sm text-center max-w-xs mb-6" style={{ color: 'var(--text-muted)' }}>
              Add contacts by Gmail or create a group chat.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModal('addContact')} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#2563eb' }}>Add Contact</button>
              <button onClick={() => setModal('createGroup')} className="px-5 py-2.5 rounded-xl text-sm font-semibold border" style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}>New Group</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--bg-surface)' }} onClick={e => e.stopPropagation()}>

            {/* Add Contact */}
            {modal === 'addContact' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Add Contact</h3>
                  <button onClick={closeModal}><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
                </div>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Enter their Gmail address. They'll receive a request to accept.</p>
                {error && <div className="mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>{error}</div>}
                <input value={searchEmail} onChange={e => setSearchEmail(e.target.value)} placeholder="person@gmail.com"
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none mb-3"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-primary)' }}
                  onKeyDown={e => e.key === 'Enter' && handleSendRequest()} />
                <button onClick={handleSendRequest} disabled={loading || !searchEmail.trim()}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: '#2563eb' }}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" /> Send Request</>}
                </button>
              </div>
            )}

            {/* Create Group */}
            {modal === 'createGroup' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Create Group</h3>
                  <button onClick={closeModal}><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
                </div>
                {error && <div className="mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>{error}</div>}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Group Name *</label>
                    <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. Project Team"
                      className="w-full border rounded-xl px-4 py-3 text-sm outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Members (Gmail, comma-separated) *</label>
                    <textarea value={groupEmails} onChange={e => setGroupEmails(e.target.value)} rows={3}
                      placeholder="email1@gmail.com, email2@gmail.com"
                      className="w-full border rounded-xl px-4 py-3 text-sm outline-none resize-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-primary)' }} />
                  </div>
                  <button onClick={handleCreateGroup} disabled={loading || !groupName.trim() || !groupEmails.trim()}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: '#2563eb' }}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Users className="h-4 w-4" /> Create Group</>}
                  </button>
                </div>
              </div>
            )}

            {/* Pending Requests */}
            {modal === 'requests' && (
              <div>
                <div className="flex items-center justify-between p-6 pb-3">
                  <div>
                    <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Chat Requests</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{requests.length} pending</p>
                  </div>
                  <button onClick={closeModal}><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
                </div>
                <div className="max-h-80 overflow-y-auto px-4 pb-4 space-y-2">
                  {requests.length === 0 ? (
                    <div className="text-center py-10"><Bell className="h-8 w-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No pending requests</p></div>
                  ) : requests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>{req.sender.name[0]}</div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{req.sender.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{req.sender.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleRespondRequest(req.id, 'ACCEPTED')} className="p-2 rounded-lg text-white" style={{ background: '#059669' }}><Check className="h-4 w-4" /></button>
                        <button onClick={() => handleRespondRequest(req.id, 'REJECTED')} className="p-2 rounded-lg border" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}><X className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Group Info / Management */}
            {modal === 'groupInfo' && currentRoom?.type === 'GROUP' && (
              <div>
                <div className="flex items-center justify-between p-6 pb-3">
                  <div>
                    <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{currentRoom.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{currentRoom.members?.length} members</p>
                  </div>
                  <button onClick={closeModal}><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
                </div>
                {error && <div className="mx-4 mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>{error}</div>}
                {/* Admin actions */}
                {isAdmin && (
                  <div className="px-4 pb-3 flex gap-2">
                    <button onClick={() => { setRenameVal(currentRoom.name || ''); setModal('renameGroup'); }}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      <Pencil className="h-3.5 w-3.5" /> Rename
                    </button>
                    <button onClick={() => setModal('addMember')}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      <UserPlus className="h-3.5 w-3.5" /> Add Member
                    </button>
                  </div>
                )}
                {/* Members list */}
                <div className="max-h-64 overflow-y-auto px-4 pb-3 space-y-2">
                  {currentRoom.members?.map((m: any) => (
                    <div key={m.user_id} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'var(--bg-surface-2)' }}>
                      <button className="flex items-center gap-3 flex-1 text-left" onClick={() => openProfile(m.user_id)}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                          {m.user?.avatar_url ? <img src={m.user.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" /> : m.user?.name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{m.user?.name} {m.user_id === user?.id ? '(You)' : ''}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.role === 'ADMIN' ? '👑 Admin' : 'Member'}</p>
                        </div>
                      </button>
                      {isAdmin && m.user_id !== user?.id && (
                        <button onClick={() => handleRemoveMember(m.user_id)} className="p-1.5 rounded-lg hover:bg-red-100" title="Remove">
                          <UserMinus className="h-3.5 w-3.5 text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {/* Leave / Delete */}
                <div className="px-4 pb-4 flex gap-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                  <button onClick={handleLeaveGroup} className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 text-amber-600 hover:bg-amber-50">
                    <LogOut className="h-3.5 w-3.5" /> Leave Group
                  </button>
                  {isAdmin && (
                    <button onClick={handleDeleteRoom} className="flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 text-red-500 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" /> Delete Group
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Add Member */}
            {modal === 'addMember' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Add Member</h3>
                  <button onClick={() => setModal('groupInfo')}><ArrowLeft className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
                </div>
                {error && <div className="mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>{error}</div>}
                <input value={addMemberEmail} onChange={e => setAddMemberEmail(e.target.value)} placeholder="member@gmail.com"
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none mb-3"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-primary)' }}
                  onKeyDown={e => e.key === 'Enter' && handleAddMember()} />
                <button onClick={handleAddMember} disabled={loading || !addMemberEmail.trim()}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: '#2563eb' }}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" /> Add to Group</>}
                </button>
              </div>
            )}

            {/* Rename Group */}
            {modal === 'renameGroup' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Rename Group</h3>
                  <button onClick={() => setModal('groupInfo')}><ArrowLeft className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
                </div>
                <input value={renameVal} onChange={e => setRenameVal(e.target.value)} placeholder="New group name"
                  className="w-full border rounded-xl px-4 py-3 text-sm outline-none mb-3"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface-2)', color: 'var(--text-primary)' }}
                  onKeyDown={e => e.key === 'Enter' && handleRenameGroup()} />
                <button onClick={handleRenameGroup} disabled={loading || !renameVal.trim()}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: '#2563eb' }}>
                  {loading ? 'Saving...' : 'Save Name'}
                </button>
              </div>
            )}

            {/* View Profile */}
            {modal === 'profile' && viewProfile && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Profile</h3>
                  <button onClick={closeModal}><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
                </div>
                <div className="flex flex-col items-center mb-5">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3"
                    style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                    {viewProfile.avatar_url ? <img src={viewProfile.avatar_url} className="w-20 h-20 rounded-full object-cover" alt="" /> : viewProfile.name?.[0] || 'U'}
                  </div>
                  <p className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{viewProfile.name}</p>
                  <div className="flex gap-1 mt-1 flex-wrap justify-center">
                    {viewProfile.roles?.map((r: any) => (
                      <span key={r.role.name} className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#eff6ff', color: '#2563eb' }}>{r.role.name}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: Mail, label: 'Email', value: viewProfile.email },
                    { icon: Phone, label: 'Phone', value: viewProfile.phone },
                    { icon: Building2, label: 'Organization', value: viewProfile.organization },
                  ].filter(f => f.value).map(f => (
                    <div key={f.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-surface-2)' }}>
                      <f.icon className="h-4 w-4 shrink-0" style={{ color: '#2563eb' }} />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{f.label}</p>
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{f.value}</p>
                      </div>
                    </div>
                  ))}
                  {viewProfile.bio && (
                    <div className="p-3 rounded-xl" style={{ background: 'var(--bg-surface-2)' }}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Bio</p>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{viewProfile.bio}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
