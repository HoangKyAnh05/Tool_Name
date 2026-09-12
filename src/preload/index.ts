import { contextBridge, ipcRenderer } from 'electron';

export const electronAPI = {
  // AI
  initGemini: (apiKey: string, modelName: string) => 
    ipcRenderer.invoke('ai:init-gemini', { apiKey, modelName }),
  analyzeVideo: (params: any) => 
    ipcRenderer.invoke('ai:analyze-video', params),

  // Google Drive
  initGoogleAuth: (clientId: string, clientSecret: string) => 
    ipcRenderer.invoke('gdrive:init-auth', { clientId, clientSecret }),
  loginGoogle: () => 
    ipcRenderer.invoke('gdrive:login'),
  checkAuth: () => 
    ipcRenderer.invoke('gdrive:is-auth'),
  listFolders: (parentId?: string, isDemo?: boolean) => 
    ipcRenderer.invoke('gdrive:list-folders', { parentId, isDemo }),
  listVideos: (folderId?: string, isDemo?: boolean) => 
    ipcRenderer.invoke('gdrive:list-videos', { folderId, isDemo }),
  renameFile: (fileId: string, newName: string, isDemo?: boolean) => 
    ipcRenderer.invoke('gdrive:rename-file', { fileId, newName, isDemo }),

  // System
  restartApp: () => 
    ipcRenderer.invoke('app:restart'),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
