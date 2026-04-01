"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Search, Plus, X, Pin } from 'lucide-react';
import { getArticles, getArticle, createArticle, updateArticle } from '@/lib/kb-api';

const CATEGORIES = ['IT', 'HR', 'POLICY', 'PROCESS', 'FAQ', 'GENERAL'];

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', category: 'GENERAL', tags: '', is_published: true, is_pinned: false });

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (!s) { router.push('/login'); return; }
    const u = JSON.parse(s);
    if ((u.roles?.[0] || '').toUpperCase() === 'STUDENT') { router.push('/dashboard'); return; }
    setUser(u);
    const role = (u.roles?.[0] || '').toUpperCase();
    setIsManager(['MANAGER', 'ADMIN'].includes(role));
    load();
  }, []);

  async function load(s = search, c = filterCat) {
    try {
      const f: any = {};
      if (s) f.search = s;
      if (c) f.category = c;
      const data = await getArticles(f);
      setArticles(Array.isArray(data) ? data : []);
    } catch {}
  }

  async function openArticle(id: string) {
    try { const a = await getArticle(id); setSelected(a); } catch {}
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try { await createArticle(form); setShowCreate(false); load(); } catch (err: any) { alert(err.message); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Knowledge Base</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>Company documentation, FAQs, and guides</p>
        </div>
        {isManager && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--jira-blue)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--jira-blue-hover)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--jira-blue)')}>
            <Plus className="h-4 w-4" /> New Article
          </button>
        )}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); load(e.target.value, filterCat); }}
            placeholder="Search articles..."
            className="w-full pl-9 pr-3 py-2 border rounded text-sm outline-none"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
        </div>
        <select value={filterCat} onChange={e => { setFilterCat(e.target.value); load(search, e.target.value); }}
          className="border rounded px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Articles grid */}
      {articles.length === 0 ? (
        <div className="rounded p-12 text-center" style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}>
          <BookOpen className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No articles yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {articles.map(a => (
            <div key={a.id} onClick={() => openArticle(a.id)}
              className="rounded p-5 cursor-pointer transition-all"
              style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-e100)' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-e200)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-e100)')}>
              <div className="flex items-start justify-between mb-2">
                <span className="lozenge lozenge-info">{a.category}</span>
                {a.is_pinned && <Pin className="h-3.5 w-3.5" style={{ color: 'var(--jira-blue)' }} />}
              </div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{a.title}</h3>
              <p className="text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{a.body?.replace(/<[^>]+>/g, '').slice(0, 120)}...</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.author?.name}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.views} views</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Article detail */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-end z-50">
          <div className="w-full max-w-2xl h-full overflow-y-auto p-8" style={{ background: 'var(--bg-surface)' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="lozenge lozenge-info mb-2 inline-block">{selected.category}</span>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selected.title}</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>By {selected.author?.name} · {selected.views} views</p>
              </div>
              <button onClick={() => setSelected(null)}><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="prose prose-sm max-w-none text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {selected.body?.split('\n').map((line: string, i: number) => <p key={i} className="mb-2">{line}</p>)}
            </div>
            {selected.tags && (
              <div className="flex flex-wrap gap-2 mt-4">
                {selected.tags.split(',').map((t: string) => (
                  <span key={t} className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--bg-surface-3)', color: 'var(--text-secondary)' }}>{t.trim()}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl rounded-lg p-6 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>New Article</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5" style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Title *</label>
                <input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm outline-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Tags (comma separated)</label>
                  <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Content *</label>
                <textarea required rows={10} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm outline-none resize-none"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
                  Publish immediately
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))} />
                  Pin article
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-2 rounded text-sm font-semibold text-white" style={{ backgroundColor: 'var(--jira-blue)' }}>Publish</button>
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
