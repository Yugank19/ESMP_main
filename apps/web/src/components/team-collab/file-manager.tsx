"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import {
    Upload, FolderPlus, Folder, Download, Trash2,
    Star, Search, ChevronRight, Home, X, MessageSquare, Eye,
    AlertCircle, RefreshCw, FileText, MoreVertical, LayoutGrid, List,
    ShieldCheck, Database, HardDrive, File, FileCode, FileImage, FileStack,
    Send
} from 'lucide-react';
import { teamFilesApi } from '@/lib/team-files-api';
import { cn } from '@/lib/utils';

interface TeamFile {
    id: string;
    name: string;
    original_name: string;
    file_url: string;
    mime_type: string;
    size: number;
    is_important: boolean;
    description?: string;
    folder_id?: string | null;
    created_at: string;
    uploader: { id: string; name: string };
    _count: { comments: number; versions: number };
    comments?: any[];
}

interface TeamFolder {
    id: string;
    name: string;
    parent_id?: string | null;
    created_at: string;
    _count: { files: number; children: number };
    created_by?: string;
}

interface Props {
    teamId: string;
    currentUser: any;
    isLeader: boolean;
}

function formatSize(bytes: number) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(mime: string) {
    if (!mime) return <File className="h-5 w-5 text-slate-400" />;
    if (mime.startsWith('image/')) return <FileImage className="h-5 w-5 text-emerald-500" />;
    if (mime.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (mime.includes('word') || mime.includes('document')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (mime.includes('sheet') || mime.includes('excel')) return <FileText className="h-5 w-5 text-emerald-600" />;
    if (mime.includes('presentation') || mime.includes('powerpoint')) return <FileText className="h-5 w-5 text-amber-500" />;
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) return <FileStack className="h-5 w-5 text-purple-500" />;
    if (mime.startsWith('text/') || mime.includes('javascript') || mime.includes('typescript') || mime.includes('json')) return <FileCode className="h-5 w-5 text-indigo-500" />;
    return <File className="h-5 w-5 text-slate-400" />;
}

export default function FileManager({ teamId, currentUser, isLeader }: Props) {
    const [files, setFiles] = useState<TeamFile[]>([]);
    const [folders, setFolders] = useState<TeamFolder[]>([]);
    const [currentFolder, setCurrentFolder] = useState<string | undefined>(undefined);
    const [breadcrumb, setBreadcrumb] = useState<{ id?: string; name: string }[]>([{ name: 'Asset Repository' }]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedFile, setSelectedFile] = useState<TeamFile | null>(null);
    const [comment, setComment] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [foldersRes, filesRes] = await Promise.all([
                teamFilesApi.getFolders(teamId, currentFolder),
                teamFilesApi.getFiles(teamId, currentFolder, search || undefined),
            ]);
            setFolders(foldersRes.data);
            setFiles(filesRes.data);
        } catch (e: any) {
            setError(e?.response?.data?.message || 'Repository synchronization failure.');
        } finally {
            setLoading(false);
        }
    }, [teamId, currentFolder, search]);

    useEffect(() => { load(); }, [load]);

    const doUpload = async (file: File) => {
        setUploading(true);
        setUploadProgress(0);
        setUploadError(null);
        try {
            await teamFilesApi.uploadFile(teamId, file, currentFolder, p => setUploadProgress(p));
            await load();
        } catch (e: any) {
            const msg = e?.response?.data?.message || e?.message || 'Transmission failure';
            setUploadError(msg);
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) doUpload(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) doUpload(file);
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            await teamFilesApi.createFolder(teamId, {
                name: newFolderName.trim(),
                parent_id: currentFolder,
            });
            setNewFolderName('');
            setShowNewFolder(false);
            load();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Directroy allocation failure');
        }
    };

    const handleOpenFolder = (folder: TeamFolder) => {
        setCurrentFolder(folder.id);
        setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }]);
        setSearch('');
    };

    const handleBreadcrumb = (idx: number) => {
        const crumb = breadcrumb[idx];
        setBreadcrumb(breadcrumb.slice(0, idx + 1));
        setCurrentFolder(crumb.id);
        setSearch('');
    };

    const handleDeleteFile = async (file: TeamFile, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Purge "${file.name}" from repository?`)) return;
        try {
            await teamFilesApi.deleteFile(teamId, file.id);
            setFiles(prev => prev.filter(f => f.id !== file.id));
            if (selectedFile?.id === file.id) setSelectedFile(null);
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Purge failure');
        }
    };

    const handleDeleteFolder = async (folder: TeamFolder, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Purge directory "${folder.name}" and all sub-assets?`)) return;
        try {
            await teamFilesApi.deleteFolder(teamId, folder.id);
            setFolders(prev => prev.filter(f => f.id !== folder.id));
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Purge failure');
        }
    };

    const handleToggleImportant = async (file: TeamFile, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await teamFilesApi.updateFile(teamId, file.id, { is_important: !file.is_important });
            setFiles(prev => prev.map(f => f.id === file.id ? { ...f, ...res.data } : f));
            if (selectedFile?.id === file.id) setSelectedFile(prev => prev ? { ...prev, is_important: !prev.is_important } : prev);
        } catch { }
    };

    const handleAddComment = async () => {
        if (!comment.trim() || !selectedFile) return;
        try {
            await teamFilesApi.addComment(teamId, selectedFile.id, comment);
            setComment('');
            const res = await teamFilesApi.getFile(teamId, selectedFile.id);
            setSelectedFile(res.data);
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Intel logging failure');
        }
    };

    const openFileDetail = async (file: TeamFile) => {
        setSelectedFile(file);
        try {
            const res = await teamFilesApi.getFile(teamId, file.id);
            setSelectedFile(res.data);
        } catch { }
    };

    const canDelete = (file: TeamFile) => file.uploader.id === currentUser?.id || isLeader;
    const canDeleteFolder = (folder: TeamFolder) => folder.created_by === currentUser?.id || isLeader;

    return (
        <div
            className="flex gap-6 animate-in fade-in duration-300"
            style={{ height: 'calc(100vh - 340px)', minHeight: '520px' }}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            {/* Main Repository Panel */}
            <div className={cn(
                "flex-1 flex flex-col bg-white rounded-[3px] border transition-all relative overflow-hidden shadow-sm",
                isDragging ? "border-[var(--color-primary)] ring-4 ring-blue-50" : "border-[var(--border)]"
            )}>
                {/* Search / Breadcrumbs Toolbar */}
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface-2)] shrink-0">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {breadcrumb.map((crumb, i) => (
                            <div key={i} className="flex items-center gap-1 shrink-0">
                                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />}
                                <button
                                    onClick={() => handleBreadcrumb(i)}
                                    className={cn(
                                        "text-[11px] font-bold uppercase tracking-widest transition px-2 py-1 rounded-[3px]",
                                        i === breadcrumb.length - 1 
                                            ? "text-[var(--text-primary)] bg-white border border-[var(--border)]" 
                                            : "text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-blue-50"
                                    )}
                                >
                                    {i === 0 && <Database className={cn("h-3.5 w-3.5 inline mr-1.5", i === breadcrumb.length - 1 ? "text-[var(--color-primary)]" : "text-[var(--text-muted)]")} />}
                                    {crumb.name}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
                            <input
                                className="pl-9 pr-3 py-1.5 bg-white border border-[var(--border)] rounded-[3px] text-xs font-medium focus:border-[var(--color-primary)] outline-none transition-all w-48"
                                placeholder="Locate asset..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button onClick={load} className="p-2 text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-white rounded-[3px] border border-transparent hover:border-[var(--border)] transition-all">
                             <RefreshCw className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Primary Actions Toolbar */}
                <div className="px-6 py-3 border-b border-[var(--border)] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowNewFolder(true)}
                            className="jira-button border border-[var(--border)] bg-white text-[var(--text-secondary)] h-8 gap-2 font-bold uppercase text-[10px]"
                        >
                            <FolderPlus className="h-4 w-4" /> New Directory
                        </button>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInput} />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="jira-button jira-button-primary h-8 gap-2 font-bold uppercase text-[10px] relative overflow-hidden"
                        >
                            <Upload className="h-4 w-4" /> 
                            {uploading ? `TRANSMITTING... ${uploadProgress}%` : 'Upload Asset'}
                            {uploading && (
                                <div 
                                    className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300" 
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            )}
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-[3px]">
                             <button className="p-1.5 bg-white shadow-sm rounded-[2px]"><List className="h-3.5 w-3.5 text-[var(--color-primary)]" /></button>
                             <button className="p-1.5 hover:bg-white transition-colors rounded-[2px]"><LayoutGrid className="h-3.5 w-3.5 text-[var(--text-muted)]" /></button>
                        </div>
                    </div>
                </div>

                {/* Error Banner */}
                {uploadError && (
                    <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-[3px] flex items-center justify-between animate-in slide-in-from-top-2">
                        <div className="flex items-center gap-3">
                             <AlertCircle className="h-4 w-4 text-red-600" />
                             <span className="text-[10px] font-bold text-red-700 uppercase tracking-tight">{uploadError}</span>
                        </div>
                        <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-700"><X className="h-4 w-4" /></button>
                    </div>
                )}

                {/* New Folder Overlay / Inline Input */}
                {showNewFolder && (
                    <div className="px-6 py-4 bg-blue-50/50 border-b border-blue-100 flex items-center gap-4 shrink-0 animate-in slide-in-from-top-4">
                        <Folder className="h-5 w-5 text-[var(--color-primary)]" />
                        <input
                            className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-[3px] text-sm font-bold placeholder:text-slate-300 outline-none focus:border-[var(--color-primary)]"
                            placeholder="Directory identifier..."
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleCreateFolder();
                                if (e.key === 'Escape') setShowNewFolder(false);
                            }}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button onClick={handleCreateFolder} className="jira-button jira-button-primary h-9 px-4 font-bold uppercase text-[10px]">Allocate</button>
                            <button onClick={() => setShowNewFolder(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors"><X className="h-5 w-5" /></button>
                        </div>
                    </div>
                )}

                {/* Content Stream */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 opacity-40">
                             <div className="h-8 w-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
                             <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em]">Synchronizing Asset Metadata...</span>
                        </div>
                    ) : folders.length === 0 && files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 opacity-30">
                            <HardDrive className="h-20 w-20 text-[var(--text-muted)] mb-6 stroke-[1px]" />
                            <h3 className="text-xl font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Repository Vacant</h3>
                            <p className="text-xs font-bold text-[var(--text-muted)] mt-2 uppercase tracking-widest text-center max-w-sm">
                                Utilize the uplink to transmit assets or drag-and-drop into the primary interface.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[var(--border)]">
                            {/* Directories */}
                            {folders.map(folder => (
                                <div
                                    key={folder.id}
                                    className="group flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                                    onDoubleClick={() => handleOpenFolder(folder)}
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-[3px] bg-blue-50 flex items-center justify-center">
                                            <Folder className="h-5 w-5 text-[var(--color-primary)]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-[var(--text-primary)] truncate uppercase tracking-tighter">{folder.name}</p>
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
                                                {folder._count.files} Assets · Allocated {new Date(folder.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 ml-6 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => handleOpenFolder(folder)} className="text-[9px] font-bold text-[var(--color-primary)] uppercase hover:underline">Access</button>
                                        {canDeleteFolder(folder) && (
                                            <button 
                                                onClick={e => handleDeleteFolder(folder, e)}
                                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Files */}
                            {files.map(file => (
                                <div
                                    key={file.id}
                                    className={cn(
                                        "group flex items-center justify-between px-6 py-3.5 cursor-pointer transition-all border-l-2",
                                        selectedFile?.id === file.id 
                                            ? "bg-blue-50 border-[var(--color-primary)] shadow-sm" 
                                            : "hover:bg-slate-50 border-transparent"
                                    )}
                                    onClick={() => openFileDetail(file)}
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={cn(
                                            "w-10 h-10 rounded-[3px] flex items-center justify-center shadow-sm",
                                            selectedFile?.id === file.id ? "bg-white" : "bg-slate-50"
                                        )}>
                                            {getFileIcon(file.mime_type)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-[var(--text-primary)] truncate tracking-tight">{file.name}</p>
                                                {file.is_important && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                                            </div>
                                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-0.5">
                                                {formatSize(file.size)} · Transmitted by {file.uploader.name} · {file._count.comments} Intel Logged
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 ml-6 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={e => handleToggleImportant(file, e)}
                                            className={cn(
                                                "p-2 rounded-[3px] transition-colors",
                                                file.is_important ? "text-amber-500 bg-amber-50" : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                                            )}
                                        >
                                            <Star className="h-4 w-4" />
                                        </button>
                                        <a
                                            href={file.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="p-2 text-slate-400 hover:text-[var(--color-primary)] hover:bg-blue-50 rounded-[3px] transition-colors"
                                        >
                                            <Download className="h-4 w-4" />
                                        </a>
                                        {canDelete(file) && (
                                            <button
                                                onClick={e => handleDeleteFile(file, e)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-[3px] transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Comprehensive Asset Intel Panel (Sidebar) */}
            {selectedFile && (
                <div className="w-80 bg-white border border-[var(--border)] rounded-[3px] flex flex-col overflow-hidden shadow-md animate-in slide-in-from-right-4 duration-300">
                    <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-surface-2)] flex items-center justify-between shrink-0">
                        <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-[0.2em]">Asset Intelligence</span>
                        <button onClick={() => setSelectedFile(null)} className="p-1 px-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-white rounded-[3px] transition-all">
                             <X className="h-4 w-4" />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
                        {/* Preview and Terminal Info */}
                        <div className="text-center group">
                            <div className="inline-block p-4 border border-[var(--border)] bg-slate-50 rounded-[3px] mb-4 group-hover:border-[var(--color-primary)] transition-all relative">
                                {selectedFile.mime_type.startsWith('image/') ? (
                                    <img
                                        src={selectedFile.file_url}
                                        alt={selectedFile.name}
                                        className="w-32 h-32 object-cover rounded-[2px]"
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <div className="w-24 h-24 flex items-center justify-center">
                                        {getFileIcon(selectedFile.mime_type)}
                                    </div>
                                )}
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100">
                                     <button className="p-1.5 bg-white shadow-sm border border-[var(--border)] rounded-[2px] text-[var(--text-muted)] hover:text-[var(--color-primary)]">
                                          <Eye className="h-3.5 w-3.5" />
                                     </button>
                                </div>
                            </div>
                            <h4 className="text-sm font-bold text-[var(--text-primary)] break-all uppercase tracking-tight">{selectedFile.name}</h4>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">{formatSize(selectedFile.size)}</p>
                        </div>

                        {/* Telemetry Data */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-slate-50 border border-[var(--border)] rounded-[3px]">
                                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Uplinked By</span>
                                <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase truncate ml-2">{selectedFile.uploader.name}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 border border-[var(--border)] rounded-[3px]">
                                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Asset Class</span>
                                <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase truncate ml-2">{selectedFile.mime_type.split('/')[1] || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 border border-[var(--border)] rounded-[3px]">
                                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Transmission</span>
                                <span className="text-[10px] font-bold text-[var(--text-primary)] uppercase ml-2">{new Date(selectedFile.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Actions Uplink */}
                        <div className="grid grid-cols-2 gap-3">
                            <a
                                href={selectedFile.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="jira-button jira-button-primary h-10 gap-2 font-bold uppercase text-[10px]"
                            >
                                <Download className="h-3.5 w-3.5" /> Acquire
                            </a>
                             <button
                                className="jira-button border border-[var(--border)] bg-white text-[var(--text-secondary)] h-10 gap-2 font-bold uppercase text-[10px]"
                            >
                                <RefreshCw className="h-3.5 w-3.5" /> Version
                            </button>
                        </div>

                        {/* Security Check / Intel Feed */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 pt-4">
                                <h5 className="text-[10px] font-bold text-[var(--text-primary)] uppercase tracking-widest flex items-center gap-2">
                                    <MessageSquare className="h-3.5 w-3.5 text-[var(--color-primary)]" /> Intel Ledger ({selectedFile.comments?.length || 0})
                                </h5>
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 opacity-40" />
                            </div>
                            
                            <div className="space-y-3 max-h-48 overflow-y-auto no-scrollbar pb-2">
                                {(selectedFile.comments ?? []).length === 0 ? (
                                    <div className="py-8 text-center bg-slate-50 border border-dashed border-[var(--border)] rounded-[3px]">
                                         <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">No intelligence logged</p>
                                    </div>
                                ) : (
                                    (selectedFile.comments ?? []).map((c: any) => (
                                        <div key={c.id} className="p-3 bg-slate-100/50 border border-[var(--border)] rounded-[3px] relative group/c">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[9px] font-bold text-[var(--color-primary)] uppercase">{c.user.name}</span>
                                                <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase">{new Date(c.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">{c.body}</p>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="flex items-center gap-2 mt-4">
                                <input
                                    className="flex-1 px-3 py-2 bg-white border border-[var(--border)] rounded-[3px] text-xs font-medium placeholder:text-slate-300 outline-none focus:border-[var(--color-primary)]"
                                    placeholder="Append intelligence..."
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                />
                                <button
                                    onClick={handleAddComment}
                                    disabled={!comment.trim()}
                                    className="p-2 bg-[var(--color-primary)] text-white rounded-[3px] disabled:opacity-40 transition-opacity"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
