import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, RotateCcw, Plus, Trash2, Eye, EyeOff, X,
  Image as ImageIcon, ChevronUp, ChevronDown, GripVertical,
  Layout, CheckSquare, Square, FolderOpen, Tag
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PageImage = { src: string; id: number; category?: string };
type PageData = { wedding: PageImage[]; kunqu: PageImage[]; intimacy: PageImage[] };
type PageKey = keyof PageData;

type PageConfig = {
  label: string;
  labelEn: string;
  cols: number;
  folder: string;
  theme: 'light' | 'dark';
  bgColor: string;
  accent: string;
  aspects: string[];
};

const PAGE_CONFIGS: Record<PageKey, PageConfig> = {
  wedding: {
    label: '婚禮',
    labelEn: 'Wedding',
    cols: 3,
    folder: 'wedding',
    theme: 'light',
    bgColor: '#faf9f7',
    accent: 'rose',
    aspects: ['aspect-[3/4]', 'aspect-square', 'aspect-[4/5]'],
  },
  kunqu: {
    label: '崑曲',
    labelEn: 'Kunqu',
    cols: 3,
    folder: 'kunqu',
    theme: 'dark',
    bgColor: '#0a0a0a',
    accent: 'amber',
    aspects: ['aspect-[3/4]', 'aspect-[4/5]', 'aspect-square'],
  },
  intimacy: {
    label: '親密',
    labelEn: 'Intimacy',
    cols: 2,
    folder: 'intimacy',
    theme: 'light',
    bgColor: '#fdfcfa',
    accent: 'rose',
    aspects: ['aspect-[3/4]', 'aspect-square'],
  },
};

