'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Plus, RefreshCw, ShoppingCart, X, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  low_stock_threshold: number;
  recipe_description: string | null;
  image: string | null;
  status: boolean;
  category: Category;
}

export default function ProductsPage() {
  const { user, token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form States
  const [productName, setProductName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productType, setProductType] = useState<'FINISHED' | 'RECIPE'>('FINISHED');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('5');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [status, setStatus] = useState(true);
  
  // Delete Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchProducts = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:3000/api/products', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to retrieve products database');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error occurred while loading products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3000/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openAddModal = () => {
    setModalMode('ADD');
    setProductName('');
    setCategoryId('');
    setProductType('FINISHED');
    setPrice('');
    setQuantity('');
    setLowStockThreshold('5');
    setRecipeDescription('');
    setStatus(true);
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setModalMode('EDIT');
    setEditingId(product.id);
    setProductName(product.name);
    setCategoryId(product.category_id.toString());
    setProductType(product.product_type);
    setPrice(product.price.toString());
    setQuantity(product.quantity.toString());
    setLowStockThreshold(product.low_stock_threshold?.toString() || '5');
    setRecipeDescription(product.recipe_description || '');
    setStatus(product.status);
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const openDeleteModal = (product: Product) => {
    setProductToDelete(product);
    setSubmitError(null);
    setIsDeleteModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return setSubmitError('Product name is required.');
    if (!categoryId) return setSubmitError('Category selection is required.');
    
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) return setSubmitError('Price must be a valid non-negative number.');
    
    const parsedQty = productType === 'RECIPE' ? 0 : parseInt(quantity, 10);
    if (productType === 'FINISHED' && (isNaN(parsedQty) || parsedQty < 0)) {
      return setSubmitError('Quantity must be a valid non-negative integer.');
    }

    const parsedThreshold = parseInt(lowStockThreshold, 10);
    if (productType === 'FINISHED' && (isNaN(parsedThreshold) || parsedThreshold < 0)) {
      return setSubmitError('Low stock threshold must be a valid non-negative integer.');
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const url = modalMode === 'ADD' 
        ? 'http://localhost:3000/api/products'
        : `http://localhost:3000/api/products/${editingId}`;
      const method = modalMode === 'ADD' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: productName.trim(),
          category_id: Number(categoryId),
          product_type: productType,
          price: parsedPrice,
          quantity: parsedQty,
          low_stock_threshold: productType === 'FINISHED' ? parsedThreshold : undefined,
          recipe_description: productType === 'RECIPE' ? recipeDescription : undefined,
          status,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${modalMode.toLowerCase()} product`);

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error occurred while saving product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`http://localhost:3000/api/products/${productToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');

      setIsDeleteModalOpen(false);
      fetchProducts();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error occurred while deleting product');
    } finally {
      setSubmitting(false);
    }
  };

  const isSuperAdmin = user?.role?.name === 'SUPER_ADMIN';
  if (!isSuperAdmin) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center px-4">
        <div className="h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-500 mb-4 animate-bounce">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Access Privileges Insufficient</h3>
      </div>
    );
  }

  const formatPrice = (p: string | number) => {
    const num = Number(p);
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  const renderStockBadge = (product: Product) => {
    if (product.product_type === 'RECIPE') {
      return <span className="text-xs text-slate-500 font-medium italic">N/A (Recipe)</span>;
    }
    const qty = product.quantity;
    const threshold = product.low_stock_threshold || 5;
    
    if (qty === 0) return <Badge className="px-2 py-0.5 bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20 text-[10px] font-bold">Out of Stock</Badge>;
    if (qty <= threshold) return <Badge className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-500/20 text-[10px] font-bold">Low Stock ({qty})</Badge>;
    return <Badge className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[10px] font-bold">Healthy ({qty})</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-200">Products Inventory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and view catalog pricing, stock levels, and classifications.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchProducts} className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/80">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync
          </Button>
          <Button size="sm" onClick={openAddModal} className="bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-semibold transition-all duration-200 shadow-md shadow-emerald-500/10">
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-950/20 p-24 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-4" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-6 text-center text-red-600 dark:text-red-400">⚠️ {error}</div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-900 border-dashed bg-slate-50 dark:bg-slate-950/10 p-20 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 mb-4">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">No Products Registered</h3>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-900/40 backdrop-blur-md overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
              <TableRow className="border-slate-200 dark:border-slate-900 hover:bg-slate-100 dark:hover:bg-slate-900/80">
                <TableHead className="w-[80px] text-slate-500 dark:text-slate-400 font-bold">Code</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400 font-bold">Product Item</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400 font-bold">Category</TableHead>
                <TableHead className="w-[120px] text-slate-500 dark:text-slate-400 font-bold text-center">Type</TableHead>
                <TableHead className="w-[100px] text-slate-500 dark:text-slate-400 font-bold text-right">Price</TableHead>
                <TableHead className="w-[150px] text-slate-500 dark:text-slate-400 font-bold text-center">Inventory Level</TableHead>
                <TableHead className="w-[100px] text-slate-500 dark:text-slate-400 font-bold text-center">Status</TableHead>
                <TableHead className="w-[100px] text-slate-500 dark:text-slate-400 font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="border-slate-200 dark:border-slate-800">
              {products.map((product) => (
                <TableRow key={product.id} className="border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <TableCell className="font-mono text-xs text-slate-500 font-semibold">
                    #PRD-{product.id.toString().padStart(3, '0')}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800 dark:text-slate-200">{product.name}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400 text-sm">{product.category?.name || 'Unassigned'}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`px-2 py-0.5 rounded-md text-[9px] font-semibold uppercase tracking-wider ${
                      product.product_type === 'FINISHED' ? 'border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/5' : 'border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/5'
                    }`}>
                      {product.product_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    {formatPrice(product.price)}
                  </TableCell>
                  <TableCell className="text-center">{renderStockBadge(product)}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      product.status ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/25'
                    }`}>
                      {product.status ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(product)} className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-400/10 rounded transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => openDeleteModal(product)} className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md transition-opacity duration-300" onClick={() => !submitting && setIsModalOpen(false)} />
          <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  {modalMode === 'ADD' ? <Plus className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{modalMode === 'ADD' ? 'Create' : 'Edit'} Product</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{modalMode === 'ADD' ? 'Register a new catalog item' : 'Update existing product'}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} disabled={submitting} className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-900 hover:border-slate-300 dark:hover:border-slate-800 text-slate-500 dark:text-slate-400">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {submitError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-3.5 mb-4 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="font-medium">{submitError}</div>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Product Name</Label>
                <Input
                  type="text"
                  placeholder="e.g. Avocado Shake"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  disabled={submitting}
                  className="bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-200 focus-visible:border-emerald-500/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Classification Category</Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  disabled={submitting}
                  className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/40 px-2.5 py-1 text-slate-900 dark:text-slate-200 focus:border-emerald-500/50 outline-none focus:ring-1 focus:ring-emerald-500/50 text-sm"
                  required
                >
                  <option value="" disabled className="bg-white dark:bg-slate-950 text-slate-500">-- Select Category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200">{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Product Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setProductType('FINISHED')} disabled={submitting} className={`flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold border transition-colors ${productType === 'FINISHED' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-900 text-slate-500'}`}>
                    Finished Good
                  </button>
                  <button type="button" onClick={() => { setProductType('RECIPE'); setQuantity('0'); }} disabled={submitting} className={`flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold border transition-colors ${productType === 'RECIPE' ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-900 text-slate-500'}`}>
                    Recipe Item
                  </button>
                </div>
              </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Unit Price ($)</Label>
                    <Input
                      type="number" step="0.01" min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      disabled={submitting}
                      className="bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-200"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Inventory Stock</Label>
                    <Input
                      type="number" min="0"
                      value={productType === 'RECIPE' ? '' : quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      disabled={submitting || productType === 'RECIPE'}
                      className="bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-200 disabled:opacity-40 disabled:bg-slate-100 dark:disabled:bg-slate-900/10"
                      required={productType === 'FINISHED'}
                    />
                  </div>
                </div>

                {productType === 'FINISHED' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Low Stock Alert Threshold</Label>
                    <Input
                      type="number" min="0"
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      disabled={submitting}
                      className="bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-200"
                      required
                    />
                    <p className="text-[10px] text-slate-500">You will be alerted when stock falls to this amount or lower.</p>
                  </div>
                )}

                {productType === 'RECIPE' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Recipe Instructions (Optional)</Label>
                    <textarea
                      value={recipeDescription}
                      onChange={(e) => setRecipeDescription(e.target.value)}
                      disabled={submitting}
                      className="w-full min-h-[80px] rounded-md bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-200 p-2 text-sm focus-visible:outline-none focus:ring-1 focus:ring-emerald-500/50"
                      placeholder="e.g. 1. Blend 2 avocados. 2. Add 200ml milk..."
                    />
                  </div>
                )}

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setStatus(true)} disabled={submitting} className={`flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold border transition-colors ${status ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-900 text-slate-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-300 dark:bg-slate-600'}`} /> Active
                  </button>
                  <button type="button" onClick={() => setStatus(false)} disabled={submitting} className={`flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold border transition-colors ${!status ? 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400' : 'bg-slate-50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-900 text-slate-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${!status ? 'bg-red-500 dark:bg-red-400' : 'bg-slate-300 dark:bg-slate-600'}`} /> Inactive
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 mt-2 border-t border-slate-100 dark:border-slate-900">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting} className="border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/20 text-slate-600 dark:text-slate-400">Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold">
                  {submitting ? 'Saving...' : (modalMode === 'ADD' ? 'Create Product' : 'Save Changes')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md" onClick={() => !submitting && setIsDeleteModalOpen(false)} />
          <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl border border-red-200 dark:border-red-500/20 bg-white dark:bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-500">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Delete Product?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">{productToDelete.name}</strong>? This cannot be undone.
              (It will fail if sales are linked).
            </p>

            {submitError && (
              <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-lg p-2 mb-4">
                {submitError}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={submitting} className="flex-1 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900">
                Cancel
              </Button>
              <Button type="button" onClick={handleDeleteProduct} disabled={submitting} className="flex-1 bg-red-600 dark:bg-red-500 hover:bg-red-500 dark:hover:bg-red-600 text-white font-bold">
                {submitting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
