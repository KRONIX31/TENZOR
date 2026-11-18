import type { OrderStatus } from "../types/api";
import { statusLabels } from "../utils/format";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`status status--${status.toLowerCase()}`}>{statusLabels[status]}</span>;
}
