'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Comment } from '@/lib/types';
import Avatar from './avatar';

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

interface CommentSectionProps {
  comments: Comment[];
  currentUserId: number | null;
  onAdd: (content: string) => Promise<void>;
  onDelete: (commentId: number) => Promise<void>;
}

export default function CommentSection({
  comments,
  currentUserId,
  onAdd,
  onDelete,
}: CommentSectionProps) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAdd(text.trim());
      setText('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 pt-2">
      {/* Comment list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {comments.map((c) => (
          <div key={c.commentId} className="flex gap-2.5 group">
            <Link href={`/users/${c.userId}`}>
              <Avatar username={c.user.username} size="sm" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="bg-muted rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/users/${c.userId}`}
                    className="text-xs font-semibold text-card-foreground hover:underline"
                  >
                    {c.user.username}
                  </Link>
                  <span className="text-[10px] text-muted-foreground">
                    {timeAgo(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-card-foreground mt-0.5">{c.content}</p>
              </div>
              {currentUserId === c.userId && (
                <button
                  onClick={() => onDelete(c.commentId)}
                  className="text-[10px] text-muted-foreground hover:text-accent mt-0.5 ml-3 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            No comments yet
          </p>
        )}
      </div>

      {/* Add comment */}
      {currentUserId && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            maxLength={255}
            className="flex-1 px-3 py-2 text-sm bg-muted border border-border rounded-lg text-card-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Post
          </button>
        </form>
      )}
    </div>
  );
}
