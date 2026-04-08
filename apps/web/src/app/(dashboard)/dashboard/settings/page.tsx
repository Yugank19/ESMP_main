"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Bell, Shield, Palette, Globe, Save, Check, 
  Lock, Eye, EyeOff, LogOut, Camera, Sliders, 
  ShieldCheck, Smartphone, Settings as SettingsIcon,
  ChevronRight, Terminal, Zap, Info, Mail, Phone,
  FileText, X, AlertCircle, Activity
} from 'lucide-react';
import { getUserPreferences, updateUserPreferences, getTeamSettings, updateTeamSettings } from '@/lib/settings-api';
import { callLogout } from '@/lib/audit-api';
import { applyThemeClass } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'profile', label: 'CORE_PROFILE', icon: User, desc: 'Identity & Credentials' },
  { id: 'notifications', label: 'COMMS_LOG', icon: Bell, desc: 'Signal Preferences' },
  { id: 'appearance', label: 'UI_VISUALS', icon: Palette, desc: 'Temporal Themes' },
  { id: 'security', label: 'AUTH_SHIELD', icon: Shield, desc: 'Access Protocols' },
  { id: 'privacy', label: 'SIGNAL_STEALTH', icon: Eye, desc: 'Visibility Control' },
  { id: 'team', label: 'SECTOR_CONFIG', icon: Globe, desc: 'Team Unit Parameters' },
];

