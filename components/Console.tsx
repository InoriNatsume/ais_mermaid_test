import React, { useEffect, useRef } from 'react';
import { LogEntry, LogLevel } from '../types';
import { Terminal, AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface ConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
}

const Console: React.FC<ConsoleProps> = ({ logs, onClear }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getIcon = (level: LogLevel) => {
    switch (level) {
      case LogLevel.INFO: return <Info className="w-4 h-4 text-blue-400" />;
      case LogLevel.SUCCESS: return <CheckCircle className="w-4 h-4 text-green-400" />;
      case LogLevel.WARNING: return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case LogLevel.ERROR: return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.INFO: return 'text-slate-300';
      case LogLevel.SUCCESS: return 'text-green-300';
      case LogLevel.WARNING: return 'text-yellow-300';
      case LogLevel.ERROR: return 'text-red-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-t border-slate-700 shadow-xl">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Debug Console</span>
        </div>
        <button 
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-700 transition-colors"
        >
          Clear
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-3">
        {logs.length === 0 && (
          <div className="text-slate-500 italic text-center mt-4">No logs available. Ready for processing.</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="group animate-in fade-in slide-in-from-bottom-1 duration-200">
            <div className="flex items-start space-x-2">
              <span className="mt-0.5 opacity-70">{getIcon(log.level)}</span>
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <span className={`${getColor(log.level)} font-medium break-all`}>
                    {log.message}
                  </span>
                  <span className="text-[10px] text-slate-600 shrink-0 ml-2 select-none">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                {log.details && (
                  <pre className="mt-1 p-2 bg-black/30 rounded border border-slate-800 text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap break-words">
                    {log.details}
                  </pre>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default Console;