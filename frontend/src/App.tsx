import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";
import { ToastProvider } from "./contexts/ToastContext";
import { MyOrderDetailPage, MyOrdersPage } from "./pages/AccountPages";
import { AdminPage } from "./pages/AdminPage";
import { LoginPage, RegisterPage } from "./pages/AuthPage";
import { CartPage } from "./pages/CartPage";
import { CatalogPage } from "./pages/CatalogPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { ProductPage } from "./pages/ProductPage";
import { StaffOrderPage, StaffQueuePage } from "./pages/StaffPages";

function NotFoundPage() {
  return <section><p className="eyebrow">404</p><h1>Страница не найдена</h1><p>Возможно, ссылка устарела или введена с ошибкой.</p></section>;
}

export default function App() {
  return <BrowserRouter><AuthProvider><CartProvider><ToastProvider><AppLayout><Routes>
    <Route path="/" element={<CatalogPage />} />
    <Route path="/products/:id" element={<ProductPage />} />
    <Route path="/cart" element={<CartPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route element={<ProtectedRoute roles={["CLIENT"]} />}>
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/account/orders" element={<MyOrdersPage />} />
      <Route path="/account/orders/:id" element={<MyOrderDetailPage />} />
    </Route>
    <Route element={<ProtectedRoute roles={["STAFF", "ADMIN"]} />}>
      <Route path="/staff/orders" element={<StaffQueuePage />} />
      <Route path="/staff/orders/:id" element={<StaffOrderPage />} />
    </Route>
    <Route element={<ProtectedRoute roles={["ADMIN"]} />}><Route path="/admin" element={<AdminPage />} /></Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes></AppLayout></ToastProvider></CartProvider></AuthProvider></BrowserRouter>;
}
