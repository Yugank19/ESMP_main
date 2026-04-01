"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Shield, Layers, GitBranch, BarChart2, Globe, Zap, Users, Briefcase, CheckCircle, Star, Cpu } from "lucide-react";

function FadeIn({ children, delay = 0, className = "", from = "bottom" }: { children: React.ReactNode; delay?: number; className?: string; from?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const t = from === "left" ? "translateX(-28px)" : from === "right" ? "translateX(28px)" : "translateY(20px)";
  return (
    <div ref={ref} className={className} style={{ opacity: v ? 1 : 0, transform: v ? "none" : t, transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; obs.disconnect();
      let s = 0; const step = end / 50;
      const t = setInterval(() => { s += step; if (s >= end) { setN(end); clearInterval(t); } else setN(Math.floor(s)); }, 20);
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}


function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{ background: scrolled ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.95)", backdropFilter: "blur(24px)", borderBottom: scrolled ? "1px solid rgba(15,23,42,0.08)" : "1px solid transparent", height: 68 }}>
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm transition-all duration-200 group-hover:scale-105"
            style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}>E</div>
          <span className="font-bold text-[15px] tracking-tight" style={{ color: "#0f172a" }}>ESMP</span>
        </Link>
        <div className="hidden lg:flex items-center gap-0.5">
          {["Features","Modules","Solutions","Resources","About"].map(l => (
            <a key={l} href="#" className="px-3.5 py-2 text-[13.5px] font-medium transition-colors duration-200 rounded-lg hover:bg-slate-50"
              style={{ color: "#475569" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#0f172a")}
              onMouseLeave={e => (e.currentTarget.style.color = "#475569")}>{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/login" className="hidden sm:flex px-4 py-2 rounded-lg text-[13.5px] font-semibold border transition-all duration-200 hover:bg-blue-50 hover:border-blue-300"
            style={{ color: "#2563eb", borderColor: "#bfdbfe" }}>Log in</Link>
          <Link href="/register" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13.5px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)", boxShadow: "0 2px 10px rgba(37,99,235,0.3)" }}>
            Get Started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}


function DashboardPreview() {
  return (
    <div className="relative w-full" style={{ maxWidth: 560 }}>
      <div className="absolute -inset-8 rounded-3xl blur-3xl opacity-25 pointer-events-none"
        style={{ background: "linear-gradient(135deg,rgba(37,99,235,0.5),rgba(124,58,237,0.4))" }} />
      <div className="relative rounded-2xl overflow-hidden border"
        style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.9)", boxShadow: "0 32px 80px rgba(37,99,235,0.18),0 8px 24px rgba(0,0,0,0.08)" }}>
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "#f1f5f9", background: "#fafbff" }}>
          <div className="flex gap-1.5">
            {["#ff5f57","#febc2e","#28c840"].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
          </div>
          <div className="flex-1 mx-3 bg-slate-100 rounded-md px-3 py-1 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-[10px] text-slate-400 font-medium">app.esmp.io/dashboard</span>
          </div>
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[8px] font-bold">A</div>
        </div>
        <div className="flex" style={{ minHeight: 320 }}>
          <div className="w-32 border-r py-3 px-2 flex flex-col gap-0.5" style={{ borderColor: "#f1f5f9", background: "#fafbff" }}>
            {(["Dashboard","Projects","Tasks","Requests","Approvals","Reports","Team"] as const).map((l, i) => (
              <div key={l} className={`px-2 py-1.5 rounded-lg text-[10px] font-medium ${i === 0 ? "text-white" : "text-slate-400"}`}
                style={{ background: i === 0 ? "linear-gradient(135deg,#2563eb,#7c3aed)" : "transparent" }}>{l}</div>
            ))}
          </div>
          <div className="flex-1 p-4 space-y-3">
            <div>
              <p className="text-[11px] font-bold text-slate-700">Welcome back, Alex 👋</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Here&apos;s what&apos;s happening today.</p>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {([["36","Projects","#2563eb","#eff6ff"],["78","Tasks","#7c3aed","#f5f3ff"],["14","Approvals","#d97706","#fffbeb"],["186","Resolved","#059669","#ecfdf5"]] as const).map(([v,l,c,bg]) => (
                <div key={l} className="rounded-xl p-2 text-center" style={{ background: bg }}>
                  <p className="font-bold text-sm leading-none" style={{ color: c }}>{v}</p>
                  <p className="text-[8px] mt-0.5 font-medium" style={{ color: c, opacity: 0.7 }}>{l}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-3" style={{ background: "#f8fafc" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-bold text-slate-600">Project Progress</p>
                <span className="text-[8px] text-blue-500 font-semibold">View All</span>
              </div>
              {([["Website Redesign",72,"#2563eb"],["Mobile App Dev",53,"#7c3aed"],["ERP Integration",91,"#059669"],["Infra Upgrade",40,"#d97706"]] as const).map(([n,p,c]) => (
                <div key={n} className="mb-1.5">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[8px] text-slate-500">{n}</span>
                    <span className="text-[8px] text-slate-400">{p}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-200">
                    <div className="h-full rounded-full" style={{ width: `${p}%`, background: c }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-1">
              {([["New task assigned","2m ago","#2563eb"],["Client request approved","15m ago","#059669"],["Report generated","1h ago","#7c3aed"]] as const).map(([t,time,c]) => (
                <div key={t} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: "#f8fafc" }}>
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c }} />
                  <p className="text-[8px] text-slate-500 flex-1">{t}</p>
                  <p className="text-[7px] text-slate-300">{time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-4 -right-4 flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg border"
        style={{ background: "#fff", borderColor: "#e2e8f0" }}>
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] font-bold text-slate-600">Live · 99.9% uptime</span>
      </div>
    </div>
  );
}


function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ paddingTop: 68, background: "linear-gradient(150deg,#f8fafc 0%,#eff6ff 40%,#f5f3ff 70%,#f8fafc 100%)" }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[700px] h-[700px] rounded-full opacity-[0.12] blur-3xl" style={{ background: "radial-gradient(circle,#2563eb,transparent 70%)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.10] blur-3xl" style={{ background: "radial-gradient(circle,#7c3aed,transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "linear-gradient(#2563eb 1px,transparent 1px),linear-gradient(90deg,#2563eb 1px,transparent 1px)", backgroundSize: "72px 72px" }} />
      </div>
      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center py-20 lg:py-28">
        <div className="space-y-8">
          <FadeIn delay={0}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase"
              style={{ background: "rgba(37,99,235,0.07)", color: "#2563eb", border: "1px solid rgba(37,99,235,0.18)" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Enterprise Service Management
            </div>
          </FadeIn>
          <FadeIn delay={80}>
            <h1 style={{ fontSize: "clamp(2.4rem,4.5vw,3.75rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#0f172a" }}>
              Manage.{" "}
              <span style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Automate.</span>
              <br />Deliver with <span style={{ color: "#2563eb" }}>ESMP</span>
            </h1>
          </FadeIn>
          <FadeIn delay={160}>
            <p className="text-[15px] leading-[1.75] max-w-[480px]" style={{ color: "#475569" }}>
              A unified platform to streamline service management, automate workflows, and empower teams across your entire organization — from IT to HR to Operations.
            </p>
          </FadeIn>
          <FadeIn delay={240}>
            <div className="flex flex-wrap gap-3">
              <Link href="/register" className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)", boxShadow: "0 4px 20px rgba(37,99,235,0.35)" }}>
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ color: "#0f172a", background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                Request a Demo
              </Link>
            </div>
          </FadeIn>
          <FadeIn delay={320}>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {(["#2563eb","#7c3aed","#059669","#d97706","#dc2626"] as const).map((c,i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-bold" style={{ background: c }}>
                    {String.fromCharCode(65+i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-[11px] font-medium" style={{ color: "#64748b" }}>
                  Trusted by <span className="font-bold text-slate-700">10,000+</span> professionals
                </p>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={400}>
            <div className="grid grid-cols-4 gap-3 pt-2">
              {([
                { icon: Users, value: 10000, suffix: "+", label: "Active Users", color: "#2563eb" },
                { icon: Briefcase, value: 2500, suffix: "+", label: "Projects", color: "#7c3aed" },
                { icon: CheckCircle, value: 99.8, suffix: "%", label: "Satisfaction", color: "#059669" },
                { icon: Zap, value: 24, suffix: "/7", label: "Uptime", color: "#d97706" },
              ] as const).map(s => (
                <div key={s.label} className="text-center p-3 rounded-xl transition-all duration-200 hover:-translate-y-1 cursor-default"
                  style={{ background: "rgba(255,255,255,0.85)", border: "1px solid rgba(37,99,235,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <s.icon className="h-4 w-4 mx-auto mb-1.5" style={{ color: s.color }} />
                  <p className="font-bold text-base leading-none" style={{ color: "#0f172a" }}><Counter end={s.value} suffix={s.suffix} /></p>
                  <p className="text-[10px] mt-1 font-medium" style={{ color: "#94a3b8" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
        <FadeIn delay={200} from="right" className="flex justify-center lg:justify-end pb-8">
          <DashboardPreview />
        </FadeIn>
      </div>
    </section>
  );
}

function TrustedBy() {
  return (
    <section className="py-16 border-y" style={{ background: "#fff", borderColor: "#f1f5f9" }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.15em] mb-10" style={{ color: "#cbd5e1" }}>
          Trusted by forward-thinking organizations
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-14 gap-y-6">
          {["TechNova","InnovaSoft","DataVision","CloudCore","PrimeLogic","NextGen"].map(name => (
            <div key={name} className="font-bold text-[15px] tracking-tight cursor-default transition-all duration-300 hover:scale-105"
              style={{ color: "#d1d5db" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#2563eb")}
              onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")}>{name}</div>
          ))}
        </div>
      </div>
    </section>
  );
}


const features = [
  { icon: Layers,    title: "Unified Command Center",  desc: "Consolidate disparate workflows into a single source of truth. Customizable dashboards provide clarity at every organizational level.", cta: "Explore" },
  { icon: Shield,    title: "Fortress Security",        desc: "Enterprise-grade encryption and granular role-based access controls tailored for high-security environments.", cta: "Learn more", highlight: true },
  { icon: GitBranch, title: "Smart Workflows",          desc: "Seamlessly bridge departments with intelligent routing and automated hand-offs that eliminate human error." },
  { icon: BarChart2, title: "Predictive Analytics",     desc: "Anticipate service bottlenecks before they occur with real-time dashboards and ML-powered insights." },
  { icon: Globe,     title: "Global Reach",             desc: "Multi-region deployment and localized interfaces ensure consistency across your international workforce." },
  { icon: Cpu,       title: "Real-Time Automation",     desc: "Trigger intelligent workflows automatically based on events, thresholds, and configurable business rules." },
];

function Features() {
  return (
    <section className="py-24 lg:py-32" style={{ background: "#f8fafc" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <FadeIn>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase mb-5"
              style={{ background: "rgba(37,99,235,0.07)", color: "#2563eb", border: "1px solid rgba(37,99,235,0.15)" }}>
              Platform Capabilities
            </div>
            <h2 className="font-bold mb-4" style={{ fontSize: "clamp(1.75rem,3vw,2.5rem)", color: "#0f172a", letterSpacing: "-0.02em" }}>
              Engineered for Excellence
            </h2>
            <p className="max-w-xl mx-auto text-[15px] leading-relaxed" style={{ color: "#64748b" }}>
              Sophisticated tools designed for complex organizational structures where precision is the only metric that matters.
            </p>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <FadeIn key={f.title} delay={i * 60}>
              <div className="group p-7 rounded-2xl h-full flex flex-col cursor-default transition-all duration-300 hover:-translate-y-2"
                style={{
                  background: f.highlight ? "linear-gradient(145deg,#1d4ed8,#7c3aed)" : "#fff",
                  boxShadow: f.highlight ? "0 20px 48px rgba(37,99,235,0.28),0 4px 12px rgba(0,0,0,0.08)" : "0 2px 12px rgba(15,23,42,0.06)",
                  border: f.highlight ? "none" : "1px solid #f1f5f9",
                }}
                onMouseEnter={e => { if (!f.highlight) { e.currentTarget.style.boxShadow = "0 16px 40px rgba(37,99,235,0.12)"; e.currentTarget.style.borderColor = "#bfdbfe"; } }}
                onMouseLeave={e => { if (!f.highlight) { e.currentTarget.style.boxShadow = "0 2px 12px rgba(15,23,42,0.06)"; e.currentTarget.style.borderColor = "#f1f5f9"; } }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: f.highlight ? "rgba(255,255,255,0.18)" : "rgba(37,99,235,0.08)" }}>
                  <f.icon className="h-5 w-5" style={{ color: f.highlight ? "#fff" : "#2563eb" }} />
                </div>
                <h3 className="font-semibold text-[15px] mb-2.5" style={{ color: f.highlight ? "#fff" : "#0f172a" }}>{f.title}</h3>
                <p className="text-sm flex-1 leading-relaxed" style={{ color: f.highlight ? "rgba(255,255,255,0.72)" : "#64748b" }}>{f.desc}</p>
                {f.cta && (
                  <a href="#" className="mt-5 flex items-center gap-1.5 text-sm font-semibold transition-all duration-200 hover:gap-2.5"
                    style={{ color: f.highlight ? "#fff" : "#2563eb" }}>
                    {f.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function Visionaries() {
  const cases = [
    { no: "01", title: "Fortune 100 Conglomerates", tag: "Enterprise", desc: "Centralize multi-continental operations under a unified governance model while maintaining local autonomy.", cta: "Download Executive Whitepaper" },
    { no: "02", title: "Research & Education", tag: "Academic", desc: "Bridge the communication gap between research faculties and administration with streamlined grant and asset management.", cta: "Explore Academic Solutions" },
  ];
  return (
    <section className="py-24 lg:py-32" style={{ background: "#fff" }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <FadeIn>
          <div className="mb-16">
            <h2 className="font-bold mb-4" style={{ fontSize: "clamp(2rem,3.5vw,3rem)", color: "#0f172a", letterSpacing: "-0.025em", lineHeight: 1.15 }}>
              Designed for the<br />
              <em style={{ fontStyle: "italic", background: "linear-gradient(135deg,#2563eb,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>visionaries</em>{" "}of scale.
            </h2>
            <p className="max-w-lg text-[15px] leading-relaxed" style={{ color: "#64748b" }}>
              We don&apos;t just build portals; we design ecosystem frameworks for the world&apos;s most complex organizations.
            </p>
          </div>
        </FadeIn>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((c, i) => (
            <FadeIn key={c.no} delay={i * 100}>
              <div className="group p-8 rounded-2xl flex flex-col gap-4 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#bfdbfe"; e.currentTarget.style.background = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#94a3b8" }}>Case Study No. {c.no}</span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: "rgba(37,99,235,0.08)", color: "#2563eb" }}>{c.tag}</span>
                </div>
                <h3 className="font-bold text-xl" style={{ color: "#0f172a", letterSpacing: "-0.01em" }}>{c.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{c.desc}</p>
                <a href="#" className="flex items-center gap-2 text-sm font-semibold transition-all duration-200 hover:gap-3" style={{ color: "#2563eb" }}>
                  {c.cta} <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 lg:py-32" style={{ background: "#0f172a" }}>
      <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
        <FadeIn>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase mb-8"
            style={{ background: "rgba(37,99,235,0.2)", color: "#93c5fd", border: "1px solid rgba(37,99,235,0.3)" }}>
            Ready to scale?
          </div>
          <h2 className="font-bold text-white mb-5" style={{ fontSize: "clamp(1.75rem,3.5vw,2.75rem)", letterSpacing: "-0.025em", lineHeight: 1.2 }}>
            Ready to institutionalize efficiency?
          </h2>
          <p className="mb-10 text-[15px] leading-relaxed max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
            Join the elite 1% of enterprises utilizing ESMP to redefine their operational DNA.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
              style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)", boxShadow: "0 4px 20px rgba(37,99,235,0.4)" }}>
              Initiate Onboarding <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-white/10"
              style={{ color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}>
              Talk to a Solutions Architect
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { title: "Platform", links: ["Core Features","Security","API","Integrations"] },
    { title: "Company",  links: ["About Us","Careers","Partners","Blog"] },
    { title: "Resources",links: ["Whitepapers","Webinars","Support","Docs"] },
    { title: "Legal",    links: ["Privacy Policy","Terms of Service","Security"] },
  ];
  return (
    <footer className="py-16 px-6 lg:px-10" style={{ background: "#0a0f1e", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs"
                style={{ background: "linear-gradient(135deg,#2563eb,#7c3aed)" }}>E</div>
              <span className="font-bold text-sm text-white">ESMP</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
              Empowering global organizations with high-precision service management architectures since 2018.
            </p>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4 text-white">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l}><a href="#" className="text-xs transition-colors duration-200 hover:text-white" style={{ color: "rgba(255,255,255,0.35)" }}>{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>© 2024 Enterprise Service Management Portal. All rights reserved.</p>
          <div className="flex gap-5">
            {["LinkedIn","Twitter","YouTube","GitHub"].map(s => (
              <a key={s} href="#" className="text-xs transition-colors duration-200 hover:text-white" style={{ color: "rgba(255,255,255,0.25)" }}>{s}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div style={{ background: "#f8fafc" }}>
      <Navbar />
      <Hero />
      <TrustedBy />
      <Features />
      <Visionaries />
      <CTA />
      <Footer />
    </div>
  );
}
