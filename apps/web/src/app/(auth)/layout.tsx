export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
            style={{ 
                backgroundImage: 'url("/images/auth-bg.png")', 
                backgroundSize: 'cover', 
                backgroundPosition: 'center' 
            }}
        >
            {/* Overlay for better contrast */}
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] pointer-events-none" />

            {/* Background blobs for depth */}
            <div className="absolute top-[-100px] left-[-100px] w-[450px] h-[450px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-indigo-500/15 blur-[100px] pointer-events-none" />

            {/* Card with Glassmorphism */}
            <div
                className="relative z-10 w-full max-w-5xl flex rounded-3xl overflow-hidden shadow-[0_32px_120px_rgba(0,0,0,0.6)] border border-white/10"
                style={{ minHeight: '640px' }}
            >
                {/* Left brand panel - Modern Glass */}
                <div className="hidden lg:flex lg:w-[45%] bg-slate-900/60 backdrop-blur-2xl flex-col justify-between p-12 relative overflow-hidden border-r border-white/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-slate-950/40 pointer-events-none" />

                    {/* Logo with improved styling */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
                                <span className="text-white font-black text-base">E</span>
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight">ESMP</span>
                        </div>
                        <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest mt-2 ml-1">
                            Enterprise Service Portal
                        </p>
                    </div>

                    {/* Main copy */}
                    <div className="relative z-10 space-y-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                All-in-one platform
                            </div>
                            <h2 className="text-[2.5rem] font-black text-white leading-[1.1] tracking-tight">
                                Manage your<br />
                                enterprise work<br />
                                <span className="text-blue-500">smarter.</span>
                            </h2>
                        </div>
                        <p className="text-slate-400 text-base leading-relaxed max-w-xs">
                            Unified workspace for projects, tasks, teams, and approvals.
                        </p>

                        {/* Feature pills with glass effect */}
                        <div className="flex flex-wrap gap-2.5 pt-2">
                            {['Projects', 'Tasks', 'Teams', 'Reports', 'Chat'].map(f => (
                                <div key={f} className="px-4 py-1.5 rounded-xl bg-white/5 text-white/50 text-[11px] font-semibold border border-white/5 hover:bg-white/10 hover:text-white/80 transition-colors">
                                    {f}
                                </div>
                            ))}
                        </div>

                        {/* Stats - more premium look */}
                        <div className="flex gap-10 pt-6 border-t border-white/10">
                            {[['500+', 'Users'], ['99.9%', 'Uptime'], ['4 Roles', 'Roles']].map(([val, lbl]) => (
                                <div key={lbl}>
                                    <p className="text-white font-extrabold text-lg">{val}</p>
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{lbl}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="relative z-10 text-slate-500 text-[10px] font-medium tracking-wide translate-x-1">
                        © 2026 ESMP ENTERPRISE. ALL RIGHTS RESERVED.
                    </div>
                </div>

                {/* Right form panel - Clean White/Glass */}
                <div className="flex-1 flex items-center justify-center bg-white/95 lg:bg-white/90 backdrop-blur-xl px-12 py-12">
                    <div className="w-full max-w-sm">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
