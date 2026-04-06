"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import {
    Video, VideoOff, Mic, MicOff, PhoneOff, Monitor,
    Users, Copy, Check, ExternalLink, RefreshCw, Shield,
    Wifi, Lock, Layout, User, MoreHorizontal, Maximize,
    ShieldCheck, Zap, Radio, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    teamId: string;
    teamName: string;
    currentUser: any;
    members: any[];
}

declare global {
    interface Window {
        JitsiMeetExternalAPI: any;
    }
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function VideoConference({ teamId, teamName, currentUser, members }: Props) {
    const jitsiRef = useRef<HTMLDivElement>(null);
    const apiRef = useRef<any>(null);
    const [inCall, setInCall] = useState(false);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [participants, setParticipants] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [notifyStatus, setNotifyStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

    // Stable room name based on teamId
    const roomName = `esmp-team-${teamId.replace(/-/g, '').slice(0, 16)}`;
    const meetingLink = `https://meet.jit.si/${roomName}`;

    // Load Jitsi script once
    useEffect(() => {
        if (window.JitsiMeetExternalAPI) { setScriptLoaded(true); return; }
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        script.onerror = () => console.error('Failed to load Jitsi');
        document.head.appendChild(script);
    }, []);

    const notifyMembers = useCallback(async () => {
        setNotifyStatus('sending');
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/teams/${teamId}/video-call/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                setNotifyStatus('sent');
                setTimeout(() => setNotifyStatus('idle'), 4000);
            } else {
                setNotifyStatus('error');
            }
        } catch {
            setNotifyStatus('error');
        }
    }, [teamId]);

    const startCall = useCallback(() => {
        if (!scriptLoaded || !jitsiRef.current) return;
        setLoading(true);

        // Notify team
        notifyMembers();

        try {
            apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
                roomName,
                width: '100%',
                height: '100%',
                parentNode: jitsiRef.current,
                userInfo: {
                    displayName: currentUser?.name || 'ESMP Operator',
                    email: currentUser?.email || '',
                },
                configOverwrite: {
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    disableDeepLinking: true,
                    prejoinPageEnabled: false,
                    enableWelcomePage: false,
                    toolbarButtons: [
                        'microphone', 'camera', 'desktop', 'fullscreen',
                        'fodeviceselection', 'hangup', 'chat',
                        'raisehand', 'videoquality', 'filmstrip',
                        'participants-pane', 'tileview', 'select-background',
                        'mute-everyone',
                    ],
                    subject: `${teamName.toUpperCase()} // SYNCHRONIZED COMMS`,
                },
                interfaceConfigOverwrite: {
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    SHOW_BRAND_WATERMARK: false,
                    SHOW_POWERED_BY: false,
                    DISPLAY_WELCOME_FOOTER: false,
                    MOBILE_APP_PROMO: false,
                    APP_NAME: 'ESMP COMPX-VIDEO',
                    DEFAULT_BACKGROUND: '#091E42',
                },
            });

            apiRef.current.addEventListener('videoConferenceJoined', () => {
                setInCall(true);
                setLoading(false);
            });

            apiRef.current.addEventListener('videoConferenceLeft', () => {
                endCall();
            });

            apiRef.current.addEventListener('participantJoined', () => setParticipants(p => p + 1));
            apiRef.current.addEventListener('participantLeft', () => setParticipants(p => Math.max(0, p - 1)));
            apiRef.current.addEventListener('audioMuteStatusChanged', (e: any) => setIsMuted(e.muted));
            apiRef.current.addEventListener('videoMuteStatusChanged', (e: any) => setIsVideoOff(e.muted));

        } catch (err) {
            console.error('Jitsi initialization failure:', err);
            setLoading(false);
        }
    }, [scriptLoaded, roomName, teamName, currentUser, notifyMembers]);

    const endCall = useCallback(() => {
        if (apiRef.current) {
            try { apiRef.current.dispose(); } catch {}
            apiRef.current = null;
        }
        setInCall(false);
        setLoading(false);
        setParticipants(0);
        setIsMuted(false);
        setIsVideoOff(false);
    }, []);

    const toggleMute = () => apiRef.current?.executeCommand('toggleAudio');
    const toggleVideo = () => apiRef.current?.executeCommand('toggleVideo');
    const shareScreen = () => apiRef.current?.executeCommand('toggleShareScreen');

    const copyLink = () => {
        navigator.clipboard.writeText(meetingLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return (
        <div className="flex flex-col bg-white rounded-[3px] border border-[var(--border)] overflow-hidden shadow-sm animate-in fade-in duration-300" style={{ height: 'calc(100vh - 340px)', minHeight: '520px' }}>
            {/* Mission Critical Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-2)] shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[3px] bg-[var(--color-primary)] flex items-center justify-center text-white shadow-md shadow-blue-100">
                        <Radio className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-tight">Compx-Video Uplink</span>
                            {inCall && <div className="px-2 py-0.5 rounded-[2px] bg-red-500 text-[9px] font-bold text-white uppercase animate-pulse tracking-widest">Live</div>}
                        </div>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
                            {inCall ? `Active Session · ${participants + 1} Personnel Synchronized` : 'Secure Telepresence Terminal'}
                        </p>
                    </div>
                </div>

                {inCall && (
                    <div className="flex items-center gap-2">
                        <button onClick={toggleMute} className={cn(
                            "p-2 rounded-[3px] transition-all flex items-center gap-2 px-4",
                            isMuted ? "bg-red-50 text-red-600 border border-red-100" : "bg-white border border-[var(--border)] text-[var(--color-primary)]"
                        )}>
                            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                            <span className="text-[10px] font-bold uppercase tracking-widest">Audio</span>
                        </button>
                        <button onClick={toggleVideo} className={cn(
                            "p-2 rounded-[3px] transition-all flex items-center gap-2 px-4",
                            isVideoOff ? "bg-red-50 text-red-600 border border-red-100" : "bg-white border border-[var(--border)] text-[var(--color-primary)]"
                        )}>
                            {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                            <span className="text-[10px] font-bold uppercase tracking-widest">Visual</span>
                        </button>
                        <button onClick={shareScreen} className="p-2 rounded-[3px] bg-white border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all flex items-center gap-2 px-4">
                            <Monitor className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Desktop</span>
                        </button>
                        <button onClick={endCall} className="p-2 rounded-[3px] bg-red-600 text-white hover:bg-red-700 transition-all flex items-center gap-2 px-4 shadow-md shadow-red-100">
                            <PhoneOff className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Terminate</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Notification Banner */}
            {notifyStatus !== 'idle' && (
                <div className={cn(
                    "px-6 py-3 border-b flex items-center gap-3 animate-in slide-in-from-top-2",
                    notifyStatus === 'sent' ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-blue-50 border-blue-100 text-blue-700"
                )}>
                    <Zap className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                        {notifyStatus === 'sending' ? 'Transmitting synchronization signals to all team personnel...' : 'All team personnel successfully notified via priority channel.'}
                    </span>
                </div>
            )}

            {/* Main Interactive Zone */}
            <div className="flex-1 relative bg-slate-50 overflow-hidden">
                {!inCall && !loading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
                        {/* High-end Lobby Design */}
                        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-[var(--color-primary)] mb-4">
                                        <Globe className="h-3.5 w-3.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Regional Uplink Secured</span>
                                    </div>
                                    <h2 className="text-4xl font-extrabold text-[var(--text-primary)] leading-tight">
                                        Team <span className="text-[var(--color-primary)]">{teamName}</span><br />Discovery Terminal
                                    </h2>
                                    <p className="text-sm font-medium text-[var(--text-secondary)] leading-relaxed max-w-sm">
                                        Initialize synchronized audio-visual communication with team personnel. Supports HD transmission and secure desktop sharing.
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-4">
                                     <div className="flex -space-x-3">
                                        {members.slice(0, 5).map((m: any, i: number) => (
                                            <div key={m.user_id || i}
                                                className="w-10 h-10 rounded-full border-4 border-white flex items-center justify-center text-white text-[11px] font-bold shadow-sm"
                                                style={{ background: ['#0052CC','#FF5630','#36B37E','#FFAB00','#6554C0'][i % 5] }}>
                                                {m.user?.name?.[0] || '?'}
                                            </div>
                                        ))}
                                        {members.length > 5 && (
                                            <div className="w-10 h-10 rounded-full border-4 border-white flex items-center justify-center text-[10px] font-bold bg-slate-200 text-slate-600 shadow-sm">
                                                +{members.length - 5}
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-10 flex flex-col justify-center border-l-2 border-slate-200 pl-4">
                                        <p className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest">{members.length} Ready Pilots</p>
                                        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter">Available for synchronization</p>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-4">
                                    <button 
                                        onClick={notifyMembers} 
                                        className="jira-button jira-button-primary h-14 px-8 gap-4 font-bold uppercase text-[12px] group w-full sm:w-auto"
                                    >
                                        <Video className="h-5 w-5 transition-transform group-hover:scale-110" /> Initialize Operational Call
                                    </button>
                                    <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> End-to-end encrypted Discovery link generated
                                    </p>
                                </div>
                            </div>

                            <div className="hidden lg:block relative">
                                <div className="aspect-video bg-white border border-[var(--border)] rounded-[3px] shadow-2xl p-4 flex flex-col items-center justify-center text-center overflow-hidden relative">
                                     {/* Background patterns */}
                                     <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle,rgba(0,82,204,0.1)_1px,transparent_1px)] [background-size:20px_20px]" />
                                     
                                     <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-6 border border-blue-100">
                                          <Layout className="h-10 w-10 text-[var(--color-primary)]" />
                                     </div>
                                     <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest mb-2 px-12 leading-relaxed">External Jitsi Node Handshake Pending</h4>
                                     <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tighter max-w-[200px]">Verification of audio/visual drivers will occur upon initialization.</p>
                                     <button 
                                        onClick={startCall}
                                        disabled={!scriptLoaded}
                                        className="mt-8 text-[10px] font-bold text-[var(--color-primary)] uppercase underline tracking-widest hover:text-blue-700 disabled:opacity-50"
                                     >
                                         {scriptLoaded ? 'Open Inline Terminal' : 'Loading Drivers...'}
                                     </button>
                                </div>
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                            </div>
                        </div>

                        {/* Invite link and external tab warning */}
                        <div className="mt-16 w-full max-w-4xl p-6 bg-white border border-[var(--border)] rounded-[3px] flex flex-col md:flex-row items-center gap-6 shadow-sm">
                             <div className="flex-1 w-full space-y-2">
                                 <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Encrypted Discovery Link</p>
                                 <div className="flex items-center gap-3 bg-slate-50 border border-[var(--border)] rounded-[3px] p-2 pl-4">
                                      <Lock className="h-3.5 w-3.5 text-emerald-500" />
                                      <span className="flex-1 text-xs font-mono text-[var(--text-primary)] truncate">{meetingLink}</span>
                                      <button onClick={copyLink} className={cn("p-2 rounded-[2px] transition-all", copied ? "bg-emerald-500 text-white" : "hover:bg-slate-200 text-slate-400")}>
                                           {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                      </button>
                                 </div>
                             </div>
                             <div className="w-[1px] h-12 bg-[var(--border)] hidden md:block" />
                             <div className="w-full md:w-64 space-y-3">
                                  <a href={meetingLink} target="_blank" rel="noopener noreferrer" onClick={notifyMembers} className="flex items-center justify-center gap-2 text-[10px] font-bold text-white bg-slate-800 rounded-[3px] h-10 uppercase tracking-widest hover:bg-slate-900 transition-colors w-full">
                                      <ExternalLink className="h-3.5 w-3.5" /> Launch External Client
                                  </a>
                                  <p className="text-[9px] font-bold text-center text-red-600 uppercase tracking-tight">Recommended: High browser permission compatibility</p>
                             </div>
                        </div>
                    </div>
                )}

                {/* Loading state overlay */}
                {loading && (
                    <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-blue-50 border-t-[var(--color-primary)] animate-spin" />
                            <Wifi className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-primary)] animate-pulse" />
                        </div>
                        <div className="text-center">
                            <h4 className="text-sm font-extrabold text-[var(--text-primary)] uppercase tracking-[0.3em] mb-2">Establishing Uplink</h4>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Handshake with Jitsi node in progress... hold station.</p>
                        </div>
                    </div>
                )}

                {/* Jitsi iframe container */}
                <div
                    ref={jitsiRef}
                    className="absolute inset-0"
                    style={{
                        display: inCall ? 'block' : 'none',
                    }}
                />
            </div>

            {/* Session Analytics Footer */}
            {inCall && (
                <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--bg-surface-2)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2">
                             <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 opacity-60" />
                             <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Encrypted Data Stream Active</span>
                         </div>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2">
                             <Users className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                             <span className="text-[9px] font-bold text-[var(--text-primary)] uppercase tracking-tight">{participants + 1} PERSONNEL SYNCED</span>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
}
