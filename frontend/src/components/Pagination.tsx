import type { Page } from "../types/api";

export function Pagination({ data, onChange }: { data: Page<unknown>; onChange: (page: number) => void }) {
  if (data.total <= data.page_size) return null;
  const pageCount = Math.ceil(data.total / data.page_size);
  return (
    <nav className="pagination" aria-label="Страницы списка">
      <button type="button" className="button button--secondary" disabled={data.page <= 1} onClick={() => onChange(data.page - 1)}>Назад</button>
      <span aria-live="polite">Страница {data.page} из {pageCount}</span>
      <button type="button" className="button button--secondary" disabled={data.page >= pageCount} onClick={() => onChange(data.page + 1)}>Вперёд</button>
    </nav>
  );
}
