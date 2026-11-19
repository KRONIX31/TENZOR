import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Empty, ErrorAlert, Notice } from "../components/AsyncState";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import type { ApiError, QuoteOut } from "../types/api";
import { moscowMinPickupDate, money } from "../utils/format";
import { fieldErrors, normalisePhone, validPhone } from "../utils/validation";

type CreatePayload = { items: Array<{ product_id: string; filling_id: string; weight_g: number; quantity: number }>; expected_total: string; phone: string; pickup_date: string; comment: string | null };
type Attempt = { key: string; payload: CreatePayload; signature: string };
type CheckoutForm = { phone: string; pickup_date: string; comment: string };

function validateCheckout(form: CheckoutForm) {
  const errors: Partial<Record<keyof CheckoutForm, string>> = {};
  const earliestPickup = moscowMinPickupDate();
  if (!form.phone.trim()) errors.phone = "Введите телефон для связи.";
  else if (!validPhone(form.phone)) errors.phone = "Введите телефон в формате + и 10–15 цифр.";
  if (!form.pickup_date) errors.pickup_date = "Выберите дату самовывоза.";
  else if (form.pickup_date < earliestPickup) errors.pickup_date = `Выберите дату не раньше ${earliestPickup.split("-").reverse().join(".")}.`;
  if (form.comment.length > 1000) errors.comment = "Комментарий не должен быть длиннее 1000 символов.";
  return errors;
}