const inputClass = "w-full px-4 py-3 bg-white border border-[var(--border)] rounded-[3px] text-sm font-bold text-[var(--text-primary)] placeholder:text-slate-200 outline-none focus:border-[var(--color-primary)] transition-all uppercase tracking-tight";
const labelClass = "text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2 block pl-1";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [prefs, setPrefs] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [teamSettings, setTeamSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', bio: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [viewPhoto, setViewPhoto] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const loadPrefs = useCallback(async () => {
    try {
      const data = await getUserPreferences();
      setPrefs(data);
    } catch {
      setPrefs({ theme: 'light', language: 'en', notifications_enabled: true, email_notifications: true, desktop_notifications: false, timezone: 'UTC' });
    }
  }, []);

  const loadTeams = useCallback(async () => {
    try {
      const res = await fetch(`${API}/teams`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setTeams(list);
      if (list.length > 0) setSelectedTeam(list[0].id);
    } catch {}
  }, [API]);

  const loadTeamSettings = useCallback(async (teamId: string) => {
    try { setTeamSettings(await getTeamSettings(teamId) || {}); } catch { setTeamSettings({}); }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    const u = JSON.parse(stored);
    setUser(u);
    setProfileForm({ name: u.name || '', email: u.email || '', bio: u.bio || '', phone: u.phone || '' });
    loadPrefs();
    loadTeams();
  }, [loadPrefs, loadTeams, router]);

  useEffect(() => { if (selectedTeam) loadTeamSettings(selectedTeam); }, [selectedTeam, loadTeamSettings]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('DATA_OVERFLOW: FILE EXCEEDS 5MB LIMIT'); return; }
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/profile/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const url = data.avatar_url.startsWith('/uploads/') ? `${API}${data.avatar_url}` : data.avatar_url;
        setUser((u: any) => ({ ...u, avatar_url: url }));
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, avatar_url: url }));
        showSaved();
      }
    } catch {}
    finally { setAvatarUploading(false); }
  }

  async function savePrefs(updates: any) {
    setSaving(true);
    try {
      const updated = await updateUserPreferences(updates);
      setPrefs(updated);
      if (updates.theme) {
        localStorage.setItem('esmp_theme', updates.theme);
        applyThemeClass(updates.theme);
      }
      showSaved();
    }
    catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch(`${API}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ name: profileForm.name, bio: profileForm.bio, phone: profileForm.phone }),
      });
      if (!res.ok) throw new Error('PROFILE_SYCHRONIZATION_FAILED');
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name: profileForm.name }));
      setUser((u: any) => ({ ...u, name: profileForm.name }));
      showSaved();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function savePassword() {
    setPwError('');
    if (passwordForm.newPass !== passwordForm.confirm) { setPwError('TOKEN_MISMATCH: PASSWORDS DO NOT MATCH'); return; }
    if (passwordForm.newPass.length < 8) { setPwError('COMPLEXITY_FAILURE: MIN 8 CHARACTERS REQUIRED'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API}/profile/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ current_password: passwordForm.current, new_password: passwordForm.newPass }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'FAILED'); }
      setPasswordForm({ current: '', newPass: '', confirm: '' });
      showSaved();
    } catch (e: any) { setPwError(e.message); }
    finally { setSaving(false); }
  }

  async function saveTeamSettings() {
    if (!selectedTeam) return;
    setSaving(true);
    try { await updateTeamSettings(selectedTeam, teamSettings); showSaved(); }
    catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function handleLogout() {
    try { await callLogout(); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }

  function showSaved() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-96 gap-4 opacity-40">
      <div className="h-10 w-10 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
      <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Synchronizing Account Identity...</span>
    </div>
  );

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[3px] bg-slate-900 border border-slate-700 flex items-center justify-center text-white shadow-lg">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-tight">Enterprise Configuration Interface</h1>
            <p className="text-[10px] font-bold text-[var(--text-muted)] mt-1 uppercase tracking-widest">Master account protocols and communications logic management</p>
          </div>
        </div>
        {saved && (
            <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-[3px] text-emerald-700 text-[10px] font-bold uppercase tracking-widest animate-in slide-in-from-top-4 shadow-sm">
              <Check className="h-4 w-4" /> Parameters Synchronized
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
            <div className="bg-[var(--bg-surface-2)] p-2 rounded-[3px] border border-[var(--border)] shadow-sm">
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={cn(
                        "w-full flex items-center gap-4 px-4 py-4 rounded-[1px] transition-all text-left group",
                        activeTab === tab.id ? "bg-white shadow-md border border-slate-100 ring-2 ring-blue-50 z-10" : "hover:bg-slate-50/50"
                    )}>
                    <div className={cn(
                        "w-8 h-8 rounded-[3px] flex items-center justify-center border transition-all",
                        activeTab === tab.id ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-blue-100 shadow-lg" : "bg-white border-slate-100 text-slate-400 group-hover:bg-slate-100"
                    )}>
                        <tab.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={cn("text-[10px] font-black uppercase tracking-[0.15em]", activeTab === tab.id ? "text-[var(--text-primary)]" : "text-slate-400 group-hover:text-slate-600")}>{tab.label}</p>
                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter mt-0.5 truncate">{tab.desc}</p>
                    </div>
                    {activeTab === tab.id && <ChevronRight className="h-4 w-4 text-[var(--color-primary)]" />}
                  </button>
                ))}
            </div>

            <div className="p-4 bg-red-50 border border-red-100 rounded-[3px] mt-6 group">
                <button onClick={handleLogout}
                    className="w-full flex items-center gap-4 py-2 text-red-500 transition-all font-black uppercase text-[10px] tracking-widest">
                    <LogOut className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                    Terminate Session
                </button>
            </div>
        </div>

        {/* Configuration Core */}
        <div className="lg:col-span-3 card p-0 overflow-hidden shadow-xl border-[var(--border)] min-h-[600px] animate-in slide-in-from-right-4 duration-500">
          <div className="bg-[var(--bg-surface-2)] border-b border-[var(--border)] px-10 py-6 flex items-center justify-between">
               <div className="flex items-center gap-3">
                    <Terminal className="h-4 w-4 text-[var(--color-primary)]" />
                    <h2 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">ACTIVE_LOGIC_BLOCK: {activeTab.toUpperCase()}</h2>
               </div>
               <div className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 text-slate-200" />
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">v.2.4.0_CORE</span>
               </div>
          </div>

          <div className="p-12">
              {activeTab === 'profile' && (
                <div className="space-y-12">
                  {/* Photo Management Protocol */}
                  <div className="flex items-center gap-8 group/root">
                    <div className="relative group/avatar">
                        <div className="w-32 h-32 rounded-full ring-8 ring-slate-50 overflow-hidden border-2 border-slate-100 bg-white transition-transform group-hover/avatar:scale-[1.02] duration-500">
                             {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover cursor-pointer" onClick={() => setViewPhoto(true)} />
                             ) : (
                                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white text-3xl font-black">
                                  {user.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                             )}
                        </div>
                        <label className="absolute right-0 bottom-0 w-10 h-10 rounded-full bg-[var(--color-primary)] border-4 border-white flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 active:scale-95 transition-all group-hover/avatar:ring-4 group-hover/avatar:ring-blue-100 z-10">
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            <Camera className={cn("h-4 w-4 text-white", avatarUploading && "animate-pulse")} />
                        </label>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                             <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight leading-none">{user.name}</h3>
                             <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-100 text-[var(--color-primary)] text-[8px] font-black rounded-[2px] uppercase tracking-widest">{user.roles?.[0] || 'IDENTIFIED_UNIT'}</span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <Mail className="h-3 w-3" /> {user.email}
                        </p>
                        <div className="mt-4 flex gap-3">
                             <label className="jira-button border border-[var(--border)] h-9 px-4 bg-white text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-all flex items-center gap-2">
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                                <Zap className="h-3 w-3" /> Sync Media
                             </label>
                        </div>
                    </div>
                  </div>

                  {/* Profile Lightbox Interface */}
                  {viewPhoto && user.avatar_url && (
                    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[200] p-8 animate-in fade-in duration-300" onClick={() => setViewPhoto(false)}>
                      <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                        <img src={user.avatar_url} alt={user.name} className="w-full h-auto rounded-[3px] border border-white/20 shadow-2xl shadow-black animate-in zoom-in-95 duration-500" />
                        <button onClick={() => setViewPhoto(false)} className="absolute -top-12 right-0 flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest hover:text-[var(--color-primary)] transition-colors">
                            <X className="h-5 w-5" /> Terminate View
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                        <label className={labelClass}>Entity Identifier</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} className={cn(inputClass, "pl-12 uppercase")} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Primary Comms (Read Only)</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-100" />
                            <input value={profileForm.email} disabled className={cn(inputClass, "pl-12 lowercase text-slate-200 bg-slate-50/50")} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Tactical Phine Link</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                            <input value={profileForm.phone} placeholder="+X XXX-XXXX" onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} className={cn(inputClass, "pl-12")} />
                        </div>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                        <label className={labelClass}>Operational Biography</label>
                        <div className="relative">
                            <FileText className="absolute left-4 top-4 h-4 w-4 text-slate-300" />
                            <textarea value={profileForm.bio} placeholder="Enter personnel documentation..." onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} rows={4}
                                className={cn(inputClass, "pl-12 resize-none normal-case font-medium leading-relaxed")} />
                        </div>
                    </div>
                  </div>
                  
                  <div className="pt-8 border-t border-slate-50">
                    <SaveButton onClick={saveProfile} saving={saving} />
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && prefs && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Signal Dispatch Logic</h2>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Configure global alert relay hierarchy</p>
                  </div>
                  <div className="space-y-2">
                    <Toggle label="Master Protocol" desc="Global toggle for all signal relays" icon={ShieldCheck} value={prefs.notifications_enabled}
                      onChange={(v: boolean) => setPrefs((p: any) => ({ ...p, notifications_enabled: v }))} />
                    <Toggle label="Email Relay" desc="Asynchronous signal dispatch to primary mailbox" icon={Mail} value={prefs.email_notifications}
                      onChange={(v: boolean) => setPrefs((p: any) => ({ ...p, email_notifications: v }))} />
                    <Toggle label="Visual HUD HUD Alerts" desc="Synchronous desktop HUD notifications" icon={Smartphone} value={prefs.desktop_notifications}
                      onChange={(v: boolean) => setPrefs((p: any) => ({ ...p, desktop_notifications: v }))} />
                  </div>
                  <div className="pt-8 border-t border-slate-50">
                    <SaveButton onClick={() => savePrefs({ notifications_enabled: prefs.notifications_enabled, email_notifications: prefs.email_notifications, desktop_notifications: prefs.desktop_notifications })} saving={saving} />
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && prefs && (
                <div className="space-y-10">
                  <div>
                    <h2 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">UI Visual Parameters</h2>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Adjust temporal UI aesthetics and display logic</p>
                  </div>
                  
                  <div>
                    <label className={labelClass}>Visual Theme Protocol</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                          { value: 'light', label: 'LIGHT_DOMAIN', icon: Zap, bg: 'bg-white', text: 'text-slate-900', border: 'border-slate-100' }, 
                          { value: 'dark', label: 'VOID_DOMAIN', icon: Lock, bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-800' }, 
                          { value: 'system', label: 'OS_SYNC', icon: Globe, bg: 'bg-gradient-to-br from-white to-slate-900', text: 'text-slate-500', border: 'border-slate-200' }
                      ].map(t => (
                        <button key={t.value} onClick={() => {
                          setPrefs((p: any) => ({ ...p, theme: t.value }));
                          localStorage.setItem('esmp_theme', t.value);
                          applyThemeClass(t.value);
                        }}
                          className={cn(
                              "relative p-8 rounded-[3px] border-2 transition-all flex flex-col items-center gap-4 group",
                              prefs.theme === t.value ? "border-[var(--color-primary)] bg-blue-50/50 shadow-lg scale-[1.02] z-10" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                          )}>
                          <div className={cn("w-full h-12 rounded-[2px] shadow-inner border mb-2", t.bg, t.border)} />
                          <div className="text-center">
                               <p className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest mb-1">{t.label}</p>
                               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">ENVIRONMENT_LOCKED</p>
                          </div>
                          {prefs.theme === t.value && (
                              <div className="absolute top-2 right-2">
                                  <Check className="h-4 w-4 text-[var(--color-primary)]" />
                              </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-50">
                    <div className="space-y-1.5">
                      <label className={labelClass}>Syntactic Language</label>
                      <select value={prefs.language} onChange={e => setPrefs((p: any) => ({ ...p, language: e.target.value }))}
                        className={cn(inputClass, "appearance-none bg-slate-50")}>
                        <option value="en">ENGLISH_PROTOCOL</option>
                        <option value="es">SPANISH_LNK</option>
                        <option value="fr">FRENCH_LNK</option>
                        <option value="de">GERMAN_LNK</option>
                        <option value="hi">HINDI_CORE</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Temporal Coordinates (Timezone)</label>
                      <select value={prefs.timezone} onChange={e => setPrefs((p: any) => ({ ...p, timezone: e.target.value }))}
                        className={cn(inputClass, "appearance-none bg-slate-50")}>
                        <option value="UTC">UTC_CORE</option>
                        <option value="America/New_York">EASTERN_ET</option>
                        <option value="Asia/Kolkata">INDIA_IST</option>
                        <option value="Europe/London">LONDON_GMT</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="pt-8">
                    <SaveButton onClick={() => savePrefs({ theme: prefs.theme, language: prefs.language, timezone: prefs.timezone })} saving={saving} />
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-12">
                  <div>
                    <h2 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Access Control & Cryptography</h2>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Manage personnel decryption keys and auth history</p>
                  </div>

                  {pwError && (
                      <div className="p-4 bg-red-50 border border-red-100 rounded-[3px] flex items-center gap-4 animate-in shake-in">
                          <AlertCircle className="h-5 w-5 text-red-600" />
                          <p className="text-[10px] font-black text-red-700 uppercase tracking-widest">{pwError}</p>
                      </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                        <PasswordField label="Legacy Key (Current Password)" value={passwordForm.current} show={showPw.current}
                          onToggle={() => setShowPw(s => ({ ...s, current: !s.current }))}
                          onChange={(v: string) => setPasswordForm(f => ({ ...f, current: v }))} />
                    </div>
                    <div className="flex flex-col gap-4">
                        <PasswordField label="New Cipher Protocol" value={passwordForm.newPass} show={showPw.new}
                          onToggle={() => setShowPw(s => ({ ...s, new: !s.new }))}
                          onChange={(v: string) => setPasswordForm(f => ({ ...f, newPass: v }))} />
                        {passwordForm.newPass && (
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-[3px]">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Cryptographic Strength HUD</p>
                            <PasswordStrength password={passwordForm.newPass} />
                          </div>
                        )}
                    </div>
                    <div>
                        <PasswordField label="Verify Synchronization" value={passwordForm.confirm} show={showPw.confirm}
                          onToggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                          onChange={(v: string) => setPasswordForm(f => ({ ...f, confirm: v }))} />
                    </div>
                  </div>

                  <div className="pt-4">
                    <SaveButton label="Update Auth Key" onClick={savePassword} saving={saving} />
                  </div>

                  <div className="pt-12 border-t border-slate-50">
                    <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                        <Activity className="h-4 w-4 text-[var(--color-primary)]" /> Authorized Session Pulse
                    </h3>
                    <div className="bg-slate-50 group hover:bg-slate-100/50 border border-slate-100 rounded-[3px] p-6 flex items-center justify-between transition-all">
                      <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-[3px] bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                <Globe className="h-6 w-6 text-[var(--color-primary)]" />
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-widest">Active Terminal Connection</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">LINK_STABLE: {user.email}</p>
                            </div>
                      </div>
                      <div className="flex items-center gap-6">
                          <div className="flex flex-col items-end">
                              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-[2px] border border-emerald-100 shadow-sm">ENCRYPTED_AUTH</span>
                              <span className="text-[8px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">LATENCY: 12ms</span>
                          </div>
                          <button onClick={handleLogout} className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[3px] border border-transparent hover:border-red-100 transition-all">
                                <LogOut className="h-5 w-5" />
                          </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && prefs && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Signal Masking & Stealth</h2>
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Configure sector visibility and data broadcast limits</p>
                  </div>
                  <div className="space-y-2">
                    <Toggle label="Sector Visibility" desc="Display personnel signature to team members" icon={Eye} value={prefs.profile_visible !== false}
                      onChange={(v: boolean) => setPrefs((p: any) => ({ ...p, profile_visible: v }))} />
                    <Toggle label="Network Presence" desc="Broadcast real-time temporal status" icon={Activity} value={prefs.show_online_status !== false}
                      onChange={(v: boolean) => setPrefs((p: any) => ({ ...p, show_online_status: v }))} />
                    <Toggle label="Sub-Link Comms" desc="Allow direct signal reception from peers" icon={Zap} value={prefs.allow_direct_messages !== false}
                      onChange={(v: boolean) => setPrefs((p: any) => ({ ...p, allow_direct_messages: v }))} />
                    <Toggle label="Registry Discovery" desc="Appear in global personnel search queries" icon={Search} value={prefs.searchable !== false}
                      onChange={(v: boolean) => setPrefs((p: any) => ({ ...p, searchable: v }))} />
                  </div>
                  <div className="pt-8 border-t border-slate-50">
                    <SaveButton onClick={() => savePrefs({ profile_visible: prefs.profile_visible, show_online_status: prefs.show_online_status, allow_direct_messages: prefs.allow_direct_messages, searchable: prefs.searchable })} saving={saving} />
                  </div>
                </div>
              )}

              {activeTab === 'team' && (
                <div className="space-y-10">
                  <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight">Sector Coordination Parameters</h2>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Adjust high-level team logic and join protocols</p>
                    </div>
                    {teams.length > 0 && (
                        <div className="relative group">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-primary)]" />
                            <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
                                className="bg-white border border-[var(--border)] rounded-[3px] pl-10 pr-10 py-3 text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-primary)] shadow-sm outline-none appearance-none cursor-pointer group-hover:bg-slate-50 transition-all">
                                {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}_CLUSTER</option>)}
                            </select>
                        </div>
                    )}
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-[3px] border-l-4 border-l-amber-500 flex items-center gap-4">
                        <Info className="h-5 w-5 text-amber-600" />
                        <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">
                            ACCESS_DENIED: ONLY SECTOR LEADERS MAY MODIFY CORE TEAM PARAMETERS.
                        </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1.5">
                      <label className={labelClass}>Sector Visibility Protocol</label>
                      <select value={teamSettings['visibility'] || 'PRIVATE'} onChange={e => setTeamSettings(s => ({ ...s, visibility: e.target.value }))}
                        className={cn(inputClass, "appearance-none bg-slate-50")}>
                        <option value="PRIVATE">PRIVATE_STEALTH (INVITE_ONLY)</option>
                        <option value="PUBLIC">PUBLIC_BROADCAST (OPEN_HUB)</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Default Triage Priority</label>
                      <select value={teamSettings['default_priority'] || 'MEDIUM'} onChange={e => setTeamSettings(s => ({ ...s, default_priority: e.target.value }))}
                        className={cn(inputClass, "appearance-none bg-slate-50")}>
                        <option value="LOW">LOW_TIER</option>
                        <option value="MEDIUM">STANDARD_OPS</option>
                        <option value="HIGH">CRITICAL_PATH</option>
                        <option value="URGENT">IMMEDIATE_X</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Toggle label="Peer Invites" desc="Allow team units to start peer recruitment" value={teamSettings['allow_member_invite'] === 'true'}
                      onChange={(v: boolean) => setTeamSettings(s => ({ ...s, allow_member_invite: String(v) }))} />
                    <Toggle label="Join Authentication" desc="Require sector leader authorization for new links" value={teamSettings['require_approval'] === 'true'}
                      onChange={(v: boolean) => setTeamSettings(s => ({ ...s, require_approval: String(v) }))} />
                  </div>

                  <div className="pt-4">
                    <SaveButton onClick={saveTeamSettings} saving={saving} />
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Search(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  );
}

function PasswordField({ label, value, onChange, show, onToggle }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) {
  return (
    <div className="space-y-1.5">
      <label className={labelClass}>{label}</label>
      <div className="relative group">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-[var(--color-primary)] transition-colors" />
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
          placeholder="••••••••••••"
          className={cn(inputClass, "pl-12 pr-12 font-medium normal-case tracking-normal")} />
        <button type="button" onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[var(--color-primary)] transition-all">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  const labels = ['UNSAFE', 'VULNERABLE', 'MARGINAL', 'OPTIMAL', 'REINFORCED'];
  const colors = ['bg-slate-200', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-500'];
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5 h-1.5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={cn("flex-1 rounded-full transition-all duration-500", i <= score ? colors[score] : 'bg-slate-100')} />
        ))}
      </div>
      <div className="flex justify-between items-center">
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Complexity Analysis</span>
          <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", score > 2 ? "text-emerald-500" : "text-amber-500")}>{labels[score]}</span>
      </div>
    </div>
  );
}

function Toggle({ label, desc, value, onChange, icon: Icon }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void; icon?: any }) {
  return (
    <div className="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[3px] hover:bg-slate-50 transition-all group">
      <div className="flex items-center gap-6">
        {Icon && (
            <div className={cn("w-10 h-10 rounded-[2px] flex items-center justify-center border shadow-sm transition-all", value ? "bg-blue-50 border-blue-100 text-[var(--color-primary)]" : "bg-white border-slate-200 text-slate-300")}>
                <Icon className="h-4 w-4" />
            </div>
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-widest">{label}</p>
          {desc && <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{desc}</p>}
        </div>
      </div>
      <button onClick={() => onChange(!value)}
        className={cn(
            "relative w-12 h-6 rounded-full transition-all shrink-0 ml-4 border outline-none",
            value ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : "bg-slate-200 border-slate-300"
        )}>
        <div className={cn(
            "absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-lg transition-transform",
            value ? "translate-x-6 shadow-blue-900/40" : "translate-x-0.5"
        )} />
      </button>
    </div>
  );
}

function SaveButton({ onClick, saving, label = 'Save Changes' }: { onClick: () => void; saving: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="jira-button jira-button-primary h-12 px-10 gap-3 font-bold uppercase text-[10px] shadow-lg shadow-blue-100 disabled:opacity-50 group">
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />}
      {saving ? 'SYNCHRONIZING...' : label}
    </button>
  );
}

function Loader2(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
    )
}
