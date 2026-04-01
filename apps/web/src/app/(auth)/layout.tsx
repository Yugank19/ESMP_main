export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 45%, #1D4ED8 100%)' }}
        >
            {/* Background blobs */}
            <div className="absolute top-[-100px] left-[-100px] w-[450px] h-[450px] rounded-full bg-[#1D4ED8]/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-120px] right-[-80px] w-[400px] h-[400px] rounded-full bg-[#60A5FA]/15 blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/3 w-[250px] h-[250px] rounded-full bg-white/5 blur-2xl pointer-events-none" />

            {/* Card */}
            <div
                className="relative z-10 w-full max-w-5xl flex rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)]"
                style={{ minHeight: '620px' }}
            >
                {/* Left brand panel */}
                <div className="hidden lg:flex lg:w-[45%] bg-[#1E293B] flex-col justify-between p-10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1D4ED8]/25 via-transparent to-[#0F172A]/40 pointer-events-none" />

                    {/* Logo */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#1D4ED8] flex items-center justify-center shrink-0">
                                <span className="text-white font-black text-sm">E</span>
                            </div>
                            <span className="text-white font-bold text-lg tracking-tight">ESMP</span>
                        </div>
                        <p className="text-slate-500 text-xs mt-1.5">Enterprise Service Management Portal</p>
                    </div>

                    {/* Main copy */}
                    <div className="relative z-10 space-y-5">
                        <div className="space-y-2">
                            <p className="text-[#60A5FA] text-xs font-semibold uppercase tracking-widest">
                                All-in-one platform
                            </p>
                            <h2 className="text-[2rem] font-extrabold text-white leading-[1.2] tracking-tight">
                                Manage your<br />
                                enterprise work<br />
                                <span className="text-[#60A5FA]">smarter.</span>
                            </h2>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                            Projects, tasks, teams, and approvals — all streamlined for modern organizations.
                        </p>

                        {/* Feature pills */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {['Projects', 'Tasks', 'Teams', 'Reports', 'Chat'].map(f => (
                                <div key={f} className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-medium border border-white/10">
                                    {f}
                                </div>
                            ))}
                        </div>

                        {/* Stats */}
                        <div className="flex gap-6 pt-2 border-t border-white/10">
                            {[['500+', 'Users'], ['99.9%', 'Uptime'], ['4 Roles', 'Supported']].map(([val, lbl]) => (
                                <div key={lbl}>
                                    <p className="text-white font-bold text-base">{val}</p>
                                    <p className="text-slate-500 text-xs">{lbl}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="relative z-10 text-slate-600 text-[11px]">
                        © 2026 ESMP. All rights reserved.
                    </div>
                </div>

                {/* Right form panel */}
                <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] px-10 py-10">
                    <div className="w-full max-w-sm">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