export function CheckoutPage() {
  const { lines, clear, markUnavailable, clearUnavailable, unavailableKeys } = useCart(); const { show } = useToast(); const navigate = useNavigate();
  const [form, setForm] = useState({ phone: "", pickup_date: moscowMinPickupDate(), comment: "" });
  const [quote, setQuote] = useState<QuoteOut | null>(null); const [quoteError, setQuoteError] = useState<unknown>(null); const [createError, setCreateError] = useState<unknown>(null);
  const [quoting, setQuoting] = useState(false); const [sending, setSending] = useState(false); const [attempt, setAttempt] = useState<Attempt | null>(null); const [priceChanged, setPriceChanged] = useState(false);
  const [localErrors, setLocalErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({});
  const items = useMemo(() => lines.map(({ product_id, filling_id, weight_g, quantity }) => ({ product_id, filling_id, weight_g, quantity })), [lines]);
  const basketSignature = JSON.stringify(items);
  const previousSignature = useRef(basketSignature);
  useEffect(() => {
    if (previousSignature.current !== basketSignature) { previousSignature.current = basketSignature; setQuote(null); setAttempt(null); setPriceChanged(false); setQuoteError(null); }
  }, [basketSignature]);
  const markUnavailableFromError = useCallback((reason: unknown) => {
    const apiError = reason as ApiError;
    if (apiError.code !== "ITEM_UNAVAILABLE" && apiError.code !== "INVALID_CONFIGURATION") return;
    const details = apiError.details as { product_id?: string; filling_id?: string; weight_g?: number } | undefined;
    const affected = items.filter((item) => !details || ((!details.product_id || item.product_id === details.product_id) && (!details.filling_id || item.filling_id === details.filling_id) && (!details.weight_g || item.weight_g === details.weight_g))).map((item) => `${item.product_id}:${item.filling_id}:${item.weight_g}`);
    markUnavailable(affected);
  }, [items, markUnavailable]);
  const quoteOrder = useCallback(async () => {
    setQuoting(true); setQuoteError(null); setCreateError(null);
    try { setQuote(await api.quote(items)); setAttempt(null); clearUnavailable(); }
    catch (reason) { markUnavailableFromError(reason); setQuoteError(reason); }
    finally { setQuoting(false); }
  }, [clearUnavailable, items, markUnavailableFromError]);
  useEffect(() => { void quoteOrder(); }, [basketSignature]);
  if (!lines.length) return <section><p className="eyebrow">Оформление</p><h1>Корзина пуста</h1><Empty>Сначала добавьте хотя бы одну конфигурацию.</Empty><div className="empty-actions"><Link className="button" to="/">В каталог</Link></div></section>;
  const serverFields = fieldErrors(createError ?? quoteError);
  const errors = { ...serverFields, ...localErrors };
  const submit = async () => {
    setCreateError(null);
    const nextErrors = validateCheckout(form);
    setLocalErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    if (!quote) { setCreateError(new Error("Сначала рассчитайте стоимость заказа.")); return; }
    const payload: CreatePayload = { items, expected_total: quote.total, phone: normalisePhone(form.phone), pickup_date: form.pickup_date, comment: form.comment.trim() || null };
    const signature = JSON.stringify(payload);
    const currentAttempt = attempt && attempt.signature === signature ? attempt : { key: crypto.randomUUID(), payload, signature };
    if (!attempt || attempt.signature !== signature) setAttempt(currentAttempt);
    setSending(true);
    try { const order = await api.createOrder(currentAttempt.payload, currentAttempt.key); clear(); show("Заказ оформлен.", "success"); navigate(`/account/orders/${order.id}`, { replace: true }); }
    catch (reason) {
      const apiError = reason as ApiError;
      if (apiError?.code === "PRICE_CHANGED") {
        const details = apiError.details as QuoteOut | undefined;
        if (details && Array.isArray(details.items) && typeof details.total === "string") setQuote(details);
        setAttempt(null); setPriceChanged(true);
      }
      if (apiError?.code === "ITEM_UNAVAILABLE" || apiError?.code === "INVALID_CONFIGURATION") {
        markUnavailableFromError(reason);
        show("Недоступные позиции отмечены в корзине. Выберите замену или удалите их.", "warning");
        navigate("/cart");
      }
      setCreateError(reason);
    } finally { setSending(false); }
  };
  return <section className="checkout"><p className="eyebrow">Оформление</p><h1>Самовывоз</h1><p>Получение не ранее чем через два календарных дня по Москве. Время согласуется при выдаче.</p>
    <div className="checkout-grid"><form className="form-card" onSubmit={(event) => { event.preventDefault(); void submit(); }} noValidate>
      <label>Телефон<input value={form.phone} onChange={(event) => { setForm({ ...form, phone: event.target.value }); setAttempt(null); setLocalErrors({ ...localErrors, phone: undefined }); }} placeholder="+7 999 123-45-67" inputMode="tel" maxLength={32} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "phone-error" : undefined} required />{errors.phone && <small id="phone-error" className="field-error">{errors.phone}</small>}</label>
      <label>Дата самовывоза<input type="date" value={form.pickup_date} min={moscowMinPickupDate()} onChange={(event) => { setForm({ ...form, pickup_date: event.target.value }); setAttempt(null); setLocalErrors({ ...localErrors, pickup_date: undefined }); }} aria-invalid={Boolean(errors.pickup_date)} aria-describedby={errors.pickup_date ? "pickup-date-error" : undefined} required />{errors.pickup_date && <small id="pickup-date-error" className="field-error">{errors.pickup_date}</small>}</label>
      <label>Комментарий <span className="muted">(необязательно)</span><textarea value={form.comment} onChange={(event) => { setForm({ ...form, comment: event.target.value }); setAttempt(null); setLocalErrors({ ...localErrors, comment: undefined }); }} maxLength={1000} rows={4} aria-invalid={Boolean(errors.comment)} aria-describedby={errors.comment ? "comment-error" : undefined} /><small>{form.comment.length}/1000</small>{errors.comment && <small id="comment-error" className="field-error">{errors.comment}</small>}</label>
      <div className="form-actions"><button className="button button--secondary" type="button" onClick={() => void quoteOrder()} disabled={quoting}>{quoting ? "Считаем стоимость…" : quote ? "Обновить стоимость" : "Рассчитать стоимость"}</button><button className="button" disabled={sending || !quote}>{sending ? "Оформляем…" : priceChanged ? "Подтвердить новую сумму" : attempt ? "Повторить оформление" : "Подтвердить заказ"}</button></div>
      {priceChanged && <Notice tone="warning">Стоимость изменилась. Проверьте новую сумму и подтвердите заказ ещё раз.</Notice>}
      {unavailableKeys.length > 0 && <Notice tone="warning">В корзине отмечены недоступные позиции. <Link to="/cart">Перейти к корзине</Link></Notice>}
      {Boolean(quoteError) && <ErrorAlert error={quoteError} onRetry={() => void quoteOrder()} />}{Boolean(createError) && <ErrorAlert error={createError} onRetry={attempt ? () => void submit() : undefined} />}
    </form>
    <aside className="quote-card" aria-live="polite"><h2>Состав и стоимость</h2>{quote ? <><ul className="line-list">{quote.items.map((item) => <li key={`${item.product_id}:${item.filling_id}:${item.weight_g}`}><div><span>{item.product_name}, {item.filling_name} · {item.weight_g} г × {item.quantity}</span><small className="price-breakdown">Основа: {money(item.base_price_per_kg, quote.currency)}/кг · начинка: +{money(item.surcharge_per_kg, quote.currency)}/кг · цена за изделие: {money(item.unit_price, quote.currency)}</small></div><strong>{money(item.line_total, quote.currency)}</strong></li>)}</ul><p className="order-total">Итого: {money(quote.total, quote.currency)}</p><p className="muted">Сумма рассчитана с учётом выбранных веса и начинки.</p></> : <p>{quoting ? "Рассчитываем стоимость…" : "Стоимость появится здесь автоматически."}</p>}</aside>
    </div>
  </section>;
}
