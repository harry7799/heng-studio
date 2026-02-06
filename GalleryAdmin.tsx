import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Save, Trash2, Eye, LayoutGrid, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, CheckSquare, Square, X, ArrowLeftRight } from 'lucide-react';

type GalleryItem = {
  name: string;
  url: string;
  number: number;
};

const PAGE_SIZE = 60;

export default function GalleryAdmin() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [originalItems, setOriginalItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'preview'>('grid');
  const [currentPage, setCurrentPage] = useState(0);

  // Multi-select support
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [moveTarget, setMoveTarget] = useState('');
  const [lastClickedIdx, setLastClickedIdx] = useState<number | null>(null);

  // Load gallery data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/gallery.json', { cache: 'no-cache' });
        if (!res.ok) throw new Error('Failed to load gallery.json');
        const data = await res.json();
        const sorted = [...data].sort((a: GalleryItem, b: GalleryItem) => a.number - b.number);
        setItems(sorted);
        setOriginalItems(JSON.parse(JSON.stringify(sorted)));
      } catch (err: any) {
        setMessage({ type: 'error', text: err?.message || 'Failed to load gallery' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasChanges = useMemo(() => {
    if (items.length !== originalItems.length) return true;
    return items.some((item, i) => item.url !== originalItems[i]?.url);
  }, [items, originalItems]);

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const pageItems = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, currentPage]);

  // Handle click with shift/ctrl for multi-select
  const handleItemClick = useCallback((globalIdx: number, e: React.MouseEvent) => {
    const newSelected = new Set(selectedIndices);

    if (e.shiftKey && lastClickedIdx !== null) {
      // Shift+click: select range
      const start = Math.min(lastClickedIdx, globalIdx);
      const end = Math.max(lastClickedIdx, globalIdx);
      for (let i = start; i <= end; i++) {
        newSelected.add(i);
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd+click: toggle single
      if (newSelected.has(globalIdx)) {
        newSelected.delete(globalIdx);
      } else {
        newSelected.add(globalIdx);
      }
    } else {
      // Normal click: select only this one (or deselect if already selected alone)
      if (newSelected.size === 1 && newSelected.has(globalIdx)) {
        newSelected.clear();
      } else {
        newSelected.clear();
        newSelected.add(globalIdx);
      }
    }

    setSelectedIndices(newSelected);
    setLastClickedIdx(globalIdx);
  }, [selectedIndices, lastClickedIdx]);

  // Select all on current page
  const selectAllOnPage = useCallback(() => {
    const newSelected = new Set(selectedIndices);
    const start = currentPage * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, items.length);
    for (let i = start; i < end; i++) {
      newSelected.add(i);
    }
    setSelectedIndices(newSelected);
  }, [currentPage, items.length, selectedIndices]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIndices(new Set());
    setLastClickedIdx(null);
  }, []);

  // Move selected items to target position
  const moveSelectedToPosition = useCallback(() => {
    if (selectedIndices.size === 0) return;
    const target = parseInt(moveTarget, 10);
    if (isNaN(target) || target < 1 || target > items.length) {
      setMessage({ type: 'error', text: `請輸入 1-${items.length} 的數字` });
      return;
    }

    const targetIdx = target - 1;
    const sortedSelected = Array.from(selectedIndices).sort((a, b) => a - b);

    // Extract selected items (in order)
    const selectedItems = sortedSelected.map(idx => items[idx]);

    // Remove selected items from array
    const remaining = items.filter((_, idx) => !selectedIndices.has(idx));

    // Insert at target position (adjust for removed items before target)
    const removedBeforeTarget = sortedSelected.filter(idx => idx < targetIdx).length;
    const insertAt = Math.max(0, Math.min(remaining.length, targetIdx - removedBeforeTarget));

    // Insert selected items at the target position
    const newItems = [
      ...remaining.slice(0, insertAt),
      ...selectedItems,
      ...remaining.slice(insertAt)
    ];

    // Renumber
    const renumbered = newItems.map((item, i) => ({ ...item, number: i + 1 }));
    setItems(renumbered);

    // Update selection to new positions
    const newSelected = new Set<number>();
    for (let i = 0; i < selectedItems.length; i++) {
      newSelected.add(insertAt + i);
    }
    setSelectedIndices(newSelected);
    setMoveTarget('');
    setMessage({ type: 'success', text: `已移動 ${selectedItems.length} 張到位置 ${target}` });

    // Jump to the page containing the moved items
    setCurrentPage(Math.floor(insertAt / PAGE_SIZE));
  }, [selectedIndices, moveTarget, items]);

  // Move selected up/down by 1
  const moveSelectedBy = useCallback((delta: number) => {
    if (selectedIndices.size === 0) return;

    const sortedSelected = Array.from(selectedIndices).sort((a, b) => a - b);

    // Check boundaries
    if (delta < 0 && sortedSelected[0] === 0) return;
    if (delta > 0 && sortedSelected[sortedSelected.length - 1] === items.length - 1) return;

    const newItems = [...items];

    if (delta < 0) {
      // Moving up: process from start
      for (const idx of sortedSelected) {
        const newIdx = idx + delta;
        [newItems[idx], newItems[newIdx]] = [newItems[newIdx], newItems[idx]];
      }
    } else {
      // Moving down: process from end
      for (let i = sortedSelected.length - 1; i >= 0; i--) {
        const idx = sortedSelected[i];
        const newIdx = idx + delta;
        [newItems[idx], newItems[newIdx]] = [newItems[newIdx], newItems[idx]];
      }
    }

    const renumbered = newItems.map((item, i) => ({ ...item, number: i + 1 }));
    setItems(renumbered);

    // Update selection
    const newSelected = new Set(sortedSelected.map(idx => idx + delta));
    setSelectedIndices(newSelected);
  }, [selectedIndices, items]);

  // Delete selected items
  const deleteSelected = useCallback(() => {
    if (selectedIndices.size === 0) return;
    if (!confirm(`確定要刪除 ${selectedIndices.size} 張圖片？`)) return;

    const newItems = items.filter((_, i) => !selectedIndices.has(i));
    const renumbered = newItems.map((item, i) => ({ ...item, number: i + 1 }));
    setItems(renumbered);
    clearSelection();
  }, [selectedIndices, items, clearSelection]);

  // Swap two selected items
  const swapSelected = useCallback(() => {
    if (selectedIndices.size !== 2) return;

    const [idxA, idxB] = Array.from(selectedIndices).sort((a, b) => a - b);
    const newItems = [...items];
    [newItems[idxA], newItems[idxB]] = [newItems[idxB], newItems[idxA]];

    const renumbered = newItems.map((item, i) => ({ ...item, number: i + 1 }));
    setItems(renumbered);
    setMessage({ type: 'success', text: `已交換 #${idxA + 1} 和 #${idxB + 1}` });
    clearSelection();
  }, [selectedIndices, items, clearSelection]);

  // Reset
  const handleReset = () => {
    if (!confirm('確定要重置所有變更？')) return;
    setItems(JSON.parse(JSON.stringify(originalItems)));
    clearSelection();
    setMessage({ type: 'success', text: '已重置' });
  };

  // Save
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/save-gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items)
      });
      if (res.ok) {
        setOriginalItems(JSON.parse(JSON.stringify(items)));
        setMessage({ type: 'success', text: '已儲存！' });
      } else {
        throw new Error('Save failed');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: '儲存失敗：' + (err?.message || 'Unknown error') });
    } finally {
      setSaving(false);
    }
  };

  // Drag & Drop handlers
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    const globalIdx = currentPage * PAGE_SIZE + idx;
    // If dragging a non-selected item, select only it
    if (!selectedIndices.has(globalIdx)) {
      setSelectedIndices(new Set([globalIdx]));
    }
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (dragIdx === null) {
      setDragIdx(null);
      return;
    }

    const globalDropIdx = currentPage * PAGE_SIZE + dropIdx;

    // Move all selected items to drop position
    const sortedSelected = Array.from(selectedIndices).sort((a, b) => a - b);
    const selectedItems = sortedSelected.map(idx => items[idx]);
    const remaining = items.filter((_, idx) => !selectedIndices.has(idx));

    // Calculate insert position
    const removedBeforeTarget = sortedSelected.filter(idx => idx < globalDropIdx).length;
    const insertAt = Math.max(0, Math.min(remaining.length, globalDropIdx - removedBeforeTarget));

    const newItems = [
      ...remaining.slice(0, insertAt),
      ...selectedItems,
      ...remaining.slice(insertAt)
    ];

    const renumbered = newItems.map((item, i) => ({ ...item, number: i + 1 }));
    setItems(renumbered);
    setDragIdx(null);

    // Update selection
    const newSelected = new Set<number>();
    for (let i = 0; i < selectedItems.length; i++) {
      newSelected.add(insertAt + i);
    }
    setSelectedIndices(newSelected);
  };

  // Preview masonry
  const sizePattern = ['tall', 'square', 'wide', 'square', 'tall', 'wide'] as const;
  const previewItems = useMemo(() => {
    return items.slice(0, 30).map((item, idx) => ({
      ...item,
      size: sizePattern[idx % sizePattern.length]
    }));
  }, [items]);

  const [col1, col2, col3] = useMemo(() => {
    const cols: Array<Array<typeof previewItems[0]>> = [[], [], []];
    const heights = [0, 0, 0];
    for (const item of previewItems) {
      const est = item.size === 'tall' ? 4/3 : item.size === 'wide' ? 3/4 : 1;
      const colIdx = heights[0] <= heights[1] && heights[0] <= heights[2] ? 0 : heights[1] <= heights[2] ? 1 : 2;
      cols[colIdx].push(item);
      heights[colIdx] += est + 0.35;
    }
    return cols as [typeof cols[0], typeof cols[1], typeof cols[2]];
  }, [previewItems]);

  const getAspectClass = (size: string) => {
    switch (size) {
      case 'tall': return 'aspect-[3/4]';
      case 'wide': return 'aspect-[4/3]';
      default: return 'aspect-square';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-white flex items-center justify-center">
        <div className="font-mono text-[10px] uppercase tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  const selectedCount = selectedIndices.size;
  const sortedSelectedList = Array.from(selectedIndices).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-md">
        <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/60">HENGSTUDIO</div>
            <div className="font-sans font-black text-lg uppercase tracking-tighter">Gallery Manager</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View toggle */}
            <div className="flex border border-white/20 rounded-full overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1 ${
                  viewMode === 'grid' ? 'bg-white text-black' : 'hover:bg-white/10'
                }`}
              >
                <LayoutGrid size={12} /> Edit
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1 ${
                  viewMode === 'preview' ? 'bg-white text-black' : 'hover:bg-white/10'
                }`}
              >
                <Eye size={12} /> Preview
              </button>
            </div>

            <a href="#/" className="px-3 py-1.5 rounded-full border border-white/15 hover:border-white/40 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1">
              <ArrowLeft size={12} /> Back
            </a>
            <button onClick={handleReset} disabled={!hasChanges} className="px-3 py-1.5 rounded-full border border-white/15 hover:border-white/40 disabled:opacity-40 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1">
              <RotateCcw size={12} /> Reset
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="px-4 py-1.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-60 disabled:bg-white/20 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1"
            >
              <Save size={12} />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Selection toolbar */}
        <div className="px-4 py-2 border-t border-white/5 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
              {items.length} images
              {hasChanges && <span className="text-amber-400 ml-2">• Unsaved</span>}
            </span>

            {/* Selection info & controls */}
            {selectedCount > 0 ? (
              <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-full">
                <span className="font-mono text-[10px] text-emerald-400">
                  已選 {selectedCount} 張
                  {selectedCount <= 5 && (
                    <span className="text-white/50 ml-1">
                      (#{sortedSelectedList.map(i => i + 1).join(', ')})
                    </span>
                  )}
                </span>

                <div className="w-px h-4 bg-white/20" />

                <input
                  type="number"
                  value={moveTarget}
                  onChange={(e) => setMoveTarget(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && moveSelectedToPosition()}
                  placeholder="移到..."
                  className="w-16 px-2 py-0.5 bg-black/50 border border-white/20 rounded text-[10px] font-mono"
                  min={1}
                  max={items.length}
                />
                <button
                  onClick={moveSelectedToPosition}
                  className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 rounded text-[10px] font-mono"
                >
                  移動
                </button>

                <div className="w-px h-4 bg-white/20" />

                <button
                  onClick={() => moveSelectedBy(-1)}
                  disabled={sortedSelectedList[0] === 0}
                  className="p-1 bg-white/10 hover:bg-white/20 rounded disabled:opacity-30"
                  title="上移一格"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  onClick={() => moveSelectedBy(1)}
                  disabled={sortedSelectedList[sortedSelectedList.length - 1] === items.length - 1}
                  className="p-1 bg-white/10 hover:bg-white/20 rounded disabled:opacity-30"
                  title="下移一格"
                >
                  <ArrowDown size={12} />
                </button>

                {/* Swap button - only shows when exactly 2 selected */}
                {selectedCount === 2 && (
                  <button
                    onClick={swapSelected}
                    className="px-2 py-0.5 bg-blue-500 hover:bg-blue-400 rounded text-[10px] font-mono flex items-center gap-1"
                    title="交換兩張位置"
                  >
                    <ArrowLeftRight size={12} /> 交換
                  </button>
                )}

                <button
                  onClick={deleteSelected}
                  className="p-1 bg-red-500/80 hover:bg-red-500 rounded"
                  title="刪除選中"
                >
                  <Trash2 size={12} />
                </button>

                <button
                  onClick={clearSelection}
                  className="p-1 bg-white/20 hover:bg-white/30 rounded"
                  title="取消選取"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <span className="font-mono text-[10px] text-white/40">
                點選選取 | Shift+點選多選 | Ctrl+點選切換
              </span>
            )}
          </div>

          {message && (
            <div className={`font-mono text-[10px] ${message.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
              {message.text}
            </div>
          )}
        </div>
      </header>

      {viewMode === 'grid' ? (
        <>
          {/* Pagination & select all */}
          <div className="px-4 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={selectAllOnPage}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 font-mono text-[10px] flex items-center gap-1"
              >
                <CheckSquare size={12} /> 全選本頁
              </button>
              {selectedCount > 0 && (
                <button
                  onClick={clearSelection}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 font-mono text-[10px] flex items-center gap-1"
                >
                  <Square size={12} /> 取消全選
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono text-[10px]">
                {currentPage + 1} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <main className="p-3">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
              {pageItems.map((item, idx) => {
                const globalIdx = currentPage * PAGE_SIZE + idx;
                const isSelected = selectedIndices.has(globalIdx);
                const isDragging = dragIdx === idx;

                return (
                  <div
                    key={item.url}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={() => setDragIdx(null)}
                    onClick={(e) => handleItemClick(globalIdx, e)}
                    className={`
                      relative group cursor-pointer rounded-lg overflow-hidden
                      transition-all duration-150
                      ${isDragging ? 'opacity-50 scale-95' : ''}
                      ${isSelected ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-black scale-[1.02]' : 'hover:ring-1 hover:ring-white/30'}
                    `}
                  >
                    {/* Selection checkbox */}
                    <div className={`absolute top-1 right-1 z-10 w-5 h-5 rounded flex items-center justify-center transition-all ${
                      isSelected ? 'bg-emerald-500' : 'bg-black/50 opacity-0 group-hover:opacity-100'
                    }`}>
                      {isSelected ? (
                        <CheckSquare size={12} className="text-white" />
                      ) : (
                        <Square size={12} className="text-white/60" />
                      )}
                    </div>

                    {/* Number */}
                    <div className={`absolute top-1 left-1 z-10 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                      isSelected ? 'bg-emerald-500 text-white' : 'bg-black/70 text-white/80'
                    }`}>
                      {item.number}
                    </div>

                    {/* Image */}
                    <div className="aspect-square bg-white/5">
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        draggable={false}
                      />
                    </div>

                    {/* Selected overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          </main>

          {/* Page jump */}
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] text-white/50">跳到頁面:</span>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-6 h-6 rounded text-[10px] font-mono ${
                  currentPage === i ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {/* Quick tips */}
          <div className="px-4 py-2 border-t border-white/5 text-center">
            <p className="font-mono text-[9px] text-white/30">
              提示：到第2頁選取圖片 → 輸入目標位置（如 1）→ 點移動，即可跨頁搬移
            </p>
          </div>
        </>
      ) : (
        /* Preview Mode */
        <main className="p-8 bg-white min-h-screen">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-slate-400 block mb-2">
                Preview · 前 30 張
              </span>
              <h2 className="font-sans font-black text-4xl tracking-tight text-black">Gallery</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[col1, col2, col3].map((col, colIdx) => (
                <div key={colIdx} className="flex flex-col gap-8">
                  {col.map((item) => (
                    <motion.div
                      key={item.url}
                      className={`relative overflow-hidden ${getAspectClass(item.size)} rounded-lg`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: colIdx * 0.1 }}
                    >
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[9px] font-mono text-white/80">
                        #{String(item.number).padStart(3, '0')}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
