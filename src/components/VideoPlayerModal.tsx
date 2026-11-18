import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Download,
  Check,
  MessageSquare,
  Pause,
  Play,
  Send,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Bookmark,
  Radio,
  Captions,
  Settings2,
  RotateCcw,
  RotateCw,
  UserPlus,
} from 'lucide-react';
import { VideoItem } from '../types';
import { buildInitialAvatarSvg, formatCount, useApp } from '../context/AppContext';
import { MediaThumb } from './MediaThumb';

interface VideoPlayerModalProps {
  video: VideoItem;
  onClose: () => void;
  onSelectVideo: (video: VideoItem) => void;
  onOpenChannel: (channelId: string) => void;
  onRequestCreateAccount: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  onClose,
  onSelectVideo,
  onOpenChannel,
  onRequestCreateAccount,
}) => {
  const {
    state,
    activeAccount,
    subscribeToVideoComments,
    toggleLikeVideo,
    toggleDislikeVideo,
    toggleWatchLater,
    toggleDownloadVideo,
    addComment,
    toggleCommentLike,
    toggleSubscribe,
  } = useApp();

  const liveVideo = state.videos.find((v) => v.id === video.id) || video;
  const channel = state.channels.find((c) => c.id === liveVideo.channelId);

  useEffect(() => {
    return subscribeToVideoComments(liveVideo.id);
  }, [liveVideo.id, subscribeToVideoComments]);

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(18);
  const [captionsOn, setCaptionsOn] = useState(state.settings.showCaptions);
  const [qualityLabel, setQualityLabel] = useState('1080p');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [shareToast, setShareToast] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Drag-to-dismiss gesture state
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const commentsSectionRef = useRef<HTMLDivElement | null>(null);
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const suppressClickRef = useRef(false);
  const dragStateRef = useRef<{
    active: boolean;
    locked: boolean;
    fromPlayerStage: boolean;
    startX: number;
    startY: number;
    startTime: number;
    currentY: number;
  }>({
    active: false,
    locked: false,
    fromPlayerStage: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    currentY: 0,
  });

  useEffect(() => {
    setProgress(12);
    setIsPlaying(true);
  }, [liveVideo.id]);

  useEffect(() => {
    if (!isPlaying || liveVideo.type === 'live') return;
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1.5));
    }, 500);
    return () => clearInterval(timer);
  }, [isPlaying, liveVideo.type]);

  const triggerDismiss = useCallback(() => {
    setIsClosing(true);
    setIsDragging(false);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds.active || isClosing) return;

      const deltaX = e.clientX - ds.startX;
      const deltaY = e.clientY - ds.startY;

      if (!ds.locked) {
        // Wait for clear intentional movement
        if (Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return;

        // Abort if horizontal gesture (e.g. scrubber or swipe sideways) or upward scroll
        if (deltaY <= 0 || Math.abs(deltaX) > deltaY * 0.9) {
          ds.active = false;
          return;
        }

        // If dragging from the scrollable body, only engage drag-to-dismiss when at scroll top
        if (!ds.fromPlayerStage) {
          const scrollEl = scrollContainerRef.current;
          if (scrollEl && scrollEl.scrollTop > 2) {
            ds.active = false;
            return;
          }
        }

        ds.locked = true;
        setIsDragging(true);
      }

      const clampedY = Math.max(0, deltaY);
      ds.currentY = clampedY;
      setDragY(clampedY);
    };

    const handlePointerEnd = () => {
      const ds = dragStateRef.current;
      if (!ds.active) return;

      const wasLocked = ds.locked;
      const finalY = ds.currentY;
      const elapsed = Math.max(Date.now() - ds.startTime, 1);
      const velocity = finalY / elapsed; // px per ms

      ds.active = false;
      ds.locked = false;
      ds.currentY = 0;

      if (!wasLocked) return;

      suppressClickRef.current = true;
      setTimeout(() => {
        suppressClickRef.current = false;
      }, 60);

      setIsDragging(false);

      // Dismiss if dragged far enough (>120px) or flicked downwards quickly
      if (finalY > 120 || (finalY > 45 && velocity > 0.45)) {
        triggerDismiss();
      } else {
        setDragY(0);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
    };
  }, [isClosing, triggerDismiss]);

  const handleStartDrag = (e: React.PointerEvent, fromPlayerStage: boolean) => {
    if (isClosing) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    const target = e.target as HTMLElement | null;
    if (target && target.closest('input, textarea, select')) return;

    dragStateRef.current = {
      active: true,
      locked: false,
      fromPlayerStage,
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      currentY: 0,
    };
  };

  const relatedVideos = state.videos.filter(
    (v) => v.id !== liveVideo.id && v.type !== 'short'
  );

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) {
      onRequestCreateAccount();
      return;
    }
    if (!commentText.trim()) return;
    addComment(liveVideo.id, commentText);
    setCommentText('');
  };

  const scrollToComments = () => {
    commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 220);
  };

  const handleShare = () => {
    setShareToast(true);
    setTimeout(() => setShareToast(false), 1800);
  };

  const backdropOpacity = isClosing
    ? 0
    : Math.max(0.15, 0.72 - (dragY / 420) * 0.65);

  const sheetScale = isClosing ? 0.94 : Math.max(0.94, 1 - dragY / 2400);

  return (
    <div className="absolute inset-0 z-50 overflow-hidden">
      {/* Underlying Dim Backdrop (fades as user swipes down) */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black pointer-events-none"
        style={{
          opacity: backdropOpacity,
          transition: isDragging ? 'none' : 'opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* Draggable Player Sheet */}
      <div
        onPointerDown={(e) => handleStartDrag(e, false)}
        onClickCapture={(e) => {
          if (suppressClickRef.current) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
        className={`relative w-full h-full flex flex-col bg-white dark:bg-[#0F0F0F] text-zinc-900 dark:text-white overflow-hidden shadow-2xl ${
          dragY > 4 || isClosing ? 'rounded-t-[20px]' : ''
        }`}
        style={{
          transform: isClosing
            ? 'translate3d(0, 100%, 0) scale(0.95)'
            : `translate3d(0, ${dragY}px, 0) scale(${sheetScale})`,
          opacity: isClosing ? 0 : 1,
          transition: isDragging
            ? 'none'
            : 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease-out, border-radius 150ms ease',
          willChange: 'transform, opacity',
        }}
      >
        {/* Sticky Player Stage */}
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            handleStartDrag(e, true);
          }}
          className="relative w-full aspect-video bg-black shrink-0 overflow-hidden select-none touch-none cursor-grab active:cursor-grabbing"
        >
          {/* Subtle Swipe-Down Handle Indicator */}
          <div
            aria-hidden="true"
            className="absolute top-1.5 left-1/2 -translate-x-1/2 z-20 w-9 h-1 rounded-full bg-white/40 pointer-events-none"
          />

          {liveVideo.videoUrl ? (
            <>
              <video
                src={liveVideo.videoUrl}
                poster={liveVideo.thumbnailUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
              <button
                onClick={triggerDismiss}
                aria-label="Minimize player"
                className="absolute top-2 left-2 z-20 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-black/55 text-white active:scale-95 transition-transform"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </>
          ) : (
            <>
              <MediaThumb
                src={liveVideo.thumbnailUrl}
                alt={liveVideo.title}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-[1.03]' : 'scale-100 opacity-75'
                }`}
                fallbackGradient={liveVideo.accentGradient}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/45" />

              {/* Top Player Controls */}
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                <button
                  onClick={triggerDismiss}
                  aria-label="Minimize player"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/40 text-white active:scale-95 transition-transform"
                >
                  <ChevronDown className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-1.5">
                  {liveVideo.type === 'live' && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600 text-white text-[11px] font-semibold">
                      <Radio className="w-3.5 h-3.5" />
                      LIVE
                    </span>
                  )}
                  <button
                    onClick={() => setCaptionsOn((c) => !c)}
                    aria-label="Toggle captions"
                    className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors ${
                      captionsOn ? 'bg-white/25 text-white' : 'bg-black/40 text-zinc-300'
                    }`}
                  >
                    <Captions className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowQualityMenu((q) => !q)}
                    aria-label="Video quality"
                    className="min-h-[44px] px-2.5 flex items-center gap-1 rounded-full bg-black/40 text-white text-xs font-medium"
                  >
                    <Settings2 className="w-4 h-4" />
                    <span className="tabular-nums">{qualityLabel}</span>
                  </button>
                </div>
              </div>

              {/* Center Transport: -10s · Play/Pause · +10s */}
              <div className="absolute inset-0 m-auto flex items-center justify-center gap-7 pointer-events-none">
                {liveVideo.type !== 'live' && (
                  <button
                    onClick={() => setProgress((p) => Math.max(0, p - 12))}
                    aria-label="Rewind 10 seconds"
                    className="pointer-events-auto w-10 h-10 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setIsPlaying((p) => !p)}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  className="pointer-events-auto w-14 h-14 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
                >
                  {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
                </button>
                {liveVideo.type !== 'live' && (
                  <button
                    onClick={() => setProgress((p) => Math.min(100, p + 12))}
                    aria-label="Forward 10 seconds"
                    className="pointer-events-auto w-10 h-10 rounded-full bg-black/45 backdrop-blur-sm flex items-center justify-center text-white active:scale-90 transition-transform"
                  >
                    <RotateCw className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Live Captions Preview */}
              {captionsOn && (
                <div className="absolute bottom-7 left-4 right-4 flex justify-center pointer-events-none">
                  <span className="px-2.5 py-1 rounded bg-blue-900/85 text-yellow-300 text-xs font-medium text-center leading-snug">
                    {liveVideo.title.slice(0, 48)}
                  </span>
                </div>
              )}

              {/* Quality Popover */}
              {showQualityMenu && (
                <div className="absolute top-14 right-3 z-20 bg-zinc-900 border border-zinc-700 rounded-xl p-1.5 shadow-xl flex flex-col gap-0.5">
                  {['1080p', '720p', '360p', 'Auto'].map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setQualityLabel(q);
                        setShowQualityMenu(false);
                      }}
                      className={`px-3 py-1.5 text-left text-xs rounded-lg ${
                        qualityLabel === q ? 'bg-white text-black font-semibold' : 'text-zinc-200 hover:bg-zinc-800'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Bottom Scrubber */}
              <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 flex items-center gap-2">
                <span className="text-[11px] font-mono tabular-nums text-white/90">
                  {liveVideo.type === 'live' ? 'LIVE' : `0:${String(Math.floor(progress * 0.59)).padStart(2, '0')}`}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={liveVideo.type === 'live' ? 100 : progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  aria-label="Seek video"
                  className="flex-1 h-1 accent-red-600 cursor-pointer"
                />
                <span className="text-[11px] font-mono tabular-nums text-white/90">
                  {liveVideo.duration}
                </span>
              </div>
            </>
          )}
      </div>

      {/* Scrollable Details, Comments & Up Next */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 no-scrollbar pb-10 ${
          isDragging ? 'overflow-hidden' : 'overflow-y-auto'
        }`}
      >
        <div className="px-4 pt-3.5 pb-3 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-base font-semibold leading-snug">{liveVideo.title}</h2>
          <button
            onClick={() => setShowFullDesc((d) => !d)}
            className="mt-1 text-left text-xs text-zinc-500 dark:text-zinc-400 tabular-nums flex items-center gap-1 flex-wrap"
          >
            <span>{formatCount(liveVideo.viewsCount)} views · {liveVideo.publishedAgo}</span>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              {showFullDesc ? 'Show less' : '...more'}
            </span>
          </button>

          {showFullDesc && (
            <div className="mt-2.5 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <p className="font-bold tabular-nums">{formatCount(liveVideo.likesCount)}</p>
                  <p className="text-[10px] text-zinc-500">Likes</p>
                </div>
                <div>
                  <p className="font-bold tabular-nums">{formatCount(liveVideo.viewsCount)}</p>
                  <p className="text-[10px] text-zinc-500">Views</p>
                </div>
                <div>
                  <p className="font-bold">{liveVideo.publishedAgo}</p>
                  <p className="text-[10px] text-zinc-500">Published</p>
                </div>
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                {liveVideo.description}
              </p>
            </div>
          )}

          {/* Channel Row */}
          <div className="mt-3.5 flex items-center justify-between gap-3">
            <button
              onClick={() => onOpenChannel(liveVideo.channelId)}
              className="flex items-center gap-2.5 min-w-0 text-left min-h-[44px]"
            >
              <MediaThumb
                src={liveVideo.channelAvatar}
                alt={liveVideo.channelName}
                className="w-9 h-9 rounded-full object-cover shrink-0 bg-zinc-800"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{liveVideo.channelName}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                  {formatCount(channel?.subscribersCount ?? 0)} subscribers
                </p>
              </div>
            </button>

            <button
              onClick={() => toggleSubscribe(liveVideo.channelId)}
              className={`min-h-[38px] px-4 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                channel?.isSubscribed
                  ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                  : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900'
              }`}
            >
              {channel?.isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>

          {/* Action Buttons Strip */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center rounded-full bg-zinc-100 dark:bg-zinc-800/90 shrink-0 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleLikeVideo(liveVideo.id)}
                aria-label={liveVideo.isLiked ? 'Unlike video' : 'Like video'}
                aria-pressed={Boolean(liveVideo.isLiked)}
                className={`min-h-[38px] px-3.5 flex items-center gap-1.5 text-xs font-semibold rounded-l-full active:scale-95 transition-all ${
                  liveVideo.isLiked
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500/40'
                    : 'hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60'
                }`}
              >
                <ThumbsUp
                  className={`w-4 h-4 transition-transform ${
                    liveVideo.isLiked ? 'fill-current scale-110' : ''
                  }`}
                />
                <span className="tabular-nums">{formatCount(liveVideo.likesCount)}</span>
              </button>
              <span className="w-px h-4 bg-zinc-300 dark:bg-zinc-700" />
              <button
                type="button"
                onClick={() => toggleDislikeVideo(liveVideo.id)}
                aria-label={liveVideo.isDisliked ? 'Remove dislike' : 'Dislike video'}
                aria-pressed={Boolean(liveVideo.isDisliked)}
                className={`min-h-[38px] px-3.5 flex items-center gap-1.5 text-xs font-semibold rounded-r-full active:scale-95 transition-all ${
                  liveVideo.isDisliked
                    ? 'bg-red-500/20 text-red-600 dark:text-red-400 ring-1 ring-inset ring-red-500/40'
                    : 'hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60'
                }`}
              >
                <ThumbsDown
                  className={`w-4 h-4 transition-transform ${
                    liveVideo.isDisliked ? 'fill-current scale-110' : ''
                  }`}
                />
                <span className="tabular-nums">{formatCount(liveVideo.dislikesCount ?? 0)}</span>
              </button>
            </div>

            <button
              onClick={handleShare}
              className="min-h-[38px] px-3.5 rounded-full bg-zinc-100 dark:bg-zinc-800/90 flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0"
            >
              <Share2 className="w-4 h-4" />
              <span>{shareToast ? 'Link copied' : 'Share'}</span>
            </button>

            <button
              onClick={() => toggleDownloadVideo(liveVideo.id)}
              className="min-h-[38px] px-3.5 rounded-full bg-zinc-100 dark:bg-zinc-800/90 flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0"
            >
              {liveVideo.isDownloaded ? <Check className="w-4 h-4 text-blue-500" /> : <Download className="w-4 h-4" />}
              <span>{liveVideo.isDownloaded ? 'Downloaded' : 'Download'}</span>
            </button>

            <button
              onClick={() => toggleWatchLater(liveVideo.id)}
              className="min-h-[38px] px-3.5 rounded-full bg-zinc-100 dark:bg-zinc-800/90 flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0"
            >
              <Bookmark className={`w-4 h-4 ${liveVideo.isWatchLater ? 'fill-current text-blue-500' : ''}`} />
              <span>{liveVideo.isWatchLater ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          {/* YouTube Comments Preview Card */}
          <button
            onClick={scrollToComments}
            className="mt-3 w-full text-left rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80 transition-colors p-3 space-y-1.5"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold">
                {liveVideo.type === 'live' ? 'Live chat' : 'Comments'}
              </span>
              <span className="text-xs text-zinc-500 tabular-nums">
                {liveVideo.comments.length}
              </span>
            </div>
            {liveVideo.comments.length > 0 ? (
              <div className="flex items-center gap-2">
                <img
                  src={liveVideo.comments[0].authorAvatar || buildInitialAvatarSvg(liveVideo.comments[0].author)}
                  alt={liveVideo.comments[0].author}
                  className="w-6 h-6 rounded-full object-cover shrink-0 bg-zinc-800"
                />
                <p className="text-xs text-zinc-700 dark:text-zinc-300 truncate">
                  {liveVideo.comments[0].text}
                </p>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Be the first to add a comment...
              </p>
            )}
          </button>
        </div>

        {/* Interactive Comments / Live Chat Section */}
        <div
          ref={commentsSectionRef}
          className="px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-zinc-400" />
              <span>{liveVideo.type === 'live' ? 'Live chat' : 'Comments'}</span>
              <span className="text-xs font-normal text-zinc-500 tabular-nums">
                {liveVideo.comments.length}
              </span>
            </h3>
          </div>

          {activeAccount ? (
            <form onSubmit={handleSendComment} className="flex items-center gap-2.5 mb-3.5">
              <MediaThumb
                src={activeAccount.avatarUrl}
                alt={activeAccount.channelName}
                className="w-8 h-8 rounded-full object-cover shrink-0 bg-zinc-800"
              />
              <input
                ref={commentInputRef}
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={liveVideo.type === 'live' ? 'Chat publicly...' : 'Add a comment...'}
                className="flex-1 min-h-[38px] px-3.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                aria-label="Post comment"
                className="min-h-[38px] min-w-[38px] rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-40 shrink-0"
                disabled={!commentText.trim()}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="mb-3.5 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2.5">
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Create an account to post a comment
              </p>
              <button
                type="button"
                onClick={onRequestCreateAccount}
                className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create account</span>
              </button>
            </div>
          )}

          {liveVideo.comments.length === 0 ? (
            <p className="text-xs text-zinc-500 py-2">
              No comments yet. Be the first to share your thoughts.
            </p>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
              {liveVideo.comments.map((cmt) => (
                <div key={cmt.id} className="flex items-start gap-2.5 text-xs">
                  <img
                    src={cmt.authorAvatar || buildInitialAvatarSvg(cmt.author)}
                    alt={cmt.author}
                    className="w-7 h-7 rounded-full object-cover shrink-0 bg-zinc-800 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {cmt.handle || cmt.author}
                      </span>
                      <span>·</span>
                      <span>{cmt.timeAgo}</span>
                    </div>
                    <p className="text-zinc-800 dark:text-zinc-200 mt-0.5 leading-relaxed break-words">
                      {cmt.text}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <button
                        type="button"
                        onClick={() => toggleCommentLike(liveVideo.id, cmt.id)}
                        className={`flex items-center gap-1 text-[11px] py-0.5 ${
                          cmt.isLiked ? 'text-blue-500 font-semibold' : 'text-zinc-500'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span className="tabular-nums">{cmt.likes > 0 ? formatCount(cmt.likes) : ''}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Up Next Feed */}
        <div className="px-4 pt-3 space-y-3">
          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Up next</p>
          {relatedVideos.map((rel) => (
            <button
              key={rel.id}
              onClick={() => onSelectVideo(rel)}
              className="w-full flex gap-3 text-left group"
            >
              <div className="relative w-36 aspect-video rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                <MediaThumb
                  src={rel.thumbnailUrl}
                  alt={rel.title}
                  className="w-full h-full object-cover"
                  fallbackGradient={rel.accentGradient}
                />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono tabular-nums">
                  {rel.duration}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold line-clamp-2 leading-snug">{rel.title}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                  {rel.channelName}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                  {rel.viewsLabel} views · {rel.publishedAgo}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};
