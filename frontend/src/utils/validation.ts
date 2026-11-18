import { ApiError } from "../types/api";

export const validName = (value: string) => value.trim().length >= 2 && value.trim().length <= 100;
export const validCatalogName = (value: string) => value.trim().length >= 1 && value.trim().length <= 150;
export const validEmail = (value: string) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const validPassword = (value: string) => value.length >= 10 && value.length <= 128;
export const normalisePhone = (value: string) => value.replace(/[\s()\-]/g, "");
export const validPhone = (value: string) => /^\+\d{10,15}$/.test(normalisePhone(value));
export const validMoney = (value: string, allowZero = false) => {
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(value)) return false;
  const amount = Number(value);
  return Number.isFinite(amount) && amount <= 100000 && (allowZero ? amount >= 0 : amount > 0);
};
export const validImageUrl = (value: string) => !value || (value.length <= 2048 && /^https:\/\/.+/.test(value));

export function fieldErrors(error: unknown) {
  if (!(error instanceof ApiError) || error.status !== 422 || !Array.isArray(error.details)) return {} as Record<string, string>;
  return error.details.reduce<Record<string, string>>((result, item) => {
    if (item && typeof item === "object" && "loc" in item && "msg" in item) {
      const typed = item as { loc?: Array<string | number>; msg?: string };
      const key = typed.loc?.filter((part) => part !== "body").join(".") ?? "form";
      if (typed.msg) result[key] = typed.msg;
    }
    return result;
  }, {});
}
