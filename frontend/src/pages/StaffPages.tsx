import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Empty, ErrorAlert, Loading } from "../components/AsyncState";
import { useToast } from "../contexts/ToastContext";
import { OrderView } from "../components/OrderView";
import { Pagination } from "../components/Pagination";
import { OrderBriefList } from "./AccountPages";
import type { ApiError, Order, OrderBrief, OrderStatus, Page } from "../types/api";
import { statusLabels } from "../utils/format";

const statuses: OrderStatus[] = ["NEW", "CONFIRMED", "IN_PRODUCTION", "READY", "COMPLETED", "CANCELLED"];
const forward: Partial<Record<OrderStatus, OrderStatus>> = { NEW: "CONFIRMED", CONFIRMED: "IN_PRODUCTION", IN_PRODUCTION: "READY", READY: "COMPLETED" };

export function StaffQueuePage() {
  const [filters, setFilters] = useState({ status: "" as "" | OrderStatus, pickup_date_from: "", pickup_date_to: "" }); const [submitted, setSubmitted] = useState(filters);
  const [data, setData] = useState<Page<OrderBrief> | null>(null); const [error, setError] = useState<unknown>(null); const [loading, setLoading] = useState(true);
  const load = useCallback(async (page = 1) => { setLoading(true); setError(null); try { setData(await api.staffOrders({ ...submitted, status: submitted.status || undefined, pickup_date_from: submitted.pickup_date_from || undefined, pickup_date_to: submitted.pickup_date_to || undefined, page, page_size: 20 })); } catch (reason) { setError(reason); } finally { setLoading(false); } }, [submitted]);
  useEffect(() => { void load(); }, [load]);
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (filters.pickup_date_from && filters.pickup_date_to && filters.pickup_date_from > filters.pickup_date_to) { setError(new Error("Дата начала не может быть позже даты окончания.")); return; } setSubmitted(filters); };
  return <section><p className="eyebrow">Панель сотрудника</p><h1>Очередь заказов</h1><form className="filter-form" onSubmit={submit}><label>Статус<select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value as "" | OrderStatus })}><option value="">Все статусы</option>{statuses.map((status) => <option value={status} key={status}>{statusLabels[status]}</option>)}</select></label><label>Самовывоз с<input type="date" value={filters.pickup_date_from} onChange={(event) => setFilters({ ...filters, pickup_date_from: event.target.value })} /></label><label>по<input type="date" value={filters.pickup_date_to} onChange={(event) => setFilters({ ...filters, pickup_date_to: event.target.value })} /></label><button className="button">Применить</button></form>
    {loading ? <Loading /> : error ? <ErrorAlert error={error} onRetry={() => void load()} /> : data?.items.length === 0 ? <Empty>Заказов с такими фильтрами нет.</Empty> : <><OrderBriefList items={data?.items ?? []} path="/staff/orders" />{data && <Pagination data={data} onChange={(page) => void load(page)} />}</>}
  </section>;
}

export function StaffOrderPage() {
  const { id = "" } = useParams(); const { show } = useToast(); const [order, setOrder] = useState<Order | null>(null); const [error, setError] = useState<unknown>(null); const [loading, setLoading] = useState(true); const [sending, setSending] = useState(false); const [reason, setReason] = useState("");
  const load = async () => { setLoading(true); setError(null); try { setOrder(await api.staffOrder(id)); } catch (issue) { setError(issue); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [id]);
  const change = async (target: OrderStatus) => {
    if (!order) return;
    const trimmed = reason.trim();
    if (target === "CANCELLED" && (!trimmed || trimmed.length > 500)) { setError(new Error("Укажите причину отмены: от 1 до 500 символов после удаления пробелов.")); return; }
    setSending(true); setError(null);
    try { setOrder(await api.changeStatus(order.id, { version: order.version, target_status: target, reason: target === "CANCELLED" ? trimmed : null })); setReason(""); show("Статус заказа обновлён.", "success"); }
    catch (issue) { setError(issue); const apiError = issue as ApiError; if (apiError.code === "VERSION_CONFLICT") show("Заказ уже изменил другой сотрудник. Загружены актуальные данные.", "warning"); if (apiError.code === "VERSION_CONFLICT" || apiError.code === "INVALID_TRANSITION") void load(); }
    finally { setSending(false); }
  };
  if (loading) return <Loading />; if (error && !order) return <ErrorAlert error={error} onRetry={() => void load()} />; if (!order) return <Empty>Заказ не найден.</Empty>;
  const next = forward[order.status]; const complete = order.status === "COMPLETED" || order.status === "CANCELLED";
  return <section><Link className="back-link" to="/staff/orders">← К очереди</Link><OrderView order={order} />{!complete && <section className="staff-actions" aria-labelledby="staff-actions"><h2 id="staff-actions">Обработка заказа</h2>{next && <button className="button" disabled={sending} onClick={() => void change(next)}>{sending ? "Сохраняем…" : `Перевести в статус «${statusLabels[next]}»`}</button>}<div className="cancel-panel"><label>Причина отмены<textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} rows={3} required /><small>{reason.trim().length}/500</small></label><button className="button button--danger" disabled={sending || !reason.trim()} onClick={() => void change("CANCELLED")}>Отменить заказ</button></div>{Boolean(error) && <ErrorAlert error={error} onRetry={() => void load()} />}</section>}</section>;
}
