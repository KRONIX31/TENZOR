import { useEffect, type ReactNode } from "react";
import { ApiError } from "../types/api";
import { useToast } from "../contexts/ToastContext";

export function Loading({ label = "Загрузка…" }: { label?: string }) {
  return <p className="state state--loading" role="status">{label}</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="state state--empty"><p>{children}</p></div>;
}

export function ErrorAlert({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { show } = useToast();
  const apiError = error instanceof ApiError ? error : null;
  const plainError = error instanceof Error ? error : null;
  const friendlyMessage: Record<string, string> = {
    INVALID_CREDENTIALS: "Не удалось войти. Проверьте email и пароль.",
    HTTP_401: "Не удалось войти. Проверьте email и пароль.",
    EMAIL_EXISTS: "Этот email уже зарегистрирован. Войдите или используйте другой адрес.",
    INVALID_CONFIGURATION: "Выбранный вариант изделия больше недоступен. Измените корзину и повторите расчёт.",
    NETWORK_ERROR: "Не получилось связаться с сайтом. Проверьте подключение и попробуйте ещё раз.",
    HTTP_429: "Слишком много попыток. Подождите немного и попробуйте снова.",
  };
  const conflictHint = apiError?.status === 409 ? {
    PRICE_CHANGED: "Стоимость изменилась. Посмотрите обновлённую сумму и подтвердите действие ещё раз.",
    VERSION_CONFLICT: "Заказ уже обновили. Загрузите актуальные данные перед повторной попыткой.",
    IDEMPOTENCY_KEY_REUSED: "Попытка оформления уже обработана. Измените заказ и повторите действие.",
    INVALID_TRANSITION: "Это действие больше недоступно. Обновите данные заказа.",
    ITEM_UNAVAILABLE: "Одна из выбранных конфигураций больше недоступна. Измените корзину и повторите расчёт.",
  }[apiError.code] : undefined;
  const message = [apiError ? (friendlyMessage[apiError.code] ?? apiError.message) : (plainError?.message ?? "Не удалось выполнить действие. Попробуйте ещё раз."), conflictHint].filter(Boolean).join(" ");
  useEffect(() => { if (error) show(message, "error"); }, [error, message, show]);
  return onRetry ? <button className="button button--secondary retry-button" type="button" onClick={onRetry}>Повторить</button> : null;
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "success" | "warning" }) {
  return <div className={`notice notice--${tone}`} role={tone === "warning" ? "alert" : "status"}>{children}</div>;
}
