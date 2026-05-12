import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Image as ImageIcon,
  LayoutGrid,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Sparkles,
} from 'lucide-react';

type FashionWallSection = {
  label: string;
  sourceSet: string;
  limit: number;
  included: number[];
  excluded: number[];
  autoExcluded: number[];
  autoExcludedRanges: [number, number][];
};

type FashionWallConfig = {
  sections: {
    fashionWall: FashionWallSection;
  };
};

type SourceSetSummary = {
  label: string;
  count: number;
};

type FashionSourceItem = {
  sourceNumber: number;
  name: string;
  url: string;
  size: number;
  selected: boolean;
  manualIncluded: boolean;
  manualExcluded: boolean;
  autoExcluded: boolean;
};

type AdminData = {
  config: FashionWallConfig;
  sourceSet: string;
  sourceSets: SourceSetSummary[];
  currentCount: number;
  items: FashionSourceItem[];
};

type Message = { type: 'success' | 'error'; text: string } | null;
type FilterMode = 'all' | 'selected' | 'active' | 'excluded' | 'forced' | 'auto';

const filters: { key: FilterMode; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'selected', label: '目前上牆' },
  { key: 'active', label: '候選' },
  { key: 'excluded', label: '排除' },
  { key: 'forced', label: '強制使用' },
  { key: 'auto', label: '預設排除' },
];

