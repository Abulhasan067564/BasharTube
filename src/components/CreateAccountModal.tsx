import React, { useEffect, useState } from 'react';
import { Camera, CheckCircle2, UserPlus, X } from 'lucide-react';
import { buildInitialAvatarSvg, useApp } from '../context/AppContext';
import { MediaThumb } from './MediaThumb';

interface CreateAccountModalProps {
  onClose: () => void;
  onCreated?: () => void;
}

const GoogleMark: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.54-5.17 3.54-8.89Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.88-3.02c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.96H1.28v3.12A12 12 0 0 0 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.29 14.26A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.26V6.62H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4.01-3.12Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4.01 3.12c.94-2.85 3.59-4.97 6.71-4.97Z"
    />
  </svg>
);

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({
  onClose,
  onCreated,
}) => {
  const { state, firebaseUser, authError, clearAuthError, signInWithGoogle, createAccount } = useApp();
  const [ownerName, setOwnerName] = useState(firebaseUser?.displayName || '');
  const [email, setEmail] = useState(firebaseUser?.email || '');
  const [channelName, setChannelName] = useState('');
  const [handle, setHandle] = useState('');
  const [handleTouched, setHandleTouched] = useState(false);
  const [channelDescription, setChannelDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>(firebaseUser?.photoURL || '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (firebaseUser) {
      if (!ownerName && firebaseUser.displayName) setOwnerName(firebaseUser.displayName);
      if (!email && firebaseUser.email) setEmail(firebaseUser.email);
      if (!avatarUrl && firebaseUser.photoURL) setAvatarUrl(firebaseUser.photoURL);
    }
  }, [firebaseUser, ownerName, email, avatarUrl]);

  const previewAvatar =
    avatarUrl || buildInitialAvatarSvg(channelName || ownerName || 'Y');

  const handleChannelChange = (val: string) => {
    setChannelName(val);
    if (!handleTouched) {
      const slug = val
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      setHandle(slug ? `@${slug}` : '');
    }
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGoogleConnect = async () => {
    clearAuthError();
    setError(null);
    const user = await signInWithGoogle();
    if (user) {
      if (user.displayName && !ownerName) setOwnerName(user.displayName);
      if (user.email) setEmail(user.email);
      if (user.photoURL && !avatarUrl) setAvatarUrl(user.photoURL);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setError(null);

    if (!channelName.trim()) {
      setError('Please enter a channel name.');
      return;
    }
    if (!ownerName.trim() && !firebaseUser?.displayName) {
      setError('Please enter your name.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await createAccount({
        ownerName: ownerName.trim() || firebaseUser?.displayName || channelName.trim(),
        email: firebaseUser?.email || email.trim(),
        channelName,
        handle: handle || `@${channelName.replace(/\s+/g, '')}`,
        channelDescription,
        avatarUrl: avatarUrl || undefined,
      });
      if (created) {
        onCreated?.();
        onClose();
      } else {
        setError('Please complete Google Sign-In to create your channel.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-[#181818] text-zinc-900 dark:text-white rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[92%] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#FF0000]" />
            <h3 className="text-base font-bold">Create Channel · {state.appBrand.name}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {/* Google Sign-In Status / Button */}
          {firebaseUser ? (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-emerald-400 truncate">
                  Signed in with Google
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {firebaseUser.email}
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleConnect}
              className="w-full h-11 rounded-full bg-white text-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 text-xs font-semibold flex items-center justify-center gap-2.5 shadow-sm transition-colors"
            >
              <GoogleMark />
              <span>Continue with Google</span>
            </button>
          )}

          {/* Channel Logo Picker */}
          <div className="flex flex-col items-center gap-1.5 py-1">
            <label className="relative cursor-pointer group">
              <MediaThumb
                src={previewAvatar}
                alt="Channel logo preview"
                className="w-18 h-18 rounded-full object-cover border-2 border-zinc-300 dark:border-zinc-700"
              />
              <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-md">
                <Camera className="w-3.5 h-3.5" />
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                className="hidden"
              />
            </label>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
              Channel Logo (tap to upload)
            </span>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. Abul Hasan"
              className="w-full h-10 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="pt-1 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                Channel Name
              </label>
              <input
                type="text"
                value={channelName}
                onChange={(e) => handleChannelChange(e.target.value)}
                placeholder="e.g. Bashar Studio"
                className="w-full h-10 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                Channel Handle
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => {
                  setHandleTouched(true);
                  setHandle(e.target.value);
                }}
                placeholder="@channelhandle"
                className="w-full h-10 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm font-mono outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400 block mb-1">
                Channel Details
              </label>
              <textarea
                rows={2}
                value={channelDescription}
                onChange={(e) => setChannelDescription(e.target.value)}
                placeholder="Describe your channel, topics, or upload schedule..."
                className="w-full p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {(error || authError) && (
            <p className="text-xs text-red-500 font-medium">{error || authError}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-full bg-[#FF0000] hover:bg-red-600 text-white text-sm font-semibold transition-colors mt-1 disabled:opacity-50"
          >
            {submitting
              ? 'Creating Channel...'
              : firebaseUser
              ? 'Create Channel'
              : 'Sign in with Google & Create Channel'}
          </button>
        </form>
      </div>
    </div>
  );
};
