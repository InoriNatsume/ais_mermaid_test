import React, { useState, useCallback, useEffect } from 'react';
import { Split, Play, Bug, Wand2, Code2, LayoutTemplate } from 'lucide-react';
import MermaidRenderer from './components/MermaidRenderer';
import Console from './components/Console';
import { generateMermaidCode, fixMermaidCode, isAIEnabled } from './services/gemini';
import { LogEntry, LogLevel, ViewMode, DiagramType } from './types';

// Initial sample code
const INITIAL_CODE = `graph TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]
    D -- Manual Fix --> C`;

const DIAGRAM_TYPES: DiagramType[] = [
  'Auto',
  'Flowchart',
  'Sequence',
  'Class',
  'State',
  'ER Relationship',
  'Gantt',
  'User Journey',
  'Mindmap',
  'Pie',
  'Gitgraph'
];

const App: React.FC = () => {
  const [code, setCode] = useState<string>(INITIAL_CODE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.SPLIT);
  const [prompt, setPrompt] = useState("");
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [selectedDiagramType, setSelectedDiagramType] = useState<DiagramType>('Auto');

  const addLog = useCallback((level: LogLevel, message: string, details?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date(),
      level,
      message,
      details
    }]);
  }, []);

  // Initial log to indicate mode
  useEffect(() => {
    if (!isAIEnabled) {
      addLog(LogLevel.INFO, "System Ready (Offline Mode)", "AI features are disabled because no API Key was found. Editor is fully functional.");
    } else {
      addLog(LogLevel.INFO, "System Ready", "AI features are enabled.");
    }
  }, [addLog]);

  const handleMermaidError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    addLog(LogLevel.ERROR, "Rendering Failed", errorMsg);
  }, [addLog]);

  const handleMermaidSuccess = useCallback(() => {
    if (error) {
      setError(null);
      addLog(LogLevel.SUCCESS, "Diagram Rendered Successfully");
    }
  }, [error, addLog]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsProcessing(true);
    addLog(LogLevel.INFO, "AI Generating Diagram...", `Type: ${selectedDiagramType}\nPrompt: ${prompt}`);
    
    try {
      const newCode = await generateMermaidCode(prompt, selectedDiagramType);
      setCode(newCode);
      addLog(LogLevel.SUCCESS, "Generation Complete");
      setShowPromptInput(false);
      setPrompt("");
    } catch (e: any) {
      addLog(LogLevel.ERROR, "Generation Failed", e.message || "Unknown error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFix = async () => {
    if (!error) return;
    setIsProcessing(true);
    addLog(LogLevel.INFO, "AI Attempting to Fix Syntax...", `Error context: ${error.substring(0, 100)}...`);

    try {
      const fixedCode = await fixMermaidCode(code, error);
      setCode(fixedCode);
      addLog(LogLevel.SUCCESS, "Fix Applied", "The AI has updated the code. Verifying render...");
    } catch (e: any) {
      addLog(LogLevel.ERROR, "Fix Failed", e.message || "Unknown error");
    } finally {
      setIsProcessing(false);
    }
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm z-20">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg text-white ${isAIEnabled ? 'bg-indigo-600' : 'bg-slate-600'}`}>
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">Mermaid Studio</h1>
            <p className="text-xs text-slate-500">
              {isAIEnabled ? 'AI-Powered Diagram Editor' : 'Visual Diagram Editor'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
           {/* View Modes */}
           <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 hidden sm:flex">
            <button 
              onClick={() => setViewMode(ViewMode.EDITOR)}
              className={`p-1.5 rounded ${viewMode === ViewMode.EDITOR ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Editor Only"
            >
              <Code2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode(ViewMode.SPLIT)}
              className={`p-1.5 rounded ${viewMode === ViewMode.SPLIT ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Split View"
            >
              <Split className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode(ViewMode.PREVIEW)}
              className={`p-1.5 rounded ${viewMode === ViewMode.PREVIEW ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              title="Preview Only"
            >
              <Play className="w-4 h-4" />
            </button>
          </div>

          {isAIEnabled && (
            <>
              <button
                onClick={() => setShowPromptInput(!showPromptInput)}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors font-medium text-sm border border-indigo-200"
                disabled={isProcessing}
              >
                <Wand2 className="w-4 h-4" />
                <span>Generate</span>
              </button>
              
              <button
                onClick={handleFix}
                disabled={!error || isProcessing}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm border ${
                  error 
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' 
                    : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
              >
                <Bug className="w-4 h-4" />
                <span>Fix with AI</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* AI Prompt Input Overlay */}
      {showPromptInput && isAIEnabled && (
        <div className="bg-white border-b border-indigo-100 p-4 animate-in slide-in-from-top-2">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3">
             <select
                value={selectedDiagramType}
                onChange={(e) => setSelectedDiagramType(e.target.value as DiagramType)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm bg-white text-sm min-w-[140px]"
                disabled={isProcessing}
             >
                {DIAGRAM_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
             </select>
             <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the diagram (e.g., 'User login process', 'Class diagram for School')..."
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                disabled={isProcessing}
             />
             <button 
                onClick={handleGenerate}
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 shrink-0"
             >
                {isProcessing ? 'Thinking...' : 'Create'}
             </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Editor Pane */}
        {(viewMode === ViewMode.EDITOR || viewMode === ViewMode.SPLIT) && (
          <div className={`${viewMode === ViewMode.SPLIT ? 'w-1/2' : 'w-full'} flex flex-col border-r border-slate-200 bg-slate-900 transition-all duration-300`}>
             <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 text-slate-400 text-xs font-mono">
                <span>CODE</span>
                <span>MERMAID SYNTAX</span>
             </div>
             <textarea
              className="flex-1 w-full bg-slate-900 text-slate-200 p-4 font-mono text-sm resize-none focus:outline-none leading-6"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
             />
          </div>
        )}

        {/* Preview Pane */}
        {(viewMode === ViewMode.PREVIEW || viewMode === ViewMode.SPLIT) && (
          <div className={`${viewMode === ViewMode.SPLIT ? 'w-1/2' : 'w-full'} relative bg-white transition-all duration-300`}>
            <MermaidRenderer 
              code={code} 
              onError={handleMermaidError} 
              onSuccess={handleMermaidSuccess}
            />
            
            {/* Error Toast Overlay */}
            {error && (
              <div className="absolute bottom-4 left-4 right-4 bg-red-50 border border-red-200 p-3 rounded-lg shadow-lg flex items-start gap-3 animate-in slide-in-from-bottom-2">
                <Bug className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800">Syntax Error Detected</h3>
                  <p className="text-xs text-red-600 mt-1 font-mono break-all">{error.substring(0, 150)}{error.length > 150 ? '...' : ''}</p>
                </div>
                {isAIEnabled ? (
                  <button 
                    onClick={handleFix}
                    className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-medium rounded transition-colors"
                  >
                    Auto-Fix
                  </button>
                ) : (
                   <span className="text-xs text-red-400 italic">Check syntax manually</span>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Console */}
      <div className="h-48 shrink-0">
        <Console logs={logs} onClear={clearLogs} />
      </div>
    </div>
  );
};

export default App;