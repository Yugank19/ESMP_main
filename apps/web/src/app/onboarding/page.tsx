"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, User, MapPin, Calendar, Award, Briefcase, ArrowRight } from 'lucide-react';
import api from '@/lib/api';

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [step, setStep] = useState(1);

    const [profileData, setProfileData] = useState({
        address: '', dob: '', bio: '', emergency_contact: '', skills: '',
    });

    const [studentData, setStudentData] = useState({ college_name: '', course_branch: '', year_semester: '', skills: '', internship_interest: '', portfolio_url: '' });
    const [employeeData, setEmployeeData] = useState({ department: '', designation: '', experience_level: '', current_team: '' });
    const [managerData, setManagerData] = useState({ department: '', team_handled: '', authority_level: '' });
    const [clientData, setClientData] = useState({ company_name: '', contact_person: '', phone: '', project_requirement: '' });

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
        else router.push('/login');
    }, []);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put('/profile/complete', profileData);
            setStep(2);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleRoleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const role = user?.roles?.[0]?.role?.name || user?.roles?.[0] || 'EMPLOYEE';
        const endpoint = `/profile/${role.toLowerCase()}`;
        const data = role === 'STUDENT' ? studentData : role === 'EMPLOYEE' ? employeeData : role === 'MANAGER' ? managerData : clientData;
        try {
            await api.post(endpoint, data);
            router.push('/dashboard');
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    if (!user) return (
        <div className="flex items-center justify-center h-screen bg-[#F8FAFC]">
            <Loader2 className="animate-spin text-[#1D4ED8] h-8 w-8" />
        </div>
    );

    const userRole = user?.roles?.[0]?.role?.name || user?.roles?.[0] || 'EMPLOYEE';

    const inputClass = "w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition";
    const labelClass = "text-sm font-medium text-[#0F172A]";

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-[#0F172A]">
                        Welcome, {user.name}
                    </h1>
                    <p className="text-sm text-[#64748B] mt-1">Complete your profile to get started</p>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3 mb-8 px-4">
                    {['Basic Info', 'Role Details'].map((label, i) => (
                        <div key={label} className="flex items-center gap-3 flex-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                                ${i + 1 < step ? 'bg-green-500 text-white' : i + 1 === step ? 'bg-[#1D4ED8] text-white' : 'bg-[#E2E8F0] text-[#94A3B8]'}`}>
                                {i + 1 < step ? '✓' : i + 1}
                            </div>
                            <span className={`text-xs font-medium ${i + 1 === step ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>{label}</span>
                            {i < 1 && <div className={`flex-1 h-px ${i + 1 < step ? 'bg-green-500' : 'bg-[#E2E8F0]'}`} />}
                        </div>
                    ))}
                </div>

                {/* Step 1: Basic profile */}
                {step === 1 && (
                    <form onSubmit={handleProfileSubmit} className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-5">
                        <h2 className="text-base font-semibold text-[#0F172A]">Basic Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className={labelClass}>Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
                                    <input placeholder="Your city, country" className={`${inputClass} pl-10`}
                                        value={profileData.address} onChange={e => setProfileData({ ...profileData, address: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelClass}>Date of Birth</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
                                    <input type="date" className={`${inputClass} pl-10`}
                                        value={profileData.dob} onChange={e => setProfileData({ ...profileData, dob: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelClass}>Bio</label>
                            <textarea placeholder="A short description about yourself..."
                                className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition min-h-[100px] resize-none"
                                value={profileData.bio} onChange={e => setProfileData({ ...profileData, bio: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className={labelClass}>Skills</label>
                                <div className="relative">
                                    <Award className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
                                    <input placeholder="e.g. React, Node.js" className={`${inputClass} pl-10`}
                                        value={profileData.skills} onChange={e => setProfileData({ ...profileData, skills: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className={labelClass}>Emergency Contact</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
                                    <input placeholder="Name or phone" className={`${inputClass} pl-10`}
                                        value={profileData.emergency_contact} onChange={e => setProfileData({ ...profileData, emergency_contact: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Continue</span><ArrowRight className="h-4 w-4" /></>}
                        </button>
                    </form>
                )}

                {/* Step 2: Role-specific */}
                {step === 2 && (
                    <form onSubmit={handleRoleSubmit} className="bg-white rounded-xl border border-[#E2E8F0] p-6 space-y-5">
                        <h2 className="text-base font-semibold text-[#0F172A] capitalize">
                            {userRole.charAt(0) + userRole.slice(1).toLowerCase()} Details
                        </h2>

                        {userRole === 'STUDENT' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5"><label className={labelClass}>College / University</label><input placeholder="University name" className={inputClass} value={studentData.college_name} onChange={e => setStudentData({ ...studentData, college_name: e.target.value })} /></div>
                                <div className="space-y-1.5"><label className={labelClass}>Course / Branch</label><input placeholder="e.g. Computer Science" className={inputClass} value={studentData.course_branch} onChange={e => setStudentData({ ...studentData, course_branch: e.target.value })} /></div>
                                <div className="space-y-1.5"><label className={labelClass}>Year / Semester</label><input placeholder="e.g. 3rd Year" className={inputClass} value={studentData.year_semester} onChange={e => setStudentData({ ...studentData, year_semester: e.target.value })} /></div>
                                <div className="space-y-1.5"><label className={labelClass}>Portfolio URL</label><input placeholder="github.com/username" className={inputClass} value={studentData.portfolio_url} onChange={e => setStudentData({ ...studentData, portfolio_url: e.target.value })} /></div>
                            </div>
                        )}

                        {userRole === 'EMPLOYEE' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5"><label className={labelClass}>Department</label><input placeholder="e.g. Engineering" className={inputClass} value={employeeData.department} onChange={e => setEmployeeData({ ...employeeData, department: e.target.value })} /></div>
                                <div className="space-y-1.5"><label className={labelClass}>Designation</label><input placeholder="e.g. Software Engineer" className={inputClass} value={employeeData.designation} onChange={e => setEmployeeData({ ...employeeData, designation: e.target.value })} /></div>
                                <div className="space-y-1.5"><label className={labelClass}>Current Team</label><input placeholder="e.g. Backend Team" className={inputClass} value={employeeData.current_team} onChange={e => setEmployeeData({ ...employeeData, current_team: e.target.value })} /></div>
                                <div className="space-y-1.5"><label className={labelClass}>Experience Level</label><input placeholder="e.g. Mid-level" className={inputClass} value={employeeData.experience_level} onChange={e => setEmployeeData({ ...employeeData, experience_level: e.target.value })} /></div>
                            </div>
                        )}

                        {userRole === 'MANAGER' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5"><label className={labelClass}>Department</label><input placeholder="e.g. Operations" className={inputClass} value={managerData.department} onChange={e => setManagerData({ ...managerData, department: e.target.value })} /></div>
                                <div className="space-y-1.5"><label className={labelClass}>Team Size</label><input placeholder="e.g. 10-20 people" className={inputClass} value={managerData.team_handled} onChange={e => setManagerData({ ...managerData, team_handled: e.target.value })} /></div>
                                <div className="space-y-1.5"><label className={labelClass}>Authority Level</label><input placeholder="e.g. Senior Manager" className={inputClass} value={managerData.authority_level} onChange={e => setManagerData({ ...managerData, authority_level: e.target.value })} /></div>
                            </div>
                        )}

                        {userRole === 'CLIENT' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5"><label className={labelClass}>Company Name</label><input placeholder="Your company" className={inputClass} value={clientData.company_name} onChange={e => setClientData({ ...clientData, company_name: e.target.value })} /></div>
                                <div className="space-y-1.5"><label className={labelClass}>Contact Person</label><input placeholder="Primary contact" className={inputClass} value={clientData.contact_person} onChange={e => setClientData({ ...clientData, contact_person: e.target.value })} /></div>
                                <div className="space-y-1.5"><label className={labelClass}>Phone</label><input placeholder="+1 555 0000" className={inputClass} value={clientData.phone} onChange={e => setClientData({ ...clientData, phone: e.target.value })} /></div>
                                <div className="space-y-1.5 sm:col-span-2"><label className={labelClass}>Project Requirements</label>
                                    <textarea placeholder="Describe what you need..." className="w-full px-3 py-2.5 rounded-lg border border-[#E2E8F0] bg-white text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent transition min-h-[100px] resize-none"
                                        value={clientData.project_requirement} onChange={e => setClientData({ ...clientData, project_requirement: e.target.value })} />
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setStep(1)}
                                className="px-4 py-2.5 rounded-lg border border-[#E2E8F0] text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] transition">
                                Back
                            </button>
                            <button type="submit" disabled={loading}
                                className="flex-1 py-2.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete Setup'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
