import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { QuoteItemIn } from "../types/api";

export interface CartLine extends QuoteItemIn {
  key: string;
  product_name: string;
  filling_name: string;
  image_url: string | null;
}

interface CartValue {
  lines: CartLine[];
  add(line: Omit<CartLine, "key" | "quantity">, quantity?: number): boolean;
  setQuantity(key: string, quantity: number): void;
  remove(key: string): void;
  clear(): void;
  unavailableKeys: string[];
  markUnavailable(keys: string[]): void;
  clearUnavailable(): void;
  removeUnavailable(): void;
}

const CartContext = createContext<CartValue | null>(null);
const makeKey = (line: Pick<CartLine, "product_id" | "filling_id" | "weight_g">) => `${line.product_id}:${line.filling_id}:${line.weight_g}`;
const storageKey = "konditerskaya:cart:v1";

function readStoredLines(): CartLine[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((line): line is CartLine => Boolean(line && typeof line === "object" && typeof (line as CartLine).key === "string" && typeof (line as CartLine).product_id === "string" && typeof (line as CartLine).filling_id === "string" && Number.isInteger((line as CartLine).weight_g) && Number.isInteger((line as CartLine).quantity) && (line as CartLine).quantity >= 1 && (line as CartLine).quantity <= 20)).slice(0, 20).map((line) => ({ ...line, image_url: typeof line.image_url === "string" ? line.image_url : null }));
  } catch { return []; }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readStoredLines);
  const [unavailableKeys, setUnavailableKeys] = useState<string[]>([]);
  useEffect(() => {
    try { window.localStorage.setItem(storageKey, JSON.stringify(lines)); } catch { /* Cart remains available for this session. */ }
  }, [lines]);
  const add = useCallback((line: Omit<CartLine, "key" | "quantity">, quantity = 1) => {
    const key = makeKey(line);
    const found = lines.find((item) => item.key === key);
    if (found ? found.quantity + quantity > 20 : lines.length >= 20 || quantity < 1 || quantity > 20) return false;
    setLines((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) {
        return current.map((item) => item.key === key ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...current, { ...line, key, quantity }];
    });
    setUnavailableKeys((current) => current.filter((item) => item !== key));
    return true;
  }, [lines]);
  const value = useMemo<CartValue>(() => ({
    lines,
    add,
    setQuantity(key, quantity) {
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return;
      setLines((current) => current.map((line) => line.key === key ? { ...line, quantity } : line));
    },
    remove(key) {
      setLines((current) => current.filter((line) => line.key !== key));
      setUnavailableKeys((current) => current.filter((item) => item !== key));
    },
    clear() { setLines([]); setUnavailableKeys([]); },
    unavailableKeys,
    markUnavailable(keys) { setUnavailableKeys((current) => [...new Set([...current, ...keys])]); },
    clearUnavailable() { setUnavailableKeys([]); },
    removeUnavailable() { setLines((current) => current.filter((line) => !unavailableKeys.includes(line.key))); setUnavailableKeys([]); },
  }), [add, lines, unavailableKeys]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used under CartProvider");
  return context;
}
