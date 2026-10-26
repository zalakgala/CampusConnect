import { createContext, useContext, useEffect, useState } from 'react';

const RouterContext = createContext(null);
export function Router({ children }) {
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const navigate = (path) => { window.history.pushState({}, '', path); setPathname(path); window.scrollTo(0, 0); };
  return <RouterContext.Provider value={{ pathname, navigate }}>{children}</RouterContext.Provider>;
}
export function useLocation() { return useContext(RouterContext); }
export function Link({ to, onClick, children, ...props }) {
  const router = useContext(RouterContext);
  return <a href={to} {...props} onClick={(event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); router.navigate(to);
  }}>{children}</a>;
}

