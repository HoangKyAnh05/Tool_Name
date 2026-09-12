import { ipcMain, app, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { gdriveService } from './gdrive-service';
import { geminiService, VideoAnalysisRequest } from './gemini-service';

const CONFIG_PATH = path.join(app.getPath('userData'), 'app_config.json');

// Mock Data for Demo / Sandbox Mode
const MOCK_FOLDERS = [
  { id: 'folder_1', name: '📁 Khóa Học Lập Trình React & TypeScript' },
  { id: 'folder_2', name: '📁 Video Hướng Dẫn Kỹ Năng Mềm' },
  { id: 'folder_3', name: '📁 Vlog Du Lịch Đà Nẵng 2024' },
  { id: 'folder_4', name: '📁 Bài Giảng Trí Tuệ Nhân Tạo & Gemini' },
];

const MOCK_VIDEOS = [
  {
    id: 'vid_01',
    name: 'VID_20240901_091244_UNPROCESSED.mp4',
    mimeType: 'video/mp4',
    size: '142.5 MB',
    modifiedTime: '01/09/2026',
    duration: '14:32',
    thumbnailLink: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200&auto=format&fit=crop&q=80',
    webViewLink: 'https://drive.google.com',
    status: 'idle',
    selected: true,
  },
  {
    id: 'vid_02',
    name: 'recording_zoom_session_108239.mkv',
    mimeType: 'video/x-matroska',
    size: '480.2 MB',
    modifiedTime: '04/09/2026',
    duration: '45:10',
    thumbnailLink: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=200&auto=format&fit=crop&q=80',
    webViewLink: 'https://drive.google.com',
    status: 'idle',
    selected: true,
  },
  {
    id: 'vid_03',
    name: 'CLIP_0098_export_draft_v2.mp4',
    mimeType: 'video/mp4',
    size: '88.0 MB',
    modifiedTime: '08/09/2026',
    duration: '06:15',
    thumbnailLink: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=200&auto=format&fit=crop&q=80',
    webViewLink: 'https://drive.google.com',
    status: 'idle',
    selected: true,
  },
  {
    id: 'vid_04',
    name: 'screen_capture_gemini_api_setup.webm',
    mimeType: 'video/webm',
    size: '65.3 MB',
    modifiedTime: '10/09/2026',
    duration: '08:45',
    thumbnailLink: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    webViewLink: 'https://drive.google.com',
    status: 'idle',
    selected: true,
  },
  {
    id: 'vid_05',
    name: 'untitled_project_final_render_720p.mov',
    mimeType: 'video/quicktime',
    size: '312.8 MB',
    modifiedTime: '12/09/2026',
    duration: '22:18',
    thumbnailLink: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80',
    webViewLink: 'https://drive.google.com',
    status: 'idle',
    selected: true,
  },
];

export function setupIpcHandlers() {
  // Config Gemini
  ipcMain.handle('ai:init-gemini', async (_, { apiKey, modelName }) => {
    try {
      geminiService.init(apiKey, modelName);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // Config Google OAuth
  ipcMain.handle('gdrive:init-auth', async (_, { clientId, clientSecret }) => {
    try {
      const autoLoggedIn = gdriveService.initOAuth(clientId, clientSecret);
      return { success: true, autoLoggedIn };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // Authenticate Google
  ipcMain.handle('gdrive:login', async () => {
    try {
      const auth = await gdriveService.authenticate();
      return { success: auth };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // Check auth
  ipcMain.handle('gdrive:is-auth', async () => {
    return { authenticated: gdriveService.isAuthenticated() };
  });

  // List Folders
  ipcMain.handle('gdrive:list-folders', async (_, { parentId, isDemo }) => {
    if (isDemo) {
      return { success: true, folders: MOCK_FOLDERS };
    }
    try {
      const folders = await gdriveService.listFolders(parentId || 'root');
      return { success: true, folders };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // List Videos
  ipcMain.handle('gdrive:list-videos', async (_, { folderId, isDemo }) => {
    if (isDemo) {
      return { success: true, videos: JSON.parse(JSON.stringify(MOCK_VIDEOS)) };
    }
    try {
      const videos = await gdriveService.listVideos(folderId || 'root');
      return { success: true, videos };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // AI Analyze Video
  ipcMain.handle('ai:analyze-video', async (_, req: VideoAnalysisRequest & { isDemo?: boolean }) => {
    if (req.isDemo) {
      // Simulate intelligent mock response
      await new Promise(r => setTimeout(r, 1200)); // realistic delay
      const extMatch = req.fileName.match(/\.[0-9a-z]+$/i);
      const ext = extMatch ? extMatch[0] : '.mp4';
      
      const mockNames: Record<string, { name: string; summary: string }> = {
        'vid_01': {
          name: '2024-09-01_React_Hooks_State_Management_Co_Ban' + ext,
          summary: 'Video hướng dẫn kiến trúc State Management và cách dùng useState, useEffect trong React 18.'
        },
        'vid_02': {
          name: '2024-09-04_Ky_Nang_Thuyet_Trinh_Va_Giao_Tiep_Nhom' + ext,
          summary: 'Buổi training kỹ năng mềm về phương pháp thuyết trình thuyết phục và làm việc nhóm hiệu quả.'
        },
        'vid_03': {
          name: '2024-09-08_Kham_Pha_Cau_Rong_Va_Bana_Hills_Da_Nang' + ext,
          summary: 'Trải nghiệm du lịch ngắm Cầu Rồng phun lửa và cáp treo lên đỉnh Bà Nà Hills tại Đà Nẵng.'
        },
        'vid_04': {
          name: '2024-09-10_Huong_Dan_Tich_Hop_Gemini_Flash_Vao_Nodejs' + ext,
          summary: 'Thao tác cấu hình API Key và gọi SDK Gemini 2.0 Flash để phân tích đa phương tiện trong Node.js.'
        },
        'vid_05': {
          name: '2024-09-12_Tong_Quan_Kien_Truc_He_Thong_Microservices' + ext,
          summary: 'Giải thích chi tiết về ưu nhược điểm của kiến trúc Microservices so với Monolith trong doanh nghiệp.'
        }
      };

      const result = mockNames[req.fileId] || {
        name: `2024-09-13_Video_Noi_Dung_Tong_Hop_${Math.floor(Math.random()*100)}${ext}`,
        summary: 'Nội dung video đã được AI phân tích và phân loại chủ đề thành công.'
      };

      return {
        success: true,
        data: result
      };
    }

    try {
      const data = await geminiService.analyzeVideoName(req);
      return { success: true, data };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // Rename File
  ipcMain.handle('gdrive:rename-file', async (_, { fileId, newName, isDemo }) => {
    if (isDemo) {
      await new Promise(r => setTimeout(r, 600));
      return { success: true, file: { id: fileId, name: newName } };
    }
    try {
      const result = await gdriveService.renameFile(fileId, newName);
      return { success: true, file: result };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // App Restart / Reload
  ipcMain.handle('app:restart', async () => {
    try {
      const windows = BrowserWindow.getAllWindows();
      if (windows.length > 0) {
        windows[0].webContents.reloadIgnoringCache();
        return { success: true };
      }
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  // Config Persistence
  ipcMain.handle('config:save', async (_, { apiConfig, renameConfig }) => {
    try {
      let current: any = {};
      if (fs.existsSync(CONFIG_PATH)) {
        try {
          current = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        } catch (e) {}
      }
      const updated = {
        ...current,
        ...(apiConfig ? { apiConfig: { ...current.apiConfig, ...apiConfig } } : {}),
        ...(renameConfig ? { renameConfig: { ...current.renameConfig, ...renameConfig } } : {}),
      };
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(updated, null, 2), 'utf-8');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle('config:get', async () => {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        return { success: true, config: JSON.parse(raw) };
      }
      return { success: true, config: {} };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  });
}
