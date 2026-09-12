import React from 'react';
import { Terminal, ChevronUp, ChevronDown, Trash2, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { LogEntry } from '../types';

interface ProcessLogsProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const ProcessLogs: React.FC<ProcessLogsProps> = ({ logs, onClearLogs }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  const lastLog = logs[logs.length - 1];

  return (
    <div className="glass-panel border-t border-slate-800 transition-all duration-300">
      {/* Bottom Bar Header */}
      <div className="px-6 py-2.5 flex items-center justify-between text-xs cursor-pointer select-none" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Terminal className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span className="font-semibold text-slate-300">Nhật Ký Tiến Trình ({logs.length})</span>
          {lastLog && (
            <span className="text-slate-500 truncate max-w-md hidden sm:inline text-[11px]">
              - {lastLog.timestamp}: {lastLog.message}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isOpen && logs.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearLogs();
              }}
              title="Xóa nhật ký"
              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="p-1 rounded text-slate-400 hover:text-white">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Expanded Logs Content */}
      {isOpen && (
        <div
          ref={logContainerRef}
          className="p-4 max-h-48 overflow-y-auto space-y-1.5 font-mono text-[11px] bg-slate-950/70 border-t border-slate-800/80"
        >
          {logs.length === 0 ? (
            <div className="text-slate-600 italic">Chưa có nhật ký hoạt động.</div>
          ) : (
            logs.map((log) => {
              const icons = {
                info: <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />,
                success: <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />,
                warning: <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />,
                error: <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />,
              };

              const colors = {
                info: 'text-slate-300',
                success: 'text-emerald-300',
                warning: 'text-amber-300',
                error: 'text-rose-300 font-semibold',
              };

              return (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                  {icons[log.type]}
                  <span className={colors[log.type]}>{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
