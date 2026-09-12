import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FolderSelector } from './components/FolderSelector';
import { VideoTable } from './components/VideoTable';
import { RenameSettingsModal } from './components/RenameSettingsModal';
import { ApiConfigModal } from './components/ApiConfigModal';
import { RenamedListModal, RenamedItemHistory } from './components/RenamedListModal';
import { ProcessLogs } from './components/ProcessLogs';
import { DriveFile, DriveFolder, RenameConfig, ApiConfig, LogEntry } from './types';
import { extractVideoFrames } from './utils/frame-extractor';

// Default initial configurations
const DEFAULT_API_CONFIG: ApiConfig = {
  googleClientId: '',
  googleClientSecret: '',
  geminiApiKey: '',
  geminiModel: 'gemini-3.7-flash',
  isDemoMode: false,
};

const DEFAULT_RENAME_CONFIG: RenameConfig = {
  namingPattern: 'date_topic',
  customTemplate: '',
  language: 'vi',
  caseStyle: 'lowercase',
  includeDate: false,
  includeIndex: true,
  indexFormat: '1.',
  prefix: '',
  maxWords: 8,
  contextHint: 'Video đánh cầu lông (đơn nam, đôi nam, giao lưu, tập luyện...)',
  autoRenameAfterScan: true,
};

