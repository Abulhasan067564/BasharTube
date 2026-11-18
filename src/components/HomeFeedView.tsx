import React, { useState } from 'react';
import {
  Bell,
  Search,
  MoreVertical,
  Radio,
  Music2,
  CheckCircle2,
  Clock,
  Download,
  Share2,
  EyeOff,
  User,
  Check,
  Video,
  Plus,
  Shield,
} from 'lucide-react';
import { HomeSubTab, VideoItem } from '../types';
import { useApp } from '../context/AppContext';
import { MediaThumb } from './MediaThumb';
import {
  YouTubeLogoMark,
  YouTubeShortsBadgeIcon,
} from './YouTubeIcons';

interface HomeFeedViewProps {
  subTab: HomeSubTab;
  onChangeSubTab: (tab: HomeSubTab) => void;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
  onOpenCreate: () => void;
  onPlayVideo: (video: VideoItem) => void;
  onOpenShort: (shortId: string) => void;
  onOpenChannel: (channelId: string) => void;
  onOpenAdmin: () => void;
}

const SUB_TABS: HomeSubTab[] = ['Home', 'Subs', 'Music', 'Live'];

const HOME_FILTERS = [
  'All',
  'Bangla Natok',
  'Islamic',
  'Tech & AI',
  'Village Life',
  'Music',
  'Live',
] as const;

