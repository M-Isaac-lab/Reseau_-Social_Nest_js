'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { posts as postsApi } from '@/lib/api';
import type { Post } from '@/lib/types';
import PostCard from '@/components/post-card';
import CreatePost from '@/components/create-post';

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [postList, setPostList] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await postsApi.getFeed(p, 10);
      setPostList(res.data);
      setTotalPages(res.meta.totalPages);
      setPage(p);
    } catch {
      // If feed fails (e.g., not following anyone), try all posts
      try {
        const res = await postsApi.getAll(p, 10);
        setPostList(res.data);
        setTotalPages(res.meta.totalPages);
        setPage(p);
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signin');
      return;
    }
    if (user) loadPosts(1);
  }, [user, authLoading, router, loadPosts]);

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <CreatePost onCreated={() => loadPosts(1)} />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : postList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No posts yet. Follow some users or create a post!
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {postList.map((post) => (
              <PostCard
                key={post.postId}
                post={post}
                onDelete={() => loadPosts(page)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => loadPosts(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => loadPosts(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
