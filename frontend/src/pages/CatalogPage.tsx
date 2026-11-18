import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Empty, ErrorAlert, Loading } from "../components/AsyncState";
import { Pagination } from "../components/Pagination";
import type { Page, ProductListItem } from "../types/api";
import { money } from "../utils/format";

function weightVariantLabel(count: number) {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return "вариантов веса";
  if (mod10 === 1) return "вариант веса";
  if (mod10 >= 2 && mod10 <= 4) return "варианта веса";
  return "вариантов веса";
}

function previewDescription(description: string, maxLength = 160) {
  return description.length > maxLength ? `${description.slice(0, maxLength).trimEnd()}…` : description;
}

export function CatalogPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<ProductListItem> | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await api.products({ q: query || undefined, page, page_size: 12 })); }
    catch (reason) { setError(reason); }
    finally { setLoading(false); }
  }, [page, query]);
  useEffect(() => { void load(); }, [load]);
  const submit = (event: React.FormEvent) => { event.preventDefault(); setPage(1); setQuery(search.trim()); };
  return <section>
    <div className="hero"><div><p className="eyebrow">Каталог</p><h1>Изделия на ваш праздник</h1><p>Выберите изделие, вес и начинку — перед подтверждением вы увидите точную стоимость заказа.</p></div></div>
    <form className="search-form" role="search" onSubmit={submit}>
      <label htmlFor="catalog-search">Поиск по названию</label>
      <div><input id="catalog-search" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={150} /><button className="button" type="submit">Найти</button></div>
    </form>
    {loading ? <Loading label="Загружаем каталог…" /> : error ? <ErrorAlert error={error} onRetry={() => void load()} /> : data?.items.length === 0 ? <Empty>По этому запросу ничего не найдено.</Empty> : <>
      <div className="product-grid">{data?.items.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      {data && <Pagination data={data} onChange={setPage} />}
    </>}
  </section>;
}

function ProductCard({ product }: { product: ProductListItem }) {
  return <article className="product-card">
    <div className="product-card__image">{product.image_url ? <img src={product.image_url} alt={product.name} /> : <span aria-hidden="true">🍰</span>}</div>
    <div className="product-card__body"><h2><Link to={`/products/${product.id}`}>{product.name}</Link></h2>
      {product.description && <p>{previewDescription(product.description)}</p>}
      <div className="product-card__meta"><span>от {money(product.base_price_per_kg)} / кг</span><span>{product.weights_g.length} {weightVariantLabel(product.weights_g.length)}</span></div>
      <Link className="button button--secondary" to={`/products/${product.id}`}>Выбрать</Link>
    </div>
  </article>;
}
