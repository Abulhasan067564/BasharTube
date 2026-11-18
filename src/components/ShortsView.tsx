import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  MessageSquare,
  MoreVertical,
  Pause,
  Play,
  Repeat2,
  Search,
  Share2,
  ShoppingBag,
  ThumbsDown,
  ThumbsUp,
  X,
  Captions,
  Settings2,
  EyeOff,
  Flag,
  Send,
  Plus,
  UserPlus,
} from 'lucide-react';
import { buildInitialAvatarSvg, formatCount, useApp } from '../context/AppContext';
import { MediaThumb } from './MediaThumb';

interface ShortsViewProps {
  initialShortId?: string | null;
  onOpenSearch: () => void;
  onOpenChannel: (channelId: string) => void;
  onOpenCreate?: () => void;
  onRequestCreateAccount?: () => void;
}

export const ShortsView: React.FC<ShortsViewProps> = ({
  initialShortId,
  onOpenSearch,
  onOpenChannel,
  onOpenCreate,
  onRequestCreateAccount,
}) => {
  const {
    state,
    activeAccount,
    subscribeToVideoComments,
    toggleLikeVideo,
    toggleDislikeVideo,
    addComment,
    toggleCommentLike,
    toggleSubscribe,
  } = useApp();

  const shorts = state.videos.filter((v) => v.type === 'short');
  const startIndex = initialShortId
    ? Math.max(0, shorts.findIndex((s) => s.id === initialShortId))
    : 0;

  const [index, setIndex] = useState(startIndex);
  const [paused, setPaused] = useState(false);
  const [clearScreen, setClearScreen] = useState(false);
  const [showDescSheet, setShowDescSheet] = useState(false);
  const [showMenuSheet, setShowMenuSheet] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const swipeStartYRef = React.useRef<number | null>(null);

  const activeShortId = shorts[index]?.id;
  React.useEffect(() => {
    if (!activeShortId) return;
    return subscribeToVideoComments(activeShortId);
  }, [activeShortId, subscribeToVideoComments]);

  if (shorts.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-black text-white p-6 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500">
          <Play className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold">No Shorts uploaded yet</p>
          <p className="text-xs text-zinc-400">
            Upload your first Short to watch it here.
          </p>
        </div>
        {onOpenCreate && (
          <button
            onClick={onOpenCreate}
            className="px-4 py-2 rounded-full bg-white text-black text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Short</span>
          </button>
        )}
      </div>
    );
  }

  const current = shorts[Math.min(index, shorts.length - 1)];
  const channel = state.channels.find((c) => c.id === current.channelId);

  const showNotice = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleNext = () => {
    setIndex((i) => (i + 1) % shorts.length);
    setPaused(false);
  };

  const handlePrev = () => {
    setIndex((i) => (i - 1 + shorts.length) % shorts.length);
    setPaused(false);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    addComment(current.id, commentInput);
    setCommentInput('');
  };

  return (
    <div
      onPointerDown={(e) => {
        swipeStartYRef.current = e.clientY;
      }}
      onPointerUp={(e) => {
        if (swipeStartYRef.current === null) return;
        const dy = e.clientY - swipeStartYRef.current;
        swipeStartYRef.current = null;
        if (dy < -55) handleNext();
        else if (dy > 55) handlePrev();
      }}
      className="relative flex-1 bg-black text-white overflow-hidden select-none touch-none"
    >
      {/* Full-bleed Short Media */}
      <div
        onClick={() => setPaused((p) => !p)}
        className="absolute inset-0 cursor-pointer"
      >
        {current.videoUrl ? (
          <video
            src={current.videoUrl}
            poster={current.thumbnailUrl}
            autoPlay
            loop
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <MediaThumb
            src={current.thumbnailUrl}
            alt={current.title}
            className={`w-full h-full object-cover transition-transform duration-700 ${
              paused ? 'scale-100 brightness-75' : 'scale-[1.03]'
            }`}
            fallbackGradient={current.accentGradient}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/45" />
      </div>

      {/* Play/Pause Feedback Center */}
      {paused && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Top Overlay Controls */}
      <div className="relative z-10 flex items-center justify-between px-3 pt-3">
        <span className="text-base font-bold tracking-tight drop-shadow">Shorts</span>
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrev}
            aria-label="Previous Short"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next Short"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenSearch}
            aria-label="Search Shorts"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowMenuSheet(true)}
            aria-label="More options"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-full bg-zinc-900/95 border border-zinc-700 text-xs font-medium">
          {toastMsg}
        </div>
      )}

      {/* Right Rail + Bottom Metadata (hidden in Clear Screen mode) */}
      {!clearScreen ? (
        <>
          <div className="absolute right-2.5 bottom-4 z-10 flex flex-col items-center gap-3">
            <button
              onClick={() => toggleLikeVideo(current.id)}
              className="flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center"
            >
              <div className={`w-11 h-11 rounded-full bg-black/40 flex items-center justify-center ${current.isLiked ? 'text-blue-400' : ''}`}>
                <ThumbsUp className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium tabular-nums">
                {formatCount(current.likesCount)}
              </span>
            </button>

            <button
              onClick={() => toggleDislikeVideo(current.id)}
              className="flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center"
            >
              <div className={`w-11 h-11 rounded-full bg-black/40 flex items-center justify-center ${current.isDisliked ? 'text-red-400' : ''}`}>
                <ThumbsDown className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium">Dislike</span>
            </button>

            <button
              onClick={() => setShowCommentsSheet(true)}
              className="flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center"
            >
              <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium tabular-nums">{current.comments.length}</span>
            </button>

            <button
              onClick={() => showNotice('Short link copied to clipboard')}
              className="flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center"
            >
              <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium">Share</span>
            </button>

            <button
              onClick={() => showNotice('Remix audio queued')}
              className="flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center"
            >
              <div className="w-11 h-11 rounded-full bg-black/40 flex items-center justify-center">
                <Repeat2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium">Remix</span>
            </button>

            <button
              onClick={() => onOpenChannel(current.channelId)}
              aria-label="Original sound"
              className="mt-1 w-9 h-9 rounded-lg overflow-hidden border border-white/40 bg-zinc-900 shadow"
            >
              <MediaThumb
                src={current.channelAvatar}
                alt={current.channelName}
                className="w-full h-full object-cover"
              />
            </button>
          </div>

          {/* Bottom Channel & Caption */}
          <div className="absolute left-3 right-16 bottom-4 z-10">
            {current.productPick && (
              <button
                onClick={() => setShowDescSheet(true)}
                className="mb-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-xs font-semibold shadow"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Shop</span>
              </button>
            )}

            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => onOpenChannel(current.channelId)}
                className="flex items-center gap-2 min-w-0"
              >
                <MediaThumb
                  src={current.channelAvatar}
                  alt={current.channelName}
                  className="w-8 h-8 rounded-full object-cover border border-white/25 shrink-0"
                />
                <span className="text-sm font-semibold truncate">{current.channelHandle}</span>
              </button>
              <button
                onClick={() => toggleSubscribe(current.channelId)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 ${
                  channel?.isSubscribed ? 'bg-zinc-700 text-white' : 'bg-white text-black'
                }`}
              >
                {channel?.isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>

            <button
              onClick={() => setShowDescSheet(true)}
              className="text-left text-sm font-medium line-clamp-2 leading-snug"
            >
              {current.title}
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => setClearScreen(false)}
          className="absolute bottom-4 right-4 z-20 px-3.5 py-2 rounded-full bg-black/70 border border-white/20 text-xs font-medium"
        >
          Show Controls
        </button>
      )}

      {/* Short Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20">
        <div className={`h-full bg-white transition-all duration-300 ${paused ? 'w-1/3' : 'w-2/3'}`} />
      </div>

      {/* Description & Product Picks Sheet */}
      {showDescSheet && (
        <div className="absolute inset-0 z-30 bg-black/60 flex items-end" onClick={() => setShowDescSheet(false)}>
          <div
            className="w-full bg-[#1C1C1E] rounded-t-2xl p-4 max-h-[75%] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mb-3" />
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-bold leading-snug">{current.title}</h3>
              <button onClick={() => setShowDescSheet(false)} className="p-1.5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-1">{current.channelName}</p>

            <div className="grid grid-cols-3 gap-2 my-4 text-center py-3 border-y border-zinc-800">
              <div>
                <p className="text-base font-bold tabular-nums">{formatCount(current.likesCount)}</p>
                <p className="text-[11px] text-zinc-400">Likes</p>
              </div>
              <div>
                <p className="text-base font-bold tabular-nums">{current.viewsLabel}</p>
                <p className="text-[11px] text-zinc-400">Views</p>
              </div>
              <div>
                <p className="text-base font-bold">{current.publishedAgo}</p>
                <p className="text-[11px] text-zinc-400">Published</p>
              </div>
            </div>

            {current.productPick && (
              <div className="mb-4 p-3 rounded-xl bg-zinc-800/80 border border-zinc-700">
                <p className="text-xs font-semibold text-amber-300 mb-1">
                  Product picks by {current.channelName}
                </p>
                <p className="text-sm font-medium">{current.productPick.title}</p>
                <p className="text-xs text-blue-400 mt-0.5">{current.productPick.store}</p>
              </div>
            )}

            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
              {current.description}
            </p>
          </div>
        </div>
      )}

      {/* 3-Dot Options Bottom Sheet (Matching Screenshot) */}
      {showMenuSheet && (
        <div className="absolute inset-0 z-30 bg-black/60 flex items-end" onClick={() => setShowMenuSheet(false)}>
          <div
            className="w-full bg-[#1C1C1E] rounded-t-2xl py-3 px-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mb-2" />
            {[
              { icon: MessageSquare, label: 'Description', action: () => { setShowMenuSheet(false); setShowDescSheet(true); } },
              { icon: EyeOff, label: clearScreen ? 'Show Controls' : 'Clear Screen', action: () => { setClearScreen((c) => !c); setShowMenuSheet(false); } },
              { icon: Captions, label: 'Captions · Bangla (auto-generated)', action: () => { setShowMenuSheet(false); showNotice('Bangla Captions enabled'); } },
              { icon: Settings2, label: 'Quality · Data Saver (1080p)', action: () => { setShowMenuSheet(false); showNotice('Quality set to 1080p'); } },
              { icon: Pause, label: 'Not interested', action: () => { setShowMenuSheet(false); handleNext(); showNotice('Removed from feed'); } },
              { icon: Flag, label: 'Report', action: () => { setShowMenuSheet(false); showNotice('Report submitted to Admin'); } },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center gap-4 px-4 py-3 text-sm text-zinc-100 hover:bg-zinc-800 rounded-xl text-left"
              >
                <item.icon className="w-5 h-5 text-zinc-300 shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Comments Drawer */}
      {showCommentsSheet && (
        <div className="absolute inset-0 z-30 bg-black/60 flex items-end" onClick={() => setShowCommentsSheet(false)}>
          <div
            className="w-full bg-[#1C1C1E] rounded-t-2xl p-4 h-[65%] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold">Comments · {current.comments.length}</h3>
              <button onClick={() => setShowCommentsSheet(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {current.comments.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-8">No comments yet.</p>
              ) : (
                current.comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5 text-xs">
                    <img
                      src={c.authorAvatar || buildInitialAvatarSvg(c.author)}
                      alt={c.author}
                      className="w-7 h-7 rounded-full object-cover shrink-0 bg-zinc-800 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                        <span className="font-semibold text-zinc-200">{c.handle || c.author}</span>
                        <span>·</span>
                        <span>{c.timeAgo}</span>
                      </div>
                      <p className="text-zinc-200 mt-0.5">{c.text}</p>
                      <button
                        type="button"
                        onClick={() => toggleCommentLike(current.id, c.id)}
                        className={`mt-1 flex items-center gap-1 text-[11px] ${
                          c.isLiked ? 'text-blue-400 font-semibold' : 'text-zinc-400'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{c.likes > 0 ? formatCount(c.likes) : ''}</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {activeAccount ? (
              <form onSubmit={handlePostComment} className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 h-10 px-3.5 rounded-full bg-zinc-800 text-xs outline-none"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
                <span className="text-xs text-zinc-400">Create an account to comment</span>
                {onRequestCreateAccount && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCommentsSheet(false);
                      onRequestCreateAccount();
                    }}
                    className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create account</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
