'use client';

import Link from 'next/link';
import type { FollowUser } from '@/lib/types';
import Avatar from './avatar';

interface UserCardProps {
  user: FollowUser;
}

export default function UserCard({ user }: UserCardProps) {
  return (
    <Link
      href={`/users/${user.userId}`}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
    >
      <Avatar username={user.username} avatarUrl={user.avatarUrl} size="sm" />
      <span className="text-sm font-medium text-card-foreground">{user.username}</span>
    </Link>
  );
}
