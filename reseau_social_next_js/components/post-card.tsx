'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Post, Comment as CommentType } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { posts as postsApi, likes as likesApi, comments as commentsApi } from '@/lib/api';
import Avatar from './avatar';
import CommentSection from './comment-section';

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(date).toLocaleDateString();
}

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(post._count.likes);
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentList, setCommentList] = useState<CommentType[]>(post.comments ?? []);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editBody, setEditBody] = useState(post.body ?? '');
  const [displayTitle, setDisplayTitle] = useState(post.title);
  const [displayBody, setDisplayBody] = useState(post.body ?? '');

  const isOwner = user?.userId === post.userId;

  async function handleLike() {
    if (!user) return;
    try {
      if (liked) {
        await likesApi.unlike(post.postId);
        setLikeCount((c) => c - 1);
        setLiked(false);
      } else {
        await likesApi.like(post.postId);
        setLikeCount((c) => c + 1);
        setLiked(true);
      }
    } catch {
      // Already liked/unliked — toggle UI anyway
    }
  }

  async function handleDelete() {
    try {
      await postsApi.delete(post.postId);
      onDelete?.();
    } catch {
      // ignore
    }
  }

  async function handleEdit() {
    try {
      await postsApi.update(post.postId, { title: editTitle, body: editBody });
      setDisplayTitle(editTitle);
      setDisplayBody(editBody);
      setEditing(false);
    } catch {
      // ignore
    }
  }

  async function handleAddComment(content: string) {
    await commentsApi.create(post.postId, content);
    const res = await commentsApi.getByPost(post.postId);
    setCommentList(res.data);
  }

  async function handleDeleteComment(commentId: number) {
    await commentsApi.delete(commentId);
    setCommentList((prev) => prev.filter((c) => c.commentId !== commentId));
  }

  return (
    <article className="bg-card rounded-xl border border-border p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/users/${post.userId}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <Avatar username={post.user.username} avatarUrl={post.user.avatarUrl} />
          <div>
            <p className="font-semibold text-sm text-card-foreground">
              {post.user.username}
            </p>
            <p className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</p>
          </div>
        </Link>
        {isOwner && !editing && (
          <div className="flex gap-1">
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-muted-foreground hover:text-primary px-2 py-1 rounded-md hover:bg-muted transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-xs text-muted-foreground hover:text-accent px-2 py-1 rounded-md hover:bg-muted transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-2">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-card-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-card-foreground outline-none resize-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-card-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="font-semibold text-card-foreground">{displayTitle}</h3>
          {displayBody && (
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
              {displayBody}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-2 border-t border-border">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-accent' : 'text-muted-foreground hover:text-accent'}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={2}
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
          {likeCount}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
            />
          </svg>
          {commentList.length}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <CommentSection
          comments={commentList}
          currentUserId={user?.userId ?? null}
          onAdd={handleAddComment}
          onDelete={handleDeleteComment}
        />
      )}
    </article>
  );
}
