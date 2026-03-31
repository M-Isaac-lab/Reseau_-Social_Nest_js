'use client';

import Image from 'next/image';

interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-2xl',
};

const colors = [
  'bg-indigo-500',
  'bg-rose-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-violet-500',
  'bg-pink-500',
  'bg-teal-500',
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export default function Avatar({
  username,
  avatarUrl,
  size = 'md',
  className = '',
}: AvatarProps) {
  const pixelSize = { sm: 32, md: 40, lg: 48, xl: 80 }[size];

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={username}
        width={pixelSize}
        height={pixelSize}
        className={`${sizeMap[size]} rounded-full object-cover ${className}`}
        unoptimized
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} ${getColor(username)} rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${className}`}
    >
      {username[0]?.toUpperCase()}
    </div>
  );
}
