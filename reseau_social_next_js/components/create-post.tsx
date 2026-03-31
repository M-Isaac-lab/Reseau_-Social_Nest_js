'use client';

import { useState } from 'react';
import { posts } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Avatar from './avatar';

interface CreatePostProps {
  onCreated: () => void;
}

export default function CreatePost({ onCreated }: CreatePostProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    try {
      await posts.create({ title: title.trim(), body: body.trim() || undefined });
      setTitle('');
      setBody('');
      setExpanded(false);
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex gap-3">
        <Avatar username={user.username} avatarUrl={user.avatarUrl} />
        <div className="flex-1">
          {!expanded ? (
            <button
              onClick={() => setExpanded(true)}
              className="w-full text-left px-4 py-2.5 text-sm text-muted-foreground bg-muted rounded-lg hover:bg-border transition-colors"
            >
              What&apos;s on your mind?
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                maxLength={255}
                autoFocus
                className="w-full px-3 py-2 text-sm font-medium bg-muted border border-border rounded-lg text-card-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Tell us more... (optional)"
                rows={3}
                className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg text-card-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(false);
                    setTitle('');
                    setBody('');
                  }}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-card-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || submitting}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
