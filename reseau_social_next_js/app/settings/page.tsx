'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { auth as authApi } from '@/lib/api';
import Avatar from '@/components/avatar';

export default function SettingsPage() {
  const { user, loading: authLoading, refreshUser, signout } = useAuth();
  const router = useRouter();

  // Profile form
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Delete account
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'code'>(
    'idle',
  );
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signin');
      return;
    }
    if (user) {
      setUsername(user.username);
      setBio(user.bio ?? '');
      setAvatarUrl(user.avatarUrl ?? '');
    }
  }, [user, authLoading, router]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg('');
    setProfileSaving(true);
    try {
      await authApi.updateProfile({
        username: username.trim(),
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      await refreshUser();
      setProfileMsg('Profile updated!');
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? 'Failed to update profile';
      setProfileMsg(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleDeleteRequest() {
    if (!user) return;
    setDeleteError('');
    setDeleteLoading(true);
    try {
      await authApi.deleteAccount({
        email: user.email,
        password: deletePassword,
      });
      setDeleteStep('code');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? 'Request failed';
      setDeleteError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!user) return;
    setDeleteError('');
    setDeleteLoading(true);
    try {
      await authApi.confirmDeleteAccount({
        email: user.email,
        password: deletePassword,
        code: deleteCode,
      });
      signout();
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ?? 'Confirmation failed';
      setDeleteError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setDeleteLoading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[80vh]">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-8">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* Edit Profile */}
      <section className="bg-card rounded-xl border border-border p-5 space-y-4">
        <h2 className="font-semibold">Edit Profile</h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar
              username={username || user.username}
              avatarUrl={avatarUrl || null}
              size="lg"
            />
            <div className="flex-1 space-y-1.5">
              <label htmlFor="avatarUrl" className="text-xs text-muted-foreground">
                Avatar URL
              </label>
              <input
                id="avatarUrl"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-3 py-2 text-sm bg-muted border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={55}
              required
              className="w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-lg outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-lg outline-none resize-none focus:ring-2 focus:ring-ring"
              placeholder="Tell us about yourself..."
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/500
            </p>
          </div>
          {profileMsg && (
            <p
              className={`text-sm ${profileMsg.includes('updated') ? 'text-emerald-600' : 'text-accent'}`}
            >
              {profileMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={profileSaving}
            className="px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {profileSaving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </section>

      {/* Danger Zone */}
      <section className="bg-card rounded-xl border border-accent/30 p-5 space-y-4">
        <h2 className="font-semibold text-accent">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">
          Once you delete your account, there is no going back. All your posts,
          comments, and data will be permanently removed.
        </p>

        {deleteStep === 'idle' && (
          <button
            onClick={() => setDeleteStep('confirm')}
            className="px-4 py-2 text-sm font-medium text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors"
          >
            Delete my account
          </button>
        )}

        {deleteStep === 'confirm' && (
          <div className="space-y-3">
            {deleteError && (
              <div className="px-3 py-2 text-sm text-accent bg-accent/10 rounded-lg">
                {deleteError}
              </div>
            )}
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password to confirm"
              className="w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDeleteRequest}
                disabled={!deletePassword || deleteLoading}
                className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleteLoading ? 'Sending code...' : 'Send confirmation code'}
              </button>
              <button
                onClick={() => {
                  setDeleteStep('idle');
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-card-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {deleteStep === 'code' && (
          <div className="space-y-3">
            {deleteError && (
              <div className="px-3 py-2 text-sm text-accent bg-accent/10 rounded-lg">
                {deleteError}
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              A confirmation code has been sent to your email.
            </p>
            <input
              type="text"
              value={deleteCode}
              onChange={(e) => setDeleteCode(e.target.value)}
              maxLength={5}
              placeholder="Enter 5-digit code"
              className="w-full px-3 py-2.5 text-sm bg-muted border border-border rounded-lg outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground text-center tracking-widest text-lg"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteCode.length !== 5 || deleteLoading}
                className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Permanently delete account'}
              </button>
              <button
                onClick={() => {
                  setDeleteStep('idle');
                  setDeletePassword('');
                  setDeleteCode('');
                  setDeleteError('');
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-card-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
