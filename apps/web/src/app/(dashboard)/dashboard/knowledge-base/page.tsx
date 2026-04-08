"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Search, Plus, X, Pin, Trash2, ArrowLeft,
  Book, ChevronRight, Eye, User, Calendar, Tag,
  ShieldCheck, Zap, Globe, FileText, Layout, Share2,
  CheckCircle2
} from 'lucide-react';
import { getArticles, getArticle, createArticle, updateArticle, deleteArticle } from '@/lib/kb-api';
import { cn } from '@/lib/utils';

const CATEGORIES = ['IT', 'HR', 'POLICY', 'PROCESS', 'FAQ', 'GENERAL'];

const inputClass = "w-full px-3 py-2.5 bg-white border border-[var(--border)] rounded-[3px] text-sm font-bold text-[var(--text-primary)] placeholder:text-slate-200 outline-none focus:border-[var(--color-primary)] transition-all uppercase tracking-tight";
const labelClass = "text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1.5 block pl-1";

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', body: '', category: 'GENERAL', tags: '', is_published: true, is_pinned: false });

  const load = useCallback(async (s = search, c = filterCat) => {
    setLoading(true);
    try {
      const f: any = {};
      if (s) f.search = s;
      if (c) f.category = c;
      const data = await getArticles(f);
      setArticles(Array.isArray(data) ? data : []);
    } catch { }
    finally { setLoading(false); }
  }, [search, filterCat]);

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (!s) { router.push('/login'); return; }
    const u = JSON.parse(s);
    if ((u.roles?.[0] || '').toUpperCase() === 'STUDENT') { router.push('/dashboard'); return; }
    setUser(u);
    const role = (u.roles?.[0] || '').toUpperCase();
    setIsManager(['MANAGER', 'ADMIN'].includes(role));
    load();
  }, [load, router]);

  async function openArticle(id: string) {
    try { const a = await getArticle(id); setSelected(a); } catch { }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createArticle(form);
      setShowCreate(false);
      load();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDeleteArticle(id: string) {
    if (!confirm('Archive this knowledge asset? This action is permanent.')) return;
    try { await deleteArticle(id); setSelected(null); load(); } catch { alert('Failed to delete asset'); }
  }

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={() => router.back()}
            className="p-2 sm:p-2.5 rounded-[3px] bg-white border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all shadow-sm shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight truncate">Intelligence Repository</h1>
            <p className="hidden sm:block text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-widest">Unified Knowledge Base and Operational Guidelines</p>
          </div>
        </div>
        {isManager && (
          <button onClick={() => setShowCreate(true)}
            className="jira-button jira-button-primary h-10 sm:h-12 px-4 sm:px-8 gap-3 font-bold uppercase text-[9px] sm:text-[10px] shadow-lg shadow-blue-100 w-full sm:w-auto">
            <Plus className="h-4 w-4" /> Create Documentation
          </button>
        )}
      </div>

      {/* Advanced Search + Global Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-[var(--color-primary)] transition-colors" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); load(e.target.value, filterCat); }}
            placeholder="SEARCH INTELLIGENCE ASSETS..."
            className="w-full pl-12 pr-6 py-3 sm:py-4 bg-white border border-[var(--border)] rounded-[3px] text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] placeholder:text-slate-200 outline-none focus:border-[var(--color-primary)] shadow-sm transition-all" />
        </div>
        <div className="relative group w-full md:w-auto">
          <Layout className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-primary)]" />
          <select value={filterCat} onChange={e => { setFilterCat(e.target.value); load(search, e.target.value); }}
            className="w-full bg-white border border-[var(--border)] rounded-[3px] pl-12 pr-10 py-3 sm:py-4 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] focus:border-[var(--color-primary)] outline-none appearance-none cursor-pointer shadow-sm transition-all hover:bg-slate-50">
            <option value="">ALL_SECTORS</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}_UNIT</option>)}
          </select>
          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none rotate-90" />
        </div>
      </div>

      {/* Discovery Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-40">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Executing Intelligence Query...</span>
        </div>
      ) : articles.length === 0 ? (
        <div className="card p-32 text-center flex flex-col items-center opacity-30">
          <BookOpen className="h-20 w-20 text-[var(--text-muted)] mb-6 stroke-[1px]" />
          <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Repository Exhausted</h3>
          <p className="text-xs font-bold text-[var(--text-muted)] mt-2 uppercase tracking-widest">No intelligence assets found within current sector synchronization.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map(a => (
            <div key={a.id} onClick={() => openArticle(a.id)}
              className="card p-0 overflow-hidden border-[var(--border)] hover:border-[var(--color-primary)] group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <span className="px-2 py-0.5 text-[9px] font-extrabold border border-blue-100 bg-blue-50 text-[var(--color-primary)] rounded-[2px] uppercase tracking-widest shadow-sm transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-white">
                    {a.category}
                  </span>
                  {a.is_pinned && <Zap className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse" />}
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3 leading-tight group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">{a.title}</h3>
                <p className="text-[11px] font-medium text-[var(--text-secondary)] line-clamp-3 leading-relaxed mb-6 opacity-80 group-hover:opacity-100 transition-opacity">
                  {a.body?.replace(/<[^>]+>/g, '').slice(0, 160)}...
                </p>
                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      {a.author?.name?.[0] || 'O'}
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">{a.author?.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Eye className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold tracking-tighter tabular-nums">{a.views}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Intel Drawer */}
      {selected && (
        <div className="fixed inset-0 z-[110] flex items-start justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-3xl h-full bg-white shadow-2xl overflow-y-auto no-scrollbar animate-in slide-in-from-right-1/2 duration-500 border-l border-[var(--border)] flex flex-col">
            <div className="px-8 py-6 bg-[var(--bg-surface-2)] border-b border-[var(--border)] sticky top-0 z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-[var(--color-primary)]" />
                <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">INTELLIGENCE_ASSET_UNIT: {selected.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 bg-white border border-[var(--border)] rounded-[3px] text-slate-400 hover:text-[var(--color-primary)] transition-all shadow-sm">
                  <Share2 className="h-4.5 w-4.5" />
                </button>
                {isManager && (
                  <button onClick={() => handleDeleteArticle(selected.id)} className="p-2 bg-red-50 border border-red-100 rounded-[3px] text-red-400 hover:text-red-700 transition-all shadow-sm">
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="p-2 bg-white border border-[var(--border)] rounded-[3px] text-slate-400 hover:text-[var(--text-primary)] transition-all shadow-sm">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-12 space-y-12 flex-1 max-w-3xl mx-auto w-full">
              {/* Core Meta */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 text-[10px] font-extrabold border border-blue-100 bg-blue-50 text-[var(--color-primary)] rounded-[2px] uppercase tracking-widest shadow-sm">
                    {selected.category}_PROTOCOL
                  </span>
                  {selected.is_pinned && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 text-amber-600 rounded-[2px] text-[10px] font-bold uppercase tracking-widest">
                      <Zap className="h-3.5 w-3.5 fill-amber-500" /> MISSION_CRITICAL
                    </div>
                  )}
                </div>
                <h2 className="text-4xl font-extrabold text-[var(--text-primary)] leading-tight tracking-tight">{selected.title}</h2>

                <div className="flex items-center gap-8 py-6 border-y border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[12px] font-extrabold text-slate-400 shadow-sm">
                      {selected.author?.name?.[0] || 'O'}
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Authorized Author</p>
                      <p className="text-[12px] font-bold text-[var(--text-primary)] uppercase">{selected.author?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                      <Calendar className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Last Synchronization</p>
                      <p className="text-[12px] font-bold text-[var(--text-primary)] uppercase">
                        {new Date(selected.updated_at || selected.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intellectual Content */}
              <div className="prose-slate max-w-none">
                {selected.body?.split('\n').map((line: string, i: number) => {
                  if (!line.trim()) return <br key={i} />;
                  return <p key={i} className="text-base text-[var(--text-secondary)] leading-loose mb-6 font-medium opacity-90">{line}</p>;
                })}
              </div>

              {/* Heuristic Tags */}
              {selected.tags && (
                <div className="pt-12 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5" /> Sector Indexing Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.tags.split(',').map((t: string) => (
                      <span key={t} className="px-3 py-1.5 rounded-[2px] border border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
                        {t.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Initialization Terminal Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[3px] shadow-2xl w-full max-w-2xl overflow-hidden border border-[var(--border)] animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-[var(--bg-surface-2)] border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-[var(--color-primary)]" />
                <h2 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">New Sector Documentation</h2>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1.5 rounded-[3px] hover:bg-white hover:border-[var(--border)] border border-transparent transition-all"
              >
                <X className="h-4 w-4 text-[var(--text-muted)]" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-8">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">Register Intelligence Unit</h3>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Formalize mission guidelines and technical documentation.</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className={labelClass}>Asset Title *</label>
                  <input required value={form.title} placeholder="INTELLIGENCE_OBJECTIVE_IDENTIFIER" onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className={cn(inputClass, "uppercase")} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Sector Designation (Category)</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-primary)]" />
                      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                        className={cn(inputClass, "pl-10 appearance-none bg-slate-50")}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}_UNIT</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Indexing Protocol (Tags)</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                      <input value={form.tags} placeholder="TAG1, TAG2, TAG3" onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                        className={cn(inputClass, "pl-10 uppercase")} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Intel Stream (Content) *</label>
                  <textarea required rows={12} value={form.body} placeholder="Formalize intelligence stream for global distribution..." onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    className={cn(inputClass, "resize-none font-medium normal-case leading-relaxed")} />
                </div>

                <div className="flex items-center gap-8 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn(
                      "w-5 h-5 rounded-[2px] border-2 flex items-center justify-center transition-all",
                      form.is_published ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : "border-slate-300 bg-white"
                    )}>
                      {form.is_published && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                      <input type="checkbox" className="hidden" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider group-hover:text-[var(--text-primary)] transition-colors">Broadcast Stream (Publish)</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={cn(
                      "w-5 h-5 rounded-[2px] border-2 flex items-center justify-center transition-all",
                      form.is_pinned ? "bg-amber-500 border-amber-500" : "border-slate-300 bg-white"
                    )}>
                      {form.is_pinned && <Zap className="h-3.5 w-3.5 text-white" />}
                      <input type="checkbox" className="hidden" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider group-hover:text-[var(--text-primary)] transition-colors">Mission Critical (Pin)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-[var(--border)]">
                <button type="submit" className="jira-button jira-button-primary h-12 flex-1 font-bold uppercase text-[10px] shadow-lg shadow-blue-100">Synchronize Asset</button>
                <button type="button" onClick={() => setShowCreate(false)} className="jira-button border border-[var(--border)] h-12 flex-1 font-bold uppercase text-[10px] bg-white text-[var(--text-muted)]">Abort Transmission</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
