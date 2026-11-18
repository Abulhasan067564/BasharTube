import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpLeft,
  Clock,
  Mic,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { VideoItem } from '../types';
import { useApp } from '../context/AppContext';
import { MediaThumb } from './MediaThumb';

export const SearchOverlay: React.FC<{
  onClose: () => void;
  onPlayVideo: (video: VideoItem) => void;
  onOpenShort: (shortId: string) => void;
}> = ({ onClose, onPlayVideo, onOpenShort }) => {
  const { state, addSearchQuery, removeSearchHistory } = useApp();
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);

  const trimmed = query.trim().toLowerCase();
  const matches = trimmed
    ? state.videos.filter(
        (v) =>
          v.title.toLowerCase().includes(trimmed) ||
          v.channelName.toLowerCase().includes(trimmed) ||
          v.category.toLowerCase().includes(trimmed) ||
          v.tags.some((t) => t.toLowerCase().includes(trimmed))
      )
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addSearchQuery(query);
    }
  };

  const triggerVoiceSearch = () => {
    setListening(true);
    setTimeout(() => {
      setListening(false);
      setQuery('গজল');
      addSearchQuery('গজল');
    }, 1200);
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white dark:bg-[#0F0F0F] text-zinc-900 dark:text-white">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-2.5 py-2 border-b border-zinc-200 dark:border-zinc-800"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Back"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-full px-3.5 h-10">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search BasharTube"
            className="flex-1 bg-transparent text-sm outline-none"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="p-1 text-zinc-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={triggerVoiceSearch}
          aria-label="Voice search"
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors ${
            listening ? 'bg-red-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800'
          }`}
        >
          <Mic className="w-5 h-5" />
        </button>
      </form>

      {listening && (
        <div className="px-4 py-3 bg-red-600/10 border-b border-red-500/20 text-xs text-red-500 font-medium text-center">
          Listening in {state.settings.voiceSearchLanguage}...
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {!trimmed ? (
          <div className="py-1">
            {state.searchHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
              >
                <Clock className="w-5 h-5 text-zinc-400 shrink-0" />
                <button
                  onClick={() => {
                    setQuery(item.query);
                    addSearchQuery(item.query);
                  }}
                  className="flex-1 text-left text-sm font-medium truncate"
                >
                  {item.query}
                </button>
                {item.thumbnailUrl && (
                  <MediaThumb
                    src={item.thumbnailUrl}
                    alt={item.query}
                    className="w-12 h-8 rounded object-cover shrink-0"
                  />
                )}
                <button
                  onClick={() => removeSearchHistory(item.id)}
                  aria-label="Remove history"
                  className="p-1.5 text-zinc-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setQuery(item.query)}
                  aria-label="Fill query"
                  className="p-1.5 text-zinc-400"
                >
                  <ArrowUpLeft className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Search className="w-8 h-8 text-zinc-500 mb-2" />
            <p className="text-sm font-semibold">No matching videos found</p>
            <p className="text-xs text-zinc-500 mt-1">
              Try searching for নাটক, গজল, মাছ, or Smart Digital Bangla.
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {matches.map((v) => (
              <button
                key={v.id}
                onClick={() => {
                  addSearchQuery(query);
                  if (v.type === 'short') onOpenShort(v.id);
                  else onPlayVideo(v);
                }}
                className="w-full flex gap-3 text-left"
              >
                <div className="relative w-36 aspect-video rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                  <MediaThumb
                    src={v.thumbnailUrl}
                    alt={v.title}
                    className="w-full h-full object-cover"
                    fallbackGradient={v.accentGradient}
                  />
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                    {v.duration}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold line-clamp-2 leading-snug">{v.title}</p>
                  <p className="text-[11px] text-zinc-500 mt-1 truncate">{v.channelName}</p>
                  <p className="text-[11px] text-zinc-500 tabular-nums">
                    {v.viewsLabel} views · {v.publishedAgo}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const NotificationsView: React.FC<{
  onClose: () => void;
  onOpenSearch: () => void;
  onPlayVideoId: (videoId: string) => void;
}> = ({ onClose, onOpenSearch, onPlayVideoId }) => {
  const { state, markAllNotificationsRead } = useApp();
  const [filter, setFilter] = useState<'All' | 'Comments' | 'Mentions'>('All');

  const items = state.notifications.filter((n) => {
    if (filter === 'Comments') return n.type === 'comment' || n.type === 'post';
    if (filter === 'Mentions') return n.type === 'mention';
    return true;
  });

  const importantItems = items.filter((n) => n.section === 'Important');
  const todayItems = items.filter((n) => n.section === 'Today');

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white dark:bg-[#0F0F0F] text-zinc-900 dark:text-white">
      <header className="flex items-center justify-between px-2.5 py-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            aria-label="Back"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold">Notifications</h2>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={markAllNotificationsRead}
            className="px-2.5 py-1.5 text-xs font-medium text-blue-500 whitespace-nowrap"
          >
            Mark all read
          </button>
          <button
            onClick={onOpenSearch}
            aria-label="Search"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        {(['All', 'Comments', 'Mentions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              filter === tab
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-black'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        {items.length === 0 ? (
          <div className="py-16 text-center px-6">
            <p className="text-sm font-semibold">No {filter.toLowerCase()} notifications</p>
            <p className="text-xs text-zinc-500 mt-1">Updates from subscribed channels appear here.</p>
          </div>
        ) : (
          <>
            {importantItems.length > 0 && (
              <section className="pt-2">
                <h3 className="px-3.5 pb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Important
                </h3>
                {importantItems.map((n) => (
                  <NotifRow
                    key={n.id}
                    item={n}
                    onClick={() => {
                      if (n.videoId) onPlayVideoId(n.videoId);
                    }}
                  />
                ))}
              </section>
            )}

            {todayItems.length > 0 && (
              <section className="pt-4">
                <h3 className="px-3.5 pb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Today
                </h3>
                {todayItems.map((n) => (
                  <NotifRow
                    key={n.id}
                    item={n}
                    onClick={() => {
                      if (n.videoId) onPlayVideoId(n.videoId);
                    }}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const NotifRow: React.FC<{
  item: ReturnType<typeof useApp>['state']['notifications'][number];
  onClick: () => void;
}> = ({ item, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-start gap-3 px-3.5 py-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 text-left"
  >
    <div className="flex items-center gap-1.5 shrink-0 mt-1">
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          item.isUnread ? 'bg-blue-500' : 'bg-transparent'
        }`}
      />
      <MediaThumb
        src={item.channelAvatar}
        alt={item.channelName}
        className="w-9 h-9 rounded-full object-cover bg-zinc-800"
      />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs leading-snug line-clamp-3">{item.title}</p>
      <p className="text-[11px] text-zinc-500 mt-1">{item.timeAgo}</p>
    </div>
    <MediaThumb
      src={item.thumbnailUrl}
      alt={item.title}
      className="w-16 h-10 rounded object-cover shrink-0 bg-zinc-800"
    />
  </button>
);
