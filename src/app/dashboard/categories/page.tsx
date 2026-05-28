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
import { ShieldAlert, Plus, RefreshCw, Layers, X, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Category {
  id: number;
  name: string;
  status: boolean;
}

export default function CategoriesPage() {
  const { user, token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add/Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryStatus, setCategoryStatus] = useState(true);
  
  // Delete Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchCategories = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:3000/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to retrieve categories database');
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error occurred while loading categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const openAddModal = () => {
    setModalMode('ADD');
    setCategoryName('');
    setCategoryStatus(true);
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setModalMode('EDIT');
    setEditingId(category.id);
    setCategoryName(category.name);
    setCategoryStatus(category.status);
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const openDeleteModal = (category: Category) => {
    setCategoryToDelete(category);
    setSubmitError(null);
    setIsDeleteModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setSubmitError('Category name is required.');
      return;
    }
    
    setSubmitting(true);
    setSubmitError(null);

    try {
      const url = modalMode === 'ADD' 
        ? 'http://localhost:3000/api/categories'
        : `http://localhost:3000/api/categories/${editingId}`;
      
      const method = modalMode === 'ADD' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          status: categoryStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${modalMode.toLowerCase()} category`);

      setIsModalOpen(false);
      fetchCategories();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error occurred while saving category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`http://localhost:3000/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category (it may be linked to products)');

      setIsDeleteModalOpen(false);
      fetchCategories();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error occurred while deleting category');
    } finally {
      setSubmitting(false);
    }
  };

  const isSuperAdmin = user?.role?.name === 'SUPER_ADMIN';
  if (!isSuperAdmin) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-center px-4">
        <div className="h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-500 mb-4 animate-bounce">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Access Privileges Insufficient</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-200">Categories Inventory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage and view your product classifications.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchCategories} className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-900/80">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync
          </Button>
          <Button size="sm" onClick={openAddModal} className="bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-semibold transition-all duration-200 shadow-md shadow-emerald-500/10">
            <Plus className="h-4 w-4 mr-2" /> Add Category
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white/50 dark:bg-slate-950/20 p-24 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-4" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-6 text-center text-red-600 dark:text-red-400">⚠️ {error}</div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-900 border-dashed bg-slate-50 dark:bg-slate-950/10 p-20 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 mb-4">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">No Categories Registered</h3>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-900/40 backdrop-blur-md overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
              <TableRow className="border-slate-200 dark:border-slate-900 hover:bg-slate-100 dark:hover:bg-slate-900/80">
                <TableHead className="w-[100px] text-slate-500 dark:text-slate-400 font-bold">Category ID</TableHead>
                <TableHead className="text-slate-500 dark:text-slate-400 font-bold">Classification Name</TableHead>
                <TableHead className="w-[120px] text-slate-500 dark:text-slate-400 font-bold text-center">Status</TableHead>
                <TableHead className="w-[100px] text-slate-500 dark:text-slate-400 font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="border-slate-200 dark:border-slate-800">
              {categories.map((category) => (
                <TableRow key={category.id} className="border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <TableCell className="font-mono text-xs text-slate-500 font-semibold">
                    #CAT-{category.id.toString().padStart(3, '0')}
                  </TableCell>
                  <TableCell className="font-medium text-slate-800 dark:text-slate-200">{category.name}</TableCell>
                  <TableCell className="text-center">
                    <Badge className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      category.status ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/25'
                    }`}>
                      {category.status ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(category)} className="p-1.5 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-400/10 rounded transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => openDeleteModal(category)} className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 rounded transition-colors">
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

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md" onClick={() => !submitting && setIsModalOpen(false)} />
          <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  {modalMode === 'ADD' ? <Plus className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{modalMode === 'ADD' ? 'Create' : 'Edit'} Category</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Define a new inventory classification</p>
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

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Category Name</Label>
                <Input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  disabled={submitting}
                  className="bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-200 focus-visible:border-emerald-500/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Status</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setCategoryStatus(true)} disabled={submitting} className={`flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold border ${categoryStatus ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-900 text-slate-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${categoryStatus ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-300 dark:bg-slate-600'}`} /> Active
                  </button>
                  <button type="button" onClick={() => setCategoryStatus(false)} disabled={submitting} className={`flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-bold border ${!categoryStatus ? 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500/30 text-red-700 dark:text-red-400' : 'bg-slate-50 dark:bg-slate-900/10 border-slate-200 dark:border-slate-900 text-slate-500'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${!categoryStatus ? 'bg-red-500 dark:bg-red-400' : 'bg-slate-300 dark:bg-slate-600'}`} /> Inactive
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-900 mt-4">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting} className="border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900/20 text-slate-600 dark:text-slate-400">Cancel</Button>
                <Button type="submit" disabled={submitting} className="bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-bold">
                  {submitting ? 'Saving...' : 'Save Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md" onClick={() => !submitting && setIsDeleteModalOpen(false)} />
          <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl border border-red-200 dark:border-red-500/20 bg-white dark:bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-500">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">Delete Category?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">{categoryToDelete.name}</strong>? This cannot be undone. 
              (It will fail if products are linked).
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
              <Button type="button" onClick={handleDeleteCategory} disabled={submitting} className="flex-1 bg-red-600 dark:bg-red-500 hover:bg-red-500 dark:hover:bg-red-600 text-white font-bold">
                {submitting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
