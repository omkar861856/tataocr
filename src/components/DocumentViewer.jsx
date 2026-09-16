import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { 
  Eye, Code, Copy, Download, ZoomIn, ZoomOut, RotateCcw, 
  Layers, Check, FileCode, CheckCircle2, ChevronRight 
} from 'lucide-react';

export default function DocumentViewer({ documentData, activeImage }) {
  const [activeTab, setActiveTab] = useState('markdown'); // 'markdown' | 'json'
  const [showBoxes, setShowBoxes] = useState(true);
  const [rawMarkdown, setRawMarkdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const canvasRef = useRef(null);

  const markdownContent = documentData?.markdown || '# No markdown extracted';
  const jsonContent = documentData?.json || {};
  const regions = jsonContent?.regions || [];

  // Render HTML from Markdown
  const renderedHtml = React.useMemo(() => {
    try {
      return marked.parse(markdownContent);
    } catch (err) {
      return `<pre class="text-rose-400">${markdownContent}</pre>`;
    }
  }, [markdownContent]);

  // Handle Draw Bounding Boxes on Canvas
  useEffect(() => {
    if (!activeImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = activeImage;

    img.onload = () => {
      canvas.width = img.naturalWidth || 800;
      canvas.height = img.naturalHeight || 1000;

      // Draw background image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Overlay bounding boxes if enabled
      if (showBoxes && regions.length > 0) {
        regions.forEach((reg, index) => {
          const [x1, y1, x2, y2] = reg.box || [0, 0, 100, 100];
          const width = x2 - x1;
          const height = y2 - y1;

          // Box Stroke Colors
          const colors = [
            { border: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)', text: '#c7d2fe' }, // Indigo
            { border: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', text: '#a7f3d0' },  // Emerald
            { border: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', text: '#e9d5ff' }, // Purple
            { border: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', text: '#bae6fd' }   // Cyan
          ];
          const theme = colors[index % colors.length];

          // Draw Fill
          ctx.fillStyle = theme.bg;
          ctx.fillRect(x1, y1, width, height);

          // Draw Border
          ctx.strokeStyle = theme.border;
          ctx.lineWidth = Math.max(2, Math.floor(canvas.width / 400));
          ctx.strokeRect(x1, y1, width, height);

          // Draw Label Tag
          ctx.fillStyle = theme.border;
          const fontSize = Math.max(12, Math.floor(canvas.width / 50));
          ctx.font = `bold ${fontSize}px sans-serif`;
          const text = `${reg.label || 'Region'} (${Math.round((reg.confidence || 0.95) * 100)}%)`;
          const textWidth = ctx.measureText(text).width;

          ctx.fillRect(x1, Math.max(0, y1 - fontSize - 6), textWidth + 12, fontSize + 6);
          ctx.fillStyle = '#0f172a';
          ctx.fillText(text, x1 + 6, Math.max(fontSize, y1 - 4));
        });
      }
    };
  }, [activeImage, showBoxes, regions]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (filename, content, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-[calc(100vh-80px)] min-h-[700px]">
      {/* Left Pane: Document Canvas & Layout Overlay */}
      <div className="flex flex-col bg-slate-900/70 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-200">Document Layout Canvas</span>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
              PaddleOCR-VL Annotated
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBoxes(!showBoxes)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors border ${
                showBoxes 
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                  : 'bg-slate-800 text-slate-400 border-slate-700/50 hover:text-slate-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Bounding Boxes ({regions.length})</span>
            </button>

            <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/50">
              <button 
                onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.2))} 
                className="p-1 hover:text-indigo-400 text-slate-400"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 px-1">{Math.round(zoomLevel * 100)}%</span>
              <button 
                onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))} 
                className="p-1 hover:text-indigo-400 text-slate-400"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => setZoomLevel(1)} 
                className="p-1 hover:text-indigo-400 text-slate-400 border-l border-slate-700 ml-0.5"
                title="Reset Zoom"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Canvas Display Container */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950/40 relative">
          <div 
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }} 
            className="transition-transform duration-150 max-w-full"
          >
            <canvas ref={canvasRef} className="rounded-lg shadow-2xl border border-slate-800 max-w-full h-auto block" />
          </div>
        </div>
      </div>

      {/* Right Pane: Extracted Markdown & JSON Workspace */}
      <div className="flex flex-col bg-slate-900/70 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
        {/* Workspace Header Tabs */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('markdown')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'markdown' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Extracted Markdown</span>
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                activeTab === 'json' 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="h-3.5 w-3.5" />
              <span>Layout JSON</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {activeTab === 'markdown' && (
              <button
                onClick={() => setRawMarkdown(!rawMarkdown)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  rawMarkdown 
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                    : 'bg-slate-800 text-slate-400 border-slate-700/50 hover:text-slate-200'
                }`}
              >
                {rawMarkdown ? 'Rendered View' : 'Raw Markdown'}
              </button>
            )}

            <button
              onClick={() => handleCopy(activeTab === 'markdown' ? markdownContent : JSON.stringify(jsonContent, null, 2))}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Copy Content"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>

            <button
              onClick={() => handleDownload(
                `paddleocr_output.${activeTab === 'markdown' ? 'md' : 'json'}`,
                activeTab === 'markdown' ? markdownContent : JSON.stringify(jsonContent, null, 2),
                activeTab === 'markdown' ? 'text/markdown' : 'application/json'
              )}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Download File"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="flex-1 overflow-auto p-6 bg-slate-950/30 font-sans text-sm text-slate-200">
          {activeTab === 'markdown' ? (
            rawMarkdown ? (
              <pre className="font-mono text-xs text-indigo-200 whitespace-pre-wrap bg-slate-900/90 p-4 rounded-xl border border-slate-800 leading-relaxed overflow-x-auto">
                {markdownContent}
              </pre>
            ) : (
              <div 
                className="prose prose-invert prose-slate max-w-none prose-headings:text-slate-100 prose-headings:font-bold prose-a:text-indigo-400 prose-table:border prose-table:border-slate-800 prose-th:bg-slate-900 prose-th:text-slate-200 prose-td:border-t prose-td:border-slate-800/80"
                dangerouslySetInnerHTML={{ __html: renderedHtml }} 
              />
            )
          ) : (
            <pre className="font-mono text-xs text-emerald-300 whitespace-pre-wrap bg-slate-900/90 p-4 rounded-xl border border-slate-800 overflow-x-auto leading-relaxed">
              {JSON.stringify(jsonContent, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
