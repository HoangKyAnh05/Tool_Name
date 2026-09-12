import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  ListOrdered, 
  Trash2, 
  Sparkles,
  Layers,
  FolderOpen
} from 'lucide-react';
import { DriveFile } from '../types';

export interface RenamedItemHistory {
  id: string;
  originalName: string;
  newName: string;
  timestamp: string;
  summary?: string;
}

interface RenamedListModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: DriveFile[];
  history: RenamedItemHistory[];
  onClearHistory: () => void;
}

export const RenamedListModal: React.FC<RenamedListModalProps> = ({
  isOpen,
  onClose,
  videos,
  history,
  onClearHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'folder' | 'processed' | 'history'>('folder');
  const [copied, setCopied] = useState(false);
  const [includeExtension, setIncludeExtension] = useState(true);
  const [includeIndex, setIncludeIndex] = useState(true);
  const [viewMode, setViewMode] = useState<'plain' | 'table'>('plain');

  if (!isOpen) return null;

  // All videos in current folder (showing proposed/renamed name if available, otherwise original name)
  const currentFolderItems = videos.map((v) => ({
    id: v.id,
    originalName: v.name,
    newName: v.proposedName || v.name,
    timestamp: v.modifiedTime || new Date().toLocaleTimeString('vi-VN'),
    summary: v.summary,
    status: v.status,
  }));

  // Only processed / ready items in current folder
  const processedItems = videos
    .filter((v) => v.status === 'renamed' || v.status === 'ready')
    .map((v) => ({
      id: v.id,
      originalName: v.name,
      newName: v.proposedName || v.name,
      timestamp: v.modifiedTime || new Date().toLocaleTimeString('vi-VN'),
      summary: v.summary,
      status: v.status,
    }));

  const activeItems = 
    activeTab === 'folder' 
      ? currentFolderItems 
      : activeTab === 'processed' 
        ? processedItems 
        : history;

  // Format list text for copying (1. name, 2. name...)
  const formattedText = activeItems
    .map((item, idx) => {
      let name = item.newName;
      if (!includeExtension) {
        name = name.replace(/\.[^/.]+$/, '');
      }
      if (includeIndex) {
        // If the name already starts with a number format like "1. " or "01. ", keep as is, otherwise prefix
        if (!/^\d+[\.\-\]]\s*/.test(name)) {
          return `${idx + 1}. ${name}`;
        }
      }
      return name;
    })
    .join('\n');

  const handleCopy = () => {
    if (!formattedText) return;
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!formattedText) return;
    const blob = new Blob([formattedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `danh_sach_video_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20">
              <ListOrdered className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Danh Sách Tên Video</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  {activeItems.length} video
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tự động trích xuất toàn bộ tên video trong thư mục đang mở, hỗ trợ sao chép nhanh 1 chạm theo thứ tự 1., 2.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs & Controls */}
        <div className="px-6 py-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 text-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('folder')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'folder'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Thư Mục Mở ({currentFolderItems.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('processed')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'processed'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Đã Xử Lý ({processedItems.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lịch Sử Lưu ({history.length})</span>
            </button>
          </div>

          {/* Formatting Options */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeIndex}
                onChange={(e) => setIncludeIndex(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>Đánh số (1., 2.)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={includeExtension}
                onChange={(e) => setIncludeExtension(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>Đuôi file (.mp4)</span>
            </label>

            <div className="h-4 w-[1px] bg-slate-800" />

            <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewMode('plain')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                  viewMode === 'plain' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400'
                }`}
              >
                Văn Bản
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                  viewMode === 'table' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400'
                }`}
              >
                Đối Chiếu
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 min-h-[280px] max-h-[50vh]">
          {activeItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <FileText className="w-12 h-12 text-slate-700 mb-3" />
              <p className="font-semibold text-slate-300 text-sm">Chưa có video nào trong danh sách</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Hãy chọn một thư mục chứa video trên Google Drive để danh sách video tự động xuất hiện.
              </p>
            </div>
          ) : viewMode === 'plain' ? (
            <div className="relative">
              <textarea
                readOnly
                value={formattedText}
                rows={12}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed resize-none selection:bg-indigo-500/40"
              />
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                    <th className="p-3 w-10 text-center">#</th>
                    <th className="p-3">Tên Gốc Trong Thư Mục</th>
                    <th className="p-3">Tên Sau Xử Lý / Đổi Tên</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activeItems.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-800/20">
                      <td className="p-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-3 text-slate-400 truncate max-w-[200px]" title={item.originalName}>
                        {item.originalName}
                      </td>
                      <td className="p-3 font-mono text-indigo-300 font-medium">
                        {item.newName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div>
            {activeTab === 'history' && history.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Lịch Sử</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadTxt}
              disabled={activeItems.length === 0}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Xuất Tệp .TXT</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              disabled={activeItems.length === 0}
              className={`px-5 py-2 rounded-xl text-white font-semibold flex items-center gap-1.5 shadow-lg transition-all ${
                copied
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/25 border border-indigo-400/30'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-200" />
                  <span>Đã Sao Chép ({activeItems.length})!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Sao Chép Toàn Bộ ({activeItems.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
