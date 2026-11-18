import { session, unauthorizedEvent } from "./session";
import type {
  FillingAdmin,
  FillingInput,
  Order,
  OrderBrief,
  OrderStatus,
  Page,
  ProductAdmin,
  ProductDetail,
  ProductInput,
  ProductListItem,
  QuoteItemIn,
  QuoteOut,
  Staff,
  TokenOut,
  User,
} from "../types/api";
import { ApiError, type ApiErrorBody } from "../types/api";

const baseUrl = (import.meta.env.VITE_API_URL ?? "/api/v1").replace(/\/$/, "");

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  skipAuthRedirect?: boolean;
};

function makeUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(`${baseUrl}${path}`, window.location.origin);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function fallbackMessage(status: number) {
  if (status === 400) return "Некорректный запрос.";
  if (status === 401) return "Сеанс истёк. Войдите снова.";
  if (status === 403) return "У вас нет прав для этого действия.";
  if (status === 404) return "Объект не найден.";
  if (status === 409) return "Данные успели измениться. Обновите страницу и попробуйте снова.";
  if (status === 422) return "Проверьте заполнение полей.";
  if (status === 429) return "Слишком много запросов. Попробуйте позже.";
  return "Сервис временно недоступен. Попробуйте ещё раз.";
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, skipAuthRedirect, headers, ...init } = options;
  const token = session.token;
  let response: Response;
  try {
    response = await fetch(makeUrl(path, query), {
      ...init,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Не получилось связаться с сайтом. Попробуйте ещё раз.");
  }

  const text = await response.text();
  let data: unknown = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }

  if (!response.ok) {
    const payload = (data ?? {}) as ApiErrorBody;
    const apiError = payload.error;
    const error = new ApiError(
      response.status,
      apiError?.code ?? `HTTP_${response.status}`,
      apiError?.message ?? fallbackMessage(response.status),
      apiError?.details ?? payload.detail,
      apiError?.request_id,
    );
    if (response.status === 401 && !skipAuthRedirect) {
      session.clear();
      window.dispatchEvent(new Event(unauthorizedEvent));
    }
    throw error;
  }

  return data as T;
}

function normaliseFillings(value: unknown): FillingAdmin[] {
  if (Array.isArray(value)) return value as FillingAdmin[];
  if (value && typeof value === "object" && Array.isArray((value as { items?: unknown[] }).items)) {
    return (value as { items: FillingAdmin[] }).items;
  }
  return [];
}

export const api = {
  register: (body: { name: string; email: string; password: string }) =>
    request<User>("/auth/register", { method: "POST", body, skipAuthRedirect: true }),
  login: (body: { email: string; password: string }) =>
    request<TokenOut>("/auth/login", { method: "POST", body, skipAuthRedirect: true }),
  me: () => request<User>("/users/me"),

  products: (query: { q?: string; page?: number; page_size?: number }) =>
    request<Page<ProductListItem>>("/products", { query }),
  product: (id: string) => request<ProductDetail>(`/products/${id}`),

  quote: (items: QuoteItemIn[]) => request<QuoteOut>("/orders/quote", { method: "POST", body: { items } }),
  createOrder: (
    body: { items: QuoteItemIn[]; expected_total: string; phone: string; pickup_date: string; comment?: string | null },
    idempotencyKey: string,
  ) => request<Order>("/orders", { method: "POST", body, headers: { "Idempotency-Key": idempotencyKey } }),
  myOrders: (query: { status?: OrderStatus; page?: number; page_size?: number }) =>
    request<Page<OrderBrief>>("/orders/my", { query }),
  myOrder: (id: string) => request<Order>(`/orders/my/${id}`),
  cancelMyOrder: (id: string, version: number) =>
    request<Order>(`/orders/my/${id}/cancel`, { method: "POST", body: { version } }),

  staffOrders: (query: { status?: OrderStatus; pickup_date_from?: string; pickup_date_to?: string; page?: number; page_size?: number }) =>
    request<Page<OrderBrief>>("/staff/orders", { query }),
  staffOrder: (id: string) => request<Order>(`/staff/orders/${id}`),
  changeStatus: (id: string, body: { version: number; target_status: OrderStatus; reason?: string | null }) =>
    request<Order>(`/staff/orders/${id}/status`, { method: "POST", body }),

  adminProducts: (query: { q?: string; page?: number; page_size?: number }) =>
    request<Page<ProductAdmin>>("/admin/products", { query }),
  createProduct: (body: ProductInput) => request<ProductAdmin>("/admin/products", { method: "POST", body }),
  updateProduct: (id: string, body: Partial<ProductInput>) =>
    request<ProductAdmin>(`/admin/products/${id}`, { method: "PATCH", body }),
  adminFillings: async () => normaliseFillings(await request<unknown>("/admin/fillings")),
  createFilling: (body: FillingInput) => request<FillingAdmin>("/admin/fillings", { method: "POST", body }),
  updateFilling: (id: string, body: Partial<FillingInput>) =>
    request<FillingAdmin>(`/admin/fillings/${id}`, { method: "PATCH", body }),
  createStaff: (body: { name: string; email: string; password: string }) =>
    request<Staff>("/admin/staff", { method: "POST", body }),
  adminStaff: (query: { page?: number; page_size?: number }) =>
    request<Page<Staff>>("/admin/staff", { query }),
  blockStaff: (id: string) => request<Staff>(`/admin/staff/${id}/block`, { method: "PATCH" }),
  unblockStaff: (id: string) => request<Staff>(`/admin/staff/${id}/unblock`, { method: "PATCH" }),
};
