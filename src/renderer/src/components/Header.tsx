import React from 'react';
import { 
  Sparkles, 
  Settings2, 
  KeyRound, 
  CloudCheck, 
  CloudOff, 
  PlayCircle, 
  Layers,
  RotateCcw
} from 'lucide-react';
import { ApiConfig } from '../types';

interface HeaderProps {
  apiConfig: ApiConfig;
  isDriveAuth: boolean;
  onOpenApiConfig: () => void;
  onOpenRenameSettings: () => void;
  onOpenRenamedList: () => void;
  renamedCount: number;
  onToggleDemoMode: () => void;
  onLoginGoogle: () => void;
  onRestartApp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiConfig,
  isDriveAuth,
  onOpenApiConfig,
  onOpenRenameSettings,
  onOpenRenamedList,
  renamedCount,
  onToggleDemoMode,
  onLoginGoogle,
  onRestartApp,
}) => {
  return (
    <header className="glass-panel sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b border-slate-800/80">
      {/* Logo & App Info */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse-slow" />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">
              DriveAI Video Renamer
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              v1.0 Pro
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Quét & Tự động đổi tên video thông minh trên Google Drive bằng Gemini
          </p>
        </div>
      </div>

      {/* Center / Status Badges */}
      <div className="flex items-center gap-3">
        {/* Demo Mode Badge */}
        <button
          onClick={onToggleDemoMode}
          title="Bật/Tắt chế độ Demo (chạy thử nghiệm dữ liệu mẫu không cần API)"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
            apiConfig.isDemoMode
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
              : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          {apiConfig.isDemoMode ? 'Chế độ Demo (Bật)' : 'Chế độ Trực Tiếp'}
        </button>

        {/* Google Drive Status */}
        {apiConfig.isDemoMode ? (
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Drive Sandbox</span>
          </div>
        ) : isDriveAuth ? (
          <div className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Drive Đã Kết Nối</span>
          </div>
        ) : (
          <button
            onClick={onLoginGoogle}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 flex items-center gap-1.5 transition-all"
          >
            <CloudOff className="w-3.5 h-3.5 text-rose-400" />
            <span>Đăng Nhập Google</span>
          </button>
        )}

        {/* Gemini Status */}
        <div className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border ${
          apiConfig.isDemoMode || apiConfig.geminiApiKey
            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        }`}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>{apiConfig.isDemoMode ? 'Gemini 2.0 Flash (Sandbox)' : (apiConfig.geminiApiKey ? 'Gemini AI Sẵn Sàng' : 'Chưa có API Key')}</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Renamed List & Copy Hub Button */}
        <button
          onClick={onOpenRenamedList}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-500/40 flex items-center gap-2 transition-all shadow-sm"
          title="Xem và sao chép toàn bộ danh sách tên video đã xử lý"
        >
          <span className="font-mono text-xs">📋</span>
          <span>Danh Sách Tên</span>
          {renamedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-500/30 text-cyan-200 font-bold">
              {renamedCount}
            </span>
          )}
        </button>

        <button
          onClick={onOpenRenameSettings}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all hover:border-slate-600 shadow-sm"
        >
          <Settings2 className="w-4 h-4 text-indigo-400" />
          <span>Quy Tắc Đổi Tên</span>
        </button>

        <button
          onClick={onOpenApiConfig}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md shadow-indigo-600/20 border border-indigo-400/30 flex items-center gap-2 transition-all"
        >
          <KeyRound className="w-4 h-4" />
          <span>Cấu Hình API</span>
        </button>

        {onRestartApp && (
          <button
            onClick={onRestartApp}
            title="Khởi động lại ứng dụng"
            className="p-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Khởi Động Lại</span>
          </button>
        )}
      </div>
    </header>
  );
};
