
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const Admin = React.lazy(() => import('./Admin'));
const LightingSimulator3D = React.lazy(() => import('./LightingSimulator3D'));
const KunquPage = React.lazy(() => import('./KunquPage'));
const WeddingPage = React.lazy(() => import('./WeddingPage'));
const IntimacyPage = React.lazy(() => import('./IntimacyPage'));
let GalleryAdmin: React.LazyExoticComponent<React.ComponentType<any>> | null = null;
let PageManager: React.LazyExoticComponent<React.ComponentType<any>> | null = null;
let FashionWallAdmin: React.LazyExoticComponent<React.ComponentType<any>> | null = null;
if (import.meta.env.DEV) {
  GalleryAdmin = React.lazy(() => import('./GalleryAdmin'));
  PageManager = React.lazy(() => import('./PageManager'));
  FashionWallAdmin = React.lazy(() => import('./FashionWallAdmin'));
}

function getRoute() {
  const hash = window.location.hash || '';
  if (hash.startsWith('#/')) return hash.slice(1);
  const path = window.location.pathname.replace(/\/+$/, '');
  return path || '/';
}

function routeStartsWith(route: string, prefix: string) {
  return route === prefix || route.startsWith(`${prefix}/`);
}

function useRoute() {
  const [route, setRoute] = React.useState<string>(() => getRoute());

  React.useEffect(() => {
    const onChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onChange);
    window.addEventListener('popstate', onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener('popstate', onChange);
    };
  }, []);

  return route;
}

function Root() {
  const route = useRoute();
  if (import.meta.env.DEV && GalleryAdmin && routeStartsWith(route, '/gallery-admin')) {
    return (
      <React.Suspense fallback={null}>
        <GalleryAdmin />
      </React.Suspense>
    );
  }
  if (import.meta.env.DEV && PageManager && routeStartsWith(route, '/page-manager')) {
    return (
      <React.Suspense fallback={null}>
        <PageManager />
      </React.Suspense>
    );
  }
  if (import.meta.env.DEV && FashionWallAdmin && routeStartsWith(route, '/fashion-wall-admin')) {
    return (
      <React.Suspense fallback={null}>
        <FashionWallAdmin />
      </React.Suspense>
    );
  }
  if (routeStartsWith(route, '/admin')) return <RouteBoundary><Admin /></RouteBoundary>;
  if (routeStartsWith(route, '/lighting')) return <RouteBoundary><LightingSimulator3D /></RouteBoundary>;
  if (routeStartsWith(route, '/kunqu')) return <RouteBoundary><KunquPage /></RouteBoundary>;
  if (routeStartsWith(route, '/wedding')) return <RouteBoundary><WeddingPage /></RouteBoundary>;
  if (routeStartsWith(route, '/intimacy')) return <RouteBoundary><IntimacyPage /></RouteBoundary>;
  return <App />;
}

function RouteBoundary({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F7F4EF] text-sm text-stone-500">
          載入中
        </div>
      }
    >
      {children}
    </React.Suspense>
  );
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
