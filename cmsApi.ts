import type { Project } from './types';

export type ProjectCreateInput = Omit<Project, 'id'>;

function getAdminToken(): string | null {
  try {
    const v = localStorage.getItem('hengstudio_admin_token');
    return v && v.trim().length > 0 ? v.trim() : null;
  } catch {
    return null;
  }
}

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'X-Admin-Token': token } : {}),
      ...(init?.headers || {})
    },
    ...init
  });

  if (!res.ok) {
    let body: any = undefined;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    const msg = body?.error || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  return (await res.json()) as T;
}

export async function listProjects(): Promise<Project[]> {
  return await http<Project[]>('/api/projects');
}

export async function createProject(input: ProjectCreateInput): Promise<Project> {
  return await http<Project>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(input)
  });
}

export async function updateProject(id: string, input: ProjectCreateInput): Promise<Project> {
  return await http<Project>(`/api/projects/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(input)
  });
}

export async function deleteProject(id: string): Promise<{ ok: true } & { deleted: Project } | { ok: true }>{
  return await http(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export type MediaItem = {
  name: string;
  url: string;
  size: number;
  mtimeMs: number;
};

export async function listMedia(): Promise<MediaItem[]> {
  return await http<MediaItem[]>('/api/media');
}

export async function uploadMedia(file: File): Promise<MediaItem> {
  const form = new FormData();
  form.append('file', file);

  const token = getAdminToken();

  const res = await fetch('/api/uploads', {
    method: 'POST',
    headers: token ? { 'X-Admin-Token': token } : undefined,
    body: form
  });

  if (!res.ok) {
    let body: any = undefined;
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    const msg = body?.error || `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }

  const data = (await res.json()) as { ok: true; item: MediaItem };
  return data.item;
}
