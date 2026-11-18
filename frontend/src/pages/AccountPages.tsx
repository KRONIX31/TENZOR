import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Empty, ErrorAlert, Loading } from "../components/AsyncState";
import { useToast } from "../contexts/ToastContext";
import { OrderView } from "../components/OrderView";
import { Pagination } from "../components/Pagination";
import { StatusBadge } from "../components/StatusBadge";
import type { Order, OrderBrief, OrderStatus, Page } from "../types/api";
import { formatMoscowDate, money, statusLabels } from "../utils/format";

export function MyOrdersPage() {
  const [status, setStatus] = useState<"" | OrderStatus>(""); const [page, setPage] = useState(1); const [data, setData] = useState<Page<OrderBrief> | null>(null); const [error, setError] = useState<unknown>(null); const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setData(await api.myOrders({ status: status || undefined, page, page_size: 20 })); } catch (reason) { setError(reason); } finally { setLoading(false); } }, [page, status]);
  useEffect(() => { void load(); }, [load]);
  const changeStatus = (nextStatus: "" | OrderStatus) => { setStatus(nextStatus); setPage(1); };
  return <section><div className="split"><div><p className="eyebrow">Личный кабинет</p><h1>Мои заказы</h1></div><label className="inline-field">Статус<select value={status} onChange={(event) => changeStatus(event.target.value as "" | OrderStatus)}><option value="">Все</option>{ORDER_STATUSES.map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></label></div>
    {loading ? <Loading /> : error ? <ErrorAlert error={error} onRetry={() => void load()} /> : data?.items.length === 0 ? <Empty>Заказов с такими условиями нет.</Empty> : <><OrderBriefList items={data?.items ?? []} path="/account/orders" />{data && <Pagination data={data} onChange={setPage} />}</>}
  </section>;
}

export function MyOrderDetailPage() {
  const { id = "" } = useParams(); const { show } = useToast(); const [order, setOrder] = useState<Order | null>(null); const [error, setError] = useState<unknown>(null); const [loading, setLoading] = useState(true); const [cancelling, setCancelling] = useState(false);
  const load = async () => { setLoading(true); setError(null); try { setOrder(await api.myOrder(id)); } catch (reason) { setError(reason); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [id]);
  const cancel = async () => { if (!order) return; setCancelling(true); setError(null); try { setOrder(await api.cancelMyOrder(order.id, order.version)); show("Заказ отменён.", "success"); } catch (reason) { setError(reason); if ((reason as { code?: string }).code === "INVALID_TRANSITION") void load(); } finally { setCancelling(false); } };
  if (loading) return <Loading />; if (error && !order) return <ErrorAlert error={error} onRetry={() => void load()} />; if (!order) return <Empty>Заказ не найден.</Empty>;
  return <section><Link className="back-link" to="/account/orders">← К списку заказов</Link><OrderView order={order} />{order.status === "NEW" && <div className="danger-zone"><h2>Отмена заказа</h2><p>Клиент может отменить только новый заказ.</p><button className="button button--danger" onClick={() => void cancel()} disabled={cancelling}>{cancelling ? "Отменяем…" : "Отменить заказ"}</button>{Boolean(error) && <ErrorAlert error={error} onRetry={() => void load()} />}</div>}</section>;
}

export function OrderBriefList({ items, path }: { items: OrderBrief[]; path: string }) {
  return <ul className="order-brief-list">{items.map((item) => <li key={item.id}><div><Link to={`${path}/${item.id}`}>Заказ № {item.id}</Link><p>{formatMoscowDate(item.pickup_date)} · {item.items_count} поз.</p></div><div><strong>{money(item.total, item.currency)}</strong><StatusBadge status={item.status} /></div></li>)}</ul>;
}

const ORDER_STATUSES: OrderStatus[] = ["NEW", "CONFIRMED", "IN_PRODUCTION", "READY", "COMPLETED", "CANCELLED"];
