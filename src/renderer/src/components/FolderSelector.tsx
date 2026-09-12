import React from 'react';
import { 
  Folder, 
  RotateCw, 
  Search, 
  Sparkles, 
  CheckCheck, 
  Filter, 
  Video,
  FileCheck2
} from 'lucide-react';
import { DriveFolder, DriveFile } from '../types';

interface FolderSelectorProps {
  folders: DriveFolder[];
  selectedFolder: string;
  onSelectFolder: (folderId: string) => void;
  onRefresh: () => void;
  isLoadingFolders: boolean;
  isLoadingVideos: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  videos: DriveFile[];
  onBatchAnalyze: () => void;
  onBatchRename: () => void;
  isProcessing: boolean;
}

export const FolderSelector: React.FC<FolderSelectorProps> = ({
  folders,
  selectedFolder,
  onSelectFolder,
  onRefresh,
  isLoadingFolders,
  isLoadingVideos,
  searchTerm,
  onSearchChange,
  videos,
  onBatchAnalyze,
  onBatchRename,
  isProcessing,
}) => {
  const selectedVideosCount = videos.filter(v => v.selected).length;
  const readyToRenameCount = videos.filter(v => v.selected && v.status === 'ready').length;
  const completedCount = videos.filter(v => v.status === 'renamed').length;
  const [customFolderInput, setCustomFolderInput] = React.useState('');
  const [showDirectInput, setShowDirectInput] = React.useState(false);

  const handleApplyCustomFolder = () => {
    let input = customFolderInput.trim();
    if (!input) return;

    // Trích xuất Folder ID nếu là URL dạng https://drive.google.com/drive/folders/1ABC...
    const urlMatch = input.match(/folders\/([a-zA-Z0-9_-]+)/);
    const folderId = urlMatch ? urlMatch[1] : input;

    onSelectFolder(folderId);
    setShowDirectInput(false);
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col gap-4 shadow-xl">
      {/* Top Row: Folder picker & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Folder Picker */}
        <div className="flex items-center gap-3 flex-1 min-w-[340px]">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Folder className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Thư mục Google Drive
              </label>
              <button
                type="button"
                onClick={() => setShowDirectInput(!showDirectInput)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors font-medium underline"
              >
                {showDirectInput ? 'Chọn từ danh sách' : '+ Dán Link / ID Thư Mục'}
              </button>
            </div>

            {showDirectInput ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Dán link Drive (https://drive.google.com/drive/folders/...) hoặc ID"
                  value={customFolderInput}
                  onChange={(e) => setCustomFolderInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomFolder()}
                  className="w-full bg-slate-900/90 text-slate-200 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomFolder}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl whitespace-nowrap"
                >
                  Mở
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={selectedFolder}
                  onChange={(e) => onSelectFolder(e.target.value)}
                  disabled={isLoadingFolders || isProcessing}
                  className="w-full bg-slate-900/90 text-slate-200 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm font-medium focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="root">📁 Thư mục Gốc (My Drive / Root)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={onRefresh}
                  disabled={isLoadingFolders || isLoadingVideos || isProcessing}
                  title="Làm mới danh sách thư mục & video"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all hover:border-slate-600 disabled:opacity-50"
                >
                  <RotateCw className={`w-4 h-4 ${isLoadingFolders || isLoadingVideos ? 'animate-spin text-indigo-400' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="w-72">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Lọc theo tên file
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm video..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-900/90 text-slate-200 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Bottom Row: Stats & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-800/80">
        {/* Stats */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-indigo-400" />
            <span>Tổng: <strong className="text-white">{videos.length}</strong> video</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Đã sinh tên: <strong className="text-cyan-300">{readyToRenameCount}</strong></span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Đã đổi tên Drive: <strong className="text-emerald-300">{completedCount}</strong></span>
          </div>
        </div>

        {/* Batch Actions */}
        <div className="flex items-center gap-3">
          {/* Analyze with AI button */}
          <button
            onClick={onBatchAnalyze}
            disabled={isProcessing || selectedVideosCount === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-400/30 flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles className={`w-4 h-4 text-cyan-300 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Phân Tích AI ({selectedVideosCount})</span>
          </button>

          {/* Batch Rename button */}
          <button
            onClick={onBatchRename}
            disabled={isProcessing || readyToRenameCount === 0}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 border border-emerald-400/30 flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Đổi Tên Trên Drive ({readyToRenameCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
