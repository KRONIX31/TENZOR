import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

const linkClass = ({ isActive }: { isActive: boolean }) => isActive ? "nav-link nav-link--active" : "nav-link";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { lines } = useCart();
  const navigate = useNavigate();
  const logoutAndGoHome = () => { logout(); navigate("/"); };
  return <div className="app-shell">
    <a className="skip-link" href="#main">Перейти к содержимому</a>
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink className="brand" to="/">Кондитерская<span>заказ · самовывоз</span></NavLink>
        <nav aria-label="Главная навигация" className="main-nav">
          <NavLink className={linkClass} to="/">Каталог</NavLink>
          <NavLink className={linkClass} to="/cart">Корзина{lines.length > 0 ? ` (${lines.length})` : ""}</NavLink>
          {user?.role === "CLIENT" && <NavLink className={linkClass} to="/account/orders">Мои заказы</NavLink>}
          {(user?.role === "STAFF" || user?.role === "ADMIN") && <NavLink className={linkClass} to="/staff/orders">Очередь</NavLink>}
          {user?.role === "ADMIN" && <NavLink className={linkClass} to="/admin">Администрирование</NavLink>}
        </nav>
        <div className="account-nav">
          {user ? <><span className="user-name">{user.name}</span><button className="button button--text" onClick={logoutAndGoHome}>Выйти</button></> : <>
            <NavLink className="button button--text" to="/login">Войти</NavLink><NavLink className="button" to="/register">Регистрация</NavLink>
          </>}
        </div>
      </div>
    </header>
    <main id="main" className="page-content">{children}</main>
    <footer className="site-footer"><div><strong>Кондитерская</strong><span>Сладкие заказы к вашим важным дням</span></div><p>Выберите изделие онлайн — статус заказа всегда под рукой.</p></footer>
  </div>;
}
