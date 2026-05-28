'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, RefreshCw, Trash2, Plus, Minus, CreditCard, ShieldCheck, Search, Printer } from 'lucide-react';

interface Category {
  id: number;
  name: string;
}

interface Product {
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

interface SuccessInvoiceItem {
  id: number;
  qty: number;
  product?: { name: string };
  total: string | number;
}

interface SuccessInvoice {
  invoice_no: string;
  cashier?: { name: string; email: string };
  created_at: string | Date;
  items?: SuccessInvoiceItem[];
  subtotal: string | number;
  discount: string | number;
  total: string | number;
}

export default function PosPage() {
  const { user, token } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const { 
    cart, discount, paymentMethod, 
    addToCart, updateQty, removeFromCart, setDiscount, setPaymentMethod, clearCart, 
    getSubtotal, getTotal 
  } = useCartStore();

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState<SuccessInvoice | null>(null);

  const fetchCatalog = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('http://localhost:3000/api/products', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('http://localhost:3000/api/categories', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (!prodRes.ok) throw new Error('Failed to load products');
      
      const prodData = await prodRes.json();
      setProducts(prodData.filter((p: Product) => p.status)); 

      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData.filter((c: { status: boolean }) => c.status));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === null || p.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleCheckout = async () => {
    if (!token || !user || cart.length === 0) return;

    setCheckoutLoading(true);
    setError(null);
    setSuccessInvoice(null);

    const payload = {
      cashier_id: user.id,
      payment_method: paymentMethod,
      discount: Number(discount),
      items: cart.map((item) => ({ product_id: item.product.id, qty: item.qty }))
    };

    try {
      const res = await fetch('http://localhost:3000/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout transaction failed');

      setSuccessInvoice(data.sale);
      clearCart();
      fetchCatalog(); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error occurred during checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
      
      {/* 1. Products Catalog Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-200">Point of Sale</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Process orders and manage transactions</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchCatalog} className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200">
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Sync
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="relative w-full xl:w-64 shrink-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus-visible:ring-emerald-500"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 hide-scrollbar flex-1">
            <Badge 
              onClick={() => setSelectedCategory(null)}
              className={`cursor-pointer px-4 py-2 whitespace-nowrap text-xs transition-colors ${selectedCategory === null ? 'bg-emerald-500 hover:bg-emerald-600 text-white dark:text-slate-950 font-bold' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'}`}
            >
              All Categories
            </Badge>
            {categories.map((c) => (
              <Badge 
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`cursor-pointer px-4 py-2 whitespace-nowrap text-xs transition-colors ${selectedCategory === c.id ? 'bg-emerald-500 hover:bg-emerald-600 text-white dark:text-slate-950 font-bold' : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'}`}
              >
                {c.name}
              </Badge>
            ))}
          </div>
        </div>

        {error && !checkoutLoading && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">⚠️ {error}</div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-950/20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-slate-200 dark:border-slate-900 border-dashed text-slate-500">
            No products match the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const outOfStock = product.product_type === 'FINISHED' && product.quantity <= 0;
              return (
                <Card 
                  key={product.id}
                  onClick={() => !outOfStock && addToCart(product)}
                  className={`backdrop-blur-sm bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-900/80 transition-all duration-200 cursor-pointer overflow-hidden ${
                    outOfStock ? 'opacity-50 cursor-not-allowed border-slate-100 dark:border-slate-950 bg-slate-50 dark:bg-slate-900/20' : 'hover:border-emerald-400 dark:hover:border-emerald-500/40 hover:bg-emerald-50/50 dark:hover:bg-slate-900/70 hover:scale-[1.02] shadow-sm hover:shadow-md dark:shadow-none'
                  }`}
                >
                  <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
                    <div className="flex justify-between items-start">
                      <Badge className={`text-[9px] font-bold py-0 ${product.product_type === 'FINISHED' ? 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'}`}>
                        {product.product_type}
                      </Badge>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">${Number(product.price).toFixed(2)}</span>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-1">{product.name}</h3>
                      <p className="text-[10px] text-slate-500">{product.category?.name || 'Beverage'}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-900 text-[10px] text-slate-500 dark:text-slate-400 flex justify-between items-center">
                      <span>Stock level:</span>
                      {product.product_type === 'RECIPE' ? (
                        <span className="italic text-slate-400 dark:text-slate-600">Recipe</span>
                      ) : (
                        <span className={`font-bold ${product.quantity <= 5 ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{product.quantity} left</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Cart & Checkout Details Panel */}
      <div className="space-y-6">
        <Card className="backdrop-blur-md bg-white/90 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 flex flex-col h-[75vh] sticky top-6 shadow-md dark:shadow-none">
          <CardHeader className="border-b border-slate-100 dark:border-slate-900 px-6 py-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
              <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-200">Active Cart</CardTitle>
            </div>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="h-6 px-2 text-xs text-slate-500 hover:text-red-500 dark:hover:text-red-400">Clear</Button>
            )}
          </CardHeader>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 text-center gap-2">
                🍊
                <p className="text-xs font-semibold">Active Cart is Empty</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-600 max-w-[180px]">Add items from catalog to start POS billing</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-100 dark:border-slate-900/60">
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">{item.product.name}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-medium">${Number(item.product.price).toFixed(2)} each</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.product.id, -1)} className="h-5 w-5 rounded bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-xs">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center text-slate-800 dark:text-slate-200">{item.qty}</span>
                    <button onClick={() => updateQty(item.product.id, 1)} className="h-5 w-5 rounded bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-xs">
                      <Plus className="h-3 w-3" />
                    </button>
                    <button onClick={() => removeFromCart(item.product.id)} className="h-5 w-5 text-red-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded flex items-center justify-center text-xs ml-1 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Calculations */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-950/40 space-y-4 rounded-b-xl">
            {cart.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="discount" className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Discount ($)</Label>
                    <Input id="discount" type="number" min="0" step="0.01" value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value))} className="h-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs mt-1 text-slate-900 dark:text-slate-200 focus-visible:ring-emerald-500" />
                  </div>
                  <div>
                    <Label htmlFor="payment" className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">Payment Method</Label>
                    <select id="payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full h-8 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs mt-1 px-2.5 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500">
                      <option value="CASH">Cash</option>
                      <option value="CARD">Debit / Credit</option>
                      <option value="MOBILE">Mobile Pay</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-2">
              <div className="flex justify-between">
                <span>Total Items Bill:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">${getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-red-500 dark:text-red-400">
                <span>Discount applied:</span>
                <span className="font-mono">-${Number(discount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-slate-200 pt-1.5 border-t border-slate-200 dark:border-slate-900">
                <span>Final Invoice Total:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">${getTotal().toFixed(2)}</span>
              </div>
            </div>

            <Button onClick={handleCheckout} disabled={checkoutLoading || cart.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-gradient-to-r dark:from-emerald-500 dark:to-emerald-600 text-white dark:text-slate-950 dark:hover:from-emerald-400 dark:hover:to-emerald-500 font-bold shadow-md">
              {checkoutLoading ? (
                <div className="flex items-center gap-1.5"><div className="h-4 w-4 animate-spin rounded-full border-2 border-white dark:border-slate-950 border-t-transparent" /> Processing...</div>
              ) : (
                <div className="flex items-center gap-2"><CreditCard className="h-4.5 w-4.5" /> Complete Checkout</div>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Invoice Receipt Print Popup */}
      {successInvoice && (
        <div className="lg:col-span-3 z-[100] fixed inset-0 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-md px-4 print:bg-white print:absolute print:inset-0 print:block print:p-0">
          <Card className="w-full max-w-sm bg-white dark:bg-slate-900 border-emerald-500/20 shadow-2xl relative print:w-full print:max-w-none print:shadow-none print:border-none print:bg-white print:text-black print:rounded-none">
            
            {/* Print Only Header (Hidden on screen) */}
            <div className="hidden print:block text-center pb-4 mb-4 border-b border-black">
              <h1 className="text-2xl font-bold font-mono uppercase tracking-widest">JUICE BAR POS</h1>
              <p className="text-xs font-mono">Official Receipt</p>
            </div>

            {/* Screen Header (Hidden on print) */}
            <CardHeader className="text-center border-b border-slate-100 dark:border-slate-800 print:hidden">
              <div className="h-10 w-10 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <CardTitle className="text-emerald-600 dark:text-emerald-400 font-bold">Transaction Confirmed</CardTitle>
              <p className="text-[10px] text-slate-500 mt-1">Invoice registered in POS records</p>
            </CardHeader>

            <CardContent className="p-6 space-y-4 font-mono text-xs text-slate-700 dark:text-slate-300 print:text-black print:p-0 print:mt-4">
              <div className="flex justify-between print:text-black text-[10px]">
                <span className="text-slate-500 print:text-gray-600">INVOICE NO:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold print:text-black">{successInvoice.invoice_no}</span>
              </div>
              <div className="flex justify-between print:text-black text-[10px]">
                <span className="text-slate-500 print:text-gray-600">CASHIER:</span>
                <span className="font-bold">{successInvoice.cashier?.name}</span>
              </div>
              <div className="flex justify-between print:text-black text-[10px] border-b border-slate-100 dark:border-slate-800 print:border-gray-300 pb-2">
                <span className="text-slate-500 print:text-gray-600">DATE:</span>
                <span className="font-bold">{new Date(successInvoice.created_at).toLocaleString()}</span>
              </div>

              {/* Items listing */}
              <div className="space-y-1.5 py-2">
                {successInvoice.items?.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="font-bold">{item.qty}x {item.product?.name}</span>
                    <span>${Number(item.total).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="border-t border-slate-200 dark:border-slate-800 print:border-black pt-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400 print:text-black">Subtotal:</span>
                  <span>${Number(successInvoice.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-500 dark:text-red-400 print:text-black">
                  <span>Discount:</span>
                  <span>-${Number(successInvoice.discount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 print:text-black font-bold text-sm border-t border-dashed border-slate-300 dark:border-slate-800 print:border-black pt-2 mt-2">
                  <span>Grand Total:</span>
                  <span>${Number(successInvoice.total).toFixed(2)}</span>
                </div>
              </div>
              
              {/* Print Only Footer (Hidden on screen) */}
              <div className="hidden print:block text-center pt-8 text-[10px] italic">
                Thank you for your purchase!
              </div>
            </CardContent>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex gap-4 print:hidden">
              <Button onClick={handlePrint} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500 font-bold">
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
              <Button onClick={() => setSuccessInvoice(null)} className="flex-1 border border-slate-200 dark:border-transparent bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700">
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
