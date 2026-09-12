import React from 'react';
import { X, KeyRound, ExternalLink, Sparkles, ShieldCheck, Check } from 'lucide-react';
import { ApiConfig } from '../types';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ApiConfig;
  onSave: (config: ApiConfig) => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [formData, setFormData] = React.useState<ApiConfig>(config);

  React.useEffect(() => {
    setFormData(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cấu Hình API & Kết Nối</h2>
              <p className="text-xs text-slate-400">Thiết lập Google Cloud OAuth 2.0 và Google Gemini API Key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Demo Mode Switch Alert */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <input
              type="checkbox"
              id="demoModeCheck"
              checked={formData.isDemoMode}
              onChange={(e) => setFormData({ ...formData, isDemoMode: e.target.checked })}
              className="mt-0.5 rounded border-amber-600 bg-slate-900 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="demoModeCheck" className="cursor-pointer">
              <div className="font-semibold text-amber-300">Bật Chế Độ Thử Nghiệm (Sandbox Demo Mode)</div>
              <p className="text-[11px] text-amber-200/70 mt-0.5">
                Cho phép bạn trải nghiệm đầy đủ giao diện, quét thư mục mẫu và sinh tên video giả lập thông minh ngay lập tức mà chưa cần nhập API Key hay Client ID.
              </p>
            </label>
          </div>

          {/* Gemini AI Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Google Gemini API Key</span>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Lấy key tại Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <input
              type="password"
              placeholder="AIzaSy..."
              value={formData.geminiApiKey}
              onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            />

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Mô hình Gemini (Model)
              </label>
              <select
                value={formData.geminiModel}
                onChange={(e) => setFormData({ ...formData, geminiModel: e.target.value })}
                className="w-full bg-slate-900 text-slate-200 border border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-cyan-500"
              >
                <option value="gemini-3.7-flash">Gemini 3.7 Flash (Mới nhất - Cực nhanh & Thông minh)</option>
                <option value="gemini-3.6-flash">Gemini 3.6 Flash (Tốc độ cao & Tiết kiệm)</option>
              </select>
            </div>
          </div>

          {/* Google Cloud OAuth 2.0 Settings */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Google Cloud OAuth 2.0 Client</span>
              </div>
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Google Cloud Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Client ID
              </label>
              <input
                type="text"
                placeholder="xxxxxx.apps.googleusercontent.com"
                value={formData.googleClientId}
                onChange={(e) => setFormData({ ...formData, googleClientId: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Client Secret
              </label>
              <input
                type="password"
                placeholder="GOCSPX-xxxxxx"
                value={formData.googleClientSecret}
                onChange={(e) => setFormData({ ...formData, googleClientSecret: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(formData);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Áp Dụng Cấu Hình</span>
          </button>
        </div>
      </div>
    </div>
  );
};
