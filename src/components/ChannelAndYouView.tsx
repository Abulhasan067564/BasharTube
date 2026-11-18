import React, { useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Check,
  Clock,
  Copy,
  Download,
  Edit2,
  Eye,
  EyeOff,
  ListVideo,
  Pencil,
  Plus,
  Search,
  Settings,
  Shield,
  ThumbsUp,
  Trash2,
  UserCircle2,
  UserPlus,
  LogOut,
  Users,
  X,
} from 'lucide-react';
import { Channel, VideoItem } from '../types';
import { formatCount, useApp } from '../context/AppContext';
import { MediaThumb } from './MediaThumb';

type SubPage = 'you' | 'channel' | 'analytics' | 'edit-channel' | 'all-history';

export const ChannelAndYouView: React.FC<{
  initialChannelId?: string | null;
  onClearInitialChannel: () => void;
  onPlayVideo: (video: VideoItem) => void;
  onOpenShort: (shortId: string) => void;
  onOpenSettings: () => void;
  onOpenSearch: () => void;
  onOpenAdmin: () => void;
  onRequestCreateAccount: () => void;
}> = ({
  initialChannelId,
  onClearInitialChannel,
  onPlayVideo,
  onOpenShort,
  onOpenSettings,
  onOpenSearch,
  onOpenAdmin,
  onRequestCreateAccount,
}) => {
  const {
    state,
    firebaseUser,
    authError,
    signInWithGoogle,
    activeAccount,
    ownChannel,
    switchAccount,
    signOutAccount,
    toggleIncognito,
    toggleSubscribe,
    updateOwnChannel,
    votePoll,
    answerQuiz,
    removeFromWatchHistory,
    clearWatchHistory,
  } = useApp();

  const [subPage, setSubPage] = useState<SubPage>(initialChannelId ? 'channel' : 'you');
  const [youTab, setYouTab] = useState<'overview' | 'history'>('overview');
  const [historySearch, setHistorySearch] = useState('');
  const [viewingChannelId, setViewingChannelId] = useState<string>(
    initialChannelId || ownChannel?.id || ''
  );
  const [showAccountsSheet, setShowAccountsSheet] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<'Recents' | 'Downloaded' | 'Playlists' | 'Music'>('Recents');
  const [channelTab, setChannelTab] = useState<'Home' | 'Videos' | 'Shorts' | 'Live' | 'Playlists' | 'Posts'>('Home');
  const [videoSort, setVideoSort] = useState<'Latest' | 'Popular' | 'Oldest'>('Latest');
  const [postFilter, setPostFilter] = useState<'Published' | 'Scheduled' | 'Archived'>('Published');
  const [historyTab, setHistoryTab] = useState<'HISTORY' | 'CONTROLS' | 'INTERACTIONS'>('HISTORY');

  // Edit channel state
  const [editName, setEditName] = useState(ownChannel?.name || '');
  const [editHandle, setEditHandle] = useState(ownChannel?.handle || '');
  const [editDesc, setEditDesc] = useState(ownChannel?.description || '');
  const [copiedUrl, setCopiedUrl] = useState(false);

  React.useEffect(() => {
    if (initialChannelId) {
      setViewingChannelId(initialChannelId);
      setSubPage('channel');
    }
  }, [initialChannelId]);

  React.useEffect(() => {
    if (ownChannel) {
      setEditName(ownChannel.name);
      setEditHandle(ownChannel.handle);
      setEditDesc(ownChannel.description);
    }
  }, [ownChannel?.id]);

  const openChannel = (id: string) => {
    setViewingChannelId(id);
    setChannelTab('Home');
    setSubPage('channel');
  };

  const targetChannel: Channel | null =
    state.channels.find((c) => c.id === viewingChannelId) || ownChannel || null;
  const isOwn = Boolean(ownChannel && targetChannel && targetChannel.id === ownChannel.id);

  const historyVideos = [...state.watchHistoryIds]
    .sort((aId, bId) => {
      const aTs = state.watchHistoryTimestamps?.[aId] ?? 0;
      const bTs = state.watchHistoryTimestamps?.[bId] ?? 0;
      return bTs - aTs;
    })
    .map((id) => state.videos.find((v) => v.id === id))
    .filter((v): v is VideoItem => Boolean(v));

  const formatWatchedAgo = (videoId: string): string => {
    const ts = state.watchHistoryTimestamps?.[videoId];
    if (!ts) return 'Watched recently';
    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (diffSec < 60) return 'Watched just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Watched ${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `Watched ${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `Watched ${diffDay}d ago`;
  };

  const filteredHistoryVideos = historySearch.trim()
    ? historyVideos.filter(
        (v) =>
          v.title.toLowerCase().includes(historySearch.trim().toLowerCase()) ||
          v.channelName.toLowerCase().includes(historySearch.trim().toLowerCase())
      )
    : historyVideos;

  const likedVideos = state.videos.filter((v) => v.isLiked);
  const watchLaterVideos = state.videos.filter((v) => v.isWatchLater);
  const downloadedVideos = state.videos.filter((v) => v.isDownloaded);

  const channelVideos = targetChannel
    ? state.videos.filter((v) => v.channelId === targetChannel.id)
    : [];
  const channelShorts = channelVideos.filter((v) => v.type === 'short');
  const channelRegularVideos = channelVideos.filter((v) => v.type === 'video' || v.type === 'music');
  const channelLive = channelVideos.filter((v) => v.type === 'live');
  const channelPosts = targetChannel
    ? state.posts.filter((p) => p.channelId === targetChannel.id && p.status === postFilter)
    : [];

  const sortedRegularVideos = [...channelRegularVideos].sort((a, b) => {
    if (videoSort === 'Popular') return b.viewsCount - a.viewsCount;
    if (videoSort === 'Oldest') return a.id.localeCompare(b.id);
    return b.id.localeCompare(a.id);
  });

  if (subPage === 'analytics' && ownChannel) {
    const totalViews = channelVideos.reduce((sum, v) => sum + v.viewsCount, 0);
    const totalLikes = channelVideos.reduce((sum, v) => sum + v.likesCount, 0);
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0F0F0F] text-zinc-900 dark:text-white overflow-hidden">
        <header className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <button onClick={() => setSubPage('channel')} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold">Analytics</h2>
          </div>
          <span className="text-xs text-zinc-500">All time</span>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5 pb-20">
          <div className="flex items-center gap-4">
            <MediaThumb src={ownChannel.avatarUrl} alt={ownChannel.name} className="w-14 h-14 rounded-full object-cover bg-zinc-800" />
            <div>
              <p className="text-2xl font-bold tabular-nums">{ownChannel.subscribersCount}</p>
              <p className="text-xs text-zinc-500">Subscribers</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 py-3 border-y border-zinc-200 dark:border-zinc-800">
            <div>
              <p className="text-xl font-bold tabular-nums">{formatCount(totalViews)}</p>
              <p className="text-xs text-zinc-500">Views</p>
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums">{formatCount(totalLikes)}</p>
              <p className="text-xs text-zinc-500">Likes</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-2">Recent views</h3>
            <div className="h-28 flex items-end gap-2 px-2 pt-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
              {[18, 32, 24, 65, 90, 42, 78].map((h, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    style={{ height: `${h}%` }}
                    className="w-full max-w-[20px] rounded-t bg-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-zinc-500 mt-1">
              <span>Nov 9</span>
              <span>Nov 16</span>
            </div>
          </div>

          {channelVideos[0] && (
            <div>
              <h3 className="text-sm font-bold mb-2">Latest creation</h3>
              <button
                onClick={() => onPlayVideo(channelVideos[0])}
                className="w-full flex gap-3 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left"
              >
                <MediaThumb src={channelVideos[0].thumbnailUrl} alt={channelVideos[0].title} className="w-24 aspect-video rounded-lg object-cover shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold line-clamp-2">{channelVideos[0].title}</p>
                  <p className="text-[11px] text-zinc-500 mt-1 tabular-nums">
                    {channelVideos[0].viewsLabel} views · {channelVideos[0].likesCount} likes
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (subPage === 'edit-channel' && ownChannel) {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0F0F0F] text-zinc-900 dark:text-white overflow-hidden">
        <header className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <button onClick={() => setSubPage('channel')} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold">Edit channel</h2>
          </div>
          <button
            onClick={() => {
              updateOwnChannel({
                name: editName.trim() || ownChannel.name,
                handle: editHandle.trim() || ownChannel.handle,
                description: editDesc,
              });
              setSubPage('channel');
            }}
            className="px-3.5 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold"
          >
            Save
          </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
          <div className={`relative h-28 bg-gradient-to-r ${ownChannel.bannerGradient} flex items-center justify-center`}>
            <MediaThumb
              src={ownChannel.avatarUrl}
              alt={ownChannel.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
            />
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Name</label>
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <Pencil className="w-4 h-4 text-zinc-400" />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 block mb-1">Handle</label>
              <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <input
                  type="text"
                  value={editHandle}
                  onChange={(e) => setEditHandle(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <Pencil className="w-4 h-4 text-zinc-400" />
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 block mb-1">Channel URL</label>
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <span className="text-xs text-zinc-500 truncate">
                  https://www.youtube.com/{editHandle}
                </span>
                <button
                  onClick={() => {
                    setCopiedUrl(true);
                    setTimeout(() => setCopiedUrl(false), 1500);
                  }}
                  className="p-1.5 text-zinc-400"
                >
                  {copiedUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500 block mb-1">Description</label>
              <textarea
                rows={3}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="w-full rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 text-xs outline-none"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">My Community</p>
                <p className="text-xs text-zinc-500">Viewers can post</p>
              </div>
              <button
                onClick={() => updateOwnChannel({ communityEnabled: !ownChannel.communityEnabled })}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                  ownChannel.communityEnabled ? 'bg-blue-600' : 'bg-zinc-600'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${ownChannel.communityEnabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Privacy</p>
                <p className="text-xs text-zinc-500">Keep all my subscriptions private</p>
              </div>
              <button
                onClick={() => updateOwnChannel({ subscriptionsPrivate: !ownChannel.subscriptionsPrivate })}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                  ownChannel.subscriptionsPrivate ? 'bg-blue-600' : 'bg-zinc-600'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${ownChannel.subscriptionsPrivate ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (subPage === 'all-history') {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0F0F0F] text-zinc-900 dark:text-white overflow-hidden">
        <header className="flex items-center justify-between px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <button onClick={() => setSubPage('you')} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold">BasharTube History</h2>
          </div>
          <button
            onClick={clearWatchHistory}
            className="text-xs font-semibold text-red-500 px-2.5 py-1.5"
          >
            Clear all
          </button>
        </header>

        <div className="grid grid-cols-3 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold">
          {(['HISTORY', 'CONTROLS', 'INTERACTIONS'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setHistoryTab(t)}
              className={`py-3 border-b-2 ${
                historyTab === t ? 'border-zinc-900 dark:border-white' : 'border-transparent text-zinc-500'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-20">
          {historyTab === 'HISTORY' && (
            <>
              <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
                <p className="font-semibold">Saving your search & watch history</p>
                <p className="text-zinc-500">Auto-delete (36 months)</p>
              </div>
              {historyVideos.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-8">Watch history is empty.</p>
              ) : (
                historyVideos.map((v) => (
                  <button
                    key={`allh-${v.id}`}
                    onClick={() => onPlayVideo(v)}
                    className="w-full flex gap-3 text-left"
                  >
                    <MediaThumb src={v.thumbnailUrl} alt={v.title} className="w-28 aspect-video rounded-lg object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold line-clamp-2">{v.title}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{v.channelName}</p>
                    </div>
                  </button>
                ))
              )}
            </>
          )}

          {historyTab === 'CONTROLS' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <p className="font-semibold text-sm">BasharTube Watch History</p>
                <p className="text-zinc-500 mt-1">Saves the videos you watch across devices.</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <p className="font-semibold text-sm">BasharTube Search History</p>
                <p className="text-zinc-500 mt-1">Helps improve recommendations and search suggestions.</p>
              </div>
            </div>
          )}

          {historyTab === 'INTERACTIONS' && (
            <div className="space-y-3 text-xs">
              <p className="text-zinc-500">Liked videos: {likedVideos.length}</p>
              <p className="text-zinc-500">Saved Watch Later: {watchLaterVideos.length}</p>
              <p className="text-zinc-500">Subscribed channels: {state.channels.filter((c) => c.isSubscribed).length}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (subPage === 'channel' && targetChannel) {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-[#0F0F0F] text-zinc-900 dark:text-white overflow-hidden">
        <header className="flex items-center justify-between px-2.5 py-1.5 shrink-0">
          <button
            onClick={() => {
              onClearInitialChannel();
              setSubPage('you');
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button onClick={onOpenSearch} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Search className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
          {/* Channel Banner */}
          <div className={`mx-3 h-24 rounded-xl bg-gradient-to-r ${targetChannel.bannerGradient} p-3 flex flex-col justify-center items-center text-center text-white`}>
            <p className="font-display text-lg font-bold tracking-tight">{targetChannel.bannerTitle}</p>
            {targetChannel.bannerSubtitle && (
              <p className="text-[11px] text-zinc-300">{targetChannel.bannerSubtitle}</p>
            )}
          </div>

          {/* Channel Info */}
          <div className="px-3.5 pt-3.5 flex items-center gap-3.5">
            <MediaThumb
              src={targetChannel.avatarUrl}
              alt={targetChannel.name}
              className="w-16 h-16 rounded-full object-cover bg-zinc-800 shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-lg font-bold leading-tight truncate">{targetChannel.name}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{targetChannel.handle}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                {formatCount(targetChannel.subscribersCount)} subscribers · {targetChannel.videosCount} videos
              </p>
            </div>
          </div>

          <p className="px-3.5 mt-2.5 text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2">
            {targetChannel.description}
          </p>

          {/* Action Buttons */}
          <div className="px-3.5 mt-3 space-y-2">
            {isOwn ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSubPage('analytics')}
                    className="h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <BarChart3 className="w-4 h-4" /> Analytics
                  </button>
                  <button
                    onClick={() => {
                      if (!ownChannel) return;
                      setEditName(ownChannel.name);
                      setEditHandle(ownChannel.handle);
                      setEditDesc(ownChannel.description);
                      setSubPage('edit-channel');
                    }}
                    className="h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-4 h-4" /> Edit channel
                  </button>
                </div>
                <button
                  onClick={() => setChannelTab('Posts')}
                  className="w-full h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Users className="w-4 h-4" /> Community
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => toggleSubscribe(targetChannel.id)}
                  className={`h-9 rounded-full text-xs font-semibold ${
                    targetChannel.isSubscribed
                      ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                      : 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                  }`}
                >
                  {targetChannel.isSubscribed ? 'Subscribed' : 'Subscribe'}
                </button>
                <button
                  onClick={() => setChannelTab('Posts')}
                  className="h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Users className="w-4 h-4" /> Community
                </button>
              </div>
            )}
          </div>

          {/* Channel Tabs */}
          <div className="flex items-center gap-4 px-3.5 mt-3 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar">
            {(['Home', 'Videos', 'Shorts', 'Live', 'Playlists', 'Posts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setChannelTab(tab)}
                className={`py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap shrink-0 ${
                  channelTab === tab
                    ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
                    : 'border-transparent text-zinc-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-3.5 space-y-4">
            {channelTab === 'Home' && (
              <div className="space-y-4">
                {channelShorts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold mb-2">Shorts</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {channelShorts.map((sh) => (
                        <button
                          key={sh.id}
                          onClick={() => onOpenShort(sh.id)}
                          className="relative aspect-[9/14] rounded-xl overflow-hidden bg-zinc-900 text-left"
                        >
                          <MediaThumb src={sh.thumbnailUrl} alt={sh.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          <p className="absolute bottom-2 left-2 right-2 text-xs text-white font-semibold line-clamp-2">
                            {sh.title}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {sortedRegularVideos.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold mb-2">Popular videos</h3>
                    <div className="space-y-3">
                      {sortedRegularVideos.map((v) => (
                        <button key={v.id} onClick={() => onPlayVideo(v)} className="w-full flex gap-3 text-left">
                          <div className="relative w-36 aspect-video rounded-lg overflow-hidden bg-zinc-900 shrink-0">
                            <MediaThumb src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                              {v.duration}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold line-clamp-2">{v.title}</p>
                            <p className="text-[11px] text-zinc-500 mt-1 tabular-nums">
                              {v.viewsLabel} · {v.publishedAgo}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {channelTab === 'Videos' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(['Latest', 'Popular', 'Oldest'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setVideoSort(s)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        videoSort === s
                          ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {sortedRegularVideos.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-8 text-center">No uploaded videos yet.</p>
                ) : (
                  sortedRegularVideos.map((v) => (
                    <button key={v.id} onClick={() => onPlayVideo(v)} className="w-full flex gap-3 text-left">
                      <MediaThumb src={v.thumbnailUrl} alt={v.title} className="w-36 aspect-video rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold line-clamp-2">{v.title}</p>
                        <p className="text-[11px] text-zinc-500 mt-1 tabular-nums">
                          {v.viewsLabel} · {v.publishedAgo}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {channelTab === 'Shorts' && (
              <div className="grid grid-cols-2 gap-2">
                {channelShorts.map((sh) => (
                  <button
                    key={sh.id}
                    onClick={() => onOpenShort(sh.id)}
                    className="relative aspect-[9/14] rounded-xl overflow-hidden bg-zinc-900 text-left"
                  >
                    <MediaThumb src={sh.thumbnailUrl} alt={sh.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <p className="absolute bottom-2 left-2 right-2 text-xs text-white font-semibold line-clamp-2">
                      {sh.title}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {channelTab === 'Live' && (
              <div className="space-y-3">
                {channelLive.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-8 text-center">No recent live streams.</p>
                ) : (
                  channelLive.map((lv) => (
                    <button key={lv.id} onClick={() => onPlayVideo(lv)} className="w-full flex gap-3 text-left">
                      <MediaThumb src={lv.thumbnailUrl} alt={lv.title} className="w-36 aspect-video rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold line-clamp-2">{lv.title}</p>
                        <p className="text-[11px] text-red-500 font-semibold mt-1">{lv.viewsLabel}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {channelTab === 'Playlists' && (
              <div className="space-y-3">
                {watchLaterVideos.length === 0 && likedVideos.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-8 text-center">No playlists yet.</p>
                ) : (
                  [
                    { name: 'Watch later', count: watchLaterVideos.length, privacy: 'Private' },
                    { name: 'Liked videos', count: likedVideos.length, privacy: 'Private' },
                  ]
                    .filter((pl) => pl.count > 0)
                    .map((pl) => (
                      <div key={pl.name} className="flex items-center gap-3">
                        <div className="relative w-32 aspect-video rounded-lg bg-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                          <ListVideo className="w-6 h-6 text-zinc-400" />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] tabular-nums">
                            {pl.count}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{pl.name}</p>
                          <p className="text-xs text-zinc-500">{pl.privacy} · Playlist</p>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}

            {channelTab === 'Posts' && (
              <div className="space-y-4">
                {isOwn && (
                  <div className="flex gap-2">
                    {(['Published', 'Scheduled', 'Archived'] as const).map((pf) => (
                      <button
                        key={pf}
                        onClick={() => setPostFilter(pf)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                          postFilter === pf
                            ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {pf}
                      </button>
                    ))}
                  </div>
                )}

                {channelPosts.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-8 text-center">No posts in {postFilter}.</p>
                ) : (
                  channelPosts.map((post) => (
                    <div key={post.id} className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <MediaThumb src={post.channelAvatar} alt={post.channelName} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="text-xs font-semibold">{post.channelName}</p>
                          <p className="text-[11px] text-zinc-500">{post.timeAgo}</p>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed">{post.text}</p>
                      {post.imageUrl && (
                        <MediaThumb src={post.imageUrl} alt="Post attachment" className="w-full aspect-video rounded-xl object-cover" />
                      )}
                      {post.pollOptions && (
                        <div className="space-y-1.5 pt-1">
                          {post.pollOptions.map((opt) => {
                            const totalVotes = post.pollOptions!.reduce((s, o) => s + o.votes, 0) || 1;
                            const pct = Math.round((opt.votes / totalVotes) * 100);
                            const voted = post.votedOptionId === opt.id;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => votePoll(post.id, opt.id)}
                                className={`w-full relative overflow-hidden p-2.5 rounded-xl border text-left text-xs ${
                                  voted ? 'border-blue-500 font-semibold' : 'border-zinc-300 dark:border-zinc-700'
                                }`}
                              >
                                {post.votedOptionId && (
                                  <div
                                    style={{ width: `${pct}%` }}
                                    className="absolute inset-y-0 left-0 bg-blue-500/20"
                                  />
                                )}
                                <div className="relative flex justify-between">
                                  <span>{opt.text}</span>
                                  {post.votedOptionId && <span className="tabular-nums">{pct}%</span>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {post.quizOptions && (
                        <div className="space-y-1.5 pt-1">
                          {post.quizOptions.map((q) => {
                            const chosen = post.selectedQuizId === q.id;
                            return (
                              <button
                                key={q.id}
                                onClick={() => answerQuiz(post.id, q.id)}
                                className={`w-full p-2.5 rounded-xl border text-left text-xs ${
                                  chosen
                                    ? q.isCorrect
                                      ? 'border-emerald-500 bg-emerald-500/15'
                                      : 'border-red-500 bg-red-500/15'
                                    : 'border-zinc-300 dark:border-zinc-700'
                                }`}
                              >
                                {q.text}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex items-center gap-4 pt-1 text-xs text-zinc-500 tabular-nums">
                        <span className="flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" /> {post.likesCount}</span>
                        <span>{post.commentsCount} comments</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: 'you' Profile & Library screen
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-[#0F0F0F] text-zinc-900 dark:text-white overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-3 py-2 shrink-0">
        <button
          onClick={() => setShowAccountsSheet(true)}
          className="px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium flex items-center gap-1.5"
        >
          <span>{state.incognitoMode ? 'Incognito' : 'Accounts'}</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenAdmin}
            aria-label="Admin Panel"
            className="min-h-[44px] px-2.5 flex items-center gap-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-red-500"
          >
            <Shield className="w-4 h-4" />
            <span>Admin</span>
          </button>
          <button onClick={onOpenSearch} aria-label="Search" className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full">
            <Search className="w-5 h-5" />
          </button>
          <button onClick={onOpenSettings} aria-label="Settings" className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* You View Tabs: Overview & History */}
      <div className="grid grid-cols-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0 px-2">
        <button
          onClick={() => setYouTab('overview')}
          className={`py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            youTab === 'overview'
              ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
              : 'border-transparent text-zinc-500'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setYouTab('history')}
          className={`py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            youTab === 'history'
              ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white'
              : 'border-transparent text-zinc-500'
          }`}
        >
          <span>History</span>
          {historyVideos.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] font-bold tabular-nums">
              {historyVideos.length}
            </span>
          )}
        </button>
      </div>

      {youTab === 'history' ? (
        <div className="flex-1 overflow-y-auto no-scrollbar pb-20 px-3.5 pt-3 space-y-3.5">
          {state.incognitoMode && (
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-300">
              <EyeOff className="w-4 h-4 shrink-0 text-amber-500" />
              <span>Incognito is on — new views aren&apos;t saved to History.</span>
            </div>
          )}

          {/* Search & Actions */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 h-9 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search watch history"
                className="flex-1 bg-transparent text-xs outline-none"
              />
              {historySearch && (
                <button
                  onClick={() => setHistorySearch('')}
                  aria-label="Clear history search"
                  className="text-zinc-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setSubPage('all-history')}
              className="px-3 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium shrink-0"
            >
              Manage
            </button>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Most recent · {filteredHistoryVideos.length} video{filteredHistoryVideos.length === 1 ? '' : 's'}
            </p>
            {historyVideos.length > 0 && (
              <button
                onClick={clearWatchHistory}
                className="text-xs font-semibold text-red-500 flex items-center gap-1 py-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear all</span>
              </button>
            )}
          </div>

          {filteredHistoryVideos.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2 rounded-2xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80">
              <div className="w-12 h-12 mx-auto rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold">
                {historySearch ? 'No matching watched videos' : 'No watch history yet'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {historySearch
                  ? 'Try a different keyword.'
                  : 'Videos and Shorts you watch will appear here, sorted by most recent.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistoryVideos.map((v) => (
                <div key={`tab-hist-${v.id}`} className="flex items-start gap-2.5 group">
                  <button
                    onClick={() => onPlayVideo(v)}
                    className="flex-1 flex gap-3 text-left min-w-0"
                  >
                    <div className="relative w-36 aspect-video rounded-lg overflow-hidden bg-zinc-900 shrink-0">
                      <MediaThumb
                        src={v.thumbnailUrl}
                        alt={v.title}
                        className="w-full h-full object-cover"
                        fallbackGradient={v.accentGradient}
                      />
                      <span className="absolute bottom-1.5 right-1 px-1 py-0.5 rounded bg-black/85 text-white text-[10px] font-mono tabular-nums">
                        {v.duration}
                      </span>
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/30">
                        <div className="h-full w-3/4 bg-[#FF0000]" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold line-clamp-2 leading-snug">{v.title}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                        {v.channelName}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                        {v.viewsLabel} views · {formatWatchedAgo(v.id)}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => removeFromWatchHistory(v.id)}
                    aria-label={`Remove ${v.title} from watch history`}
                    className="p-1.5 text-zinc-400 hover:text-red-500 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
      <div className="flex-1 overflow-y-auto no-scrollbar pb-20 space-y-5">
        {/* Profile Header / Signed-out State */}
        {activeAccount ? (
          <section className="px-3.5 pt-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <MediaThumb
                  src={activeAccount.avatarUrl}
                  alt={activeAccount.channelName}
                  className="w-16 h-16 rounded-full object-cover bg-zinc-800 shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-xl font-bold leading-tight truncate">{activeAccount.channelName}</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                    {activeAccount.handle}
                  </p>
                  <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300 mt-0.5 tabular-nums truncate">
                    {(() => {
                      const subs = ownChannel?.subscribersCount ?? activeAccount.subscribersCount;
                      const vids =
                        ownChannel?.videosCount ??
                        state.videos.filter((v) => v.channelId === activeAccount.channelId).length;
                      return `${formatCount(subs)} ${subs === 1 ? 'subscriber' : 'subscribers'} · ${vids} ${vids === 1 ? 'video' : 'videos'}`;
                    })()}
                  </p>
                </div>
              </div>

              {ownChannel && (
                <button
                  onClick={() => {
                    setViewingChannelId(ownChannel.id);
                    setSubPage('analytics');
                  }}
                  aria-label="Channel analytics"
                  title="Analytics"
                  className="min-h-[40px] min-w-[40px] rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center shrink-0 transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => openChannel(activeAccount.channelId)}
                className="h-9 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-semibold"
              >
                View channel
              </button>
              <button
                onClick={() => setShowAccountsSheet(true)}
                className="h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold"
              >
                Switch account
              </button>
            </div>
          </section>
        ) : (
          <section className="px-4 pt-3 pb-2">
            <div className="p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-center space-y-3">
              {firebaseUser?.photoURL ? (
                <MediaThumb
                  src={firebaseUser.photoURL}
                  alt={firebaseUser.displayName || 'Google User'}
                  className="w-16 h-16 mx-auto rounded-full object-cover border border-zinc-700"
                />
              ) : (
                <div className="w-16 h-16 mx-auto rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-300">
                  <UserCircle2 className="w-10 h-10" />
                </div>
              )}
              <div className="space-y-1">
                <h2 className="text-base font-bold">
                  {firebaseUser
                    ? `Signed in as ${firebaseUser.displayName || firebaseUser.email}`
                    : 'Sign in with Google'}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {firebaseUser
                    ? 'Create your channel to upload videos, shorts, and post comments.'
                    : 'Sign in with your Google account to sync history, likes, channels, and uploads.'}
                </p>
              </div>
              {authError && (
                <p className="text-xs text-red-500 font-medium break-words">{authError}</p>
              )}
              <div className="flex flex-col gap-2 pt-1">
                {!firebaseUser && (
                  <button
                    onClick={() => void signInWithGoogle()}
                    className="w-full h-10 rounded-full bg-white text-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.54-5.17 3.54-8.89Z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.88-3.02c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.96H1.28v3.12A12 12 0 0 0 12 24Z" />
                      <path fill="#FBBC05" d="M5.29 14.26A7.2 7.2 0 0 1 4.91 12c0-.79.14-1.56.38-2.26V6.62H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l4.01-3.12Z" />
                      <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l4.01 3.12c.94-2.85 3.59-4.97 6.71-4.97Z" />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>
                )}
                <button
                  onClick={onRequestCreateAccount}
                  className="w-full h-10 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-black text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{firebaseUser ? 'Create your channel' : 'Create new channel'}</span>
                </button>
                {firebaseUser && (
                  <button
                    onClick={signOutAccount}
                    className="w-full h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 text-xs font-semibold text-red-400"
                  >
                    Sign out
                  </button>
                )}
                {state.accounts.length > 0 && (
                  <button
                    onClick={() => setShowAccountsSheet(true)}
                    className="w-full h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 text-xs font-semibold"
                  >
                    Switch channel ({state.accounts.length})
                  </button>
                )}
              </div>
            </div>
          </section>
        )}

        {/* History Shelf */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between px-3.5">
            <button
              onClick={() => setYouTab('history')}
              className="text-base font-bold flex items-center gap-1"
            >
              <span>History</span>
            </button>
            <button
              onClick={() => setYouTab('history')}
              className="text-xs font-semibold text-blue-500 px-2 py-1"
            >
              View all
            </button>
          </div>

          {historyVideos.length === 0 ? (
            <div className="px-3.5">
              <p className="text-xs text-zinc-500 py-3 px-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900/70">
                No watch history yet.
              </p>
            </div>
          ) : (
            <div className="flex gap-2.5 px-3.5 overflow-x-auto no-scrollbar">
              {historyVideos.map((v) => (
                <button key={`hist-${v.id}`} onClick={() => onPlayVideo(v)} className="w-36 shrink-0 text-left">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-900">
                    <MediaThumb src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                      {v.duration}
                    </span>
                  </div>
                  <p className="text-xs font-medium line-clamp-2 mt-1">{v.title}</p>
                  <p className="text-[11px] text-zinc-500 truncate">{v.channelName}</p>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Library Section */}
        <section className="px-3.5 space-y-3">
          <h3 className="text-base font-bold">Library</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['Recents', 'Downloaded', 'Playlists', 'Music'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setLibraryFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 ${
                  libraryFilter === f
                    ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-1">
            {(libraryFilter === 'Recents' || libraryFilter === 'Playlists') && (
              <>
                <button
                  onClick={() => watchLaterVideos[0] && onPlayVideo(watchLaterVideos[0])}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <div className="w-28 aspect-video rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Watch later</p>
                    <p className="text-xs text-zinc-500 tabular-nums">Private · {watchLaterVideos.length} videos</p>
                  </div>
                </button>

                <button
                  onClick={() => likedVideos[0] && onPlayVideo(likedVideos[0])}
                  className="w-full flex items-center gap-3 text-left"
                >
                  <div className="w-28 aspect-video rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
                    <ThumbsUp className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Liked videos</p>
                    <p className="text-xs text-zinc-500 tabular-nums">Private · {likedVideos.length} videos</p>
                  </div>
                </button>
              </>
            )}

            {(libraryFilter === 'Recents' || libraryFilter === 'Downloaded') && (
              <button
                onClick={() => downloadedVideos[0] && onPlayVideo(downloadedVideos[0])}
                className="w-full flex items-center gap-3 text-left"
              >
                <div className="w-28 aspect-video rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
                  <Download className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Downloads</p>
                  <p className="text-xs text-zinc-500 tabular-nums">{downloadedVideos.length} videos saved offline</p>
                </div>
              </button>
            )}

            {libraryFilter === 'Music' &&
              state.videos
                .filter((v) => v.type === 'music')
                .map((m) => (
                  <button key={m.id} onClick={() => onPlayVideo(m)} className="w-full flex items-center gap-3 text-left">
                    <MediaThumb src={m.thumbnailUrl} alt={m.title} className="w-28 aspect-video rounded-lg object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold line-clamp-2">{m.title}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{m.channelName}</p>
                    </div>
                  </button>
                ))}
          </div>
        </section>
      </div>
      )}

      {/* Accounts Switcher Modal (Matching Screenshot) */}
      {showAccountsSheet && (
        <div className="absolute inset-0 z-50 bg-black/65 flex items-center justify-center p-4" onClick={() => setShowAccountsSheet(false)}>
          <div
            className="w-full max-w-sm bg-[#1F1F1F] text-white rounded-2xl overflow-hidden shadow-2xl max-h-[85%] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h3 className="text-base font-bold">Accounts</h3>
              <button onClick={() => setShowAccountsSheet(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
              {state.accounts.length === 0 ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-sm font-semibold">No accounts created yet</p>
                  <p className="text-xs text-zinc-400">
                    Create a brand new account to start uploading and commenting.
                  </p>
                </div>
              ) : (
                Array.from(new Set(state.accounts.map((a) => a.email))).map((email) => {
                  const group = state.accounts.filter((a) => a.email === email);
                  return (
                    <div key={email} className="space-y-2.5 pb-3 border-b border-zinc-800">
                      <p className="text-xs text-zinc-400">{email}</p>
                      {group.map((acc) => {
                        const isActive = activeAccount ? acc.id === activeAccount.id : false;
                        return (
                          <button
                            key={acc.id}
                            onClick={() => {
                              switchAccount(acc.id);
                              setShowAccountsSheet(false);
                            }}
                            className="w-full flex items-center justify-between gap-3 py-1.5 text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <MediaThumb src={acc.avatarUrl} alt={acc.channelName} className="w-10 h-10 rounded-full object-cover shrink-0 bg-zinc-800" />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{acc.channelName}</p>
                                <p className="text-xs text-zinc-400 truncate">{acc.handle}</p>
                                <p className="text-[11px] text-zinc-500 tabular-nums">
                                  {acc.subscribersCount === 0 ? 'No subscribers' : `${acc.subscribersCount} subscribers`}
                                </p>
                              </div>
                            </div>
                            {isActive && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  );
                })
              )}

              {!firebaseUser && (
                <button
                  onClick={() => {
                    setShowAccountsSheet(false);
                    void signInWithGoogle();
                  }}
                  className="w-full flex items-center gap-3 py-2 text-sm text-white font-semibold"
                >
                  <UserCircle2 className="w-4 h-4 text-blue-400" />
                  <span>Sign in with Google</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowAccountsSheet(false);
                  onRequestCreateAccount();
                }}
                className="w-full flex items-center gap-3 py-2 text-sm text-blue-400 font-semibold"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create new channel</span>
              </button>

              {(activeAccount || firebaseUser) && (
                <button
                  onClick={() => {
                    signOutAccount();
                    setShowAccountsSheet(false);
                  }}
                  className="w-full flex items-center gap-3 py-2 text-sm text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              )}

              <button
                onClick={() => {
                  toggleIncognito();
                  setShowAccountsSheet(false);
                }}
                className="w-full flex items-center gap-3 py-2 text-sm text-zinc-200"
              >
                {state.incognitoMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{state.incognitoMode ? 'Turn off Incognito' : 'Turn on Incognito'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
