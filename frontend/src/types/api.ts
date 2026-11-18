export type Role = "CLIENT" | "STAFF" | "ADMIN";
export type OrderStatus = "NEW" | "CONFIRMED" | "IN_PRODUCTION" | "READY" | "COMPLETED" | "CANCELLED";

export interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown; request_id?: string };
  detail?: Array<{ loc?: Array<string | number>; msg?: string; type?: string }>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface TokenOut {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
}

export interface FillingBrief {
  id: string;
  name: string;
  surcharge_per_kg: string;
}

export interface FillingAdmin extends FillingBrief {
  is_active?: boolean;
}

export interface ProductListItem {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  base_price_per_kg: string;
  weights_g: number[];
}

export interface ProductDetail extends ProductListItem {
  fillings: FillingBrief[];
}

export interface ProductAdmin extends ProductDetail {
  is_active: boolean;
}

export interface Page<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
}

export interface QuoteItemIn {
  product_id: string;
  filling_id: string;
  weight_g: number;
  quantity: number;
}

export interface QuoteItemOut extends QuoteItemIn {
  product_name: string;
  filling_name: string;
  base_price_per_kg: string;
  surcharge_per_kg: string;
  unit_price: string;
  line_total: string;
}

export interface QuoteOut {
  items: QuoteItemOut[];
  total: string;
  currency: string;
}

export interface OrderBrief {
  id: string;
  status: OrderStatus;
  version: number;
  pickup_date: string;
  total: string;
  currency: string;
  created_at: string;
  items_count: number;
}

export interface OrderItem extends QuoteItemOut {}

export interface HistoryEntry {
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  actor_id: string;
  actor_name: string;
  reason: string | null;
  created_at: string;
}

export interface PickupLocation {
  address: string;
  hours: string;
}

export interface Order extends Omit<OrderBrief, "items_count"> {
  phone: string;
  comment: string | null;
  updated_at: string;
  items: OrderItem[];
  history: HistoryEntry[];
  pickup_location: PickupLocation;
}

export interface ProductInput {
  name: string;
  description?: string | null;
  image_url?: string | null;
  base_price_per_kg: string;
  weights_g?: number[];
  filling_ids?: string[];
  is_active: boolean;
}

export interface FillingInput {
  name: string;
  surcharge_per_kg: string;
  is_active: boolean;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: "STAFF";
  is_active: boolean;
}
