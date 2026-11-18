import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Empty, ErrorAlert, Loading } from "../components/AsyncState";
import { useCart } from "../contexts/CartContext";
import { useToast } from "../contexts/ToastContext";
import type { ProductDetail } from "../types/api";
import { money } from "../utils/format";

export function ProductPage() {
  const { id = "" } = useParams();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [weight, setWeight] = useState("");
  const [filling, setFilling] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();
  const { add } = useCart();
  const load = async () => {
    setLoading(true); setError(null);
    try {
      const next = await api.product(id); setProduct(next);
      setWeight(String(next.weights_g[0] ?? "")); setFilling(next.fillings[0]?.id ?? "");
    } catch (reason) { setError(reason); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [id]);
  if (loading) return <Loading label="Загружаем изделие…" />;
  if (error) return <ErrorAlert error={error} onRetry={() => void load()} />;
  if (!product) return <Empty>Изделие не найдено.</Empty>;
  const orderable = product.weights_g.length > 0 && product.fillings.length > 0;
  const addToCart = () => {
    const selected = product.fillings.find((item) => item.id === filling);
    if (!selected || !weight) return;
    const ok = add({ product_id: product.id, filling_id: selected.id, weight_g: Number(weight), product_name: product.name, filling_name: selected.name, image_url: product.image_url });
    show(ok ? "Изделие добавлено в корзину." : "В корзине может быть до 20 разных позиций и до 20 штук каждой позиции.", ok ? "success" : "warning");
  };
  return <article className="product-detail">
    <div className="product-detail__image">{product.image_url ? <img src={product.image_url} alt={product.name} /> : <span aria-hidden="true">🍰</span>}</div>
    <div><Link className="back-link" to="/">← В каталог</Link><p className="eyebrow">Изделие</p><h1>{product.name}</h1>
      {product.description && <p className="lead">{product.description}</p>}<p className="price">{money(product.base_price_per_kg)} / кг</p>
      {!orderable ? <Empty>Изделие сейчас недоступно для заказа.</Empty> : <div className="configurator">
        <label>Вес, г<select value={weight} onChange={(event) => setWeight(event.target.value)}>{product.weights_g.map((value) => <option value={value} key={value}>{value} г</option>)}</select></label>
        <label>Начинка<select value={filling} onChange={(event) => setFilling(event.target.value)}>{product.fillings.map((item) => <option value={item.id} key={item.id}>{item.name} (+{money(item.surcharge_per_kg)} / кг)</option>)}</select></label>
        <button type="button" className="button" onClick={addToCart}>Добавить в корзину</button>
      </div>}
    </div>
  </article>;
}
