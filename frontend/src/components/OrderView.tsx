import type { Order } from "../types/api";
import { formatMoscowDate, formatMoscowDateTime, money, statusLabels } from "../utils/format";
import { StatusBadge } from "./StatusBadge";

export function OrderView({ order }: { order: Order }) {
  return (
    <article className="order-view">
      <header className="split">
        <div><p className="eyebrow">Заказ</p><h1>№ {order.id}</h1></div>
        <StatusBadge status={order.status} />
      </header>
      <dl className="details-grid">
        <div><dt>Самовывоз</dt><dd>{formatMoscowDate(order.pickup_date)}</dd></div>
        <div><dt>Создан</dt><dd>{formatMoscowDateTime(order.created_at)}</dd></div>
        <div><dt>Телефон</dt><dd>{order.phone}</dd></div>
        <div><dt>Версия</dt><dd>{order.version}</dd></div>
        <div className="details-grid__wide"><dt>Точка самовывоза</dt><dd>{order.pickup_location.address}, {order.pickup_location.hours}</dd></div>
        {order.comment && <div className="details-grid__wide"><dt>Комментарий</dt><dd>{order.comment}</dd></div>}
      </dl>
      <section aria-labelledby="order-items"><h2 id="order-items">Состав</h2>
        <ul className="line-list">
          {order.items.map((item) => <li key={`${item.product_id}:${item.filling_id}:${item.weight_g}`}>
            <div><strong>{item.product_name}</strong><span>{item.filling_name}, {item.weight_g} г × {item.quantity}</span></div>
            <strong>{money(item.line_total, order.currency)}</strong>
          </li>)}
        </ul>
        <p className="order-total">Итого: {money(order.total, order.currency)}</p>
      </section>
      <section aria-labelledby="order-history"><h2 id="order-history">История статусов</h2>
        <ol className="history-list">
          {order.history.map((item, index) => <li key={`${item.created_at}:${index}`}>
            <div><StatusBadge status={item.to_status} /><span>{formatMoscowDateTime(item.created_at)}</span></div>
            <p>{item.from_status ? `${statusLabels[item.from_status]} → ${statusLabels[item.to_status]}` : "Заказ создан"} · {item.actor_name}</p>
            {item.reason && <p className="muted">Причина: {item.reason}</p>}
          </li>)}
        </ol>
      </section>
    </article>
  );
}
