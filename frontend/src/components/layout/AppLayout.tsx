import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Book = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4.5c2.2-1 5-1 8 .3v14.7c-3-1.3-5.8-1.3-8-.3z" />
    <path d="M20 4.5c-2.2-1-5-1-8 .3v14.7c3-1.3 5.8-1.3 8-.3z" />
  </svg>
);
const Pin = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-6.5-6.1-6.5-11A6.5 6.5 0 0 1 18.5 10c0 4.9-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.3" />
  </svg>
);
const Chart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 20V10M12 20V4M20 20v-7" />
  </svg>
);
const Plus = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <header className="app-header">
        <span className="app-title">Camping Logbook</span>
        {user && (
          <button type="button" onClick={logout} className="logout-button">
            Log out
          </button>
        )}
      </header>

      <main className="app-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          <Book /> Timeline
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => (isActive ? "active" : "")}>
          <Pin /> Map
        </NavLink>
        <NavLink to="/stats" className={({ isActive }) => (isActive ? "active" : "")}>
          <Chart /> Stats
        </NavLink>
        <NavLink to="/trips/new" className={({ isActive }) => (isActive ? "active" : "")}>
          <Plus /> New
        </NavLink>
      </nav>
    </div>
  );
}
