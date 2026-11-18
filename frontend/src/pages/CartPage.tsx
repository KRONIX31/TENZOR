import { Link } from "react-router-dom";
import { Empty, Notice } from "../components/AsyncState";
import { useCart } from "../contexts/CartContext";

export function CartPage() {
  const { lines, remove, setQuantity, unavailableKeys, removeUnavailable } = useCart();
  const unavailableCount = lines.filter((line) => unavailableKeys.includes(line.key)).length;
  if (!lines.length) return <section><p className="eyebrow">Корзина</p><h1>Корзина пуста</h1><Empty>Добавьте изделия из каталога, чтобы оформить заказ.</Empty><div className="empty-actions"><Link className="button" to="/">Перейти в каталог</Link></div></section>;
  return <section><p className="eyebrow">Корзина</p><h1>Выбранные конфигурации</h1><Notice>Перед подтверждением вы увидите точную стоимость заказа.</Notice>
    {unavailableCount > 0 && <Notice tone="warning"><div className="cart-warning"><span>{unavailableCount === 1 ? "Одна позиция" : `${unavailableCount} позиции`} больше недоступна. Удалите её или выберите замену.</span><button type="button" className="button button--secondary" onClick={removeUnavailable}>Удалить недоступные</button></div></Notice>}
    <ul className="cart-list">{lines.map((line) => { const unavailable = unavailableKeys.includes(line.key); return <li key={line.key} className={`cart-card${unavailable ? " cart-card--unavailable" : ""}`}><Link className="cart-card__image" to={`/products/${line.product_id}`} aria-label={`Открыть карточку изделия «${line.product_name}»`}>{line.image_url ? <img src={line.image_url} alt="" /> : <span aria-hidden="true">🍰</span>}</Link><div><h2><Link to={`/products/${line.product_id}`}>{line.product_name}</Link></h2><p>{line.filling_name} · {line.weight_g} г</p>{unavailable && <p className="unavailable-label">Больше недоступно — выберите замену или удалите позицию.</p>}<Link className="cart-card__details" to={`/products/${line.product_id}`}>Посмотреть изделие</Link></div><div className="cart-card__actions_wrapper"><label className="quantity">Количество<input aria-label={`Количество: ${line.product_name}`} type="number" min={1} max={20} value={line.quantity} onChange={(event) => setQuantity(line.key, Number(event.target.value))} /></label><button type="button" className="button button--danger" onClick={() => remove(line.key)}>Удалить</button></div></li>; })}</ul>
    <div className="split"><p className="muted">Строк: {lines.length} из 20</p><Link className="button" to="/checkout">Перейти к оформлению</Link></div>
  </section>;
}
