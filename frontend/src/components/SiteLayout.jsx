import { Link, useLocation } from '../router.jsx';

const links = [['Home', '/'], ['Events', '/events'], ['Add event', '/add-event'], ['Contact', '/contact']];

export function Header({ account, onLogout }) {
  const location = useLocation();
  return <header className="site-header"><div className="header-inner wrap">
    <Link to="/" className="wordmark" aria-label="CampusConnect home"><span className="brand-mark" aria-hidden="true"><span className="brand-letters">cc</span><span className="brand-dot" /></span><span>CampusConnect</span></Link>
    <nav aria-label="Main navigation">{links.map(([label, path]) => <Link key={path} to={path} className={location.pathname === path ? 'active' : ''}>{label}</Link>)}</nav>
    <div className="header-account">{account ? <><Link to="/dashboard" className="header-cta">My space <span aria-hidden="true">↗</span></Link><button className="signout-link" type="button" onClick={onLogout}>Sign out</button></> : <Link to="/login" className="header-cta">Student / committee login <span aria-hidden="true">↗</span></Link>}</div>
  </div></header>;
}

export function Footer() {
  return <footer className="site-footer"><div className="wrap footer-inner"><Link to="/" className="wordmark" aria-label="CampusConnect home"><span className="brand-mark" aria-hidden="true"><span className="brand-letters">cc</span><span className="brand-dot" /></span><span>CampusConnect</span></Link><p>A campus feels smaller when we show up.</p><span className="footer-note">Made for the in-between moments · © 2026</span></div></footer>;
}

