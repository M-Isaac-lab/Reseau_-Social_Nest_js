'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/feed');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-[80vh]">
      <div className="max-w-lg text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Welcome to{' '}
          <span className="text-primary">SocialNet</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Connect with people, share your thoughts, and discover what&apos;s happening around you.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/signup"
            className="px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Get started
          </Link>
          <Link
            href="/signin"
            className="px-6 py-3 text-sm font-medium border border-border rounded-lg text-card-foreground hover:bg-muted transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
