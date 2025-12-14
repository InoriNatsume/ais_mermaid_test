import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react';

interface MermaidRendererProps {
  code: string;
  onError: (errorMsg: string) => void;
  onSuccess: () => void;
}

const MermaidRenderer: React.FC<MermaidRendererProps> = ({ code, onError, onSuccess }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  
  // Pan and Zoom State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Initialize mermaid configuration
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
      logLevel: 5
    });
  }, []);

  // Render Diagram
  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      if (!code.trim()) return;

      try {
        await mermaid.parse(code);
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        
        if (isMounted) {
          // Remove default max-width which restricts large diagrams
          const cleanedSvg = svg.replace(/max-width:\s*[^;"]+;/g, '');
          setSvgContent(cleanedSvg);
          onSuccess();
          // Reset view on new render
          setPan({ x: 0, y: 0 });
          setScale(1);
        }
      } catch (error: any) {
        if (isMounted) {
          console.error("Mermaid Render Error", error);
          let message = "Unknown rendering error";
          if (typeof error === 'string') message = error;
          else if (error instanceof Error) message = error.message;
          else if (error?.str) message = error.str;
          onError(message);
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [code, onError, onSuccess]);

  // Event Handlers for Pan & Zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Zoom towards cursor could be implemented here, 
    // but simple zoom is often sufficient and less buggy for quick implementation.
    // For now, let's just zoom in/out centered or based on delta.
    const zoomSensitivity = 0.001;
    const delta = -e.deltaY * zoomSensitivity;
    const newScale = Math.min(Math.max(0.1, scale + delta), 5);
    setScale(newScale);
  };

  const zoomIn = () => setScale(s => Math.min(5, s * 1.2));
  const zoomOut = () => setScale(s => Math.max(0.1, s / 1.2));
  const resetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-full bg-white flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex space-x-2 bg-white/90 backdrop-blur shadow-sm border border-slate-200 rounded-lg p-1">
        <button 
          onClick={zoomOut}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-500 font-mono py-1.5 px-1 min-w-[3rem] text-center select-none">
          {Math.round(scale * 100)}%
        </span>
        <button 
          onClick={zoomIn}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="w-px bg-slate-200 mx-1" />
        <button 
          onClick={resetView}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition-colors"
          title="Reset View"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas Area */}
      <div 
        className={`flex-1 overflow-hidden relative bg-slate-50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {svgContent ? (
          <div 
            ref={containerRef}
            className="absolute top-0 left-0 origin-top-left transition-transform duration-75 ease-linear will-change-transform"
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
              // Add some padding behavior effectively by starting slightly offset if desired, 
              // but (0,0) is best for predictability.
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }} 
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-slate-400 text-sm animate-pulse">Rendering diagram...</div>
          </div>
        )}
        
        {/* Helper Hint */}
        <div className="absolute bottom-4 right-4 pointer-events-none opacity-50 text-[10px] text-slate-400 select-none">
          Drag to pan • Scroll to zoom
        </div>
      </div>
    </div>
  );
};

export default MermaidRenderer;