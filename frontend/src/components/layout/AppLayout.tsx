import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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
          Timeline
        </NavLink>
        <NavLink to="/map" className={({ isActive }) => (isActive ? "active" : "")}>
          Map
        </NavLink>
        <NavLink to="/stats" className={({ isActive }) => (isActive ? "active" : "")}>
          Stats
        </NavLink>
        <NavLink to="/trips/new" className={({ isActive }) => (isActive ? "active" : "")}>
          New
        </NavLink>
      </nav>
    </div>
  );
}
