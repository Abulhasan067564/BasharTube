export type MainTab = 'home' | 'shorts' | 'create' | 'you';
export type HomeSubTab = 'Home' | 'Subs' | 'Music' | 'Live';

export interface AccountProfile {
  id: string;
  ownerName: string;
  email: string;
  password?: string;
  channelId: string;
  channelName: string;
  handle: string;
  subscribersCount: number;
  avatarUrl: string;
  isPrimary?: boolean;
}

export interface Channel {
  id: string;
  ownerUid?: string;
  name: string;
  handle: string;
  subscribersCount: number;
  videosCount: number;
  description: string;
  avatarUrl: string;
  bannerGradient: string;
  bannerTitle: string;
  bannerSubtitle?: string;
  isSubscribed: boolean;
  isVerified?: boolean;
  communityEnabled: boolean;
  subscriptionsPrivate: boolean;
  links?: string[];
}

export interface CommentItem {
  id: string;
  authorUid?: string;
  author: string;
  handle: string;
  authorAvatar?: string;
  text: string;
  timeAgo: string;
  likes: number;
  isLiked?: boolean;
}

export interface VideoItem {
  id: string;
  ownerUid?: string;
  type: 'video' | 'short' | 'music' | 'live';
  title: string;
  channelId: string;
  channelName: string;
  channelHandle: string;
  channelAvatar: string;
  thumbnailUrl: string;
  videoUrl?: string;
  accentGradient: string;
  duration: string;
  viewsCount: number;
  viewsLabel: string;
  likesCount: number;
  dislikesCount?: number;
  publishedAgo: string;
  category: string;
  description: string;
  tags: string[];
  visibility: 'Public' | 'Unlisted' | 'Private';
  isDownloaded?: boolean;
  isLiked?: boolean;
  isDisliked?: boolean;
  isWatchLater?: boolean;
  watchingCount?: number;
  comments: CommentItem[];
  productPick?: {
    title: string;
    store: string;
  };
}

export interface CommunityPost {
  id: string;
  ownerUid?: string;
  channelId: string;
  channelName: string;
  channelAvatar: string;
  timeAgo: string;
  status: 'Published' | 'Scheduled' | 'Archived';
  text: string;
  imageUrl?: string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  pollOptions?: { id: string; text: string; votes: number }[];
  votedOptionId?: string;
  quizOptions?: { id: string; text: string; isCorrect: boolean }[];
  selectedQuizId?: string;
  quizExplanation?: string;
}

export interface NotificationItem {
  id: string;
  section: 'Important' | 'Today';
  type: 'upload' | 'premiere' | 'live' | 'post' | 'comment' | 'mention';
  channelName: string;
  channelAvatar: string;
  title: string;
  timeAgo: string;
  thumbnailUrl: string;
  videoId?: string;
  isUnread: boolean;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  thumbnailUrl?: string;
}

export interface AppSettings {
  appearance: 'dark' | 'light';
  rotateShorts: boolean;
  playbackInFeeds: boolean;
  voiceSearchLanguage: string;
  location: string;
  restrictedMode: boolean;
  statsForNerds: boolean;
  earnBadges: boolean;
  appLanguage: string;
  preferredLanguages: string[];
  // Time management
  bedtimeReminder: boolean;
  breakReminder: boolean;
  shortsFeedLimitMinutes: number; // 0 = off/0m, 15, 30, 45, 60, 120
  // Notifications
  scheduledDigest: boolean;
  notifySubscriptions: boolean;
  notifyRecommended: boolean;
  notifyCreateTrends: boolean;
  notifyChannelActivity: boolean;
  notifyPostSuggestions: boolean;
  notifyCommentsReplies: boolean;
  notifyMentions: boolean;
  notifyReusing: boolean;
  notifyProductUpdates: boolean;
  notifyPromotional: boolean;
  disableSoundsVibrations: boolean;
  notifyBadges: boolean;
  // Quality & Playback
  mobileQuality: 'auto' | 'higher' | 'saver';
  wifiQuality: 'auto' | 'higher' | 'saver';
  audioQuality: 'high' | 'normal';
  autoplayNext: boolean;
  doubleTapSeekSeconds: number;
  zoomToFill: boolean;
  pictureInPicture: boolean;
  // Captions
  showCaptions: boolean;
  captionStyle: string;
  captionLanguage: string;
  // Data saving
  dataSavingMode: boolean;
  reduceVideoQuality: boolean;
  reduceDownloadQuality: boolean;
  reduceSmartDownloads: boolean;
  wifiOnlyDownloads: boolean;
  wifiOnlyUploads: boolean;
  mutedFeedOverWifi: boolean;
  selectQualityEveryVideo: boolean;
  mobileDataReminder: boolean;
  // Downloads
  downloadQuality: string;
  recommendDownloads: boolean;
  // Live chat
  holdForReview: boolean;
  topFansLeaderboard: boolean;
  watchTimeXp: boolean;
  superChatCelebrations: boolean;
  // Accessibility
  accessibilityPlayer: boolean;
  hidePlayerControls: string;
  // History
  saveSearchHistory: boolean;
  autoDeleteMonths: number;
}

export interface AppBrand {
  name: string;
  logoUrl: string | null;
}

export interface AppState {
  activeAccountId: string | null;
  incognitoMode: boolean;
  appBrand: AppBrand;
  accounts: AccountProfile[];
  channels: Channel[];
  videos: VideoItem[];
  posts: CommunityPost[];
  notifications: NotificationItem[];
  searchHistory: SearchHistoryItem[];
  watchHistoryIds: string[];
  watchHistoryTimestamps?: Record<string, number>;
  settings: AppSettings;
  adminPasswordHash: string;
}
