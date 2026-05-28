'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const { login, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!authLoading && token) {
      router.push('/dashboard');
    }
  }, [token, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoadingSubmit(true);

    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      login(data.token, data.user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please check your credentials.';
      setError(msg);
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">Initializing POS system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-300">
      {/* Quick Theme Toggle for Login Screen */}
      <div className="absolute top-6 right-6 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-10 w-10 rounded-full border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      {/* Decorative premium gradients */}
      <div className="absolute -left-48 -top-48 h-96 w-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 blur-3xl transition-opacity duration-300" />
      <div className="absolute -right-48 -bottom-48 h-96 w-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/10 blur-3xl transition-opacity duration-300" />

      <div className="z-10 w-full max-w-md">
        {/* App Branding */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
            <span className="text-2xl font-bold text-white dark:text-slate-950">🍊</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
            Juice Bar POS
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Point of Sale & Inventory Engine</p>
        </div>

        {/* Login Card */}
        <Card className="backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 shadow-2xl transition-colors duration-300">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">Welcome Back</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400">Sign in to your cashier or admin dashboard</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@juicebar.com"
                  className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus-visible:ring-emerald-500 focus-visible:ring-offset-0 transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loadingSubmit}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">Password</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus-visible:ring-emerald-500 focus-visible:ring-offset-0 transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loadingSubmit}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-gradient-to-r dark:from-emerald-500 dark:to-emerald-600 text-white dark:text-slate-950 dark:hover:from-emerald-400 dark:hover:to-emerald-500 shadow-md hover:shadow-lg hover:shadow-emerald-500/25 transition-all font-semibold"
                disabled={loadingSubmit}
              >
                {loadingSubmit ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white dark:border-slate-950 border-t-transparent" />
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Credentials Helper Box */}
        <div className="mt-6 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/40 p-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-300">
          <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">🔑 Demo Credentials</p>
          <p>Email: <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">admin@juicebar.com</code> | Password: <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">Admin@123</code></p>
        </div>
      </div>
    </div>
  );
}
