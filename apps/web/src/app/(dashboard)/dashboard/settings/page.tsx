"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Bell, Shield, Palette, Globe, Save, Check, Lock, Eye, EyeOff, LogOut } from 'lucide-react';
import { getUserPreferences, updateUserPreferences, getTeamSettings, updateTeamSettings } from '@/lib/settings-api';
import { callLogout } from '@/lib/audit-api';
import { applyThemeClass } from '@/components/theme-provider';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'privacy', label: 'Privacy', icon: Eye },
  { id: 'team', label: 'Team Settings', icon: Globe },
];

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

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File too large. Max 5MB.'); return; }
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
        return;
      }
    } catch {}
    // Fallback: base64
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setUser((u: any) => ({ ...u, avatar_url: url }));
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, avatar_url: url }));
      showSaved();
    };
    reader.readAsDataURL(file);
    setAvatarUploading(false);
  }

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) { router.push('/login'); return; }
    const u = JSON.parse(stored);
    setUser(u);
    setProfileForm({ name: u.name || '', email: u.email || '', bio: u.bio || '', phone: u.phone || '' });
    loadPrefs();
    loadTeams();
  }, []);

  useEffect(() => { if (selectedTeam) loadTeamSettings(selectedTeam); }, [selectedTeam]);

  async function loadPrefs() {
    try {
      const data = await getUserPreferences();
      setPrefs(data);
    } catch {
      setPrefs({ theme: 'light', language: 'en', notifications_enabled: true, email_notifications: true, desktop_notifications: false, timezone: 'UTC' });
    }
  }

  async function loadTeams() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/teams`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setTeams(list);
      if (list.length > 0) setSelectedTeam(list[0].id);
    } catch {}
  }

  async function loadTeamSettings(teamId: string) {
    try { setTeamSettings(await getTeamSettings(teamId) || {}); } catch { setTeamSettings({}); }
  }

  async function savePrefs(updates: any) {
    setSaving(true);
    try {
      const updated = await updateUserPreferences(updates);
      setPrefs(updated);
      // Apply theme immediately if it changed
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ name: profileForm.name, bio: profileForm.bio, phone: profileForm.phone }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name: profileForm.name }));
      setUser((u: any) => ({ ...u, name: profileForm.name }));
      showSaved();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  }

  async function savePassword() {
    setPwError('');
    if (passwordForm.newPass !== passwordForm.confirm) { setPwError('Passwords do not match'); return; }
    if (passwordForm.newPass.length < 8) { setPwError('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/profile/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ current_password: passwordForm.current, new_password: passwordForm.newPass }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed'); }
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
    <div className="flex items-center justify-center h-64">
      <div className="h-8 w-8 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 ">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Settings</h1>
        <p className="text-[15px] text-[#64748B] mt-0.5">Manage your account, preferences, and security</p>
      </div>

      <div className="flex gap-6">
        <div className="w-52 shrink-0">
          <nav className="space-y-0.5">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-colors text-left ${activeTab === tab.id ? 'bg-[#EFF6FF] text-[#1D4ED8]' : 'text-[#64748B] hover:bg-[#F1F5F9]'}`}>
                <tab.icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            ))}
            <div className="pt-4 border-t border-[#E2E8F0] mt-4">
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium text-red-500 hover:bg-red-50 transition-colors text-left">
                <LogOut className="h-4 w-4 shrink-0" />
                Sign out
              </button>
            </div>
          </nav>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-[#E2E8F0] p-6 min-h-[400px]">
          {saved && (
            <div className="flex items-center gap-2 text-emerald-600 mb-4 text-[15px] bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <Check className="h-4 w-4" /> Saved successfully
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h2 className="text-[15px] font-semibold text-[#0F172A]">Profile Information</h2>

              {/* Avatar section */}
              <div className="flex items-center gap-5 mb-2">
                <div className="relative group/avatar">
                  {/* Photo viewer */}
                  {user.avatar_url && (
                    <img
                      src={user.avatar_url}
                      alt={user.name}
                      className="w-20 h-20 rounded-full object-cover cursor-pointer ring-4 ring-[#1D4ED8]/20 hover:ring-[#1D4ED8]/50 transition-all"
                      onClick={() => setViewPhoto(true)}
                      title="Click to view"
                    />
                  )}
                  {!user.avatar_url && (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#2563eb] to-[#7c3aed] flex items-center justify-center text-white text-2xl font-bold ring-4 ring-[#1D4ED8]/20">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  {/* Upload overlay */}
                  <label className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    <span className="text-white text-xs font-semibold text-center leading-tight">
                      {avatarUploading ? '...' : '📷 Change'}
                    </span>
                  </label>
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#0F172A]">{user.name}</p>
                  <p className="text-sm text-[#64748B]">{user.email}</p>
                  <p className="text-xs text-[#94A3B8] mt-0.5 capitalize">{user.roles?.[0] || 'User'}</p>
                  <label className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)' }}>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    {avatarUploading ? 'Uploading...' : '📷 Change Photo'}
                  </label>
                </div>
              </div>

              {/* Photo lightbox */}
              {viewPhoto && user.avatar_url && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4"
                  onClick={() => setViewPhoto(false)}>
                  <div className="relative" onClick={e => e.stopPropagation()}>
                    <img src={user.avatar_url} alt={user.name}
                      className="max-w-sm max-h-[80vh] rounded-2xl object-cover shadow-2xl" />
                    <button onClick={() => setViewPhoto(false)}
                      className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg text-gray-700 hover:bg-gray-100">
                      ✕
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" value={profileForm.name} onChange={(v: string) => setProfileForm(f => ({ ...f, name: v }))} />
                <Field label="Email" value={profileForm.email} disabled />
                <Field label="Phone" value={profileForm.phone} onChange={(v: string) => setProfileForm(f => ({ ...f, phone: v }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-1">Bio</label>
                <textarea value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} rows={3}
                  className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] resize-none" />
              </div>
              <SaveButton onClick={saveProfile} saving={saving} />
            </div>
          )}

          {activeTab === 'notifications' && prefs && (
            <div className="space-y-4">
              <h2 className="text-[15px] font-semibold text-[#0F172A]">Notification Preferences</h2>
              <div className="space-y-1 divide-y divide-[#F1F5F9]">
                <Toggle label="Enable all notifications" desc="Master switch for all notifications" value={prefs.notifications_enabled}
                  onChange={(v: boolean) => setPrefs((p: any) => ({ ...p, notifications_enabled: v }))} />
                <Toggle label="Email notifications" desc="Receive notifications via email" value={prefs.email_notifications}
                  onChange={(v: boolean) => setPrefs((p: any) => ({ ...p, email_notifications: v }))} />
                <Toggle label="Desktop notifications" desc="Browser push notifications" value={prefs.desktop_notifications}
                  onChange={(v: boolean) => setPrefs((p: any) => ({ ...p, desktop_notifications: v }))} />
              </div>
              <SaveButton onClick={() => savePrefs({ notifications_enabled: prefs.notifications_enabled, email_notifications: prefs.email_notifications, desktop_notifications: prefs.desktop_notifications })} saving={saving} />
            </div>
          )}

          {activeTab === 'appearance' && prefs && (
            <div className="space-y-5">
              <h2 className="text-[15px] font-semibold text-[#0F172A]">Appearance</h2>
              <div>
                <label className="block text-xs font-medium text-[#64748B] mb-2">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {[{ value: 'light', label: 'Light', bg: 'bg-white border-2' }, { value: 'dark', label: 'Dark', bg: 'bg-[#1E293B] border-2' }, { value: 'system', label: 'System', bg: 'bg-gradient-to-r from-white to-[#1E293B] border-2' }].map(t => (
                    <button key={t.value} onClick={() => {
                      setPrefs((p: any) => ({ ...p, theme: t.value }));
                      localStorage.setItem('esmp_theme', t.value);
                      applyThemeClass(t.value);
                    }}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${prefs.theme === t.value ? 'border-[#1D4ED8]' : 'border-[#E2E8F0]'}`}>
                      <div className={`h-8 rounded-lg mb-2 ${t.bg} border border-[#E2E8F0]`} />
                      <p className="text-xs font-medium text-[#0F172A]">{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Language</label>
                  <select value={prefs.language} onChange={e => setPrefs((p: any) => ({ ...p, language: e.target.value }))}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Timezone</label>
                  <select value={prefs.timezone} onChange={e => setPrefs((p: any) => ({ ...p, timezone: e.target.value }))}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern (ET)</option>
                    <option value="America/Chicago">Central (CT)</option>
                    <option value="America/Los_Angeles">Pacific (PT)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Asia/Dubai">Dubai (GST)</option>
                  </select>
                </div>
              </div>
              <SaveButton onClick={() => savePrefs({ theme: prefs.theme, language: prefs.language, timezone: prefs.timezone })} saving={saving} />
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <h2 className="text-[15px] font-semibold text-[#0F172A]">Change Password</h2>
              {pwError && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{pwError}</div>}
              <div className="space-y-3">
                <PasswordField label="Current Password" value={passwordForm.current} show={showPw.current}
                  onToggle={() => setShowPw(s => ({ ...s, current: !s.current }))}
                  onChange={(v: string) => setPasswordForm(f => ({ ...f, current: v }))} />
                <PasswordField label="New Password" value={passwordForm.newPass} show={showPw.new}
                  onToggle={() => setShowPw(s => ({ ...s, new: !s.new }))}
                  onChange={(v: string) => setPasswordForm(f => ({ ...f, newPass: v }))} />
                <PasswordField label="Confirm New Password" value={passwordForm.confirm} show={showPw.confirm}
                  onToggle={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                  onChange={(v: string) => setPasswordForm(f => ({ ...f, confirm: v }))} />
              </div>
              {passwordForm.newPass && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[#64748B]">Password strength</p>
                  <PasswordStrength password={passwordForm.newPass} />
                </div>
              )}
              <SaveButton label="Update Password" onClick={savePassword} saving={saving} />
              <div className="pt-4 border-t border-[#E2E8F0]">
                <h3 className="text-[15px] font-semibold text-[#0F172A] mb-2">Active Sessions</h3>
                <div className="bg-[#F8FAFC] rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[15px] font-medium text-[#0F172A]">Current session</p>
                    <p className="text-xs text-[#64748B]">Logged in as {user.email}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full font-medium">Active</span>
                </div>
                <button onClick={handleLogout}
                  className="mt-3 flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-[15px] font-medium hover:bg-red-50 transition-colors">
                  <LogOut className="h-4 w-4" /> Sign out of all sessions
                </button>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && prefs && (
            <div className="space-y-4">
              <h2 className="text-[15px] font-semibold text-[#0F172A]">Privacy Preferences</h2>
              <div className="space-y-1 divide-y divide-[#F1F5F9]">
                <Toggle label="Show my profile to team members" desc="Others can see your name and avatar" value={prefs.profile_visible !== false}
                  onChange={(v: boolean) => setPrefs((p: any) => ({ ...p, profile_visible: v }))} />
                <Toggle label="Show my online status" desc="Let others see when you are active" value={prefs.show_online_status !== false}
                  onChange={(v: boolean) => setPrefs((p: any) => ({ ...p, show_online_status: v }))} />
                <Toggle label="Allow direct messages" desc="Team members can send you direct messages" value={prefs.allow_direct_messages !== false}
                  onChange={(v: boolean) => setPrefs((p: any) => ({ ...p, allow_direct_messages: v }))} />
                <Toggle label="Include me in member search" desc="Appear in search results for other users" value={prefs.searchable !== false}
                  onChange={(v: boolean) => setPrefs((p: any) => ({ ...p, searchable: v }))} />
              </div>
              <SaveButton onClick={() => savePrefs({ profile_visible: prefs.profile_visible, show_online_status: prefs.show_online_status, allow_direct_messages: prefs.allow_direct_messages, searchable: prefs.searchable })} saving={saving} />
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-[#0F172A]">Team Settings</h2>
                {teams.length > 0 && (
                  <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}
                    className="border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                    {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
              <p className="text-sm text-[#64748B] bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Only team leaders can modify these settings.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Team Visibility</label>
                  <select value={teamSettings['visibility'] || 'PRIVATE'} onChange={e => setTeamSettings(s => ({ ...s, visibility: e.target.value }))}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                    <option value="PRIVATE">Private â€” invite only</option>
                    <option value="PUBLIC">Public â€” anyone can join</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#64748B] mb-1">Default Task Priority</label>
                  <select value={teamSettings['default_priority'] || 'MEDIUM'} onChange={e => setTeamSettings(s => ({ ...s, default_priority: e.target.value }))}
                    className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <Toggle label="Allow members to invite others" desc="Members can send team invites" value={teamSettings['allow_member_invite'] === 'true'}
                  onChange={(v: boolean) => setTeamSettings(s => ({ ...s, allow_member_invite: String(v) }))} />
                <Toggle label="Require leader approval for joins" desc="Leader must approve join requests" value={teamSettings['require_approval'] === 'true'}
                  onChange={(v: boolean) => setTeamSettings(s => ({ ...s, require_approval: String(v) }))} />
              </div>
              <SaveButton onClick={saveTeamSettings} saving={saving} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, disabled, type = 'text' }: {
  label: string; value: string; onChange?: (v: string) => void; disabled?: boolean; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#64748B] mb-1">{label}</label>
      <input type={type} value={value} onChange={onChange ? e => onChange(e.target.value) : undefined} disabled={disabled}
        className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]" />
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle }: { label: string; value: string; onChange: (v: string) => void; show: boolean; onToggle: () => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#64748B] mb-1">{label}</label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
          className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 pr-10 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-green-500'];
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= score ? colors[score] : 'bg-[#E2E8F0]'}`} />
        ))}
      </div>
      <span className="text-xs text-[#64748B]">{labels[score]}</span>
    </div>
  );
}

function Toggle({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-[15px] text-[#0F172A]">{label}</p>
        {desc && <p className="text-xs text-[#94A3B8] mt-0.5">{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ml-4 ${value ? 'bg-[#1D4ED8]' : 'bg-[#E2E8F0]'}`}>
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function SaveButton({ onClick, saving, label = 'Save Changes' }: { onClick: () => void; saving: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] text-white rounded-lg text-[15px] font-medium hover:bg-[#1e40af] disabled:opacity-50 transition-colors">
      <Save className="h-4 w-4" />
      {saving ? 'Saving...' : label}
    </button>
  );
}
