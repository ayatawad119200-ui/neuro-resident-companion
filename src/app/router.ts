import { useEffect, useState } from 'react';

export type Route =
  | { name: 'cases' }
  | { name: 'caseNew' }
  | { name: 'caseEdit'; id: string }
  | { name: 'case'; id: string }
  | { name: 'casePrint'; id: string }
  | { name: 'clinical'; tab: 'scores' | 'algorithms' }
  | { name: 'drugs' }
  | { name: 'sources' }
  | { name: 'settings' };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  const parts = path.split('/').filter(Boolean).map((part) => decodeURIComponent(part));

  const [first, second, third] = parts;

  if (!first || first === 'cases') {
    if (second === 'new') return { name: 'caseNew' };
    if (second && third === 'edit') return { name: 'caseEdit', id: second };
    if (second && third === 'print') return { name: 'casePrint', id: second };
    if (second) return { name: 'case', id: second };
    return { name: 'cases' };
  }

  if (first === 'clinical') {
    return { name: 'clinical', tab: second === 'algorithms' ? 'algorithms' : 'scores' };
  }
  if (first === 'drugs') return { name: 'drugs' };
  if (first === 'sources') return { name: 'sources' };
  if (first === 'settings') return { name: 'settings' };

  return { name: 'cases' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

export function navigate(path: string): void {
  window.location.hash = path;
}