export const HomeFeedView: React.FC<HomeFeedViewProps> = ({
  subTab,
  onChangeSubTab,
  onOpenSearch,
  onOpenNotifications,
  onOpenCreate,
  onPlayVideo,
  onOpenShort,
  onOpenChannel,
  onOpenAdmin,
}) => {
  const {
    state,
    unreadNotificationsCount,
    toggleWatchLater,
    toggleDownloadVideo,
  } = useApp();

  const [selectedFilter, setSelectedFilter] = useState<(typeof HOME_FILTERS)[number]>('All');
  const [selectedSubFilter, setSelectedSubFilter] = useState<string>('all');
  const [menuVideo, setMenuVideo] = useState<VideoItem | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const shorts = state.videos.filter(
    (v) => v.type === 'short' && v.visibility === 'Public' && !dismissedIds.includes(v.id)
  );
  const standardVideos = state.videos.filter(
    (v) => v.type === 'video' && v.visibility === 'Public' && !dismissedIds.includes(v.id)
  );
  const musicVideos = state.videos.filter(
    (v) => v.type === 'music' && !dismissedIds.includes(v.id)
  );
  const liveVideos = state.videos.filter(
    (v) => v.type === 'live' && !dismissedIds.includes(v.id)
  );
  const subscribedChannels = state.channels.filter((c) => c.isSubscribed);

  const allHomeVideos = [...standardVideos, ...musicVideos, ...liveVideos].filter((v) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Bangla Natok') return v.category.toLowerCase().includes('natok') || v.category.toLowerCase().includes('drama') || v.title.includes('নাটক');
    if (selectedFilter === 'Islamic') return v.category.toLowerCase().includes('islamic') || v.category.toLowerCase().includes('nasheed') || v.title.includes('গজল');
    if (selectedFilter === 'Tech & AI') return v.category.toLowerCase().includes('tech') || v.category.toLowerCase().includes('education');
    if (selectedFilter === 'Village Life') return v.category.toLowerCase().includes('village') || v.category.toLowerCase().includes('food');
    if (selectedFilter === 'Music') return v.type === 'music';
    if (selectedFilter === 'Live') return v.type === 'live';
    return true;
  });

  const filteredSubsVideos =
    selectedSubFilter === 'all'
      ? [...standardVideos, ...musicVideos]
      : [...standardVideos, ...musicVideos].filter((v) => v.channelId === selectedSubFilter);

  return (
    <div className="relative flex-1 flex flex-col bg-white dark:bg-[#0F0F0F] text-zinc-900 dark:text-white overflow-hidden">
      {/* Authentic YouTube Mobile Top Bar (Zero Phone Status Bar!) */}
      <header className="shrink-0 bg-white/95 dark:bg-[#0F0F0F]/95 backdrop-blur-md">
        <div className="flex items-center justify-between h-12 px-3.5 pt-1">
          <button
            onClick={() => {
              onChangeSubTab('Home');
              setSelectedFilter('All');
            }}
            className="flex items-center gap-1.5 whitespace-nowrap shrink-0 min-w-0 max-w-[195px]"
          >
            {state.appBrand.logoUrl ? (
              <img
                src={state.appBrand.logoUrl}
                alt={state.appBrand.name}
                className="h-8 w-11 rounded-md object-contain shrink-0 bg-black"
              />
            ) : (
              <YouTubeLogoMark className="w-[29px] h-[20px] shrink-0" />
            )}
            <span className="font-display text-[19px] font-bold tracking-[-0.03em] truncate">
              {state.appBrand.name}
            </span>
          </button>

          <div className="flex items-center">
            <button
              onClick={onOpenNotifications}
              aria-label="Notifications"
              className="relative min-h-[44px] min-w-[42px] flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Bell className="w-[21px] h-[21px]" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FF0000] text-white text-[10px] font-bold flex items-center justify-center tabular-nums ring-2 ring-white dark:ring-[#0F0F0F]">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
            <button
              onClick={onOpenSearch}
              aria-label="Search"
              className="min-h-[44px] min-w-[42px] flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Search className="w-[21px] h-[21px]" />
            </button>
          </div>
        </div>

        {/* Sub-Tabs Row: Home · Subs · Music · Live */}
        <nav className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 px-1">
          {SUB_TABS.map((tab) => {
            const active = subTab === tab;
            return (
              <button
                key={tab}
                onClick={() => onChangeSubTab(tab)}
                className={`relative py-2.5 px-3 text-[13px] whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'text-zinc-900 dark:text-white font-semibold'
                    : 'text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {tab}
                {active && (
                  <span className="absolute bottom-0 left-2.5 right-2.5 h-[2px] bg-[#FF0000] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        {subTab === 'Home' && (
          <div className="space-y-4 pt-2.5">
            {/* YouTube Category Filter Bar */}
            <div className="flex items-center gap-2 px-3 overflow-x-auto no-scrollbar">
              {HOME_FILTERS.map((f) => {
                const active = selectedFilter === f;
                return (
                  <button
                    key={f}
                    onClick={() => setSelectedFilter(f)}
                    className={`h-8 px-3 rounded-lg text-[13px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                      active
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold'
                        : 'bg-zinc-100 dark:bg-[#272727] text-zinc-800 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>

            {/* Shorts 2x2 Grid (Only on 'All' filter, just like real YouTube Home) */}
            {selectedFilter === 'All' && shorts.length > 0 && (
              <section className="px-3 pt-0.5">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <YouTubeShortsBadgeIcon className="w-5 h-5" />
                    <h2 className="text-[16px] font-bold tracking-tight">Shorts</h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {shorts.slice(0, 4).map((sh) => (
                    <div
                      key={sh.id}
                      onClick={() => onOpenShort(sh.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') onOpenShort(sh.id);
                      }}
                      className="relative aspect-[9/14] rounded-xl overflow-hidden bg-zinc-900 text-left group cursor-pointer"
                    >
                      <MediaThumb
                        src={sh.thumbnailUrl}
                        alt={sh.title}
                        className="w-full h-full object-cover group-active:scale-[1.03] transition-transform duration-300"
                        fallbackGradient={sh.accentGradient}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20" />
                      {sh.duration && (
                        <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-semibold tabular-nums tracking-tight">
                          {sh.duration}
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label="Short options"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuVideo(sh);
                        }}
                        className="absolute top-1.5 right-1.5 w-8 h-8 flex items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/60"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2.5 left-2.5 right-2.5">
                        <p className="text-[13px] font-semibold text-white line-clamp-2 leading-snug drop-shadow-sm">
                          {sh.title}
                        </p>
                        <p className="text-[11px] text-zinc-300 mt-1 tabular-nums">
                          {sh.viewsLabel} views
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Standard Video Feed / Empty State */}
            {(selectedFilter === 'All' ? standardVideos : allHomeVideos).length === 0 &&
            (selectedFilter !== 'All' || shorts.length === 0) ? (
              <div className="px-6 py-14 flex flex-col items-center text-center space-y-3.5">
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                  <Video className="w-7 h-7 text-zinc-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold">No videos uploaded yet</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[260px] leading-relaxed">
                    Your feed starts clean. Upload a new video or Short, or publish from the Admin Panel to display videos here.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={onOpenCreate}
                    className="h-9 px-4 rounded-full bg-[#FF0000] hover:bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload Video</span>
                  </button>
                  <button
                    onClick={onOpenAdmin}
                    className="h-9 px-4 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5 text-red-500" />
                    <span>Admin Panel</span>
                  </button>
                </div>
              </div>
            ) : (
              <section className="space-y-5">
                {(selectedFilter === 'All' ? standardVideos : allHomeVideos).map((vid) => (
                  <VideoFeedCard
                    key={vid.id}
                    video={vid}
                    isWatched={state.watchHistoryIds.includes(vid.id)}
                    isMusic={vid.type === 'music'}
                    onPlay={() => onPlayVideo(vid)}
                    onOpenChannel={() => onOpenChannel(vid.channelId)}
                    onOpenMenu={() => setMenuVideo(vid)}
                  />
                ))}
              </section>
            )}
          </div>
        )}

        {subTab === 'Subs' && (
          <div className="pt-3 space-y-4">
            {subscribedChannels.length === 0 && filteredSubsVideos.length === 0 && shorts.length === 0 ? (
              <div className="px-6 py-16 text-center space-y-2">
                <p className="text-sm font-bold">No subscriptions yet</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Subscribe to channels after uploading videos to see their latest uploads here.
                </p>
              </div>
            ) : (
              <>
                {/* Horizontal Subscribed Channels Strip */}
                {subscribedChannels.length > 0 && (
                  <div className="flex items-center gap-3 px-3 overflow-x-auto no-scrollbar">
                    {subscribedChannels.map((ch) => {
                      const selected = selectedSubFilter === ch.id;
                      return (
                        <button
                          key={ch.id}
                          onClick={() =>
                            setSelectedSubFilter((prev) => (prev === ch.id ? 'all' : ch.id))
                          }
                          className="flex flex-col items-center gap-1.5 w-16 shrink-0"
                        >
                          <div
                            className={`w-13 h-13 rounded-full p-0.5 ${
                              selected ? 'ring-2 ring-blue-500' : ''
                            }`}
                          >
                            <MediaThumb
                              src={ch.avatarUrl}
                              alt={ch.name}
                              className="w-full h-full rounded-full object-cover bg-zinc-800"
                            />
                          </div>
                          <span className="text-[11px] text-zinc-600 dark:text-zinc-300 truncate w-full text-center">
                            {ch.name}
                          </span>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setSelectedSubFilter('all')}
                      className="text-xs font-semibold text-blue-500 px-2 py-2 whitespace-nowrap shrink-0"
                    >
                      All
                    </button>
                  </div>
                )}

                {/* Horizontal Shorts Shelf */}
                {shorts.length > 0 && (
                  <div className="px-3">
                    <div className="flex items-center gap-2 mb-2.5">
                      <YouTubeShortsBadgeIcon className="w-5 h-5" />
                      <h2 className="text-base font-bold">Shorts</h2>
                    </div>
                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
                      {shorts.map((sh) => (
                        <button
                          key={sh.id}
                          onClick={() => onOpenShort(sh.id)}
                          className="relative w-36 aspect-[9/15] rounded-xl overflow-hidden shrink-0 bg-zinc-900 text-left"
                        >
                          <MediaThumb
                            src={sh.thumbnailUrl}
                            alt={sh.title}
                            className="w-full h-full object-cover"
                            fallbackGradient={sh.accentGradient}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                          {sh.duration && (
                            <span className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-semibold tabular-nums tracking-tight">
                              {sh.duration}
                            </span>
                          )}
                          <div className="absolute bottom-2 left-2 right-2">
                            <p className="text-xs font-semibold text-white line-clamp-2">{sh.title}</p>
                            <p className="text-[10px] text-zinc-300 mt-0.5 tabular-nums">{sh.viewsLabel} views</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subscribed Video Feed */}
                <div className="space-y-5 pt-1">
                  {filteredSubsVideos.map((vid) => (
                    <VideoFeedCard
                      key={vid.id}
                      video={vid}
                      isWatched={state.watchHistoryIds.includes(vid.id)}
                      onPlay={() => onPlayVideo(vid)}
                      onOpenChannel={() => onOpenChannel(vid.channelId)}
                      onOpenMenu={() => setMenuVideo(vid)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {subTab === 'Music' && (
          <div className="pt-3 space-y-5">
            {musicVideos.length === 0 ? (
              <div className="px-6 py-16 text-center space-y-2">
                <p className="text-sm font-bold">No music tracks uploaded yet</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Publish a Music video from the Admin Panel to listen here.
                </p>
              </div>
            ) : (
              <>
                {musicVideos.map((mus) => (
                  <VideoFeedCard
                    key={mus.id}
                    video={mus}
                    isMusic
                    isWatched={state.watchHistoryIds.includes(mus.id)}
                    onPlay={() => onPlayVideo(mus)}
                    onOpenChannel={() => onOpenChannel(mus.channelId)}
                    onOpenMenu={() => setMenuVideo(mus)}
                  />
                ))}

                <div className="px-3 pt-1">
                  <h3 className="text-base font-bold mb-2.5">Recently played</h3>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    {musicVideos.map((m) => (
                      <button
                        key={`rec-${m.id}`}
                        onClick={() => onPlayVideo(m)}
                        className="w-40 shrink-0 text-left"
                      >
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900">
                          <MediaThumb
                            src={m.thumbnailUrl}
                            alt={m.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                            ♪ {m.duration}
                          </span>
                        </div>
                        <p className="text-xs font-semibold mt-1.5 line-clamp-2">{m.title}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{m.channelName}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {subTab === 'Live' && (
          <div className="pt-3 space-y-5">
            {liveVideos.length === 0 ? (
              <div className="px-6 py-16 text-center space-y-2">
                <p className="text-sm font-bold">No live streams active</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Start a live broadcast or publish a Live Stream from the Admin Panel.
                </p>
              </div>
            ) : (
              liveVideos.map((lv) => (
                <div key={lv.id} className="space-y-2.5">
                  <button
                    onClick={() => onPlayVideo(lv)}
                    className="relative w-full aspect-video bg-zinc-900 block overflow-hidden"
                  >
                    <MediaThumb
                      src={lv.thumbnailUrl}
                      alt={lv.title}
                      className="w-full h-full object-cover"
                      fallbackGradient={lv.accentGradient}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
                    <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded bg-[#FF0000] text-white text-[11px] font-bold">
                      <Radio className="w-3 h-3" />
                      LIVE
                    </span>
                  </button>
                  <div className="px-3 flex items-start gap-3">
                    <button onClick={() => onOpenChannel(lv.channelId)} className="shrink-0">
                      <MediaThumb
                        src={lv.channelAvatar}
                        alt={lv.channelName}
                        className="w-9 h-9 rounded-full object-cover bg-zinc-800"
                      />
                    </button>
                    <button onClick={() => onPlayVideo(lv)} className="flex-1 text-left min-w-0">
                      <p className="text-[15px] font-medium line-clamp-2 leading-snug">{lv.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 tabular-nums">
                        {lv.channelName} · {lv.watchingCount ?? 120} watching
                      </p>
                    </button>
                    <button
                      onClick={() => setMenuVideo(lv)}
                      aria-label="Video options"
                      className="min-h-[36px] min-w-[32px] flex items-center justify-center rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* Feedback Toast */}
      {toastMsg && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-lg bg-zinc-900/95 border border-zinc-700 text-white text-xs font-medium shadow-xl whitespace-nowrap">
          {toastMsg}
        </div>
      )}

      {/* YouTube 3-Dot Action Bottom Sheet */}
      {menuVideo && (
        <div
          className="absolute inset-0 z-50 bg-black/65 flex items-end"
          onClick={() => setMenuVideo(null)}
        >
          <div
            className="w-full bg-white dark:bg-[#212121] text-zinc-900 dark:text-white rounded-t-2xl py-2.5 px-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full mx-auto mb-2" />
            <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 mb-1">
              <p className="text-xs font-semibold line-clamp-1">{menuVideo.title}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{menuVideo.channelName}</p>
            </div>
            {[
              {
                icon: Clock,
                label: menuVideo.isWatchLater ? 'Remove from Watch later' : 'Save to Watch later',
                action: () => {
                  toggleWatchLater(menuVideo.id);
                  showToast(menuVideo.isWatchLater ? 'Removed from Watch later' : 'Saved to Watch later');
                  setMenuVideo(null);
                },
              },
              {
                icon: menuVideo.isDownloaded ? Check : Download,
                label: menuVideo.isDownloaded ? 'Remove download' : 'Download video',
                action: () => {
                  toggleDownloadVideo(menuVideo.id);
                  showToast(menuVideo.isDownloaded ? 'Removed from downloads' : 'Video downloaded offline');
                  setMenuVideo(null);
                },
              },
              {
                icon: Share2,
                label: 'Share',
                action: () => {
                  showToast('Video link copied');
                  setMenuVideo(null);
                },
              },
              {
                icon: User,
                label: `Go to ${menuVideo.channelName}`,
                action: () => {
                  const chId = menuVideo.channelId;
                  setMenuVideo(null);
                  onOpenChannel(chId);
                },
              },
              {
                icon: EyeOff,
                label: 'Not interested',
                action: () => {
                  setDismissedIds((prev) => [...prev, menuVideo.id]);
                  showToast('Video removed from feed');
                  setMenuVideo(null);
                },
              },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-4 px-4 py-3 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-left"
              >
                <item.icon className="w-5 h-5 text-zinc-600 dark:text-zinc-300 shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const VideoFeedCard: React.FC<{
  video: VideoItem;
  isMusic?: boolean;
  isWatched?: boolean;
  onPlay: () => void;
  onOpenChannel: () => void;
  onOpenMenu: () => void;
}> = ({ video, isMusic, isWatched, onPlay, onOpenChannel, onOpenMenu }) => (
  <article className="space-y-2.5">
    <button onClick={onPlay} className="relative w-full aspect-video bg-zinc-900 block overflow-hidden">
      <MediaThumb
        src={video.thumbnailUrl}
        alt={video.title}
        className="w-full h-full object-cover"
        fallbackGradient={video.accentGradient}
      />
      {video.type === 'live' || video.duration === 'LIVE' ? (
        <span className="absolute bottom-2.5 right-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#FF0000] text-white text-[11px] font-bold tracking-tight shadow-sm">
          <Radio className="w-3 h-3" />
          <span>LIVE</span>
        </span>
      ) : (
        <span
          aria-label={`Duration ${video.duration || '0:00'}`}
          className="absolute bottom-2.5 right-2 z-10 px-1.5 py-0.5 rounded-[4px] bg-black/85 text-white text-[11px] font-semibold tabular-nums tracking-tight shadow-sm"
        >
          {isMusic ? `♪ ${video.duration || '0:00'}` : video.duration || '0:00'}
        </span>
      )}
      {isWatched && (
        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/25">
          <span className="block h-full w-2/3 bg-[#FF0000]" />
        </span>
      )}
    </button>
    <div className="px-3 flex items-start gap-3">
      <button onClick={onOpenChannel} className="shrink-0 mt-0.5">
        <MediaThumb
          src={video.channelAvatar}
          alt={video.channelName}
          className="w-9 h-9 rounded-full object-cover bg-zinc-800"
        />
      </button>
      <button onClick={onPlay} className="flex-1 text-left min-w-0">
        <h3 className="text-[15px] font-medium leading-[1.3] line-clamp-2">{video.title}</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-1 flex-wrap tabular-nums">
          <span>{video.channelName}</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 inline shrink-0" />
          <span>· {video.viewsLabel} views</span>
          <span>· {video.publishedAgo}</span>
        </p>
      </button>
      <button
        onClick={onOpenMenu}
        aria-label="Video options"
        className="min-h-[36px] min-w-[32px] -mr-1.5 flex items-center justify-center rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  </article>
);
