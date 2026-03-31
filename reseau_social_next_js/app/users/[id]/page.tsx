'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { users as usersApi, posts as postsApi } from '@/lib/api';
import type { PublicProfile, Post, FollowUser } from '@/lib/types';
import Avatar from '@/components/avatar';
import PostCard from '@/components/post-card';

export default function UserProfilePage() {
  const params = useParams();
  const userId = Number(params.id);
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [postList, setPostList] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [tab, setTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [loading, setLoading] = useState(true);

  const isOwnProfile = currentUser?.userId === userId;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileRes, postsRes, followersRes, followingRes] =
        await Promise.all([
          usersApi.getPublicProfile(userId),
          postsApi.getAll(1, 100),
          usersApi.getFollowers(userId),
          usersApi.getFollowing(userId),
        ]);
      setProfile(profileRes.data);
      setPostList(postsRes.data.filter((p) => p.userId === userId));
      setFollowers(followersRes.data);
      setFollowing(followingRes.data);
      if (currentUser) {
        setIsFollowing(
          followersRes.data.some((f) => f.userId === currentUser.userId),
        );
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [userId, currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleFollow() {
    if (!currentUser) return;
    try {
      if (isFollowing) {
        await usersApi.unfollow(userId);
        setIsFollowing(false);
        setFollowers((prev) =>
          prev.filter((f) => f.userId !== currentUser.userId),
        );
      } else {
        await usersApi.follow(userId);
        setIsFollowing(true);
        setFollowers((prev) => [
          ...prev,
          {
            userId: currentUser.userId,
            username: currentUser.username,
            avatarUrl: currentUser.avatarUrl,
          },
        ]);
      }
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">User not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Profile header */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start gap-4">
          <Avatar
            username={profile.username}
            avatarUrl={profile.avatarUrl}
            size="xl"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">{profile.username}</h1>
              {currentUser && !isOwnProfile && (
                <button
                  onClick={handleFollow}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isFollowing
                      ? 'border border-border text-muted-foreground hover:text-accent hover:border-accent'
                      : 'bg-primary text-primary-foreground hover:opacity-90'
                  }`}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
              )}
              {isOwnProfile && (
                <Link
                  href="/settings"
                  className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Edit profile
                </Link>
              )}
            </div>
            {profile.bio && (
              <p className="text-sm mt-3 whitespace-pre-wrap">{profile.bio}</p>
            )}
            <div className="flex gap-5 mt-4">
              <button onClick={() => setTab('posts')} className="text-sm">
                <span className="font-bold">{profile._count.posts}</span>{' '}
                <span className="text-muted-foreground">posts</span>
              </button>
              <button onClick={() => setTab('followers')} className="text-sm">
                <span className="font-bold">{followers.length}</span>{' '}
                <span className="text-muted-foreground">followers</span>
              </button>
              <button onClick={() => setTab('following')} className="text-sm">
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
      {tab === 'posts' ? (
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
          <p className="text-center text-muted-foreground py-8">No followers.</p>
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
