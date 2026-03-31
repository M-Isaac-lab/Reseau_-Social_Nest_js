'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { posts as postsApi, users as usersApi } from '@/lib/api';
import type { Post, FollowUser } from '@/lib/types';
import Avatar from '@/components/avatar';
import PostCard from '@/components/post-card';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [postList, setPostList] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [tab, setTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [postsRes, followersRes, followingRes] = await Promise.all([
        postsApi.getAll(1, 100),
        usersApi.getFollowers(user.userId),
        usersApi.getFollowing(user.userId),
      ]);
      setPostList(postsRes.data.filter((p) => p.userId === user.userId));
      setFollowers(followersRes.data);
      setFollowing(followingRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signin');
      return;
    }
    if (user) loadData();
  }, [user, authLoading, router, loadData]);

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Profile header */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start gap-4">
          <Avatar username={user.username} avatarUrl={user.avatarUrl} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">{user.username}</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Link
                href="/settings"
                className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Edit profile
              </Link>
            </div>
            {user.bio && (
              <p className="text-sm mt-3 whitespace-pre-wrap">{user.bio}</p>
            )}
            <div className="flex gap-5 mt-4">
              <button
                onClick={() => setTab('posts')}
                className="text-sm"
              >
                <span className="font-bold">{postList.length}</span>{' '}
                <span className="text-muted-foreground">posts</span>
              </button>
              <button
                onClick={() => setTab('followers')}
                className="text-sm"
              >
                <span className="font-bold">{followers.length}</span>{' '}
                <span className="text-muted-foreground">followers</span>
              </button>
              <button
                onClick={() => setTab('following')}
                className="text-sm"
              >
                <span className="font-bold">{following.length}</span>{' '}
                <span className="text-muted-foreground">following</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {(['posts', 'followers', 'following'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-card-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'posts' ? (
        postList.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No posts yet.</p>
        ) : (
          <div className="space-y-4">
            {postList.map((post) => (
              <PostCard key={post.postId} post={post} onDelete={loadData} />
            ))}
          </div>
        )
      ) : tab === 'followers' ? (
        followers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No followers yet.</p>
        ) : (
          <div className="space-y-1">
            {followers.map((f) => (
              <Link
                key={f.userId}
                href={`/users/${f.userId}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <Avatar username={f.username} avatarUrl={f.avatarUrl} size="sm" />
                <span className="text-sm font-medium">{f.username}</span>
              </Link>
            ))}
          </div>
        )
      ) : following.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Not following anyone.</p>
      ) : (
        <div className="space-y-1">
          {following.map((f) => (
            <Link
              key={f.userId}
              href={`/users/${f.userId}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <Avatar username={f.username} avatarUrl={f.avatarUrl} size="sm" />
              <span className="text-sm font-medium">{f.username}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
