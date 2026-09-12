import React from 'react';
import { X, Settings, Sparkles, Check } from 'lucide-react';
import { RenameConfig } from '../types';

interface RenameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: RenameConfig;
  onSave: (config: RenameConfig) => void;
}

export const RenameSettingsModal: React.FC<RenameSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [formData, setFormData] = React.useState<RenameConfig>(config);

  React.useEffect(() => {
    setFormData(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  // Generate live sample preview based on current settings
  const generatePreview = () => {
    let indexPrefix = '';
    if (formData.includeIndex) {
      if (formData.indexFormat === '01.') indexPrefix = '01. ';
      else if (formData.indexFormat === '1 -') indexPrefix = '1 - ';
      else if (formData.indexFormat === '[1]') indexPrefix = '[1] ';
      else indexPrefix = '1. ';
    }

    let prefix = formData.prefix ? `${formData.prefix}_` : '';
    let dateStr = formData.includeDate ? '2026-09-13_' : '';
    let topic = 'danh_cau_don_nam';

    if (formData.language === 'en') {
      topic = 'men_singles_badminton_match';
    } else if (formData.language === 'vi_no_accent') {
      topic = 'danh_cau_don_nam';
    } else {
      topic = 'đánh_cầu_đơn_nam';
    }

    let full = `${prefix}${dateStr}${topic}`;

    if (formData.caseStyle === 'kebab-case') {
      full = full.replace(/_/g, '-').toLowerCase();
    } else if (formData.caseStyle === 'Readable Space') {
      full = full.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    } else if (formData.caseStyle === 'lowercase') {
      full = full.replace(/_/g, ' ').toLowerCase();
    } else if (formData.caseStyle === 'CamelCase') {
      full = full.split(/_|-|\s/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
    }

    return `${indexPrefix}${full}.mp4`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Quy Tắc Đặt Tên Video</h2>
              <p className="text-xs text-slate-400">Tùy biến cách AI sinh tên & đánh số thứ tự cho tệp video</p>
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
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Live Preview Box */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-300 uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Xem trước mẫu tên file (Live Preview)</span>
            </div>
            <div className="font-mono text-sm text-cyan-200 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 break-all select-all font-semibold">
              {generatePreview()}
            </div>
          </div>

          {/* Context Hint / Topic Suggestion */}
          <div>
            <label className="block text-slate-200 font-semibold mb-1.5">
              Gợi ý chủ đề / Ngữ cảnh video cho AI (Context Hint)
            </label>
            <input
              type="text"
              placeholder="VD: Video đánh cầu lông (đơn nam, đôi nam), Vlog du lịch..."
              value={formData.contextHint || ''}
              onChange={(e) => setFormData({ ...formData, contextHint: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              AI sẽ dựa vào gợi ý này + hình ảnh video để nhận diện chuẩn xác từng hành động (đánh đơn, đánh đôi...).
            </p>
          </div>

          {/* Numbering / Index Setting */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.includeIndex ?? true}
                onChange={(e) => setFormData({ ...formData, includeIndex: e.target.checked })}
                className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <div>
                <div className="font-semibold text-slate-200">Đánh số thứ tự tự động (1., 2., 3...)</div>
                <div className="text-[11px] text-slate-400">Tự động gắn số thứ tự theo danh sách video trong thư mục</div>
              </div>
            </label>

            {formData.includeIndex && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                <span className="text-slate-400 text-[11px] font-medium">Định dạng số:</span>
                {(['1.', '01.', '1 -', '[1]'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setFormData({ ...formData, indexFormat: fmt })}
                    className={`px-3 py-1 rounded-lg border font-mono text-xs font-semibold transition-all ${
                      formData.indexFormat === fmt
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Ngôn ngữ tên tệp
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'vi', label: 'Tiếng Việt có dấu' },
                { id: 'vi_no_accent', label: 'Tiếng Việt không dấu' },
                { id: 'en', label: 'Tiếng Anh (English)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, language: item.id as any })}
                  className={`p-2.5 rounded-xl border font-medium text-center transition-all ${
                    formData.language === item.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Case Style */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Kiểu định dạng chữ (Case Style)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'lowercase', label: 'chữ thường tự nhiên (VD: đánh cầu đơn nam)' },
                { id: 'Readable Space', label: 'Chữ Hoa Đầu Từ (VD: Đánh Cầu Đơn Nam)' },
                { id: 'snake_case', label: 'snake_case (VD: danh_cau_don_nam)' },
                { id: 'kebab-case', label: 'kebab-case (VD: danh-cau-don-nam)' },
              ].map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, caseStyle: style.id as any })}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-all ${
                    formData.caseStyle === style.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prefix & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Tiền tố tùy chỉnh (Prefix)
              </label>
              <input
                type="text"
                placeholder="VD: CAU_LONG hoặc BIEU_DIEN"
                value={formData.prefix}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1.5">
                Số từ tối đa trong tên
              </label>
              <input
                type="number"
                min={3}
                max={15}
                value={formData.maxWords}
                onChange={(e) => setFormData({ ...formData, maxWords: parseInt(e.target.value) || 8 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Include Date Checkbox */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
            <input
              type="checkbox"
              checked={formData.includeDate}
              onChange={(e) => setFormData({ ...formData, includeDate: e.target.checked })}
              className="rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <div>
              <div className="font-semibold text-slate-200">Gắn ngày tháng vào tên file</div>
              <div className="text-[11px] text-slate-400">Gắn thêm ngày tháng [YYYY-MM-DD] vào tên nếu cần lưu trữ theo ngày</div>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(formData);
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>Lưu Quy Tắc</span>
          </button>
        </div>
      </div>
    </div>
  );
};
