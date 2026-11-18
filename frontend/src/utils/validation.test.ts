import { afterEach, describe, expect, it, vi } from "vitest";
import { moscowMinPickupDate } from "./format";
import { normalisePhone, validCatalogName, validEmail, validImageUrl, validMoney, validName, validPassword, validPhone } from "./validation";

describe("ограничения ввода из MVP", () => {
  it("проверяет имя, email и пароль", () => {
    expect(validName("А")).toBe(false);
    expect(validName("Анна")).toBe(true);
    expect(validEmail("anna@example.test")).toBe(true);
    expect(validEmail("anna@")).toBe(false);
    expect(validPassword("123456789")).toBe(false);
    expect(validPassword("1234567890")).toBe(true);
  });

  it("нормализует и проверяет телефон", () => {
    expect(normalisePhone("+7 (999) 123-45-67")).toBe("+79991234567");
    expect(validPhone("+7 (999) 123-45-67")).toBe(true);
    expect(validPhone("79991234567")).toBe(false);
    expect(validPhone("+7999")).toBe(false);
  });

  it("соблюдает денежные, каталожные и URL-ограничения", () => {
    expect(validMoney("0.00")).toBe(false);
    expect(validMoney("0.00", true)).toBe(true);
    expect(validMoney("100000.01")).toBe(false);
    expect(validMoney("1200.50")).toBe(true);
    expect(validCatalogName("Торт")).toBe(true);
    expect(validCatalogName(" ")).toBe(false);
    expect(validImageUrl("https://images.example.test/cake.jpg")).toBe(true);
    expect(validImageUrl("http://images.example.test/cake.jpg")).toBe(false);
  });
});

describe("минимальная дата самовывоза", () => {
  afterEach(() => vi.useRealTimers());

  it("считает два календарных дня в Europe/Moscow", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T21:30:00.000Z")); // 11 января по Москве
    expect(moscowMinPickupDate()).toBe("2026-01-13");
  });
});
