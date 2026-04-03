"use client";

import { useEffect, useRef, useState } from 'react';
import {
    Video, VideoOff, Mic, MicOff, PhoneOff, Monitor,
    Users, Copy, Check, ExternalLink, RefreshCw, Shield
} from 'lucide-react';

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
        return () => {
            // Don't remove — keep cached for re-use
        };
    }, []);

    function startCall() {
        if (!scriptLoaded || !jitsiRef.current) return;
        setLoading(true);

        try {
            apiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
                roomName,
                width: '100%',
                height: '100%',
                parentNode: jitsiRef.current,
                userInfo: {
                    displayName: currentUser?.name || 'ESMP User',
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
                        'fodeviceselection', 'hangup', 'chat', 'recording',
                        'livestreaming', 'etherpad', 'sharedvideo', 'settings',
                        'raisehand', 'videoquality', 'filmstrip', 'participants-pane',
                        'feedback', 'stats', 'shortcuts', 'tileview', 'select-background',
                        'download', 'help', 'mute-everyone', 'security',
                    ],
                    subject: `${teamName} — Team Meeting`,
                },
                interfaceConfigOverwrite: {
                    SHOW_JITSI_WATERMARK: false,
                    SHOW_WATERMARK_FOR_GUESTS: false,
                    SHOW_BRAND_WATERMARK: false,
                    BRAND_WATERMARK_LINK: '',
                    SHOW_POWERED_BY: false,
                    DISPLAY_WELCOME_FOOTER: false,
                    MOBILE_APP_PROMO: false,
                    APP_NAME: 'ESMP Video',
                    NATIVE_APP_NAME: 'ESMP',
                    DEFAULT_BACKGROUND: '#1E293B',
                    TOOLBAR_ALWAYS_VISIBLE: false,
                },
            });

            apiRef.current.addEventListener('videoConferenceJoined', () => {
                setInCall(true);
                setLoading(false);
            });

            apiRef.current.addEventListener('videoConferenceLeft', () => {
                endCall();
            });

            apiRef.current.addEventListener('participantJoined', () => {
                setParticipants(p => p + 1);
            });

            apiRef.current.addEventListener('participantLeft', () => {
                setParticipants(p => Math.max(0, p - 1));
            });

            apiRef.current.addEventListener('audioMuteStatusChanged', (e: any) => {
                setIsMuted(e.muted);
            });

            apiRef.current.addEventListener('videoMuteStatusChanged', (e: any) => {
                setIsVideoOff(e.muted);
            });

        } catch (err) {
            console.error('Jitsi init error:', err);
            setLoading(false);
        }
    }

    function endCall() {
        if (apiRef.current) {
            try { apiRef.current.dispose(); } catch {}
            apiRef.current = null;
        }
        setInCall(false);
        setLoading(false);
        setParticipants(0);
        setIsMuted(false);
        setIsVideoOff(false);
    }

    function toggleMute() {
        if (apiRef.current) {
            apiRef.current.executeCommand('toggleAudio');
        }
    }

    function toggleVideo() {
        if (apiRef.current) {
            apiRef.current.executeCommand('toggleVideo');
        }
    }

    function shareScreen() {
        if (apiRef.current) {
            apiRef.current.executeCommand('toggleShareScreen');
        }
    }

    function copyLink() {
        navigator.clipboard.writeText(meetingLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    }

    return (
        <div className="flex flex-col h-full" style={{ minHeight: 520 }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0"
                style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                        <Video className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            Video Conference
                        </h3>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {inCall
                                ? `In call · ${participants + 1} participant${participants > 0 ? 's' : ''}`
                                : 'Start or join a team video call'}
                        </p>
                    </div>
                </div>

                {/* Controls when in call */}
                {inCall && (
                    <div className="flex items-center gap-2">
                        <button onClick={toggleMute}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{
                                background: isMuted ? '#fef2f2' : 'var(--bg-surface-2)',
                                color: isMuted ? '#dc2626' : 'var(--text-secondary)',
                            }}>
                            {isMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                            {isMuted ? 'Unmute' : 'Mute'}
                        </button>
                        <button onClick={toggleVideo}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{
                                background: isVideoOff ? '#fef2f2' : 'var(--bg-surface-2)',
                                color: isVideoOff ? '#dc2626' : 'var(--text-secondary)',
                            }}>
                            {isVideoOff ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                            {isVideoOff ? 'Start Video' : 'Stop Video'}
                        </button>
                        <button onClick={shareScreen}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                            <Monitor className="h-3.5 w-3.5" /> Share Screen
                        </button>
                        <button onClick={endCall}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                            style={{ background: '#dc2626' }}>
                            <PhoneOff className="h-3.5 w-3.5" /> Leave
                        </button>
                    </div>
                )}
            </div>

            {/* Pre-call screen */}
            {!inCall && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
                    {/* Animated preview */}
                    <div className="relative">
                        <div className="w-32 h-32 rounded-2xl flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg,rgba(37,99,235,0.1),rgba(124,58,237,0.1))' }}>
                            <Video className="h-14 w-14" style={{ color: '#2563eb', opacity: 0.7 }} />
                        </div>
                        {/* Member avatars */}
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex -space-x-2">
                            {members.slice(0, 4).map((m: any, i: number) => (
                                <div key={m.user_id || i}
                                    className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
                                    style={{ background: ['#2563eb','#7c3aed','#059669','#d97706'][i % 4] }}>
                                    {m.user?.name?.[0] || '?'}
                                </div>
                            ))}
                            {members.length > 4 && (
                                <div className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold"
                                    style={{ background: 'var(--bg-surface-3)', color: 'var(--text-secondary)' }}>
                                    +{members.length - 4}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-center mt-4">
                        <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-primary)' }}>
                            {teamName} Meeting Room
                        </h3>
                        <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
                            Start a video call with your team. Share your screen, collaborate in real-time, and record meetings.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                        {[
                            { icon: Video, label: 'HD Video' },
                            { icon: Monitor, label: 'Screen Share' },
                            { icon: Shield, label: 'Encrypted' },
                        ].map(f => (
                            <div key={f.label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl"
                                style={{ background: 'var(--bg-surface-2)' }}>
                                <f.icon className="h-5 w-5" style={{ color: '#2563eb' }} />
                                <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{f.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                        <button
                            onClick={startCall}
                            disabled={!scriptLoaded}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}>
                            <Video className="h-4 w-4" />
                            {scriptLoaded ? 'Start Video Call' : 'Loading...'}
                        </button>
                        <a href={meetingLink} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:-translate-y-0.5 border"
                            style={{ color: 'var(--text-primary)', borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
                            <ExternalLink className="h-4 w-4" /> Open in Browser
                        </a>
                    </div>

                    {/* Invite link */}
                    <div className="w-full max-w-sm">
                        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                            INVITE LINK — share with team members
                        </p>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                            style={{ background: 'var(--bg-surface-2)', borderColor: 'var(--border)' }}>
                            <span className="flex-1 text-xs truncate font-mono" style={{ color: 'var(--text-secondary)' }}>
                                {meetingLink}
                            </span>
                            <button onClick={copyLink}
                                className="shrink-0 p-1 rounded transition-colors"
                                style={{ color: copied ? '#059669' : 'var(--text-muted)' }}>
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                            Anyone with this link can join the meeting room
                        </p>
                    </div>

                    {/* Members who can join */}
                    <div className="w-full max-w-sm">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-3.5 w-3.5" style={{ color: 'var(--text-muted)' }} />
                            <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                                TEAM MEMBERS ({members.length})
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {members.slice(0, 8).map((m: any) => (
                                <div key={m.user_id}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                    style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                                        style={{ background: '#2563eb' }}>
                                        {m.user?.name?.[0] || '?'}
                                    </div>
                                    {m.user?.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Loading state */}
            {loading && (
                <div className="flex-1 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: '#2563eb', borderTopColor: 'transparent' }} />
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                        Connecting to meeting room...
                    </p>
                </div>
            )}

            {/* Jitsi iframe container */}
            <div
                ref={jitsiRef}
                className="flex-1"
                style={{
                    display: inCall ? 'block' : 'none',
                    minHeight: 480,
                    borderRadius: '0 0 12px 12px',
                    overflow: 'hidden',
                }}
            />
        </div>
    );
}
