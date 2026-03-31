'use client';

import { useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/api';

export default function ResetPasswordPage() {
  const [step, setStep] = useState<'request' | 'confirm' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.resetPassword({ email, password });
      setStep('confirm');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Request failed';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await auth.confirmResetPassword({ email, password: newPassword, code });
      setStep('done');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Confirmation failed';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  }

  if (step === 'done') {
    return (
      <div className="flex-1 flex items-center justify-center px-4 min-h-[80vh]">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-emerald-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Password updated!</h1>
          <p className="text-sm text-muted-foreground">
            You can now sign in with your new password.
          </p>
          <Link
            href="/signin"
            className="inline-block px-6 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 min-h-[80vh]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === 'request'
              ? 'Verify your identity to receive a reset code'
              : 'Enter the code sent to your email'}
          </p>
        </div>

        {step === 'request' ? (
          <form onSubmit={handleRequest} className="space-y-4">
            {error && (
              <div className="px-3 py-2 text-sm text-accent bg-accent/10 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Current password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                placeholder="Your current password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4">
            {error && (
              <div className="px-3 py-2 text-sm text-accent bg-accent/10 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label htmlFor="code" className="text-sm font-medium">
                Verification code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                maxLength={5}
                className="w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground text-center tracking-widest text-lg"
                placeholder="00000"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="newPassword" className="text-sm font-medium">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                placeholder="Your new password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/signin" className="text-primary font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
