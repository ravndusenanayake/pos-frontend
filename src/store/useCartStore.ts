import { create } from 'zustand';

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  category_id: number;
  product_type: 'FINISHED' | 'RECIPE';
  price: string | number;
  quantity: number;
  image: string | null;
  status: boolean;
  category: Category;
}

export interface CartItem {
  product: Product;
  qty: number;
}

interface CartState {
  cart: CartItem[];
  discount: number;
  paymentMethod: string;
  
  // Actions
  addToCart: (product: Product) => void;
  updateQty: (productId: number, delta: number) => void;
  removeFromCart: (productId: number) => void;
  setDiscount: (discount: number) => void;
  setPaymentMethod: (method: string) => void;
  clearCart: () => void;
  
  // Computed (getters)
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  discount: 0,
  paymentMethod: 'CASH',

  addToCart: (product) => set((state) => {
    const existingIndex = state.cart.findIndex((item) => item.product.id === product.id);
    
    if (existingIndex >= 0) {
      const existing = state.cart[existingIndex];
      // Guard against stock level
      if (product.product_type === 'FINISHED' && existing.qty >= product.quantity) {
        return state; // Do nothing
      }
      
      const newCart = [...state.cart];
      newCart[existingIndex] = { ...existing, qty: existing.qty + 1 };
      return { cart: newCart };
    }
    
    // First item
    if (product.product_type === 'FINISHED' && product.quantity <= 0) {
      return state; // No stock
    }
    return { cart: [...state.cart, { product, qty: 1 }] };
  }),

  updateQty: (productId, delta) => set((state) => {
    const existingIndex = state.cart.findIndex((item) => item.product.id === productId);
    if (existingIndex < 0) return state;

    const existing = state.cart[existingIndex];
    const newQty = existing.qty + delta;

    if (newQty <= 0) {
      return { cart: state.cart.filter((item) => item.product.id !== productId) };
    }

    if (existing.product.product_type === 'FINISHED' && newQty > existing.product.quantity) {
      return state; // Exceeds stock
    }

    const newCart = [...state.cart];
    newCart[existingIndex] = { ...existing, qty: newQty };
    return { cart: newCart };
  }),

  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter((item) => item.product.id !== productId)
  })),

  setDiscount: (discount) => set({ discount: Math.max(0, discount) }),
  
  setPaymentMethod: (method) => set({ paymentMethod: method }),

  clearCart: () => set({ cart: [], discount: 0 }),

  getSubtotal: () => {
    const state = get();
    return state.cart.reduce((sum, item) => sum + Number(item.product.price) * item.qty, 0);
  },

  getTotal: () => {
    const state = get();
    const subtotal = state.getSubtotal();
    return Math.max(0, subtotal - state.discount);
  }
}));
