import { cn } from "@/lib/utils";
import { Terminal, Shield, Zap, Globe, Activity, Lock } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-950 font-sans"
            style={{ 
                backgroundImage: 'url("/images/auth-bg.png")', 
                backgroundSize: 'cover', 
                backgroundPosition: 'center' 
            }}
        >
            {/* Tactical Grid Overlay */}
            <div className="absolute inset-0 bg-[url('https://grain-y.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/80 to-blue-900/20 pointer-events-none" />

            {/* Background Depth Orbs */}
            <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-120px] right-[-80px] w-[450px] h-[450px] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

            {/* Enterprise Access Terminal Card */}
            <div
                className="relative z-10 w-full max-w-5xl flex rounded-[4px] overflow-hidden shadow-[0_48px_128px_rgba(0,0,0,0.8)] border border-white/5 bg-slate-900/40 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-1000"
                style={{ minHeight: '680px' }}
            >
                {/* Left Sector: Strategic Overview */}
                <div className="hidden lg:flex lg:w-[45%] bg-slate-950/40 flex-col justify-between p-14 relative overflow-hidden border-r border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-slate-950/60 pointer-events-none" />

                    {/* Logo Segment */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[4px] bg-blue-600 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/30 font-black text-white text-lg">
                                E
                            </div>
                            <div>
                                <h1 className="text-white font-black text-xl tracking-tighter leading-none">ESMP</h1>
                                <p className="text-blue-500/80 text-[8px] font-black uppercase tracking-[0.3em] mt-1.5 flex items-center gap-1.5">
                                    <Activity className="h-2 w-2" /> SECTOR_READY_V.5
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Core Messaging Hub */}
                    <div className="relative z-10 space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-[2px] bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                <Zap className="h-3 w-3 fill-blue-500/20" /> MISSION_CRITICAL_READY
                            </div>
                            <h2 className="text-[2.75rem] font-black text-white leading-[1.05] tracking-tight uppercase">
                                Strategic<br />
                                Workflow<br />
                                <span className="text-blue-600">Optimization.</span>
                            </h2>
                        </div>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-wide leading-relaxed max-w-xs opacity-70">
                            Unified terminal for project intelligence, task synchronization, and sector-wide approvals.
                        </p>

                        {/* Tactical Segments */}
                        <div className="flex flex-wrap gap-2 pt-4">
                            {['PROJECTS', 'TASKS', 'TEAMS', 'REPORTS', 'GOVERNANCE'].map(f => (
                                <div key={f} className="px-4 py-2 rounded-[2px] bg-white/5 text-white/40 text-[9px] font-black border border-white/5 hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/5 transition-all cursor-default uppercase tracking-widest">
                                    {f}
                                </div>
                            ))}
                        </div>

                        {/* Heuristic Stats */}
                        <div className="flex gap-12 pt-8 border-t border-white/5">
                            {[
                                { val: '1.2K+', lbl: 'UNITS', icon: Globe },
                                { val: '99.9%', lbl: 'UPTIME', icon: Activity },
                                { val: 'IV_LVL', lbl: 'AUTH', icon: Shield }
                            ].map(({ val, lbl, icon: Icon }) => (
                                <div key={lbl} className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-white/30">
                                        <Icon className="h-3 w-3 text-blue-500/40" />
                                        <p className="text-[9px] font-black uppercase tracking-widest">{lbl}</p>
                                    </div>
                                    <p className="text-white font-black text-xl tabular-nums tracking-tighter">{val}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Registry Footer */}
                    <div className="relative z-10 flex items-center gap-3 text-slate-600 text-[9px] font-black tracking-[0.2em] transition-opacity hover:opacity-100 uppercase">
                        <Terminal className="h-3 w-3" /> © 2026 ESMP_PROTOCOLS_V5
                    </div>
                </div>

                {/* Right Sector: Authentication Hub */}
                <div className="flex-1 flex items-center justify-center bg-white/95 backdrop-blur-2xl px-16 py-16 relative overflow-hidden">
                    {/* Subtle Sector ID background */}
                    <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none select-none">
                        <Lock className="h-64 w-64 text-slate-900" />
                    </div>
                    
                    <div className="w-full max-w-sm relative z-10">
                        {children}
                    </div>
                </div>
            </div>
            
            {/* Terminal Status Footer */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-8 opacity-20 pointer-events-none">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">AUTH_LINK: STABLE</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">SECURE_V3_AES256</span>
                </div>
            </div>
        </div>
    );
}
