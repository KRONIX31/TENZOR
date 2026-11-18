import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ErrorAlert, Notice } from "../components/AsyncState";
import { useAuth } from "../contexts/AuthContext";
import { fieldErrors, validEmail, validName, validPassword } from "../utils/validation";

export function LoginPage() {
  const { login } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState<unknown>(null); const [sending, setSending] = useState(false);
  const state = (location.state as { sessionExpired?: boolean; registered?: boolean } | null);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    if (!email.trim()) { setError(new Error("Введите email.")); return; }
    if (!validEmail(email.trim())) { setError(new Error("Проверьте формат email.")); return; }
    if (!password) { setError(new Error("Введите пароль.")); return; }
    setSending(true);
    try { const user = await login(email.trim(), password); const from = (location.state as { from?: string } | null)?.from; navigate(from ?? (user.role === "CLIENT" ? "/account/orders" : user.role === "STAFF" ? "/staff/orders" : "/admin"), { replace: true }); }
    catch (reason) { setError(reason); } finally { setSending(false); }
  };
  return <section className="auth-card"><p className="eyebrow">Вход</p><h1>С возвращением</h1>{state?.sessionExpired && <Notice tone="warning">Время входа закончилось. Войдите снова.</Notice>}{state?.registered && <Notice tone="success">Аккаунт создан. Теперь можно войти.</Notice>}
    {Boolean(error) && <ErrorAlert error={error} />}<form onSubmit={submit} noValidate><label>Email<input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(null); }} autoComplete="email" aria-invalid={Boolean(error && !validEmail(email.trim()))} required /></label><label>Пароль<input type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(null); }} autoComplete="current-password" aria-invalid={Boolean(error && !password)} required /></label><button className="button" disabled={sending}>{sending ? "Входим…" : "Войти"}</button></form><p>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p></section>;
}

export function RegisterPage() {
  const { register } = useAuth(); const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" }); const [error, setError] = useState<unknown>(null); const [sending, setSending] = useState(false);
  const server = fieldErrors(error);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(null);
    if (!validName(form.name) || !validEmail(form.email) || !validPassword(form.password)) { setError(new Error("Проверьте поля: имя 2–100 символов, пароль 10–128 символов, email до 254 символов.")); return; }
    setSending(true); try { await register(form.name.trim(), form.email.trim(), form.password); navigate("/login", { replace: true, state: { registered: true } }); } catch (reason) { setError(reason); } finally { setSending(false); }
  };
  return <section className="auth-card"><p className="eyebrow">Регистрация</p><h1>Создайте аккаунт</h1><p>Зарегистрируйтесь, чтобы оформлять заказы и следить за их статусом.</p>{Boolean(error) && <ErrorAlert error={error} />}
    <form onSubmit={submit} noValidate><label>Как к вам обращаться?<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} minLength={2} maxLength={100} autoComplete="name" required />{server.name && <small className="field-error">{server.name}</small>}</label><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} maxLength={254} autoComplete="email" required />{server.email && <small className="field-error">{server.email}</small>}</label><label>Придумайте пароль<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={10} maxLength={128} autoComplete="new-password" required /><small>От 10 до 128 символов</small>{server.password && <small className="field-error">{server.password}</small>}</label><button className="button" disabled={sending}>{sending ? "Создаём…" : "Зарегистрироваться"}</button></form><p>Уже зарегистрированы? <Link to="/login">Войти</Link></p></section>;
}