export const App: React.FC = () => {
  // App Configs
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
    const saved = localStorage.getItem('gdrive_ai_api_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_API_CONFIG,
          ...parsed,
        };
      } catch (e) {
        return DEFAULT_API_CONFIG;
      }
    }
    return DEFAULT_API_CONFIG;
  });

  const [renameConfig, setRenameConfig] = useState<RenameConfig>(() => {
    const saved = localStorage.getItem('gdrive_ai_rename_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_RENAME_CONFIG,
          ...parsed,
          autoRenameAfterScan: parsed.autoRenameAfterScan ?? true,
          includeDate: parsed.includeDate ?? false,
          includeIndex: parsed.includeIndex ?? true,
          indexFormat: parsed.indexFormat ?? '1.',
          contextHint: parsed.contextHint || DEFAULT_RENAME_CONFIG.contextHint,
          caseStyle: parsed.caseStyle || 'lowercase',
        };
      } catch (e) {
        return DEFAULT_RENAME_CONFIG;
      }
    }
    return DEFAULT_RENAME_CONFIG;
  });

  // UI States
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isRenamedListModalOpen, setIsRenamedListModalOpen] = useState(false);
  const [isDriveAuth, setIsDriveAuth] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  // Data States
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('root');
  const [videos, setVideos] = useState<DriveFile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [renamedHistory, setRenamedHistory] = useState<RenamedItemHistory[]>(() => {
    const saved = localStorage.getItem('gdrive_ai_renamed_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const recordRenamedItem = (originalName: string, newName: string, summary?: string) => {
    const newItem: RenamedItemHistory = {
      id: Math.random().toString(36).substring(2, 9),
      originalName,
      newName,
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      summary,
    };
    setRenamedHistory((prev) => {
      const filtered = prev.filter((item) => item.newName !== newName);
      const updated = [newItem, ...filtered];
      localStorage.setItem('gdrive_ai_renamed_history', JSON.stringify(updated));
      (window as any).electronAPI?.saveConfig({ renamedHistory: updated });
      return updated;
    });
  };

  const handleClearHistory = () => {
    setRenamedHistory([]);
    localStorage.removeItem('gdrive_ai_renamed_history');
    (window as any).electronAPI?.saveConfig({ renamedHistory: [] });
    addLog('info', 'Đã xóa toàn bộ lịch sử tên video đã lưu.');
  };

  // Log Helper
  const addLog = (type: LogEntry['type'], message: string) => {
    const time = new Date().toLocaleTimeString('vi-VN');
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: time,
      type,
      message,
    };
    setLogs((prev) => [...prev, newEntry]);
  };

  // Initialize & load data
  useEffect(() => {
    addLog('info', `Khởi động ứng dụng. Chế độ: ${apiConfig.isDemoMode ? 'Sandbox Demo' : 'Trực tiếp Google Cloud'}.`);
    
    const initApp = async () => {
      let currentApiConfig = apiConfig;
      
      // Attempt to load from persistent electron file storage if available
      try {
        const stored = await (window as any).electronAPI?.getConfig();
        if (stored?.success && stored.config) {
          if (stored.config.apiConfig) {
            currentApiConfig = { ...currentApiConfig, ...stored.config.apiConfig };
            setApiConfig(currentApiConfig);
            localStorage.setItem('gdrive_ai_api_config', JSON.stringify(currentApiConfig));
          }
          if (stored.config.renameConfig) {
            setRenameConfig((prev) => ({ ...prev, ...stored.config.renameConfig }));
            localStorage.setItem('gdrive_ai_rename_config', JSON.stringify(stored.config.renameConfig));
          }
          if (stored.config.renamedHistory && Array.isArray(stored.config.renamedHistory)) {
            setRenamedHistory(stored.config.renamedHistory);
            localStorage.setItem('gdrive_ai_renamed_history', JSON.stringify(stored.config.renamedHistory));
          }
        }
      } catch (e) {}

      if (!currentApiConfig.isDemoMode) {
        if (currentApiConfig.geminiApiKey) {
          (window as any).electronAPI?.initGemini(currentApiConfig.geminiApiKey, currentApiConfig.geminiModel);
        }
        if (currentApiConfig.googleClientId && currentApiConfig.googleClientSecret) {
          try {
            const authRes = await (window as any).electronAPI?.initGoogleAuth(
              currentApiConfig.googleClientId,
              currentApiConfig.googleClientSecret
            );
            if (authRes?.autoLoggedIn) {
              setIsDriveAuth(true);
              addLog('success', 'Tự động khôi phục phiên đăng nhập Google Drive thành công.');
            }
          } catch (e) {}
        }
      }
      Promise.all([loadFolders(), loadVideos(selectedFolder)]);
    };

    initApp();
  }, [apiConfig.isDemoMode]);

  // Load Folders
  const loadFolders = async () => {
    setIsLoadingFolders(true);
    try {
      const res = await (window as any).electronAPI?.listFolders('root', apiConfig.isDemoMode);
      if (res?.success) {
        setFolders(res.folders || []);
        addLog('info', `Đã tải ${res.folders?.length || 0} thư mục từ Google Drive.`);
      } else if (res?.error) {
        addLog('warning', `Không thể tải thư mục: ${res.error}`);
      }
    } catch (e: any) {
      addLog('error', `Lỗi khi tải thư mục: ${e.message}`);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  // Load Videos
  const loadVideos = async (folderId: string) => {
    setIsLoadingVideos(true);
    try {
      addLog('info', `Đang quét tệp video trong thư mục [${folderId}]...`);
      const res = await (window as any).electronAPI?.listVideos(folderId, apiConfig.isDemoMode);
      if (res?.success) {
        setVideos(res.videos || []);
        addLog('success', `Đã tìm thấy ${res.videos?.length || 0} video.`);
      } else if (res?.error) {
        addLog('error', `Lỗi quét video: ${res.error}`);
      }
    } catch (e: any) {
      addLog('error', `Lỗi kết nối khi quét video: ${e.message}`);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // Folder selection changed
  const handleSelectFolder = (folderId: string) => {
    setSelectedFolder(folderId);
    loadVideos(folderId);
  };

  // Save Configs
  const handleSaveApiConfig = async (newConfig: ApiConfig) => {
    setApiConfig(newConfig);
    localStorage.setItem('gdrive_ai_api_config', JSON.stringify(newConfig));
    try {
      await (window as any).electronAPI?.saveConfig({ apiConfig: newConfig });
    } catch (e) {}

    addLog('success', 'Đã lưu cấu hình API & Kết nối mới.');
    if (!newConfig.isDemoMode) {
      if (newConfig.geminiApiKey) {
        (window as any).electronAPI?.initGemini(newConfig.geminiApiKey, newConfig.geminiModel);
      }
      if (newConfig.googleClientId && newConfig.googleClientSecret) {
        try {
          const authRes = await (window as any).electronAPI?.initGoogleAuth(
            newConfig.googleClientId,
            newConfig.googleClientSecret
          );
          if (authRes?.autoLoggedIn) {
            setIsDriveAuth(true);
            addLog('success', 'Tự động khôi phục phiên đăng nhập Google Drive.');
          }
        } catch (e) {}
      }
    }
  };

  const handleSaveRenameConfig = async (newConfig: RenameConfig) => {
    setRenameConfig(newConfig);
    localStorage.setItem('gdrive_ai_rename_config', JSON.stringify(newConfig));
    try {
      await (window as any).electronAPI?.saveConfig({ renameConfig: newConfig });
    } catch (e) {}
    addLog('success', 'Đã cập nhật quy tắc đặt tên video mới.');
  };

  // Single AI Analysis
  const handleAnalyzeSingle = async (file: DriveFile, customIndex?: number) => {
    if (!apiConfig.isDemoMode && !apiConfig.geminiApiKey) {
      setIsApiModalOpen(true);
      addLog('warning', 'Vui lòng cấu hình Gemini API Key trước khi phân tích video.');
      return;
    }

    const calculatedIndex = typeof customIndex === 'number' 
      ? customIndex 
      : (videos.findIndex((v) => v.id === file.id) + 1);

    setVideos((prev) =>
      prev.map((v) => (v.id === file.id ? { ...v, status: 'analyzing', errorMsg: undefined } : v))
    );
    addLog('info', `Bắt đầu trích xuất 10 khung hình diễn biến từ: "${file.name}"...`);

    try {
      let extractedFrames: string[] = [];
      if (!apiConfig.isDemoMode) {
        try {
          extractedFrames = await extractVideoFrames(file.id, 10, (p) => {
            addLog('info', `[${file.name}] ${p}`);
          });
        } catch (e) {}
      }

      if (extractedFrames.length > 0) {
        addLog('success', `Đã lấy thành công ${extractedFrames.length} ảnh diễn biến theo tiến trình video! Đang gửi cho Gemini Vision phân tích...`);
      } else {
        addLog('info', `Đang phân tích hình ảnh video cùng Gemini Vision...`);
      }

      const res = await (window as any).electronAPI?.analyzeVideo({
        fileId: file.id,
        fileName: file.name,
        mimeType: file.mimeType,
        duration: file.duration,
        thumbnailLink: file.thumbnailLink,
        imageFrames: extractedFrames,
        namingPattern: renameConfig.namingPattern,
        customTemplate: renameConfig.customTemplate,
        language: renameConfig.language,
        caseStyle: renameConfig.caseStyle,
        includeDate: renameConfig.includeDate,
        includeIndex: renameConfig.includeIndex,
        indexFormat: renameConfig.indexFormat,
        index: calculatedIndex,
        prefix: renameConfig.prefix,
        maxWords: renameConfig.maxWords,
        contextHint: renameConfig.contextHint,
        isDemo: apiConfig.isDemoMode,
      });

      if (res?.success && res.data) {
        const proposedName = res.data.proposedName;
        const summary = res.data.summary;

        if (renameConfig.autoRenameAfterScan ?? true) {
          // Immediately rename on Google Drive without requiring manual confirmation
          setVideos((prev) =>
            prev.map((v) =>
              v.id === file.id
                ? {
                    ...v,
                    status: 'renaming',
                    proposedName,
                    summary,
                  }
                : v
            )
          );
          addLog('info', `⚡ [Tự động đổi tên] Đang cập nhật tên trên Drive: "${file.name}" ➔ "${proposedName}"...`);

          try {
            const renameRes = await (window as any).electronAPI?.renameFile(
              file.id,
              proposedName,
              apiConfig.isDemoMode
            );

            if (renameRes?.success) {
              setVideos((prev) =>
                prev.map((v) =>
                  v.id === file.id
                    ? {
                        ...v,
                        status: 'renamed',
                        name: proposedName,
                        proposedName,
                        summary,
                        selected: false,
                      }
                    : v
                )
              );
              recordRenamedItem(file.name, proposedName, summary);
              addLog('success', `✅ [Tự động đổi tên] Đã đổi tên thành công: "${proposedName}"`);
            } else {
              throw new Error(renameRes?.error || 'Lỗi khi gọi Google Drive API');
            }
          } catch (renameErr: any) {
            setVideos((prev) =>
              prev.map((v) =>
                v.id === file.id
                  ? {
                      ...v,
                      status: 'error',
                      proposedName,
                      summary,
                      errorMsg: `Đã sinh tên nhưng lỗi khi đổi tên Drive: ${renameErr.message}`,
                    }
                  : v
              )
            );
            addLog('error', `Không thể đổi tên Drive cho "${file.name}": ${renameErr.message}`);
          }
        } else {
          // Keep as ready for manual confirmation
          setVideos((prev) =>
            prev.map((v) =>
              v.id === file.id
                ? {
                    ...v,
                    status: 'ready',
                    proposedName,
                    summary,
                  }
                : v
            )
          );
          recordRenamedItem(file.name, proposedName, summary);
          addLog('success', `Đã sinh tên mới cho "${file.name}" ➔ "${proposedName}"`);
        }
      } else {
        throw new Error(res?.error || 'Không nhận được kết quả từ AI');
      }
    } catch (err: any) {
      setVideos((prev) =>
        prev.map((v) => (v.id === file.id ? { ...v, status: 'error', errorMsg: err.message } : v))
      );
      addLog('error', `Lỗi khi phân tích "${file.name}": ${err.message}`);
    }
  };

  // Batch AI Analysis
  const handleBatchAnalyze = async () => {
    const selectedVideos = videos.filter((v) => v.selected && v.status !== 'renamed');
    if (selectedVideos.length === 0) return;

    setIsProcessing(true);
    addLog('info', `Bắt đầu tiến trình phân tích hàng loạt cho ${selectedVideos.length} video...`);

    for (let i = 0; i < selectedVideos.length; i++) {
      const vid = selectedVideos[i];
      await handleAnalyzeSingle(vid, i + 1);
    }

    setIsProcessing(false);
    addLog('success', `Hoàn thành đợt phân tích AI cho toàn bộ ${selectedVideos.length} video!`);
  };

  // Single Rename
  const handleRenameSingle = async (file: DriveFile) => {
    if (!file.proposedName || file.status === 'renaming' || file.status === 'renamed') return;

    setVideos((prev) =>
      prev.map((v) => (v.id === file.id ? { ...v, status: 'renaming' } : v))
    );
    addLog('info', `Đang cập nhật tên trên Drive: "${file.name}" ➔ "${file.proposedName}"...`);

    try {
      const res = await (window as any).electronAPI?.renameFile(
        file.id,
        file.proposedName,
        apiConfig.isDemoMode
      );

      if (res?.success) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === file.id
              ? { ...v, status: 'renamed', name: file.proposedName!, selected: false }
              : v
          )
        );
        recordRenamedItem(file.name, file.proposedName, file.summary);
        addLog('success', `Đã đổi tên thành công trên Google Drive: "${file.proposedName}"`);
      } else {
        throw new Error(res?.error || 'Lỗi khi gọi Google Drive API');
      }
    } catch (err: any) {
      setVideos((prev) =>
        prev.map((v) => (v.id === file.id ? { ...v, status: 'error', errorMsg: err.message } : v))
      );
      addLog('error', `Không thể đổi tên "${file.name}": ${err.message}`);
    }
  };

  // Batch Rename
  const handleBatchRename = async () => {
    const readyVideos = videos.filter((v) => v.selected && v.status === 'ready');
    if (readyVideos.length === 0) return;

    setIsProcessing(true);
    addLog('info', `Bắt đầu cập nhật tên hàng loạt cho ${readyVideos.length} video trên Google Drive...`);

    for (let i = 0; i < readyVideos.length; i++) {
      const vid = readyVideos[i];
      await handleRenameSingle(vid);
    }

    setIsProcessing(false);
    addLog('success', `Tất cả ${readyVideos.length} video đã được đổi tên hoàn tất trên Drive!`);
  };

  // Google Login Action
  const handleLoginGoogle = async () => {
    if (!apiConfig.googleClientId || !apiConfig.googleClientSecret) {
      setIsApiModalOpen(true);
      addLog('warning', 'Vui lòng cung cấp Client ID & Secret để đăng nhập Google.');
      return;
    }

    if (!(window as any).electronAPI) {
      addLog('error', 'Không tìm thấy kết nối Electron Bridge. Vui lòng chạy ứng dụng qua Electron.');
      return;
    }

    try {
      addLog('info', 'Đang kết nối tới Google Cloud OAuth...');
      const initRes = await (window as any).electronAPI.initGoogleAuth(
        apiConfig.googleClientId,
        apiConfig.googleClientSecret
      );
      if (initRes?.error) {
        addLog('error', `Lỗi khởi tạo OAuth: ${initRes.error}`);
        return;
      }

      addLog('info', 'Đang mở trình duyệt xác thực Google (cổng 8899)...');
      const res = await (window as any).electronAPI.loginGoogle();
      if (res?.success) {
        setIsDriveAuth(true);
        addLog('success', 'Đăng nhập Google Drive thành công!');
        loadFolders();
        loadVideos(selectedFolder);
      } else {
        addLog('error', `Đăng nhập thất bại: ${res?.error || 'Không nhận được mã xác thực.'}`);
      }
    } catch (e: any) {
      addLog('error', `Lỗi đăng nhập Google: ${e.message}`);
    }
  };

  // Selection handlers
  const handleToggleSelectAll = () => {
    const allSelected = videos.length > 0 && videos.every((v) => v.selected);
    setVideos((prev) => prev.map((v) => ({ ...v, selected: !allSelected })));
  };

  const handleToggleSelect = (id: string) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, selected: !v.selected } : v))
    );
  };

  const handleUpdateProposedName = (id: string, newName: string) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, proposedName: newName } : v))
    );
  };

  // Filtered videos
  const filteredVideos = videos.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.proposedName && v.proposedName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRestartApp = async () => {
    addLog('info', 'Đang khởi động lại ứng dụng...');
    try {
      if ((window as any).electronAPI?.restartApp) {
        await (window as any).electronAPI.restartApp();
      } else {
        window.location.reload();
      }
    } catch (e) {
      window.location.reload();
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0e17] text-slate-100 overflow-hidden select-none">
      {/* Top Header */}
      <Header
        apiConfig={apiConfig}
        isDriveAuth={isDriveAuth}
        onOpenApiConfig={() => setIsApiModalOpen(true)}
        onOpenRenameSettings={() => setIsRenameModalOpen(true)}
        onOpenRenamedList={() => setIsRenamedListModalOpen(true)}
        renamedCount={videos.length}
        onToggleDemoMode={() =>
          handleSaveApiConfig({ ...apiConfig, isDemoMode: !apiConfig.isDemoMode })
        }
        onLoginGoogle={handleLoginGoogle}
        onRestartApp={handleRestartApp}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 p-6 flex flex-col gap-4 min-h-0 overflow-hidden">
        <FolderSelector
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={handleSelectFolder}
          onRefresh={() => {
            loadFolders();
            loadVideos(selectedFolder);
          }}
          isLoadingFolders={isLoadingFolders}
          isLoadingVideos={isLoadingVideos}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          videos={videos}
          onBatchAnalyze={handleBatchAnalyze}
          onBatchRename={handleBatchRename}
          isProcessing={isProcessing}
          autoRenameAfterScan={renameConfig.autoRenameAfterScan ?? true}
          onToggleAutoRename={(val) => handleSaveRenameConfig({ ...renameConfig, autoRenameAfterScan: val })}
          onOpenRenamedList={() => setIsRenamedListModalOpen(true)}
        />

        <VideoTable
          videos={filteredVideos}
          onToggleSelectAll={handleToggleSelectAll}
          onToggleSelect={handleToggleSelect}
          onUpdateProposedName={handleUpdateProposedName}
          onAnalyzeSingle={handleAnalyzeSingle}
          onRenameSingle={handleRenameSingle}
          isProcessing={isProcessing}
        />
      </main>

      {/* Process Logs Drawer */}
      <ProcessLogs logs={logs} onClearLogs={() => setLogs([])} />

      {/* Modals */}
      <RenameSettingsModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
        config={renameConfig}
        onSave={handleSaveRenameConfig}
      />

      <ApiConfigModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        config={apiConfig}
        onSave={handleSaveApiConfig}
      />

      <RenamedListModal
        isOpen={isRenamedListModalOpen}
        onClose={() => setIsRenamedListModalOpen(false)}
        videos={videos}
        history={renamedHistory}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
};
export default App;