const INTIMACY_CATEGORIES = [
  { id: 'bestie', label: '閨蜜' },
  { id: 'family', label: '全家福' },
  { id: 'pet', label: '寵物' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function PageManager() {
  // --- Data state ---
  const [pages, setPages] = useState<PageData | null>(null);
  const [originalPages, setOriginalPages] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- UI state ---
  const [activePage, setActivePage] = useState<PageKey>('wedding');
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [lastClicked, setLastClicked] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [previewHoveredIdx, setPreviewHoveredIdx] = useState<number | null>(null);
  const [showImageBrowser, setShowImageBrowser] = useState(false);
  const [availableImages, setAvailableImages] = useState<string[]>([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [categoryTag, setCategoryTag] = useState<string>('bestie');

  const previewRef = useRef<HTMLDivElement>(null);

  // --- Load data ---
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/pages.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error('Failed to load pages.json');
        const data: PageData = await res.json();
        setPages(data);
        setOriginalPages(JSON.parse(JSON.stringify(data)));
      } catch (err: any) {
        setMessage({ type: 'error', text: err?.message || 'Failed to load' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- Derived ---
  const config = PAGE_CONFIGS[activePage];
  const images = pages?.[activePage] ?? [];
  const hasChanges = useMemo(() => {
    if (!pages || !originalPages) return false;
    return JSON.stringify(pages) !== JSON.stringify(originalPages);
  }, [pages, originalPages]);

  // --- Helpers ---
  const setImages = useCallback((newImages: PageImage[]) => {
    setPages(prev => prev ? { ...prev, [activePage]: newImages } : prev);
  }, [activePage]);

  const clearSelection = useCallback(() => {
    setSelectedIndices(new Set());
    setLastClicked(null);
  }, []);

  // Reset selection when switching pages
  useEffect(() => {
    clearSelection();
    setShowImageBrowser(false);
  }, [activePage, clearSelection]);

  // Flash message auto-clear
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(t);
  }, [message]);

  // --- Click handling (multi-select) ---
  const handleItemClick = useCallback((idx: number, e: React.MouseEvent) => {
    const next = new Set(selectedIndices);
    if (e.shiftKey && lastClicked !== null) {
      const start = Math.min(lastClicked, idx);
      const end = Math.max(lastClicked, idx);
      for (let i = start; i <= end; i++) next.add(i);
    } else if (e.ctrlKey || e.metaKey) {
      if (next.has(idx)) next.delete(idx); else next.add(idx);
    } else {
      if (next.size === 1 && next.has(idx)) next.clear();
      else { next.clear(); next.add(idx); }
    }
    setSelectedIndices(next);
    setLastClicked(idx);
  }, [selectedIndices, lastClicked]);

  // --- Drag & Drop ---
  const handleDragStart = useCallback((e: React.DragEvent, idx: number) => {
    if (!selectedIndices.has(idx)) {
      setSelectedIndices(new Set([idx]));
    }
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  }, [selectedIndices]);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetIdx(idx);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (dragIdx === null) return;

    const sorted = Array.from(selectedIndices).sort((a, b) => a - b);
    const selectedItems = sorted.map(i => images[i]);
    const remaining = images.filter((_, i) => !selectedIndices.has(i));
    const removedBefore = sorted.filter(i => i < dropIdx).length;
    const insertAt = Math.max(0, Math.min(remaining.length, dropIdx - removedBefore));

    const newImages = [
      ...remaining.slice(0, insertAt),
      ...selectedItems,
      ...remaining.slice(insertAt),
    ].map((img, i) => ({ ...img, id: i + 1 }));

    setImages(newImages);
    const newSelected = new Set<number>();
    for (let i = 0; i < selectedItems.length; i++) newSelected.add(insertAt + i);
    setSelectedIndices(newSelected);
    setDragIdx(null);
    setDropTargetIdx(null);
  }, [dragIdx, selectedIndices, images, setImages]);

  // --- Move up/down ---
  const moveBy = useCallback((delta: number) => {
    if (selectedIndices.size === 0) return;
    const sorted = Array.from(selectedIndices).sort((a, b) => a - b);
    if (delta < 0 && sorted[0] === 0) return;
    if (delta > 0 && sorted[sorted.length - 1] === images.length - 1) return;

    const arr = [...images];
    if (delta < 0) {
      for (const idx of sorted) {
        [arr[idx], arr[idx + delta]] = [arr[idx + delta], arr[idx]];
      }
    } else {
      for (let i = sorted.length - 1; i >= 0; i--) {
        const idx = sorted[i];
        [arr[idx], arr[idx + delta]] = [arr[idx + delta], arr[idx]];
      }
    }
    setImages(arr.map((img, i) => ({ ...img, id: i + 1 })));
    setSelectedIndices(new Set(sorted.map(i => i + delta)));
  }, [selectedIndices, images, setImages]);

  // --- Delete selected ---
  const deleteSelected = useCallback(() => {
    if (selectedIndices.size === 0) return;
    if (!confirm(`確定要從此頁移除 ${selectedIndices.size} 張圖片？`)) return;
    const newImages = images.filter((_, i) => !selectedIndices.has(i))
      .map((img, i) => ({ ...img, id: i + 1 }));
    setImages(newImages);
    clearSelection();
    setMessage({ type: 'success', text: `已移除 ${selectedIndices.size} 張` });
  }, [selectedIndices, images, setImages, clearSelection]);

  // --- Add images from browser ---
  const addImages = useCallback((srcs: string[]) => {
    const existing = new Set(images.map(img => img.src));
    const newSrcs = srcs.filter(s => !existing.has(s));
    if (newSrcs.length === 0) {
      setMessage({ type: 'error', text: '選取的圖片都已存在' });
      return;
    }
    const maxId = images.length > 0 ? Math.max(...images.map(i => i.id)) : 0;
    const newItems: PageImage[] = newSrcs.map((src, i) => ({
      src,
      id: maxId + i + 1,
      ...(activePage === 'intimacy' ? { category: categoryTag } : {}),
    }));
    setImages([...images, ...newItems].map((img, i) => ({ ...img, id: i + 1 })));
    setMessage({ type: 'success', text: `已新增 ${newSrcs.length} 張` });
    setShowImageBrowser(false);
  }, [images, setImages, activePage, categoryTag]);

  // --- Scan folder ---
  const scanFolder = useCallback(async () => {
    setScanLoading(true);
    try {
      const res = await fetch(`/api/scan-images?dir=${config.folder}`);
      const files: string[] = await res.json();
      setAvailableImages(files);
    } catch {
      setMessage({ type: 'error', text: '掃描資料夾失敗' });
    } finally {
      setScanLoading(false);
    }
  }, [config.folder]);

  // Scan when opening browser
  useEffect(() => {
    if (showImageBrowser) scanFolder();
  }, [showImageBrowser, scanFolder]);

  // --- Save ---
  const handleSave = useCallback(async () => {
    if (!pages) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/save-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pages),
      });
      if (!res.ok) throw new Error('Save failed');
      setOriginalPages(JSON.parse(JSON.stringify(pages)));
      setMessage({ type: 'success', text: '儲存成功！' });
    } catch (err: any) {
      setMessage({ type: 'error', text: '儲存失敗：' + (err?.message || '') });
    } finally {
      setSaving(false);
    }
  }, [pages]);

  // --- Reset ---
  const handleReset = useCallback(() => {
    if (!confirm('確定要重置所有變更？')) return;
    setPages(JSON.parse(JSON.stringify(originalPages)));
    clearSelection();
    setMessage({ type: 'success', text: '已重置' });
  }, [originalPages, clearSelection]);

  // No auto-scroll on hover — it causes uncontrollable page jumping

  // --- Preview columns ---
  const previewColumns = useMemo(() => {
    const cols = config.cols;
    const columns: PageImage[][] = Array.from({ length: cols }, () => []);
    images.forEach((img, i) => {
      columns[i % cols].push(img);
    });
    return columns;
  }, [images, config.cols]);

  // --- Get global index from image in column ---
  const getGlobalIndex = useCallback((colIdx: number, rowIdx: number) => {
    return rowIdx * config.cols + colIdx;
  }, [config.cols]);

  // --- Loading state ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-white flex items-center justify-center">
        <div className="font-mono text-[10px] uppercase tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  const highlightIdx = hoveredIdx ?? previewHoveredIdx;

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white flex flex-col">
      {/* ============ HEADER ============ */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-md flex-shrink-0">
        <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <a href="#/admin" className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="返回管理中心">
              <ArrowLeft size={16} />
            </a>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/60">HENGSTUDIO</div>
              <div className="font-sans font-black text-lg uppercase tracking-tighter">Page Manager</div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Preview toggle */}
            <button
              onClick={() => setShowPreview(p => !p)}
              className={`px-3 py-1.5 rounded-full border font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                showPreview ? 'border-white/40 bg-white/10' : 'border-white/15 hover:border-white/30'
              }`}
            >
              {showPreview ? <Eye size={12} /> : <EyeOff size={12} />}
              Preview
            </button>

            <button onClick={handleReset} disabled={!hasChanges}
              className="px-3 py-1.5 rounded-full border border-white/15 hover:border-white/40 disabled:opacity-40 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5">
              <RotateCcw size={12} /> Reset
            </button>
            <button onClick={handleSave} disabled={!hasChanges || saving}
              className="px-4 py-1.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-60 disabled:bg-white/20 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5">
              <Save size={12} /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Page tabs */}
        <div className="px-4 pb-2 flex items-center gap-1">
          {(Object.keys(PAGE_CONFIGS) as PageKey[]).map(key => {
            const c = PAGE_CONFIGS[key];
            const count = pages?.[key]?.length ?? 0;
            return (
              <button
                key={key}
                onClick={() => setActivePage(key)}
                className={`px-4 py-2 rounded-t-lg font-mono text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                  activePage === key
                    ? 'bg-white/10 text-white border-b-2 border-white'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                {c.label} {c.labelEn}
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/10">{count}</span>
              </button>
            );
          })}

          {/* Link to gallery admin */}
          <a href="#/gallery-admin"
            className="ml-auto px-3 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white/70 hover:bg-white/5 transition-all flex items-center gap-1.5">
            <Layout size={12} /> Gallery Manager
          </a>
          <a href="#/fashion-wall-admin"
            className="px-3 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-white/70 hover:bg-white/5 transition-all flex items-center gap-1.5">
            <ImageIcon size={12} /> Fashion Wall
          </a>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] text-white/50">
              {images.length} 張圖片
              {hasChanges && <span className="text-amber-400 ml-2">• 未儲存</span>}
            </span>

            {selectedIndices.size > 0 ? (
              <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-full">
                <span className="font-mono text-[10px] text-emerald-400">
                  已選 {selectedIndices.size} 張
                </span>
                <div className="w-px h-4 bg-white/20" />
                <button onClick={() => moveBy(-1)} className="p-1 bg-white/10 hover:bg-white/20 rounded" title="上移">
                  <ChevronUp size={12} />
                </button>
                <button onClick={() => moveBy(1)} className="p-1 bg-white/10 hover:bg-white/20 rounded" title="下移">
                  <ChevronDown size={12} />
                </button>
                <button onClick={deleteSelected} className="p-1 bg-red-500/80 hover:bg-red-500 rounded" title="移除">
                  <Trash2 size={12} />
                </button>
                <button onClick={clearSelection} className="p-1 bg-white/20 hover:bg-white/30 rounded" title="取消選取">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <span className="font-mono text-[10px] text-white/30">
                點選選取 · Shift 多選 · 拖曳排序
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImageBrowser(true)}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-colors"
            >
              <Plus size={12} /> 新增圖片
            </button>
          </div>

          {message && (
            <div className={`font-mono text-[10px] ${message.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
              {message.text}
            </div>
          )}
        </div>
      </header>

      {/* ============ MAIN CONTENT ============ */}
      <div className="flex-1 flex overflow-hidden">
        {/* --- LEFT: Image Editor Grid --- */}
        <div className={`flex-1 overflow-y-auto p-3 ${showPreview ? 'max-w-[50%]' : ''}`}>
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-white/30">
              <ImageIcon size={48} strokeWidth={1} />
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest">尚無圖片</p>
              <button
                onClick={() => setShowImageBrowser(true)}
                className="mt-4 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2"
              >
                <Plus size={12} /> 從資料夾新增
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {images.map((img, idx) => {
                const isSelected = selectedIndices.has(idx);
                const isHighlighted = highlightIdx === idx;
                const isDragging = dragIdx === idx;
                const isDropTarget = dropTargetIdx === idx;

                return (
                  <div
                    key={`${img.src}-${idx}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={() => { setDragIdx(null); setDropTargetIdx(null); }}
                    onClick={(e) => handleItemClick(idx, e)}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={`
                      relative group cursor-pointer rounded-lg overflow-hidden transition-all duration-150
                      ${isDragging ? 'opacity-40 scale-95' : ''}
                      ${isDropTarget && !isDragging ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-black' : ''}
                      ${isSelected ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-black scale-[1.02]' : ''}
                      ${isHighlighted && !isSelected ? 'ring-2 ring-amber-400/60 ring-offset-1 ring-offset-black' : ''}
                      ${!isSelected && !isHighlighted ? 'hover:ring-1 hover:ring-white/30' : ''}
                    `}
                  >
                    {/* Selection checkbox */}
                    <div className={`absolute top-1 right-1 z-10 w-5 h-5 rounded flex items-center justify-center transition-all ${
                      isSelected ? 'bg-emerald-500' : 'bg-black/50 opacity-0 group-hover:opacity-100'
                    }`}>
                      {isSelected ? <CheckSquare size={12} /> : <Square size={12} className="text-white/60" />}
                    </div>

                    {/* Number badge */}
                    <div className={`absolute top-1 left-1 z-10 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                      isSelected ? 'bg-emerald-500 text-white' : 'bg-black/70 text-white/80'
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Category badge (intimacy only) */}
                    {activePage === 'intimacy' && img.category && (
                      <div className="absolute bottom-1 left-1 z-10 px-1.5 py-0.5 rounded text-[8px] font-mono bg-black/60 text-white/70">
                        {img.category}
                      </div>
                    )}

                    {/* Drag handle */}
                    <div className="absolute top-1/2 -translate-y-1/2 right-0 z-10 opacity-0 group-hover:opacity-60 transition-opacity px-0.5">
                      <GripVertical size={14} className="text-white" />
                    </div>

                    <div className="aspect-square bg-white/5">
                      <img src={img.src} alt={img.src.split('/').pop()} className="w-full h-full object-cover" loading="lazy" draggable={false} />
                    </div>

                    {isSelected && <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />}
                    {isHighlighted && !isSelected && <div className="absolute inset-0 bg-amber-400/10 pointer-events-none" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* --- RIGHT: Live Preview Panel --- */}
        {showPreview && (
          <div className="w-[50%] border-l border-white/10 flex flex-col flex-shrink-0">
            <div className="px-4 py-2 border-b border-white/10 flex items-center justify-between bg-black/50">
              <div className="flex items-center gap-2">
                <Eye size={12} className="text-white/50" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">
                  Live Preview · {config.label} Page
                </span>
              </div>
              <span className="font-mono text-[9px] text-white/30">
                {config.cols} 欄瀑布流
              </span>
            </div>

            <div
              ref={previewRef}
              className="flex-1 overflow-y-auto"
              style={{ backgroundColor: config.bgColor }}
            >
              {/* Mini hero */}
              <div className={`px-6 pt-8 pb-4 ${config.theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]'}`}>
                <div className={`font-mono text-[8px] uppercase tracking-[0.5em] ${config.theme === 'dark' ? 'text-white/30' : 'text-black/30'} mb-1`}>
                  Portfolio
                </div>
                <div className="font-sans font-black text-2xl tracking-tight">Gallery</div>
              </div>

              {/* Masonry preview */}
              <div className={`px-6 pb-8 grid gap-3`} style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)` }}>
                {previewColumns.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-3" style={{ marginTop: colIdx === 1 ? '2rem' : colIdx === 2 ? '1rem' : 0 }}>
                    {col.map((img, rowIdx) => {
                      const globalIdx = getGlobalIndex(colIdx, rowIdx);
                      const isSelected = selectedIndices.has(globalIdx);
                      const isHighlighted = highlightIdx === globalIdx;
                      const aspectClass = config.aspects[globalIdx % config.aspects.length];

                      return (
                        <div
                          key={`${img.src}-${globalIdx}`}
                          data-preview-idx={globalIdx}
                          className={`
                            relative overflow-hidden rounded-sm cursor-pointer transition-all duration-200
                            ${aspectClass}
                            ${isSelected ? 'ring-2 ring-emerald-400 shadow-lg shadow-emerald-500/20' : ''}
                            ${isHighlighted && !isSelected ? 'ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/20' : ''}
                          `}
                          onClick={(e) => handleItemClick(globalIdx, e)}
                          onMouseEnter={() => setPreviewHoveredIdx(globalIdx)}
                          onMouseLeave={() => setPreviewHoveredIdx(null)}
                        >
                          <img src={img.src} alt="" className="w-full h-full object-cover" loading="lazy" />

                          {/* Number overlay */}
                          <div className={`absolute bottom-1 left-1 px-1 py-0.5 rounded text-[7px] font-mono ${
                            config.theme === 'dark' ? 'bg-black/60 text-white/60' : 'bg-white/80 text-black/60'
                          }`}>
                            {String(globalIdx + 1).padStart(2, '0')}
                          </div>

                          {/* Selection indicator */}
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                              <CheckSquare size={8} className="text-white" />
                            </div>
                          )}

                          {/* Hover overlay */}
                          <div className={`absolute inset-0 transition-colors duration-200 ${
                            isHighlighted ? (config.theme === 'dark' ? 'bg-white/10' : 'bg-black/10') : ''
                          }`} />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {images.length === 0 && (
                <div className={`text-center py-16 ${config.theme === 'dark' ? 'text-white/30' : 'text-black/30'}`}>
                  <p className="font-mono text-[10px] uppercase tracking-widest">No images yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============ IMAGE BROWSER MODAL ============ */}
      <AnimatePresence>
        {showImageBrowser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowImageBrowser(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <ImageBrowser
                availableImages={availableImages}
                existingImages={images}
                loading={scanLoading}
                onAdd={addImages}
                onClose={() => setShowImageBrowser(false)}
                onRefresh={scanFolder}
                isIntimacy={activePage === 'intimacy'}
                categoryTag={categoryTag}
                onCategoryChange={setCategoryTag}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Image Browser Sub-component                                        */
/* ------------------------------------------------------------------ */

function ImageBrowser({
  availableImages,
  existingImages,
  loading,
  onAdd,
  onClose,
  onRefresh,
  isIntimacy,
  categoryTag,
  onCategoryChange,
}: {
  availableImages: string[];
  existingImages: PageImage[];
  loading: boolean;
  onAdd: (srcs: string[]) => void;
  onClose: () => void;
  onRefresh: () => void;
  isIntimacy: boolean;
  categoryTag: string;
  onCategoryChange: (c: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const existingSet = useMemo(() => new Set(existingImages.map(i => i.src)), [existingImages]);

  const unusedImages = useMemo(
    () => availableImages.filter(src => !existingSet.has(src)),
    [availableImages, existingSet]
  );

  const toggleImage = (src: string) => {
    const next = new Set(selected);
    if (next.has(src)) next.delete(src); else next.add(src);
    setSelected(next);
  };

  const selectAll = () => setSelected(new Set(unusedImages));

  return (
    <>
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div>
          <div className="font-sans font-black text-lg tracking-tight">新增圖片</div>
          <div className="font-mono text-[10px] text-white/50 mt-1">
            從資料夾選取圖片加入此頁面 · {unusedImages.length} 張可用
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onRefresh} disabled={loading}
            className="px-3 py-1.5 rounded-full border border-white/15 hover:border-white/40 disabled:opacity-50 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5">
            <FolderOpen size={12} /> {loading ? '掃描中...' : '重新掃描'}
          </button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Category selector for intimacy */}
      {isIntimacy && (
        <div className="px-6 py-3 border-b border-white/5 flex items-center gap-3">
          <Tag size={12} className="text-white/50" />
          <span className="font-mono text-[10px] text-white/50">分類標籤：</span>
          {INTIMACY_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1 rounded-full font-mono text-[10px] transition-all ${
                categoryTag === cat.id
                  ? 'bg-rose-500/30 border border-rose-500/60 text-rose-300'
                  : 'bg-white/5 border border-white/10 text-white/50 hover:border-white/30'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="font-mono text-[10px] text-white/50 animate-pulse">掃描資料夾中...</div>
          </div>
        ) : unusedImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-white/30">
            <ImageIcon size={36} strokeWidth={1} />
            <p className="mt-3 font-mono text-[10px]">資料夾中沒有新圖片了</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {unusedImages.map(src => {
              const isSelected = selected.has(src);
              return (
                <div
                  key={src}
                  onClick={() => toggleImage(src)}
                  className={`relative cursor-pointer rounded-lg overflow-hidden transition-all ${
                    isSelected ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#141414] scale-[1.02]' : 'hover:ring-1 hover:ring-white/30'
                  }`}
                >
                  <div className="aspect-square bg-white/5">
                    <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded bg-emerald-500 flex items-center justify-center">
                      <CheckSquare size={12} />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-1 py-0.5">
                    <span className="font-mono text-[7px] text-white/70 truncate block">
                      {src.split('/').pop()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between bg-black/30">
        <div className="flex items-center gap-3">
          <button onClick={selectAll}
            className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 font-mono text-[10px] uppercase tracking-widest">
            全選未加入的
          </button>
          <span className="font-mono text-[10px] text-white/50">
            已勾選 {selected.size} 張
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClose}
            className="px-4 py-2 rounded-full border border-white/15 hover:border-white/30 font-mono text-[10px] uppercase tracking-widest">
            取消
          </button>
          <button
            onClick={() => onAdd(Array.from(selected))}
            disabled={selected.size === 0}
            className="px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5"
          >
            <Plus size={12} /> 加入 {selected.size} 張
          </button>
        </div>
      </div>
    </>
  );
}
