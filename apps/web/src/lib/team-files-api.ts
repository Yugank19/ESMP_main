import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const teamFilesApi = {
    // Folders
    createFolder: (teamId: string, data: { name: string; parent_id?: string }) =>
        axios.post(`${API}/teams/${teamId}/files/folders`, data, { headers: getHeaders() }),

    // parentId undefined = root level
    getFolders: (teamId: string, parentId?: string) =>
        axios.get(`${API}/teams/${teamId}/files/folders`, {
            headers: getHeaders(),
            params: { parent_id: parentId ?? 'root' },
        }),

    deleteFolder: (teamId: string, folderId: string) =>
        axios.delete(`${API}/teams/${teamId}/files/folders/${folderId}`, { headers: getHeaders() }),

    // Files
    uploadFile: (teamId: string, file: File, folderId?: string, onProgress?: (p: number) => void) => {
        const form = new FormData();
        form.append('file', file);
        const params = new URLSearchParams();
        if (folderId) params.set('folder_id', folderId);
        return axios.post(
            `${API}/teams/${teamId}/files/upload${folderId ? `?folder_id=${folderId}` : ''}`,
            form,
            {
                headers: { ...getHeaders(), 'Content-Type': 'multipart/form-data' },
                onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / (e.total || 1))),
            },
        );
    },

    // folderId undefined = root level
    getFiles: (teamId: string, folderId?: string, search?: string) =>
        axios.get(`${API}/teams/${teamId}/files`, {
            headers: getHeaders(),
            params: {
                folder_id: folderId ?? 'root',
                ...(search ? { search } : {}),
            },
        }),

    getFile: (teamId: string, fileId: string) =>
        axios.get(`${API}/teams/${teamId}/files/${fileId}`, { headers: getHeaders() }),

    updateFile: (teamId: string, fileId: string, data: any) =>
        axios.patch(`${API}/teams/${teamId}/files/${fileId}`, data, { headers: getHeaders() }),

    deleteFile: (teamId: string, fileId: string) =>
        axios.delete(`${API}/teams/${teamId}/files/${fileId}`, { headers: getHeaders() }),

    addComment: (teamId: string, fileId: string, body: string) =>
        axios.post(`${API}/teams/${teamId}/files/${fileId}/comments`, { body }, { headers: getHeaders() }),
};