function sortNumbers(values: Iterable<number>) {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

function expandNumberRanges(ranges: [number, number][] = []) {
  return ranges.flatMap(([start, end]) =>
    Array.from({ length: end - start + 1 }, (_, index) => start + index)
  );
}

function formatBytes(size: number) {
  if (!Number.isFinite(size)) return '';
  if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function isEffectivelyExcluded(item: FashionSourceItem) {
  return item.manualExcluded || (item.autoExcluded && !item.manualIncluded);
}

function itemStatus(item: FashionSourceItem) {
  if (item.manualIncluded) return '強制使用';
  if (item.manualExcluded) return '手動排除';
  if (item.autoExcluded) return '預設排除';
  if (item.selected) return '目前上牆';
  return '候選';
}

export default function FashionWallAdmin() {
  const [data, setData] = useState<AdminData | null>(null);
  const [config, setConfig] = useState<FashionWallConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [message, setMessage] = useState<Message>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/fashion-wall-admin-data', { cache: 'no-cache' });
      if (!res.ok) throw new Error('無法載入時尚牆資料');
      const payload: AdminData = await res.json();
      setData(payload);
      setConfig(payload.config);
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || '載入失敗' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const wall = config?.sections.fashionWall;
  const items = data?.items ?? [];

  const computedItems = useMemo(() => {
    if (!wall) return items;

    const included = new Set(wall.included);
    const excluded = new Set(wall.excluded);
    const autoExcluded = new Set([...wall.autoExcluded, ...expandNumberRanges(wall.autoExcludedRanges)]);

    return items.map((item) => ({
      ...item,
      manualIncluded: included.has(item.sourceNumber),
      manualExcluded: excluded.has(item.sourceNumber),
      autoExcluded: autoExcluded.has(item.sourceNumber),
    }));
  }, [items, wall]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return computedItems.filter((item) => {
      const excluded = isEffectivelyExcluded(item);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'selected' && item.selected) ||
        (filter === 'active' && !excluded) ||
        (filter === 'excluded' && excluded) ||
        (filter === 'forced' && item.manualIncluded) ||
        (filter === 'auto' && item.autoExcluded);

      const matchesQuery =
        !normalizedQuery ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        String(item.sourceNumber).includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [computedItems, filter, query]);

  const stats = useMemo(() => {
    const excludedCount = computedItems.filter(isEffectivelyExcluded).length;
    const forcedCount = computedItems.filter((item) => item.manualIncluded).length;
    const manualExcludedCount = computedItems.filter((item) => item.manualExcluded).length;

    return {
      total: computedItems.length,
      selected: computedItems.filter((item) => item.selected).length,
      active: computedItems.length - excludedCount,
      excluded: excludedCount,
      forced: forcedCount,
      manualExcluded: manualExcludedCount,
    };
  }, [computedItems]);

  const updateWall = useCallback((recipe: (section: FashionWallSection) => FashionWallSection) => {
    setConfig((current) => {
      if (!current) return current;
      const section = current.sections.fashionWall;
      return {
        ...current,
        sections: {
          ...current.sections,
          fashionWall: recipe(section),
        },
      };
    });
  }, []);

  const setItemMode = useCallback((sourceNumber: number, mode: 'include' | 'exclude' | 'auto') => {
    updateWall((section) => {
      const included = new Set(section.included);
      const excluded = new Set(section.excluded);

      if (mode === 'include') {
        included.add(sourceNumber);
        excluded.delete(sourceNumber);
      } else if (mode === 'exclude') {
        excluded.add(sourceNumber);
        included.delete(sourceNumber);
      } else {
        included.delete(sourceNumber);
        excluded.delete(sourceNumber);
      }

      return {
        ...section,
        included: sortNumbers(included),
        excluded: sortNumbers(excluded),
      };
    });

    const label = mode === 'include' ? '強制使用' : mode === 'exclude' ? '排除' : '自動';
    setMessage({ type: 'success', text: `#${sourceNumber} 已標記為「${label}」，按 Save + Rebuild 後更新首頁` });
  }, [updateWall]);

  const handleSave = useCallback(async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/save-fashion-wall-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || '儲存失敗');
      setConfig(payload.config);
      setMessage({ type: 'success', text: '設定已儲存' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || '儲存失敗' });
    } finally {
      setSaving(false);
    }
  }, [config]);

  const handleGenerate = useCallback(async () => {
    if (!config) return;
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/generate-fashion-wall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || '重建失敗');
      setData(payload.data);
      setConfig(payload.data.config);
      setMessage({ type: 'success', text: '動態牆已重建，首頁會使用新的照片排序' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || '重建失敗' });
    } finally {
      setGenerating(false);
    }
  }, [config]);

  const handleClearManual = useCallback(() => {
    if (!confirm('要清除所有手動「強制使用」與「排除」設定嗎？')) return;
    updateWall((section) => ({ ...section, included: [], excluded: [] }));
    setMessage({ type: 'success', text: '已清除手動設定，記得儲存或重建' });
  }, [updateWall]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-white">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/50">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0b]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <a href="#/admin" className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/70 transition hover:border-white/30 hover:text-white" title="返回管理中心">
                <ArrowLeft size={16} />
              </a>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">Fashion Wall Admin</div>
                <h1 className="mt-1 text-xl font-light tracking-wide md:text-2xl">首頁時尚動態牆選片</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a href="#/gallery-admin" className="rounded-lg border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white/55 transition hover:border-white/30 hover:text-white">
                Gallery
              </a>
              <a href="#/page-manager" className="rounded-lg border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white/55 transition hover:border-white/30 hover:text-white">
                Pages
              </a>
              <button
                type="button"
                onClick={loadData}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white/65 transition hover:border-white/30 hover:text-white"
              >
                <RefreshCw size={13} /> Reload
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || generating || !config}
                className="flex items-center gap-2 rounded-lg border border-emerald-400/30 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-emerald-200 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save size={13} /> {saving ? 'Saving' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={saving || generating || !config}
                className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-black transition hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Sparkles size={13} /> {generating ? 'Generating' : 'Save + Rebuild'}
              </button>
            </div>
          </div>

          {message && (
            <div className={`rounded-lg border px-3 py-2 text-sm ${message.type === 'success' ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100' : 'border-red-400/25 bg-red-400/10 text-red-100'}`}>
              {message.text}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 md:px-6 lg:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <LayoutGrid size={16} />
              板塊
            </div>
            <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3">
              <div className="text-sm text-white">{wall?.label || '首頁時尚動態牆'}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-white/35">Homepage</div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <div className="text-sm text-white/80">牆面設定</div>
            <label className="mt-3 block text-xs text-white/45">照片數量</label>
            <input
              type="number"
              min={12}
              max={144}
              value={wall?.limit ?? 72}
              onChange={(event) => updateWall((section) => ({ ...section, limit: Number(event.target.value) }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-white/35"
            />

            <label className="mt-3 block text-xs text-white/45">照片來源</label>
            <select
              value={wall?.sourceSet || data?.sourceSet || 'images/IG portfolio'}
              onChange={(event) => updateWall((section) => ({ ...section, sourceSet: event.target.value }))}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none transition focus:border-white/35"
            >
              {(data?.sourceSets ?? []).map((sourceSet) => (
                <option key={sourceSet.label} value={sourceSet.label}>
                  {sourceSet.label} ({sourceSet.count})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleClearManual}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 transition hover:border-white/25 hover:text-white"
            >
              <RotateCcw size={14} /> 清除手動設定
            </button>
          </section>

          <section className="grid grid-cols-2 gap-2">
            <Stat label="總照片" value={stats.total} />
            <Stat label="目前上牆" value={stats.selected} />
            <Stat label="候選" value={stats.active} />
            <Stat label="排除" value={stats.excluded} />
            <Stat label="強制使用" value={stats.forced} />
            <Stat label="手動排除" value={stats.manualExcluded} />
          </section>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜尋檔名或編號"
                className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-white/35"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filters.map((entry) => (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => setFilter(entry.key)}
                  className={`rounded-lg px-3 py-2 text-xs transition ${filter === entry.key ? 'bg-white text-black' : 'border border-white/10 text-white/50 hover:border-white/25 hover:text-white'}`}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between text-xs text-white/40">
            <span>顯示 {visibleItems.length} / {items.length} 張</span>
            <span>來源：{data?.sourceSet || wall?.sourceSet}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {visibleItems.map((item) => {
              const excluded = isEffectivelyExcluded(item);
              const borderClass = item.manualIncluded
                ? 'border-sky-300/60'
                : item.manualExcluded
                  ? 'border-red-300/55'
                  : excluded
                    ? 'border-amber-300/35'
                    : item.selected
                      ? 'border-emerald-300/55'
                      : 'border-white/10';

              return (
                <article key={item.sourceNumber} className={`overflow-hidden rounded-xl border bg-white/[0.035] ${borderClass}`}>
                  <div className="relative aspect-[5/6] bg-white/[0.04]">
                    <img
                      src={item.url}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      className={`h-full w-full object-cover transition ${excluded && !item.manualIncluded ? 'opacity-40 grayscale' : 'opacity-100'}`}
                    />
                    <div className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 font-mono text-[10px] text-white">
                      #{item.sourceNumber}
                    </div>
                    <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] text-white/80">
                      {itemStatus(item)}
                    </div>
                    {item.selected && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-emerald-400 px-2 py-1 text-[10px] font-medium text-black">
                        <CheckCircle2 size={12} /> 上牆
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 p-3">
                    <div className="min-w-0">
                      <div className="truncate text-xs text-white/75" title={item.name}>{item.name}</div>
                      <div className="mt-1 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-white/30">
                        <ImageIcon size={11} /> {formatBytes(item.size)}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setItemMode(item.sourceNumber, 'include')}
                        className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] transition ${item.manualIncluded ? 'bg-sky-300 text-black' : 'border border-white/10 text-white/50 hover:border-sky-300/45 hover:text-sky-100'}`}
                      >
                        <CheckCircle2 size={13} /> 使用
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemMode(item.sourceNumber, 'exclude')}
                        className={`flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] transition ${item.manualExcluded ? 'bg-red-300 text-black' : 'border border-white/10 text-white/50 hover:border-red-300/45 hover:text-red-100'}`}
                      >
                        <Ban size={13} /> 排除
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemMode(item.sourceNumber, 'auto')}
                        className="rounded-lg border border-white/10 px-2 py-2 text-[11px] text-white/45 transition hover:border-white/25 hover:text-white"
                      >
                        自動
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {visibleItems.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-16 text-center text-sm text-white/40">
              沒有符合條件的照片
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
      <div className="text-xs text-white/40">{label}</div>
      <div className="mt-1 font-mono text-xl text-white">{value}</div>
    </div>
  );
}
