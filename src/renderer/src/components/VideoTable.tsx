import React from 'react';
import { 
  FileVideo, 
  Sparkles, 
  Check, 
  ExternalLink, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  HardDrive,
  Edit3,
  Info
} from 'lucide-react';
import { DriveFile } from '../types';

interface VideoTableProps {
  videos: DriveFile[];
  onToggleSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onUpdateProposedName: (id: string, name: string) => void;
  onAnalyzeSingle: (file: DriveFile) => void;
  onRenameSingle: (file: DriveFile) => void;
  isProcessing: boolean;
}

export const VideoTable: React.FC<VideoTableProps> = ({
  videos,
  onToggleSelectAll,
  onToggleSelect,
  onUpdateProposedName,
  onAnalyzeSingle,
  onRenameSingle,
  isProcessing,
}) => {
  const allSelected = videos.length > 0 && videos.every(v => v.selected);
  const someSelected = videos.some(v => v.selected);

  if (videos.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center border border-slate-800 my-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20 shadow-inner">
          <FileVideo className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-200 mb-1">
          Không tìm thấy video nào trong thư mục này
        </h3>
        <p className="text-xs text-slate-400 max-w-md mb-4">
          Hãy chọn một thư mục khác trên Google Drive hoặc tải thêm video lên thư mục của bạn rồi bấm nút làm mới.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex-1 flex flex-col min-h-0">
      <div className="overflow-x-auto flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-10 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="py-4 px-3 min-w-[280px]">Tệp Video Gốc</th>
              <th className="py-4 px-3 w-40">Thời Lượng / Dung Lượng</th>
              <th className="py-4 px-3 min-w-[340px]">Tên Đề Xuất Bởi Gemini AI</th>
              <th className="py-4 px-3 w-36 text-center">Trạng Thái</th>
              <th className="py-4 px-4 w-36 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {videos.map((file) => {
              const isRenamed = file.status === 'renamed';
              const isAnalyzing = file.status === 'analyzing';
              const isRenaming = file.status === 'renaming';
              const isReady = file.status === 'ready';
              const isError = file.status === 'error';

              return (
                <tr 
                  key={file.id} 
                  className={`hover:bg-slate-800/30 transition-colors ${
                    file.selected ? 'bg-indigo-950/10' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="p-4 text-center">
                    <input
                      type="checkbox"
                      checked={!!file.selected}
                      onChange={() => onToggleSelect(file.id)}
                      disabled={isRenamed || isAnalyzing || isRenaming}
                      className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </td>

                  {/* Original Video Info */}
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-3">
                      {file.thumbnailLink ? (
                        <img
                          src={file.thumbnailLink}
                          alt="thumb"
                          className="w-12 h-9 object-cover rounded-lg border border-slate-700 shadow-sm flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 flex-shrink-0">
                          <FileVideo className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-slate-200 truncate max-w-[260px]" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {file.modifiedTime ? `Sửa đổi: ${file.modifiedTime}` : file.mimeType}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Duration & Size */}
                  <td className="py-4 px-3 text-slate-300">
                    <div className="flex flex-col gap-1 text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{file.duration || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                        <span>{file.size || 'N/A'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Proposed AI Name & Summary */}
                  <td className="py-4 px-3">
                    {isReady || isRenamed ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            value={file.proposedName || ''}
                            onChange={(e) => onUpdateProposedName(file.id, e.target.value)}
                            disabled={isRenamed || isRenaming}
                            className={`w-full bg-slate-900/80 border rounded-lg px-3 py-1.5 text-xs font-mono font-medium focus:outline-none transition-colors ${
                              isRenamed
                                ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/20'
                                : 'border-indigo-500/50 text-indigo-200 focus:border-indigo-400'
                            }`}
                          />
                          {!isRenamed && (
                            <Edit3 className="w-3.5 h-3.5 absolute right-2.5 text-slate-500 pointer-events-none" />
                          )}
                        </div>
                        {file.summary && (
                          <div className="flex items-start gap-1.5 text-[11px] text-slate-400 bg-slate-900/40 p-1.5 rounded border border-slate-800">
                            <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{file.summary}</span>
                          </div>
                        )}
                      </div>
                    ) : isAnalyzing ? (
                      <div className="flex items-center gap-2 text-indigo-400 py-1.5">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Đang phân tích nội dung video...</span>
                      </div>
                    ) : (
                      <div className="text-slate-500 italic text-xs py-1.5">
                        Chưa quét. Bấm "Phân tích AI" để sinh tên.
                      </div>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-3 text-center">
                    {isRenamed && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Đã đổi tên
                      </span>
                    )}
                    {isReady && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        Sẵn sàng đổi
                      </span>
                    )}
                    {isAnalyzing && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                        <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                        Đang quét
                      </span>
                    )}
                    {isRenaming && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                        Đang cập nhật
                      </span>
                    )}
                    {isError && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30" title={file.errorMsg}>
                        <AlertCircle className="w-3 h-3 text-rose-400" />
                        Lỗi
                      </span>
                    )}
                    {file.status === 'idle' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        Chưa xử lý
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isRenaming ? (
                        <button
                          disabled
                          title="Đang đổi tên trên Google Drive..."
                          className="p-2 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/40 cursor-wait"
                        >
                          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        </button>
                      ) : isReady ? (
                        <button
                          onClick={() => onRenameSingle(file)}
                          title="Đổi tên ngay trên Google Drive"
                          className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm shadow-emerald-950/40"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : !isRenamed ? (
                        <button
                          onClick={() => onAnalyzeSingle(file)}
                          disabled={isAnalyzing}
                          title="Phân tích và sinh tên bằng AI"
                          className="p-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isAnalyzing ? (
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                        </button>
                      ) : null}

                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Mở trên Google Drive"
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
