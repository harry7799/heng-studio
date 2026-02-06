
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Admin from './Admin';
import LightingSimulator3D from './LightingSimulator3D';
import KunquPage from './KunquPage';
import WeddingPage from './WeddingPage';
import IntimacyPage from './IntimacyPage';

let GalleryAdmin: React.LazyExoticComponent<React.ComponentType<any>> | null = null;
if (import.meta.env.DEV) {
  GalleryAdmin = React.lazy(() => import('./GalleryAdmin'));
}

function useHashRoute() {
  const [hash, setHash] = React.useState<string>(() => window.location.hash || '#/');

  React.useEffect(() => {
    const onChange = () => setHash(window.location.hash || '#/');
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return hash;
}

function Root() {
  const hash = useHashRoute();
  if (import.meta.env.DEV && GalleryAdmin && hash.startsWith('#/gallery-admin')) {
    return (
      <React.Suspense fallback={null}>
        <GalleryAdmin />
      </React.Suspense>
    );
  }
  if (hash.startsWith('#/admin')) return <Admin />;
  if (hash.startsWith('#/lighting')) return <LightingSimulator3D />;
  if (hash.startsWith('#/kunqu')) return <KunquPage />;
  if (hash.startsWith('#/wedding')) return <WeddingPage />;
  if (hash.startsWith('#/intimacy')) return <IntimacyPage />;
  return <App />;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
