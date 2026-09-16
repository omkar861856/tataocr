import React, { useRef } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Sparkles, ShieldCheck, Zap } from 'lucide-react';

const SAMPLE_DOCS = [
  {
    id: 'invoice',
    name: 'TechCorp_Invoice_2026.png',
    type: 'Invoice / Billing',
    size: '420 KB',
    description: 'Structured corporate invoice with line items, tax breakdowns & vendor details.',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
    markdown: `# INVOICE: INV-2026-8891\n**Vendor**: TechCorp Global Solutions Inc.\n**Date**: September 15, 2026\n**Due Date**: October 15, 2026\n\n### Line Items\n| Item Description | Qty | Unit Price | Total |\n| :--- | :---: | :---: | :---: |\n| Enterprise GPU Cloud Compute (RTX 4090 - 120 hrs) | 120 | $0.42 | $50.40 |\n| Neural OCR Layout Processing Pipeline | 1 | $150.00 | $150.00 |\n| High-Density Vector Storage (50GB) | 1 | $25.00 | $25.00 |\n\n**Subtotal**: $225.40\n**Tax (8.25%)**: $18.60\n**Total Due**: **$244.00 USD**`,
    json: {
      document_type: "invoice",
      invoice_number: "INV-2026-8891",
      vendor: "TechCorp Global Solutions Inc.",
      total_amount: 244.00,
      currency: "USD",
      line_items_count: 3,
      regions: [
        { label: "Header", box: [40, 30, 750, 120], confidence: 0.98 },
        { label: "Table", box: [40, 150, 750, 320], confidence: 0.96 },
        { label: "Summary", box: [450, 480, 750, 580], confidence: 0.99 }
      ]
    }
  },
  {
    id: 'spec',
    name: 'PaddleOCR_VL_Specs.png',
    type: 'Technical Documentation',
    size: '610 KB',
    description: 'Multi-column technical document with diagram labels and formatted text.',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    markdown: `# PaddleOCR-VL Architectural Overview\n\n## 1. System Pipeline\nPaddleOCR-VL integrates **Vision-Language Multimodal Transformers** with Layout Analysis models to directly output clean **Markdown** structure and **JSON Bounding Coordinates**.\n\n### Key Capabilities\n- **Complex Layout Recovery**: Preserves multi-column flow, headers, and footers.\n- **Table Structure Extraction**: Converts messy HTML/PDF tables directly into GFM Markdown.\n- **High Precision OCR**: Sub-pixel text detection powered by PaddlePaddle GPU acceleration.`,
    json: {
      document_type: "technical_spec",
      title: "PaddleOCR-VL Architectural Overview",
      sections: ["System Pipeline", "Key Capabilities"],
      regions: [
        { label: "Title Header", box: [30, 20, 720, 90], confidence: 0.99 },
        { label: "Paragraph", box: [30, 110, 720, 220], confidence: 0.97 },
        { label: "Bullet List", box: [30, 240, 720, 410], confidence: 0.95 }
      ]
    }
  }
];

export default function UploadDropzone({ onFileSelect, onSampleSelect, isProcessing }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium mb-4">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          <span>Curiosity localOCR • Gemma 4 Multimodal Vision Enabled</span>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight mb-2">
          Intelligent Document Vision & Extraction
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
          Upload any document (Invoice, Form, Receipt, Spec Sheet). localOCR with Gemma 4 Vision transcribes layouts, extracts structured key-value fields, and provides instant document intelligence.
        </p>
      </div>

      {/* Dropzone Card */}
      <div 
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative group rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer p-8 text-center bg-slate-900/60 backdrop-blur-sm ${
          isProcessing 
            ? 'border-emerald-500/50 bg-slate-900/90 pointer-events-none' 
            : 'border-slate-700/80 hover:border-emerald-500/80 hover:bg-slate-800/40 hover:shadow-xl hover:shadow-emerald-500/5'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*,.pdf" 
          className="hidden" 
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <UploadCloud className="h-8 w-8 text-emerald-400" />
          </div>

          <div>
            <p className="text-base font-semibold text-slate-200">
              {isProcessing ? 'Processing Document with Gemma 4 Vision...' : 'Drop document image here or click to browse'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports PNG, JPG, JPEG, WebP, PDF (Max 25MB)
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs text-slate-500 pt-2 border-t border-slate-800/80 w-full max-w-xs justify-center">
            <span className="flex items-center space-x-1">
              <Zap className="h-3 w-3 text-amber-400" />
              <span>Sub-second OCR</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span>Layout Preserved</span>
            </span>
          </div>
        </div>
      </div>

      {/* Preset Sample Documents */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Or test with sample documents
          </span>
          <span className="text-xs text-slate-500">1-click demo evaluation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE_DOCS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => onSampleSelect(sample)}
              className="group p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/50 transition-all duration-200 cursor-pointer flex items-center space-x-4"
            >
              <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-800 border border-slate-700/60 flex-shrink-0 relative">
                <img src={sample.image} alt={sample.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-200 truncate group-hover:text-indigo-300 transition-colors">
                    {sample.name}
                  </h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                    {sample.type}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">{sample.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
