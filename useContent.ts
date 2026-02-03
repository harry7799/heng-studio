import { useCallback, useEffect, useState } from 'react';
import type { Project } from './types';
import { PROJECTS } from './constants';

export type SiteContent = {
  features?: {
    admin?: boolean;
    lighting?: boolean;
  };
  site?: {
    brand?: string;
    worksArchiveStart?: number;
  };
  assets?: {
    heroCover?: string;
  };
  projects?: Project[];
};

async function loadContent(): Promise<SiteContent> {
  const res = await fetch('/content.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load content.json (${res.status})`);
  return (await res.json()) as SiteContent;
}

export function useContent() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await loadContent();
      setContent(c);
      if (Array.isArray(c.projects) && c.projects.length > 0) {
        setProjects(c.projects);
      } else {
        setProjects(PROJECTS);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load content');
      setContent(null);
      setProjects(PROJECTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { content, projects, loading, error, refresh };
}
