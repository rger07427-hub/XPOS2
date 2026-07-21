import { create } from 'zustand';
import { CartItem, Product } from '../types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product) => {
    const items = get().items;
    const existing = items.find(i => i.product.id === product.id);
    if (existing) {
      if (existing.quantity >= (product.stock ?? 0)) return;
      set({
        items: items.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      if ((product.stock ?? 0) <= 0) return;
      set({ items: [...items, { product, quantity: 1 }] });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter(i => i.product.id !== productId) });
  },

  updateQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map(i =>
        i.product.id === productId ? { ...i, quantity: qty } : i
      ),
    });
  },

  clearCart: () => set({ items: [] }),

  getTotal: () => {
    return get().items.reduce(
      (sum, i) => sum + i.product.price * i.quantity, 0
    );
  },

  getTotalItems: () => {
    return get().items.reduce((sum, i) => sum + i.quantity, 0);
  },
}));
