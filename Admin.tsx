import React, { useEffect, useMemo, useState } from 'react';
import type { Project, Category } from './types';
import { CATEGORIES } from './constants';
import { createProject, deleteProject, listMedia, listProjects, updateProject, uploadMedia, type MediaItem } from './cmsApi';

type Draft = {
  id?: string;
  title: string;
  category: Category;
  imageUrl: string;
  metadata: {
    iso: string;
    aperture: string;
    shutter: string;
    date: string;
  };
};

function toDraft(p?: Project): Draft {
  return {
    id: p?.id,
    title: p?.title || '',
    category: (p?.category || 'Fashion') as Category,
    imageUrl: p?.imageUrl || '',
    metadata: {
      iso: p?.metadata?.iso || '',
      aperture: p?.metadata?.aperture || '',
      shutter: p?.metadata?.shutter || '',
      date: p?.metadata?.date || ''
    }
  };
}

function fromDraft(d: Draft): Omit<Project, 'id'> {
  const metaVals = Object.values(d.metadata).map((v) => v.trim());
  const hasAnyMeta = metaVals.some((v) => v.length > 0);
  const hasAllMeta = metaVals.every((v) => v.length > 0);

  return {
    title: d.title.trim(),
    category: d.category,
    imageUrl: d.imageUrl.trim(),
    metadata: hasAnyMeta
      ? {
          iso: hasAllMeta ? d.metadata.iso.trim() : '',
          aperture: hasAllMeta ? d.metadata.aperture.trim() : '',
          shutter: hasAllMeta ? d.metadata.shutter.trim() : '',
          date: hasAllMeta ? d.metadata.date.trim() : ''
        }
      : undefined
  };
}

