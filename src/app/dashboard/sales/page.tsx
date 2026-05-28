'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt, History, User } from 'lucide-react';

interface SaleItem {
  id: number;
  qty: number;
  price: string;
  total: string;
  product?: {
    name: string;
  };
}

interface SaleData {
  id: number;
  invoice_no: string;
  subtotal: string;
  discount: string;
  total: string;
  payment_method: string;
  created_at: string;
  cashier?: {
    id: number;
    name: string;
    email: string;
  };
  items?: SaleItem[];
}

export default function SalesHistoryPage() {
  const { token } = useAuth();
  const [sales, setSales] = useState<SaleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSale, setExpandedSale] = useState<number | null>(null);

  const fetchSales = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/api/sales', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load sales history');
      const data = await res.json();
      setSales(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            Sales History <History className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review all past POS transactions and invoices.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/20 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading transaction history...</p>
          </div>
        </div>
      ) : (
        <Card className="backdrop-blur-sm bg-white/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm dark:shadow-none">
          <CardHeader className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/40">
            <CardTitle className="text-lg text-slate-800 dark:text-slate-200">Transaction Registry</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Invoice No</th>
                    <th className="px-6 py-4 font-medium">Date & Time</th>
                    <th className="px-6 py-4 font-medium">Cashier</th>
                    <th className="px-6 py-4 font-medium">Payment</th>
                    <th className="px-6 py-4 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {sales.map((sale) => (
                    <React.Fragment key={sale.id}>
                      <tr 
                        onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-2">
                          <Receipt className="w-4 h-4" />
                          {sale.invoice_no}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                          {new Date(sale.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            <User className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            {sale.cashier?.name || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="text-[10px] font-bold border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300">
                            {sale.payment_method}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                          ${Number(sale.total).toFixed(2)}
                        </td>
                      </tr>
                      {expandedSale === sale.id && (
                        <tr className="bg-slate-50/60 dark:bg-slate-950/60 border-t-0">
                          <td colSpan={5} className="p-0">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 border-dashed m-2 rounded-lg bg-white/50 dark:bg-slate-900/50">
                              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Invoice Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  {sale.items?.map((item) => (
                                    <div key={item.id} className="flex justify-between text-xs border-b border-slate-100 dark:border-slate-800/50 pb-1">
                                      <span className="text-slate-600 dark:text-slate-300">
                                        <span className="text-emerald-600 dark:text-emerald-500 font-bold">{item.qty}x</span> {item.product?.name}
                                      </span>
                                      <span className="text-slate-500 dark:text-slate-400 font-mono">${Number(item.total).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="space-y-1 text-xs md:border-l md:border-slate-200 dark:md:border-slate-800 md:pl-4">
                                  <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                    <span>Subtotal:</span>
                                    <span className="font-mono">${Number(sale.subtotal).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-red-500 dark:text-red-400">
                                    <span>Discount:</span>
                                    <span className="font-mono">-${Number(sale.discount).toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold text-sm pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
                                    <span>Final Total:</span>
                                    <span className="font-mono">${Number(sale.total).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        No transactions found in the system registry.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
