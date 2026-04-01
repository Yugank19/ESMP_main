"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import {
    Upload, FolderPlus, Folder, Download, Trash2,
    Star, Search, ChevronRight, Home, X, MessageSquare, Eye,
    AlertCircle, RefreshCw, FileText
} from 'lucide-react';
import { teamFilesApi } from '@/lib/team-files-api';

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
    if (!mime) return '📁';
    if (mime.startsWith('image/')) return '🖼️';
    if (mime.includes('pdf')) return '📄';
    if (mime.includes('word') || mime.includes('document')) return '📝';
    if (mime.includes('sheet') || mime.includes('excel')) return '📊';
    if (mime.includes('presentation') || mime.includes('powerpoint')) return '📋';
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) return '🗜️';
    if (mime.startsWith('text/') || mime.includes('javascript') || mime.includes('typescript') || mime.includes('json')) return '💻';
    if (mime.startsWith('video/')) return '🎬';
    if (mime.startsWith('audio/')) return '🎵';
    return '📁';
}

export default function FileManager({ teamId, currentUser, isLeader }: Props) {
    const [files, setFiles] = useState<TeamFile[]>([]);
    const [folders, setFolders] = useState<TeamFolder[]>([]);
    const [currentFolder, setCurrentFolder] = useState<string | undefined>(undefined);
    const [breadcrumb, setBreadcrumb] = useState<{ id?: string; name: string }[]>([{ name: 'Files' }]);
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
            setError(e?.response?.data?.message || 'Failed to load files. Make sure the API is running.');
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
            const msg = e?.response?.data?.message || e?.message || 'Upload failed';
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
            alert(e?.response?.data?.message || 'Failed to create folder');
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
        if (!confirm(`Delete "${file.name}"?`)) return;
        try {
            await teamFilesApi.deleteFile(teamId, file.id);
            setFiles(prev => prev.filter(f => f.id !== file.id));
            if (selectedFile?.id === file.id) setSelectedFile(null);
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Failed to delete file');
        }
    };

    const handleDeleteFolder = async (folder: TeamFolder, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(`Delete folder "${folder.name}" and all its contents?`)) return;
        try {
            await teamFilesApi.deleteFolder(teamId, folder.id);
            setFolders(prev => prev.filter(f => f.id !== folder.id));
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Failed to delete folder');
        }
    };

    const handleToggleImportant = async (file: TeamFile, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const res = await teamFilesApi.updateFile(teamId, file.id, { is_important: !file.is_important });
            setFiles(prev => prev.map(f => f.id === file.id ? { ...f, ...res.data } : f));
            if (selectedFile?.id === file.id) setSelectedFile(prev => prev ? { ...prev, is_important: !prev.is_important } : prev);
        } catch { /* ignore */ }
    };

    const handleAddComment = async () => {
        if (!comment.trim() || !selectedFile) return;
        try {
            await teamFilesApi.addComment(teamId, selectedFile.id, comment);
            setComment('');
            const res = await teamFilesApi.getFile(teamId, selectedFile.id);
            setSelectedFile(res.data);
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Failed to add comment');
        }
    };

    const openFileDetail = async (file: TeamFile) => {
        setSelectedFile(file); // show immediately
        try {
            const res = await teamFilesApi.getFile(teamId, file.id);
            setSelectedFile(res.data);
        } catch { /* keep showing basic info */ }
    };

    const canDelete = (file: TeamFile) => file.uploader.id === currentUser?.id || isLeader;
    const canDeleteFolder = (folder: TeamFolder) => folder.created_by === currentUser?.id || isLeader;

    return (
        <div
            className="flex gap-4"
            style={{ height: 'calc(100vh - 280px)', minHeight: '520px' }}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            {/* ── Main Panel ── */}
            <div className={`flex-1 flex flex-col bg-white rounded-xl border overflow-hidden transition-colors ${isDragging ? 'border-[#1D4ED8] bg-blue-50' : 'border-[#E2E8F0]'}`}>

                {/* Drag overlay */}
                {isDragging && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-50/80 rounded-xl pointer-events-none">
                        <div className="text-center">
                            <Upload className="h-10 w-10 text-[#1D4ED8] mx-auto mb-2" />
                            <p className="text-sm font-semibold text-[#1D4ED8]">Drop to upload</p>
                        </div>
                    </div>
                )}

                {/* Toolbar */}
                <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-3 flex-wrap shrink-0">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
                        {breadcrumb.map((crumb, i) => (
                            <div key={i} className="flex items-center gap-1 shrink-0">
                                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[#94A3B8]" />}
                                <button
                                    onClick={() => handleBreadcrumb(i)}
                                    className={`flex items-center gap-1 text-sm font-medium transition whitespace-nowrap
                                        ${i === breadcrumb.length - 1 ? 'text-[#0F172A]' : 'text-[#64748B] hover:text-[#1D4ED8]'}`}
                                >
                                    {i === 0 && <Home className="h-3.5 w-3.5" />}
                                    {crumb.name}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#94A3B8]" />
                            <input
                                className="pl-8 pr-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] w-36"
                                placeholder="Search..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowNewFolder(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-sm font-medium text-[#0F172A] rounded-lg transition"
                        >
                            <FolderPlus className="h-3.5 w-3.5" /> Folder
                        </button>
                        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileInput} />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
                        >
                            <Upload className="h-3.5 w-3.5" />
                            {uploading ? `${uploadProgress}%` : 'Upload'}
                        </button>
                        <button onClick={load} className="p-1.5 text-[#94A3B8] hover:bg-[#F1F5F9] rounded-lg transition">
                            <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {/* Upload progress bar */}
                {uploading && (
                    <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#1D4ED8] rounded-full transition-all duration-200"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <span className="text-xs text-[#1D4ED8] font-medium w-8">{uploadProgress}%</span>
                        </div>
                    </div>
                )}

                {/* Upload error */}
                {uploadError && (
                    <div className="px-4 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2 shrink-0">
                        <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                        <span className="text-xs text-red-600 flex-1">{uploadError}</span>
                        <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                {/* New folder input */}
                {showNewFolder && (
                    <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2 shrink-0">
                        <Folder className="h-4 w-4 text-[#1D4ED8] shrink-0" />
                        <input
                            className="flex-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                            placeholder="Folder name..."
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleCreateFolder();
                                if (e.key === 'Escape') setShowNewFolder(false);
                            }}
                            autoFocus
                        />
                        <button onClick={handleCreateFolder} className="px-3 py-1.5 bg-[#1D4ED8] text-white text-sm rounded-lg hover:bg-[#1E40AF] transition">
                            Create
                        </button>
                        <button onClick={() => setShowNewFolder(false)} className="p-1.5 text-[#94A3B8] hover:bg-[#E2E8F0] rounded-lg transition">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-40">
                            <div className="h-6 w-6 rounded-full border-2 border-[#1D4ED8] border-t-transparent animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center gap-3">
                            <AlertCircle className="h-8 w-8 text-red-400" />
                            <p className="text-sm text-red-600">{error}</p>
                            <button onClick={load} className="text-xs text-[#1D4ED8] hover:underline">Try again</button>
                        </div>
                    ) : folders.length === 0 && files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-[#EFF6FF] flex items-center justify-center mb-3">
                                <Upload className="h-7 w-7 text-[#1D4ED8]" />
                            </div>
                            <p className="text-sm font-medium text-[#64748B]">No files yet</p>
                            <p className="text-xs text-[#94A3B8] mt-1">Upload files or drag and drop here</p>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {/* Folders */}
                            {folders.map(folder => (
                                <div
                                    key={folder.id}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F8FAFC] cursor-pointer group transition"
                                    onDoubleClick={() => handleOpenFolder(folder)}
                                >
                                    <Folder className="h-5 w-5 text-[#1D4ED8] shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#0F172A] truncate">{folder.name}</p>
                                        <p className="text-xs text-[#94A3B8]">
                                            {folder._count.files} file{folder._count.files !== 1 ? 's' : ''}
                                            {folder._count.children > 0 && ` · ${folder._count.children} subfolder${folder._count.children !== 1 ? 's' : ''}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={() => handleOpenFolder(folder)}
                                            className="px-2 py-1 text-xs text-[#1D4ED8] hover:bg-[#EFF6FF] rounded-lg transition"
                                        >
                                            Open
                                        </button>
                                        {canDeleteFolder(folder) && (
                                            <button
                                                onClick={e => handleDeleteFolder(folder, e)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Divider if both exist */}
                            {folders.length > 0 && files.length > 0 && (
                                <div className="h-px bg-[#F1F5F9] my-2" />
                            )}

                            {/* Files */}
                            {files.map(file => (
                                <div
                                    key={file.id}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#F8FAFC] cursor-pointer group transition
                                        ${selectedFile?.id === file.id ? 'bg-[#EFF6FF] border border-[#BFDBFE]' : ''}`}
                                    onClick={() => openFileDetail(file)}
                                >
                                    <span className="text-xl shrink-0 leading-none">{getFileIcon(file.mime_type)}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-medium text-[#0F172A] truncate">{file.name}</p>
                                            {file.is_important && <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                                        </div>
                                        <p className="text-xs text-[#94A3B8]">
                                            {formatSize(file.size)} · {file.uploader.name} · {new Date(file.created_at).toLocaleDateString()}
                                            {file._count?.comments > 0 && ` · ${file._count.comments} comment${file._count.comments !== 1 ? 's' : ''}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={e => handleToggleImportant(file, e)}
                                            className={`p-1.5 rounded-lg transition ${file.is_important ? 'text-amber-500 bg-amber-50' : 'text-[#94A3B8] hover:bg-[#F1F5F9]'}`}
                                            title={file.is_important ? 'Unmark important' : 'Mark important'}
                                        >
                                            <Star className="h-3.5 w-3.5" />
                                        </button>
                                        <a
                                            href={file.file_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="p-1.5 text-[#64748B] hover:bg-[#F1F5F9] rounded-lg transition"
                                            title="Download"
                                        >
                                            <Download className="h-3.5 w-3.5" />
                                        </a>
                                        {canDelete(file) && (
                                            <button
                                                onClick={e => handleDeleteFile(file, e)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── File Detail Panel ── */}
            {selectedFile && (
                <div className="w-72 bg-white rounded-xl border border-[#E2E8F0] flex flex-col overflow-hidden shrink-0">
                    <div className="px-4 py-3 border-b border-[#E2E8F0] flex items-center justify-between shrink-0">
                        <span className="text-sm font-semibold text-[#0F172A]">File Details</span>
                        <button onClick={() => setSelectedFile(null)} className="p-1 text-[#94A3B8] hover:bg-[#F1F5F9] rounded-lg transition">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Preview / icon */}
                        <div className="text-center">
                            {selectedFile.mime_type.startsWith('image/') ? (
                                <img
                                    src={selectedFile.file_url}
                                    alt={selectedFile.name}
                                    className="w-full max-h-32 object-contain rounded-lg border border-[#E2E8F0] mb-2"
                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            ) : (
                                <span className="text-5xl">{getFileIcon(selectedFile.mime_type)}</span>
                            )}
                            <p className="text-sm font-semibold text-[#0F172A] mt-2 break-all leading-snug">{selectedFile.name}</p>
                            <p className="text-xs text-[#94A3B8] mt-0.5">{formatSize(selectedFile.size)}</p>
                        </div>

                        {/* Meta */}
                        <div className="space-y-2 text-xs bg-[#F8FAFC] rounded-lg p-3">
                            <div className="flex justify-between gap-2">
                                <span className="text-[#64748B]">Uploaded by</span>
                                <span className="font-medium text-[#0F172A] text-right">{selectedFile.uploader.name}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                                <span className="text-[#64748B]">Date</span>
                                <span className="font-medium text-[#0F172A]">{new Date(selectedFile.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                                <span className="text-[#64748B]">Type</span>
                                <span className="font-medium text-[#0F172A] truncate max-w-[130px] text-right">{selectedFile.mime_type}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <a
                                href={selectedFile.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1D4ED8] text-white text-xs font-medium rounded-lg hover:bg-[#1E40AF] transition"
                            >
                                <Download className="h-3.5 w-3.5" /> Download
                            </a>
                            {selectedFile.mime_type.startsWith('image/') && (
                                <a
                                    href={selectedFile.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center px-3 py-2 border border-[#E2E8F0] text-[#0F172A] text-xs font-medium rounded-lg hover:bg-[#F8FAFC] transition"
                                    title="Preview"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                </a>
                            )}
                        </div>

                        {/* Comments */}
                        <div>
                            <p className="text-xs font-semibold text-[#0F172A] mb-2 flex items-center gap-1">
                                <MessageSquare className="h-3.5 w-3.5" />
                                Comments ({selectedFile.comments?.length ?? 0})
                            </p>
                            <div className="space-y-2 max-h-48 overflow-y-auto mb-2">
                                {(selectedFile.comments ?? []).length === 0 ? (
                                    <p className="text-xs text-[#94A3B8] text-center py-2">No comments yet</p>
                                ) : (
                                    (selectedFile.comments ?? []).map((c: any) => (
                                        <div key={c.id} className="bg-[#F8FAFC] rounded-lg p-2.5">
                                            <p className="text-xs font-semibold text-[#1D4ED8]">{c.user.name}</p>
                                            <p className="text-xs text-[#0F172A] mt-0.5 break-words">{c.body}</p>
                                            <p className="text-[10px] text-[#94A3B8] mt-1">{new Date(c.created_at).toLocaleString()}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                                    placeholder="Add a comment..."
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                />
                                <button
                                    onClick={handleAddComment}
                                    disabled={!comment.trim()}
                                    className="px-2.5 py-1.5 bg-[#1D4ED8] text-white text-xs rounded-lg hover:bg-[#1E40AF] transition disabled:opacity-40"
                                >
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
