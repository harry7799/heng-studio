import { useContent } from './useContent';

export function useProjects() {
  const { projects, loading, error, refresh } = useContent();
  return { projects, loading, error, refresh };
}
