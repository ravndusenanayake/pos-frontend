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
  amountTendered?: number;
  changeDue?: number;
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
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [amountTendered, setAmountTendered] = useState<string>('');

  const fetchCatalog = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/api\/?$/, '')}/api/products`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/api\/?$/, '')}/api/categories`, { headers: { 'Authorization': `Bearer ${token}` } })
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

  const openPaymentModal = () => {
    setAmountTendered('');
    setIsPaymentModalOpen(true);
  };

  const processTransaction = async () => {
    if (!token || !user || cart.length === 0) return;

    setCheckoutLoading(true);
    setError(null);
    setSuccessInvoice(null);

    const finalTotal = getTotal();
    const tendered = Number(amountTendered);
    const change = tendered - finalTotal;

    const payload = {
      cashier_id: user.id,
      payment_method: paymentMethod,
      discount: Number(discount),
      items: cart.map((item) => ({ product_id: item.product.id, qty: item.qty }))
    };

    try {
      const res = await fetch(`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/api\/?$/, '')}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout transaction failed');

      const invoiceToSave = { ...data.sale };
      if (paymentMethod === 'CASH') {
        invoiceToSave.amountTendered = tendered;
        invoiceToSave.changeDue = change;
      }

      setSuccessInvoice(invoiceToSave);
      setIsPaymentModalOpen(false);
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
        <div className="flex flex-col gap-4">
          <div className="relative w-full sm:w-80 shrink-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus-visible:ring-emerald-500"
            />
          </div>
          <div className="flex flex-wrap gap-2 pb-2 xl:pb-0 flex-1">
            <Badge 
              onClick={() => setSelectedCategory(null)}
              className={`cursor-pointer px-6 py-2.5 rounded-full whitespace-nowrap text-sm font-bold shadow-sm transition-all duration-300 ${selectedCategory === null ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white dark:text-slate-950 shadow-emerald-500/30 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-950 scale-105' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:scale-105'}`}
            >
              All Categories
            </Badge>
            {categories.map((c) => (
              <Badge 
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`cursor-pointer px-6 py-2.5 rounded-full whitespace-nowrap text-sm font-bold shadow-sm transition-all duration-300 ${selectedCategory === c.id ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white dark:text-slate-950 shadow-emerald-500/30 ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-950 scale-105' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:scale-105'}`}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => {
              const outOfStock = product.product_type === 'FINISHED' && product.quantity <= 0;
              return (
                <div 
                  key={product.id}
                  onClick={() => !outOfStock && addToCart(product)}
                  className={`group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
                    outOfStock ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10'
                  }`}
                >
                  {/* Image Background */}
                  <div className="w-full h-40 relative bg-slate-100 dark:bg-slate-800">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🍹</div>
                    )}
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Price Tag */}
                    <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">LKR {Number(product.price).toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Content (Glassmorphism effect) */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/20 dark:bg-slate-950/40 backdrop-blur-md border-t border-white/20 dark:border-slate-800/50">
                    <h3 className="font-bold text-sm text-white drop-shadow-md line-clamp-1">{product.name}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[10px] text-slate-200 drop-shadow">{product.category?.name || 'Beverage'}</p>
                      {product.product_type === 'RECIPE' ? (
                         <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/80 text-white">Made to order</span>
                      ) : (
                         <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${product.quantity <= 5 ? 'bg-yellow-500/80' : 'bg-emerald-500/80'} text-white`}>
                           {product.quantity} Left
                         </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Cart & Checkout Details Panel */}
      <div className="space-y-6">
        <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-800/50 flex flex-col h-[calc(100vh-100px)] sticky top-6 shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-500/10 to-transparent border-b border-slate-100 dark:border-slate-800/50 px-5 py-4 flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-md shadow-emerald-500/30">
                <ShoppingCart className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">Current Order</CardTitle>
                <p className="text-xs text-slate-500 font-medium">{cart.length} items selected</p>
              </div>
            </div>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="h-8 px-3 rounded-full text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Clear All</Button>
            )}
          </CardHeader>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-60">
                <div className="h-24 w-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl shadow-inner">
                  🛒
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Your cart is empty</p>
                  <p className="text-xs text-slate-500 max-w-[200px] mt-1">Tap any product to add it to the current order.</p>
                </div>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="group flex flex-col bg-white dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2.5">
                      {item.product.image ? (
                        <img src={item.product.image} alt={item.product.name} className="h-8 w-8 rounded-lg object-cover shadow-sm" />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm">🍹</div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-tight">{item.product.name}</h4>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">LKR {Number(item.product.price).toFixed(0)}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      LKR {(Number(item.product.price) * item.qty).toFixed(0)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <button onClick={() => removeFromCart(item.product.id)} className="text-xs font-bold text-red-400 hover:text-red-500 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                    </button>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 shadow-inner ml-auto">
                      <button onClick={() => updateQty(item.product.id, -1)} className="h-6 w-6 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center shadow-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-black w-8 text-center text-slate-800 dark:text-slate-100">{item.qty}</span>
                      <button onClick={() => updateQty(item.product.id, 1)} className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/30 hover:bg-emerald-600 transition-colors">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Calculations */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 rounded-b-3xl space-y-3">
            {cart.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="discount" className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Discount (LKR)</Label>
                  <Input id="discount" type="number" min="0" step="0.01" value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value))} className="h-8 text-sm rounded-xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-200 focus-visible:ring-emerald-500 shadow-sm" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payment" className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Method</Label>
                  <select id="payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full h-8 text-sm rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 font-bold text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm appearance-none">
                    <option value="CASH">Cash 💵</option>
                    <option value="CARD">Card 💳</option>
                    <option value="MOBILE">Mobile 📱</option>
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span>Subtotal</span>
                <span>LKR {getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-red-500 dark:text-red-400 font-medium">
                <span>Discount</span>
                <span>-LKR {Number(discount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Total to Pay</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 drop-shadow-sm">LKR {getTotal().toFixed(0)}</span>
              </div>
            </div>

            <Button onClick={openPaymentModal} disabled={checkoutLoading || cart.length === 0} className="w-full h-12 text-base rounded-2xl bg-emerald-600 hover:bg-emerald-500 dark:bg-gradient-to-r dark:from-emerald-500 dark:to-emerald-400 text-white font-black shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all">
              <CreditCard className="h-4 w-4 mr-2" /> 
              Charge LKR {getTotal().toFixed(0)}
            </Button>
          </div>
        </Card>
      </div>

      {/* Payment Processing Modal */}
      {isPaymentModalOpen && (
        <div className="lg:col-span-3 z-[90] fixed inset-0 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-md px-4">
          <Card className="w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl relative border-emerald-500/20">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">Process Payment</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Total Due</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">LKR {getTotal().toFixed(2)}</span>
              </div>
              
              {paymentMethod === 'CASH' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700 dark:text-slate-300">Amount Tendered (LKR)</Label>
                    <Input 
                      type="number" 
                      autoFocus
                      placeholder="e.g. 5000" 
                      value={amountTendered} 
                      onChange={(e) => setAmountTendered(e.target.value)} 
                      className="h-14 text-xl font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  
                  {/* Quick Cash Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <Button variant="outline" type="button" onClick={() => setAmountTendered(getTotal().toString())} className="text-xs">Exact</Button>
                    <Button variant="outline" type="button" onClick={() => setAmountTendered('1000')} className="text-xs">+1000</Button>
                    <Button variant="outline" type="button" onClick={() => setAmountTendered('5000')} className="text-xs">+5000</Button>
                    <Button variant="outline" type="button" onClick={() => setAmountTendered('10000')} className="text-xs">+10000</Button>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-slate-500 font-bold">Change Due</span>
                    <span className={`text-xl font-bold ${Number(amountTendered) >= getTotal() ? 'text-slate-800 dark:text-white' : 'text-red-500'}`}>
                      LKR {Number(amountTendered) >= getTotal() ? (Number(amountTendered) - getTotal()).toFixed(2) : '0.00'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                  <CreditCard className="h-12 w-12 text-slate-400 animate-pulse" />
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">Awaiting Terminal</p>
                    <p className="text-sm text-slate-500">Please process the payment on your terminal</p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)} className="flex-1 border-slate-200 dark:border-slate-800">
                  Cancel
                </Button>
                <Button 
                  onClick={processTransaction} 
                  disabled={checkoutLoading || (paymentMethod === 'CASH' && (amountTendered === '' || Number(amountTendered) < getTotal()))} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {checkoutLoading ? 'Processing...' : 'Confirm Payment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                  <div key={item.id} className="flex justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/50 last:border-0">
                    <span className="text-slate-600 dark:text-slate-400"><span className="font-bold">{item.qty}x</span> {item.product?.name}</span>
                    <span>LKR {Number(item.total).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Bill Details */}
              <div className="border-t border-slate-200 dark:border-slate-800 print:border-black pt-3 space-y-1">
                <div className="flex justify-between text-sm py-1 text-slate-500 dark:text-slate-400">
                  <span>Subtotal</span>
                  <span>LKR {Number(successInvoice.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm py-1 text-slate-500 dark:text-slate-400">
                  <span>Discount</span>
                  <span>-LKR {Number(successInvoice.discount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-3 mt-2 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                  <span>Total</span>
                  <span>LKR {Number(successInvoice.total).toFixed(2)}</span>
                </div>
                {successInvoice.amountTendered !== undefined && (
                  <>
                    <div className="flex justify-between text-sm py-1 pt-3 text-slate-600 dark:text-slate-400 print:text-black">
                      <span>Cash Tendered</span>
                      <span>LKR {Number(successInvoice.amountTendered).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm py-1 font-bold text-slate-800 dark:text-slate-200 print:text-black">
                      <span>Change Due</span>
                      <span>LKR {Number(successInvoice.changeDue).toFixed(2)}</span>
                    </div>
                  </>
                )}
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