export default function Admin() {
  const categories = useMemo(() => CATEGORIES.filter((c) => c !== 'All') as Category[], []);

  const [adminToken, setAdminToken] = useState<string>(() => {
    try {
      return localStorage.getItem('hengstudio_admin_token') || '';
    } catch {
      return '';
    }
  });

  const [tokenDraft, setTokenDraft] = useState('');

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => toDraft());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  async function reload() {
    const data = await listProjects();
    setProjects(data);
    return data;
  }

  async function reloadMedia() {
    setMediaBusy(true);
    try {
      const items = await listMedia();
      setMedia(items);
    } finally {
      setMediaBusy(false);
    }
  }

  useEffect(() => {
    // Only load data after a token is provided.
    if (!adminToken.trim()) return;
    (async () => {
      try {
        setError(null);
        await reloadMedia();
        const data = await reload();
        if (data.length > 0) {
          setSelectedId(data[0].id);
          setDraft(toDraft(data[0]));
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load projects');
      }
    })();
  }, [adminToken]);

  if (!adminToken.trim()) {
    return (
      <div className="min-h-screen bg-[#0b0b0b] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md border border-white/10 rounded-2xl bg-white/5 p-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/60">HENGSTUDIO</div>
          <div className="font-sans font-black text-2xl uppercase tracking-tighter mt-2">Admin Login</div>
          <p className="text-white/60 mt-3 text-sm leading-relaxed">
            請輸入後台 token。沒有 token 的人就算打得開後台頁，也無法新增/刪除/上傳。
          </p>

          <label className="block mt-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-2">Admin Token</div>
            <input
              value={tokenDraft}
              onChange={(e) => setTokenDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                const next = tokenDraft.trim();
                if (!next) return;
                try {
                  localStorage.setItem('hengstudio_admin_token', next);
                } catch {
                  // ignore
                }
                setAdminToken(next);
              }}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:outline-none focus:border-white/30"
              placeholder="paste token..."
              autoFocus
            />
          </label>

          <div className="flex items-center justify-between gap-3 mt-5">
            <a
              href="#/"
              className="px-4 py-2 rounded-full border border-white/15 hover:border-white/40 transition-colors font-mono text-[10px] uppercase tracking-widest"
            >
              Back to Site
            </a>
            <button
              onClick={() => {
                const next = tokenDraft.trim();
                if (!next) return;
                try {
                  localStorage.setItem('hengstudio_admin_token', next);
                } catch {
                  // ignore
                }
                setAdminToken(next);
              }}
              disabled={!tokenDraft.trim()}
              className="px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-60 transition-colors font-mono text-[10px] uppercase tracking-widest"
            >
              Enter
            </button>
          </div>

          <div className="text-white/40 font-mono text-[10px] uppercase tracking-widest mt-5">
            Tip: 在啟動 API 時設定環境變數 `ADMIN_TOKEN`。
          </div>
        </div>
      </div>
    );
  }

  const selected = projects.find((p) => p.id === selectedId) || null;

  function pick(p: Project) {
    setSelectedId(p.id);
    setDraft(toDraft(p));
    setInfo(null);
    setError(null);
  }

  async function onSave() {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (!draft.title.trim()) throw new Error('Title is required');
      if (!draft.imageUrl.trim()) throw new Error('Image URL is required');

      const payload = fromDraft(draft);
      if (draft.id) {
        await updateProject(draft.id, payload);
        setInfo('Saved');
      } else {
        const created = await createProject(payload);
        setInfo('Created');
        setSelectedId(created.id);
      }
      const data = await reload();
      const nextSelected = data.find((p) => p.id === (draft.id || selectedId)) || (draft.id ? null : data[0] || null);
      if (nextSelected) setDraft(toDraft(nextSelected));
    } catch (e: any) {
      setError(e?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!selected) return;
    const ok = confirm(`Delete "${selected.title}"?`);
    if (!ok) return;

    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await deleteProject(selected.id);
      setInfo('Deleted');
      const data = await reload();
      if (data.length > 0) {
        setSelectedId(data[0].id);
        setDraft(toDraft(data[0]));
      } else {
        setSelectedId(null);
        setDraft(toDraft());
      }
    } catch (e: any) {
      setError(e?.message || 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0b] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur-md">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.5em] text-white/60">HENGSTUDIO</div>
            <div className="font-sans font-black text-2xl uppercase tracking-tighter">CMS / Admin</div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="#/"
              className="px-4 py-2 rounded-full border border-white/15 hover:border-white/40 transition-colors font-mono text-[10px] uppercase tracking-widest"
            >
              Back to Site
            </a>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem('hengstudio_admin_token');
                } catch {
                  // ignore
                }
                setProjects([]);
                setSelectedId(null);
                setDraft(toDraft());
                setMedia([]);
                setInfo(null);
                setError(null);
                setTokenDraft('');
                setAdminToken('');
              }}
              className="px-4 py-2 rounded-full border border-white/15 hover:border-white/40 transition-colors font-mono text-[10px] uppercase tracking-widest"
            >
              Logout
            </button>
            <button
              onClick={() => {
                setSelectedId(null);
                setDraft(toDraft());
                setInfo(null);
                setError(null);
              }}
              className="px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-colors font-mono text-[10px] uppercase tracking-widest"
            >
              New
            </button>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        <aside className="lg:col-span-4 border-r border-white/10">
          <div className="p-6 border-b border-white/10">
            <div className="font-mono text-[10px] uppercase tracking-widest text-white/60">Projects</div>
          </div>
          <div className="divide-y divide-white/10">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => pick(p)}
                className={`w-full text-left p-6 hover:bg-white/5 transition-colors ${
                  p.id === selectedId ? 'bg-white/5' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-sans font-black text-lg tracking-tight">{p.title}</div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-white/50 mt-2">{p.category}</div>
                  </div>
                  <img src={p.imageUrl} className="w-14 h-14 rounded-lg object-cover border border-white/10" />
                </div>
              </button>
            ))}
            {projects.length === 0 && (
              <div className="p-6 text-white/60 font-mono text-[10px] uppercase tracking-widest">No projects yet.</div>
            )}
          </div>
        </aside>

        <section className="lg:col-span-8">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between gap-6">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-white/60">Editor</div>
                <div className="font-sans font-black text-2xl uppercase tracking-tighter">
                  {draft.id ? 'Edit Project' : 'Create Project'}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onSave}
                  disabled={busy}
                  className="px-5 py-3 rounded-full bg-white text-black hover:bg-white/90 disabled:opacity-60 transition-colors font-mono text-[10px] uppercase tracking-widest"
                >
                  {busy ? 'Working…' : 'Save'}
                </button>
                <button
                  onClick={onDelete}
                  disabled={!selected || busy}
                  className="px-5 py-3 rounded-full border border-red-400/40 text-red-200 hover:border-red-300 disabled:opacity-50 transition-colors font-mono text-[10px] uppercase tracking-widest"
                >
                  Delete
                </button>
              </div>
            </div>

            {(error || info) && (
              <div className="mt-4">
                {error && <div className="text-red-200 font-mono text-xs">{error}</div>}
                {info && <div className="text-emerald-200 font-mono text-xs">{info}</div>}
              </div>
            )}
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-2">Title</div>
              <input
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-white/30"
                placeholder="Project title"
              />
            </label>

            <label className="block">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-2">Category</div>
              <select
                value={draft.category}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as Category }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-white/30"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-black">
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="block md:col-span-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-2">Image URL</div>
              <input
                value={draft.imageUrl}
                onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-white/30"
                placeholder="https://..."
              />

              <div className="mt-3 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
                <div className="text-white/50 font-mono text-[10px] uppercase tracking-widest">
                  Upload image or pick from <span className="text-white/70">server/uploads</span>.
                </div>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 rounded-full border border-white/15 hover:border-white/40 transition-colors font-mono text-[10px] uppercase tracking-widest cursor-pointer">
                    {uploadBusy ? 'Uploading…' : 'Upload'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadBusy}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;

                        setUploadBusy(true);
                        setError(null);
                        setInfo(null);
                        try {
                          const item = await uploadMedia(file);
                          setDraft((d) => ({ ...d, imageUrl: item.url }));
                          await reloadMedia();
                          setInfo('Uploaded');
                        } catch (err: any) {
                          setError(err?.message || 'Upload failed');
                        } finally {
                          setUploadBusy(false);
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => reloadMedia()}
                    disabled={mediaBusy}
                    className="px-4 py-2 rounded-full border border-white/15 hover:border-white/40 disabled:opacity-60 transition-colors font-mono text-[10px] uppercase tracking-widest"
                  >
                    {mediaBusy ? 'Loading…' : 'Refresh'}
                  </button>
                </div>
              </div>

              {media.length > 0 && (
                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {media.slice(0, 36).map((m) => (
                    <button
                      key={m.name}
                      type="button"
                      onClick={() => setDraft((d) => ({ ...d, imageUrl: m.url }))}
                      className={`rounded-xl overflow-hidden border transition-colors ${
                        draft.imageUrl === m.url ? 'border-white/60' : 'border-white/10 hover:border-white/30'
                      }`}
                      title={m.name}
                    >
                      <img src={m.url} className="w-full aspect-square object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </label>

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4">
              {(['iso', 'aperture', 'shutter', 'date'] as const).map((k) => (
                <label key={k} className="block">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-2">{k}</div>
                  <input
                    value={draft.metadata[k]}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, metadata: { ...d.metadata, [k]: e.target.value } }))
                    }
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-white/30"
                    placeholder={k === 'date' ? 'Feb 2026' : ''}
                  />
                </label>
              ))}
            </div>

            <div className="md:col-span-2">
              <div className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-2">Preview</div>
              <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                {draft.imageUrl ? (
                  <img src={draft.imageUrl} className="w-full h-[280px] object-cover" />
                ) : (
                  <div className="w-full h-[280px] flex items-center justify-center text-white/40 font-mono text-xs">
                    No image
                  </div>
                )}
                <div className="p-5">
                  <div className="font-sans font-black text-xl tracking-tight">{draft.title || 'Untitled'}</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-white/50 mt-2">
                    {draft.category}
                  </div>
                </div>
              </div>
              <div className="text-white/50 font-mono text-[10px] uppercase tracking-widest mt-3">
                Metadata: leave all blank to omit, or fill all 4.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
