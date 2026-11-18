import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Eye,
  EyeOff,
  Film,
  Image as ImageIcon,
  KeyRound,
  Lock,
  Palette,
  Plus,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  Video,
} from 'lucide-react';
import { NotificationItem, VideoItem } from '../types';
import { formatCount, useApp } from '../context/AppContext';
import {
  DEFAULT_BRAND_LOGO,
  DEFAULT_BRAND_NAME,
  IMG_FISHING,
  IMG_FOOD,
  IMG_NASHEED,
  IMG_NATOK,
  IMG_TECH,
} from '../data/seedData';
import { MediaThumb } from './MediaThumb';
import { YouTubeLogoMark } from './YouTubeIcons';

interface AdminPanelProps {
  onBackToApp: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToApp }) => {
  const {
    state,
    verifyAdminPassword,
    changeAdminPassword,
    updateAppBrand,
    adminAddVideo,
    adminUpdateVideo,
    adminDeleteVideo,
    adminUpdateChannel,
    adminBroadcastNotification,
    adminDeleteNotification,
    adminResetAll,
  } = useApp();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Admin Tabs
  const [tab, setTab] = useState<'overview' | 'branding' | 'content' | 'channels' | 'notifications' | 'security'>('overview');

  // Branding Form
  const [brandNameInput, setBrandNameInput] = useState(state.appBrand.name);
  const [brandLogoInput, setBrandLogoInput] = useState(state.appBrand.logoUrl || '');
  const [brandSavedMsg, setBrandSavedMsg] = useState<string | null>(null);

  // Add Content Form
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<VideoItem['type']>('video');
  const [newChannelId, setNewChannelId] = useState(state.channels[0]?.id || '__custom__');
  const [customChannelName, setCustomChannelName] = useState('');
  const [newCategory, setNewCategory] = useState('Tech');
  const [newThumb, setNewThumb] = useState(IMG_TECH);
  const [newVideoUrl, setNewVideoUrl] = useState<string | undefined>(undefined);
  const [newVideoFileName, setNewVideoFileName] = useState<string | null>(null);
  const [newDuration, setNewDuration] = useState('4:15');

  // Broadcast Notification Form
  const [notifTitle, setNotifTitle] = useState('');
  const [notifChannel, setNotifChannel] = useState(state.channels[0]?.name || state.appBrand.name);
  const [notifType, setNotifType] = useState<NotificationItem['type']>('upload');

  // Password Change Form
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');
  const [securityFeedback, setSecurityFeedback] = useState<string | null>(null);

  useEffect(() => {
    setBrandNameInput(state.appBrand.name);
    setBrandLogoInput(state.appBrand.logoUrl || '');
  }, [state.appBrand.name, state.appBrand.logoUrl]);

  useEffect(() => {
    if (state.channels.length > 0 && newChannelId === '__custom__' && !customChannelName) {
      setNewChannelId(state.channels[0].id);
    }
  }, [state.channels, newChannelId, customChannelName]);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const t = setInterval(() => setLockoutSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [lockoutSeconds]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;
    if (verifyAdminPassword(passwordInput)) {
      setIsUnlocked(true);
      setErrorMsg(null);
      setFailedAttempts(0);
      setPasswordInput('');
    } else {
      const nextFails = failedAttempts + 1;
      setFailedAttempts(nextFails);
      if (nextFails >= 5) {
        setLockoutSeconds(30);
        setErrorMsg('Too many failed attempts. Locked for 30 seconds.');
      } else {
        setErrorMsg(`Incorrect password. ${5 - nextFails} attempts remaining.`);
      }
    }
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBrandLogoInput(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleThumbFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewThumb(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewVideoFileName(file.name);
    if (file.size <= 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setNewVideoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setNewVideoUrl(URL.createObjectURL(file));
    }
  };

  if (!isUnlocked) {
    return (
      <div className="flex-1 flex flex-col bg-[#0B0D11] text-white p-5 justify-between">
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToApp}
            className="min-h-[44px] px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium flex items-center gap-1.5 hover:bg-zinc-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to App</span>
          </button>
          <span className="text-xs font-mono text-zinc-400">Protected Console</span>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-6 my-auto">
          <div className="text-center space-y-2.5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Admin Panel Access</h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Enter the administrator password to customize app logo & name, manage videos, Shorts, channels, and notifications.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter strong password..."
                  disabled={lockoutSeconds > 0}
                  autoComplete="off"
                  className="w-full h-12 pl-4 pr-12 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-mono outline-none focus:border-red-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1 h-10 w-10 flex items-center justify-center text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                <span>
                  {lockoutSeconds > 0 ? `Locked for ${lockoutSeconds}s` : errorMsg}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={!passwordInput || lockoutSeconds > 0}
              className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
            >
              <Lock className="w-4 h-4" />
              <span>Unlock Admin Panel</span>
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-zinc-500">
          {state.appBrand.name} · Administrator Authentication
        </p>
      </div>
    );
  }

  const totalViews = state.videos.reduce((sum, v) => sum + v.viewsCount, 0);
  const totalSubscribers = state.channels.reduce((sum, c) => sum + c.subscribersCount, 0);

  const handleSaveBrand = (e: React.FormEvent) => {
    e.preventDefault();
    updateAppBrand({
      name: brandNameInput.trim() || DEFAULT_BRAND_NAME,
      logoUrl: brandLogoInput.trim() || null,
    });
    setBrandSavedMsg('App logo & name updated across the platform.');
    setTimeout(() => setBrandSavedMsg(null), 2500);
  };

  const handleAddContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const ch = state.channels.find((c) => c.id === newChannelId);
    const resolvedChannelName =
      ch?.name || customChannelName.trim() || `${state.appBrand.name} Official`;

    adminAddVideo({
      type: newType,
      title: newTitle.trim(),
      channelId: ch?.id || '',
      channelName: resolvedChannelName,
      channelHandle: ch?.handle || `@${resolvedChannelName.replace(/\s+/g, '')}`,
      channelAvatar: ch?.avatarUrl || state.appBrand.logoUrl || IMG_TECH,
      customChannelName: resolvedChannelName,
      thumbnailUrl: newThumb,
      videoUrl: newVideoUrl,
      accentGradient: 'from-red-700/40 via-zinc-900 to-black',
      duration: newType === 'live' ? 'LIVE' : newDuration,
      viewsCount: 1,
      viewsLabel: '1',
      likesCount: 0,
      publishedAgo: 'Just now',
      category: newCategory,
      description: `Published via ${state.appBrand.name} Admin Panel.`,
      tags: [`#${newCategory.toLowerCase().replace(/\s+/g, '')}`],
      visibility: 'Public',
      watchingCount: newType === 'live' ? 1 : undefined,
    });
    setNewTitle('');
    setNewVideoUrl(undefined);
    setNewVideoFileName(null);
  };

  const handleSendNotif = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim()) return;
    adminBroadcastNotification({
      title: notifTitle.trim(),
      channelName: notifChannel || state.appBrand.name,
      type: notifType,
    });
    setNotifTitle('');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdminPass.length < 8) {
      setSecurityFeedback('Password must be at least 8 characters.');
      return;
    }
    if (newAdminPass !== confirmAdminPass) {
      setSecurityFeedback('Passwords do not match.');
      return;
    }
    changeAdminPassword(newAdminPass);
    setNewAdminPass('');
    setConfirmAdminPass('');
    setSecurityFeedback('Admin password updated successfully.');
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0B0D11] text-white overflow-hidden">
      {/* Admin Top Header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBackToApp}
            className="min-h-[40px] px-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium flex items-center gap-1.5 hover:bg-zinc-800 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>App</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-bold leading-tight">Admin Console</h1>
            <p className="text-[11px] text-zinc-400 truncate">{state.appBrand.name}</p>
          </div>
        </div>

        <button
          onClick={() => setIsUnlocked(false)}
          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 shrink-0"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Lock</span>
        </button>
      </header>

      {/* Admin Navigation Tabs */}
      <nav className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-zinc-800 overflow-x-auto no-scrollbar bg-zinc-950/60">
        {([
          { id: 'overview', label: 'Overview' },
          { id: 'branding', label: 'Logo & Name' },
          { id: 'content', label: 'Content' },
          { id: 'channels', label: 'Channels' },
          { id: 'notifications', label: 'Alerts' },
          { id: 'security', label: 'Security' },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              tab === t.id
                ? 'bg-red-600 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Admin Scrollable Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5">
        {tab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Total Videos</span>
                  <Film className="w-4 h-4 text-red-500" />
                </div>
                <p className="text-2xl font-bold font-mono tabular-nums">{state.videos.length}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Platform Views</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold font-mono tabular-nums">{formatCount(totalViews)}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Accounts & Channels</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold font-mono tabular-nums">
                  {state.channels.length} ({formatCount(totalSubscribers)} subs)
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Notifications</span>
                  <Bell className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-bold font-mono tabular-nums">{state.notifications.length}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <h2 className="text-sm font-bold">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTab('branding')}
                  className="p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-left"
                >
                  Change Logo & Name
                </button>
                <button
                  onClick={() => setTab('content')}
                  className="p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-left"
                >
                  + Publish New Video
                </button>
              </div>
            </div>
          </>
        )}

        {tab === 'branding' && (
          <form onSubmit={handleSaveBrand} className="space-y-4">
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Palette className="w-4 h-4 text-red-500" />
                  <span>App Logo & Name</span>
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setBrandNameInput(DEFAULT_BRAND_NAME);
                    setBrandLogoInput(DEFAULT_BRAND_LOGO);
                    updateAppBrand({ name: DEFAULT_BRAND_NAME, logoUrl: DEFAULT_BRAND_LOGO });
                    setBrandSavedMsg('Reset to default BasharTube logo & name.');
                    setTimeout(() => setBrandSavedMsg(null), 2500);
                  }}
                  className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Live Header Preview */}
              <div className="p-3 rounded-xl bg-[#0F0F0F] border border-zinc-800">
                <p className="text-[10px] text-zinc-500 mb-2">Live Header Preview</p>
                <div className="flex items-center gap-2">
                  {brandLogoInput.trim() ? (
                    <img
                      src={brandLogoInput.trim()}
                      alt="Brand preview"
                      className="h-8 w-11 rounded-md object-contain bg-black shrink-0"
                    />
                  ) : (
                    <YouTubeLogoMark className="w-[29px] h-[20px] shrink-0" />
                  )}
                  <span className="font-display text-[19px] font-bold tracking-tight truncate">
                    {brandNameInput.trim() || DEFAULT_BRAND_NAME}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Platform Name</label>
                <input
                  type="text"
                  value={brandNameInput}
                  onChange={(e) => setBrandNameInput(e.target.value)}
                  placeholder="Enter app name (e.g. BasharTube)"
                  className="w-full h-10 px-3 rounded-lg bg-zinc-950 border border-zinc-700 text-sm outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Custom Logo Image</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 h-10 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Upload Logo from Device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileUpload}
                      className="hidden"
                    />
                  </label>
                  {brandLogoInput && (
                    <button
                      type="button"
                      onClick={() => setBrandLogoInput('')}
                      className="h-10 px-3 rounded-lg bg-zinc-800 text-xs text-red-400 hover:bg-zinc-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1.5">Or Logo Image URL</label>
                <input
                  type="text"
                  value={brandLogoInput}
                  onChange={(e) => setBrandLogoInput(e.target.value)}
                  placeholder="https://... (leave empty for default logo)"
                  className="w-full h-10 px-3 rounded-lg bg-zinc-950 border border-zinc-700 text-xs outline-none focus:border-red-500"
                />
              </div>

              {brandSavedMsg && (
                <p className="text-xs text-emerald-400 font-medium">{brandSavedMsg}</p>
              )}

              <button
                type="submit"
                className="w-full h-10 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold transition-colors"
              >
                Save Logo & Name
              </button>
            </div>
          </form>
        )}

        {tab === 'content' && (
          <div className="space-y-5">
            <form onSubmit={handleAddContent} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-red-500" />
                <span>Publish Video / Short / Live</span>
              </h2>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Video or Short title..."
                className="w-full h-10 px-3 rounded-lg bg-zinc-950 border border-zinc-700 text-xs outline-none focus:border-red-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as VideoItem['type'])}
                  className="h-10 px-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs outline-none"
                >
                  <option value="video">Standard Video</option>
                  <option value="short">Short</option>
                  <option value="music">Music</option>
                  <option value="live">Live Stream</option>
                </select>
                <select
                  value={newChannelId}
                  onChange={(e) => setNewChannelId(e.target.value)}
                  className="h-10 px-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs outline-none"
                >
                  {state.channels.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name}
                    </option>
                  ))}
                  <option value="__custom__">+ New Channel Name</option>
                </select>
              </div>

              {(newChannelId === '__custom__' || state.channels.length === 0) && (
                <input
                  type="text"
                  value={customChannelName}
                  onChange={(e) => setCustomChannelName(e.target.value)}
                  placeholder={`Channel name (default: ${state.appBrand.name} Official)`}
                  className="w-full h-10 px-3 rounded-lg bg-zinc-950 border border-zinc-700 text-xs outline-none"
                />
              )}

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Category"
                  className="h-10 px-3 rounded-lg bg-zinc-950 border border-zinc-700 text-xs outline-none"
                />
                <input
                  type="text"
                  value={newDuration}
                  onChange={(e) => setNewDuration(e.target.value)}
                  placeholder="Duration (e.g. 4:15)"
                  className="h-10 px-3 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-mono outline-none"
                />
              </div>

              {/* Thumbnail Picker + Upload */}
              <div className="space-y-2">
                <p className="text-[11px] text-zinc-400">Thumbnail & Video File</p>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {[IMG_TECH, IMG_NATOK, IMG_NASHEED, IMG_FISHING, IMG_FOOD].map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setNewThumb(img)}
                      className={`w-12 h-8 rounded overflow-hidden border-2 shrink-0 ${
                        newThumb === img ? 'border-red-500' : 'border-transparent opacity-60'
                      }`}
                    >
                      <MediaThumb src={img} alt="Thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <label className="h-8 px-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer shrink-0">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <label className="w-full h-9 px-3 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-zinc-300 flex items-center justify-between cursor-pointer hover:border-zinc-500">
                  <span className="flex items-center gap-2 truncate">
                    <Video className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="truncate">
                      {newVideoFileName || 'Attach video file (optional .mp4/.webm)'}
                    </span>
                  </span>
                  <span className="text-[11px] text-blue-400 shrink-0 ml-2">Browse</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="w-full h-10 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold disabled:opacity-40"
              >
                Add to Feed
              </button>
            </form>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-400">All Content ({state.videos.length})</h3>
              {state.videos.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">
                  No videos uploaded yet. Publish one above to show it on the home feed.
                </p>
              ) : (
                state.videos.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800"
                  >
                    <MediaThumb src={v.thumbnailUrl} alt={v.title} className="w-16 h-10 rounded object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{v.title}</p>
                      <p className="text-[11px] text-zinc-400 tabular-nums">
                        {v.type.toUpperCase()} · {v.channelName} · {formatCount(v.viewsCount)} views
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        adminUpdateVideo(v.id, {
                          visibility: v.visibility === 'Public' ? 'Private' : 'Public',
                        })
                      }
                      className="px-2 py-1 rounded bg-zinc-800 text-[10px] font-medium"
                    >
                      {v.visibility}
                    </button>
                    <button
                      onClick={() => adminDeleteVideo(v.id)}
                      aria-label="Delete video"
                      className="p-2 text-zinc-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'channels' && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">
              Manage channel verification and subscriber counts (reaching 50 subscribers unlocks Live Streaming).
            </p>
            {state.channels.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center">
                No channels yet. Channels appear automatically when users create accounts or when you publish videos.
              </p>
            ) : (
              state.channels.map((ch) => (
                <div
                  key={ch.id}
                  className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MediaThumb src={ch.avatarUrl} alt={ch.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate flex items-center gap-1">
                          <span>{ch.name}</span>
                          {ch.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                        </p>
                        <p className="text-xs text-zinc-400 truncate">{ch.handle}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => adminUpdateChannel(ch.id, { isVerified: !ch.isVerified })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                        ch.isVerified ? 'bg-blue-600/20 text-blue-400' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {ch.isVerified ? 'Verified' : 'Verify'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                    <span className="text-xs text-zinc-400 tabular-nums">
                      Subscribers: <strong className="text-white">{formatCount(ch.subscribersCount)}</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          adminUpdateChannel(ch.id, { subscribersCount: ch.subscribersCount + 50 })
                        }
                        className="px-2.5 py-1 rounded bg-emerald-600/20 text-emerald-400 text-[11px] font-semibold"
                      >
                        +50 Subs
                      </button>
                      <button
                        onClick={() =>
                          adminUpdateChannel(ch.id, { subscribersCount: ch.subscribersCount + 1000 })
                        }
                        className="px-2.5 py-1 rounded bg-zinc-800 text-zinc-200 text-[11px] font-semibold"
                      >
                        +1K
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'notifications' && (
          <div className="space-y-4">
            <form onSubmit={handleSendNotif} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <h2 className="text-sm font-bold">Broadcast Push Notification</h2>
              <input
                type="text"
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Notification message..."
                className="w-full h-10 px-3 rounded-lg bg-zinc-950 border border-zinc-700 text-xs outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={notifChannel}
                  onChange={(e) => setNotifChannel(e.target.value)}
                  placeholder="Channel name"
                  className="h-10 px-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs outline-none"
                />
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value as NotificationItem['type'])}
                  className="h-10 px-2.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs outline-none"
                >
                  <option value="upload">Upload</option>
                  <option value="live">Live</option>
                  <option value="premiere">Premiere</option>
                  <option value="post">Community Post</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={!notifTitle.trim()}
                className="w-full h-10 rounded-lg bg-blue-600 text-xs font-semibold disabled:opacity-40"
              >
                Send Notification
              </button>
            </form>

            <div className="space-y-2">
              {state.notifications.map((n) => (
                <div key={n.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="min-w-0">
                    <p className="text-xs font-medium line-clamp-2">{n.title}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{n.channelName} · {n.timeAgo}</p>
                  </div>
                  <button onClick={() => adminDeleteNotification(n.id)} className="p-2 text-zinc-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div className="space-y-5">
            <form onSubmit={handleChangePassword} className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Update Admin Password</span>
              </h2>
              <input
                type="password"
                value={newAdminPass}
                onChange={(e) => setNewAdminPass(e.target.value)}
                placeholder="New strong password (min 8 chars)"
                className="w-full h-10 px-3 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-mono outline-none"
              />
              <input
                type="password"
                value={confirmAdminPass}
                onChange={(e) => setConfirmAdminPass(e.target.value)}
                placeholder="Confirm new password"
                className="w-full h-10 px-3 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-mono outline-none"
              />
              {securityFeedback && (
                <p className="text-xs text-amber-300">{securityFeedback}</p>
              )}
              <button
                type="submit"
                className="w-full h-10 rounded-lg bg-white text-black text-xs font-semibold"
              >
                Save New Password
              </button>
            </form>

            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <h2 className="text-sm font-bold">System Data</h2>
              <p className="text-xs text-zinc-400">
                Reset all videos, Shorts, accounts, channels, branding, and settings back to a clean fresh start.
              </p>
              <button
                onClick={adminResetAll}
                className="w-full h-10 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset App Data</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
