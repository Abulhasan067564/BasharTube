import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  AccountProfile,
  AppBrand,
  AppSettings,
  AppState,
  Channel,
  CommentItem,
  CommunityPost,
  NotificationItem,
  VideoItem,
} from '../types';
import {
  createInitialState,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_BRAND_LOGO,
  DEFAULT_BRAND_NAME,
  IMG_AVATAR_SDB,
} from '../data/seedData';
import {
  OperationType,
  auth,
  compactMediaDataUrl,
  db,
  googleAuthProvider,
  handleFirestoreError,
} from '../lib/firebase';

const STORAGE_KEY = 'smart_digital_bangla_state_v2';
const ADMIN_EMAIL = 'abulhasanmohim@gmail.com';

export function buildInitialAvatarSvg(label: string): string {
  const letter = (label.trim()[0] || 'U').toUpperCase();
  const colors = ['#DC2626', '#2563EB', '#059669', '#D97706', '#7C3AED', '#DB2777'];
  const color = colors[letter.charCodeAt(0) % colors.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" rx="64" fill="${color}"/><text x="64" y="78" text-anchor="middle" font-family="system-ui,sans-serif" font-size="56" font-weight="700" fill="#ffffff">${letter}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function formatRelativeTime(ts?: Timestamp | null): string {
  if (!ts || typeof ts.toMillis !== 'function') return 'Just now';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts.toMillis()) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMo = Math.floor(diffDay / 30);
  return `${diffMo}mo ago`;
}

function pruneHistoryTimestamps(
  ids: string[],
  timestamps: Record<string, number>
): Record<string, number> {
  const pruned: Record<string, number> = {};
  for (const id of ids.slice(0, 40)) {
    if (typeof timestamps[id] === 'number') {
      pruned[id] = timestamps[id];
    }
  }
  return pruned;
}

interface UserPrefsDoc {
  uid: string;
  email: string;
  ownerName: string;
  channelId: string;
  avatarUrl: string;
  likedVideoIds: string[];
  dislikedVideoIds: string[];
  watchLaterIds: string[];
  subscribedChannelIds: string[];
  watchHistoryIds: string[];
  watchHistoryTimestamps: Record<string, number>;
  searchQueries: string[];
}

interface AppContextValue {
  state: AppState;
  firebaseUser: User | null;
  authReady: boolean;
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<User | null>;
  activeAccount: AccountProfile | null;
  ownChannel: Channel | null;
  unreadNotificationsCount: number;
  subscribeToVideoComments: (videoId: string) => () => void;
  // Video & Short actions
  recordWatch: (videoId: string) => void;
  toggleLikeVideo: (videoId: string) => void;
  toggleDislikeVideo: (videoId: string) => void;
  toggleWatchLater: (videoId: string) => void;
  toggleDownloadVideo: (videoId: string) => void;
  deleteAllDownloads: () => void;
  addComment: (videoId: string, text: string) => void;
  toggleCommentLike: (videoId: string, commentId: string) => void;
  toggleSubscribe: (channelId: string) => void;
  // Creation & Posts
  publishVideo: (payload: {
    type: 'video' | 'short';
    title: string;
    description: string;
    visibility: 'Public' | 'Unlisted' | 'Private';
    category: string;
    tags: string[];
    thumbnailUrl: string;
    videoUrl?: string;
    duration: string;
  }) => VideoItem | null;
  publishPost: (payload: {
    text: string;
    pollOptions?: string[];
    quizOptions?: { text: string; isCorrect: boolean }[];
    quizExplanation?: string;
  }) => void;
  votePoll: (postId: string, optionId: string) => void;
  answerQuiz: (postId: string, optionId: string) => void;
  // Channel & Account
  createAccount: (payload: {
    ownerName: string;
    email: string;
    password?: string;
    channelName: string;
    handle: string;
    channelDescription?: string;
    avatarUrl?: string;
  }) => Promise<AccountProfile | null>;
  signOutAccount: () => void;
  updateOwnChannel: (updates: Partial<Channel>) => void;
  switchAccount: (accountId: string) => void;
  toggleIncognito: () => void;
  // Search & Notifications
  addSearchQuery: (query: string) => void;
  removeSearchHistory: (id: string) => void;
  removeFromWatchHistory: (videoId: string) => void;
  clearWatchHistory: () => void;
  markAllNotificationsRead: () => void;
  // Settings & Brand
  updateSettings: (updates: Partial<AppSettings>) => void;
  updateAppBrand: (updates: Partial<AppBrand>) => void;
  // Admin actions
  verifyAdminPassword: (input: string) => boolean;
  changeAdminPassword: (newPassword: string) => void;
  adminAddVideo: (
    video: Omit<VideoItem, 'id' | 'comments'> & { customChannelName?: string }
  ) => void;
  adminUpdateVideo: (id: string, updates: Partial<VideoItem>) => void;
  adminDeleteVideo: (id: string) => void;
  adminUpdateChannel: (id: string, updates: Partial<Channel>) => void;
  adminBroadcastNotification: (payload: {
    title: string;
    channelName: string;
    type: NotificationItem['type'];
  }) => void;
  adminDeleteNotification: (id: string) => void;
  adminResetAll: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localState, setLocalState] = useState<AppState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppState;
        if (parsed && parsed.videos && parsed.channels && parsed.settings) {
          const isDefaultLegacyBrand =
            !parsed.appBrand ||
            (parsed.appBrand.name === 'YouTube' && !parsed.appBrand.logoUrl);
          return {
            ...parsed,
            appBrand: isDefaultLegacyBrand
              ? { name: DEFAULT_BRAND_NAME, logoUrl: DEFAULT_BRAND_LOGO }
              : parsed.appBrand,
            adminPasswordHash:
              !parsed.adminPasswordHash || parsed.adminPasswordHash === 'SDB#9xK!2026@Mstr'
                ? DEFAULT_ADMIN_PASSWORD
                : parsed.adminPasswordHash,
          };
        }
      }
    } catch {
      // Fallback to fresh seed state
    }
    return createInitialState();
  });

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [remoteBrand, setRemoteBrand] = useState<AppBrand | null>(null);
  const [remoteChannels, setRemoteChannels] = useState<Channel[]>([]);
  const [publicVideos, setPublicVideos] = useState<VideoItem[]>([]);
  const [ownedVideos, setOwnedVideos] = useState<VideoItem[]>([]);
  const [publicPosts, setPublicPosts] = useState<CommunityPost[]>([]);
  const [ownedPosts, setOwnedPosts] = useState<CommunityPost[]>([]);
  const [userPrefs, setUserPrefs] = useState<UserPrefsDoc | null>(null);
  const [commentsByVideo, setCommentsByVideo] = useState<Record<string, CommentItem[]>>({});
  const [likedCommentIds, setLikedCommentIds] = useState<Record<string, boolean>>({});
  const [downloadedIds, setDownloadedIds] = useState<Record<string, boolean>>({});
  const [localBlobUrls, setLocalBlobUrls] = useState<Record<string, string>>({});

  // Async boundary error bridge so async listener/mutation errors hit ErrorBoundary cleanly
  const [fatalError, setFatalError] = useState<Error | null>(null);
  if (fatalError) {
    throw fatalError;
  }

  const userPrefsRef = useRef<UserPrefsDoc | null>(null);
  userPrefsRef.current = userPrefs;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localState));
    } catch {
      // Ignore quota issues
    }
  }, [localState]);

  useEffect(() => {
    const root = document.documentElement;
    if (localState.settings.appearance === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [localState.settings.appearance]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthReady(true);

      if (!user) {
        setUserPrefs(null);
        setOwnedVideos([]);
        setOwnedPosts([]);
        return;
      }

      const userPath = `users/${user.uid}`;
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          const initialUserDoc = {
            uid: user.uid,
            email: (user.email || 'user@gmail.com').slice(0, 200),
            ownerName: (user.displayName || 'Creator').slice(0, 100),
            channelId: '',
            avatarUrl: (user.photoURL || '').slice(0, 200000),
            likedVideoIds: [],
            dislikedVideoIds: [],
            watchLaterIds: [],
            subscribedChannelIds: [],
            watchHistoryIds: [],
            watchHistoryTimestamps: {},
            searchQueries: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, initialUserDoc);
        }
      } catch (err) {
        try {
          handleFirestoreError(err, OperationType.GET, userPath);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to public Firestore collections & brand config once auth state is initialized
  useEffect(() => {
    if (!authReady) return;
    const brandPath = 'appConfig/brand';
    const unsubBrand = onSnapshot(
      doc(db, 'appConfig', 'brand'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setRemoteBrand({
            name:
              typeof data.name === 'string' && data.name ? data.name : DEFAULT_BRAND_NAME,
            logoUrl:
              typeof data.logoUrl === 'string' && data.logoUrl
                ? data.logoUrl
                : DEFAULT_BRAND_LOGO,
          });
        }
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, brandPath);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      }
    );

    const channelsPath = 'channels';
    const unsubChannels = onSnapshot(
      query(collection(db, 'channels'), where('isPublic', '==', true)),
      (snap) => {
        const next: Channel[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ownerUid: data.ownerUid || '',
            name: data.name || 'Channel',
            handle: data.handle || '@channel',
            subscribersCount: Number(data.subscribersCount || 0),
            videosCount: Number(data.videosCount || 0),
            description: data.description || '',
            avatarUrl: data.avatarUrl || '',
            bannerGradient: data.bannerGradient || 'from-red-700 via-zinc-900 to-zinc-950',
            bannerTitle: data.bannerTitle || data.name || '',
            bannerSubtitle: data.bannerSubtitle || data.handle || '',
            isSubscribed: false,
            isVerified: Boolean(data.isVerified),
            communityEnabled: data.communityEnabled !== false,
            subscriptionsPrivate: Boolean(data.subscriptionsPrivate),
          };
        });
        setRemoteChannels(next);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, channelsPath);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      }
    );

    const videosPath = 'videos';
    const unsubVideos = onSnapshot(
      query(collection(db, 'videos'), where('visibility', '==', 'Public')),
      (snap) => {
        const next: VideoItem[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ownerUid: data.ownerUid || '',
            type: data.type || 'video',
            title: data.title || 'Untitled',
            channelId: data.channelId || '',
            channelName: data.channelName || 'Channel',
            channelHandle: data.channelHandle || '@channel',
            channelAvatar: data.channelAvatar || '',
            thumbnailUrl: data.thumbnailUrl || '',
            accentGradient: data.accentGradient || 'from-red-700/40 via-zinc-900 to-black',
            duration: data.duration || '0:00',
            viewsCount: Number(data.viewsCount || 0),
            viewsLabel: data.viewsLabel || String(data.viewsCount || 0),
            likesCount: Number(data.likesCount || 0),
            dislikesCount: Number(data.dislikesCount || 0),
            publishedAgo: formatRelativeTime(data.createdAt),
            category: data.category || 'General',
            description: data.description || '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            visibility: data.visibility || 'Public',
            comments: [],
          };
        });
        setPublicVideos(next);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, videosPath);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      }
    );

    const postsPath = 'posts';
    const unsubPosts = onSnapshot(
      query(collection(db, 'posts'), where('status', '==', 'Published')),
      (snap) => {
        const next: CommunityPost[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ownerUid: data.ownerUid || '',
            channelId: data.channelId || '',
            channelName: data.channelName || 'Channel',
            channelAvatar: data.channelAvatar || '',
            timeAgo: formatRelativeTime(data.createdAt),
            status: data.status || 'Published',
            text: data.text || '',
            likesCount: Number(data.likesCount || 0),
            commentsCount: Number(data.commentsCount || 0),
            pollOptions: Array.isArray(data.pollOptions) ? data.pollOptions : undefined,
            quizOptions: Array.isArray(data.quizOptions) ? data.quizOptions : undefined,
            quizExplanation: data.quizExplanation || undefined,
          };
        });
        setPublicPosts(next);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, postsPath);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      }
    );

    return () => {
      unsubBrand();
      unsubChannels();
      unsubVideos();
      unsubPosts();
    };
  }, [authReady]);

  // Subscribe to authenticated user's private document & owned items
  useEffect(() => {
    if (!firebaseUser) return;

    const uid = firebaseUser.uid;
    const userPath = `users/${uid}`;
    const unsubUser = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        setUserPrefs({
          uid: data.uid || uid,
          email: data.email || firebaseUser.email || '',
          ownerName: data.ownerName || firebaseUser.displayName || 'Creator',
          channelId: data.channelId || '',
          avatarUrl: data.avatarUrl || firebaseUser.photoURL || '',
          likedVideoIds: Array.isArray(data.likedVideoIds) ? data.likedVideoIds : [],
          dislikedVideoIds: Array.isArray(data.dislikedVideoIds) ? data.dislikedVideoIds : [],
          watchLaterIds: Array.isArray(data.watchLaterIds) ? data.watchLaterIds : [],
          subscribedChannelIds: Array.isArray(data.subscribedChannelIds) ? data.subscribedChannelIds : [],
          watchHistoryIds: Array.isArray(data.watchHistoryIds) ? data.watchHistoryIds : [],
          watchHistoryTimestamps:
            data.watchHistoryTimestamps && typeof data.watchHistoryTimestamps === 'object'
              ? data.watchHistoryTimestamps
              : {},
          searchQueries: Array.isArray(data.searchQueries) ? data.searchQueries : [],
        });
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, userPath);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      }
    );

    const unsubOwnedVideos = onSnapshot(
      query(collection(db, 'videos'), where('ownerUid', '==', uid)),
      (snap) => {
        const next: VideoItem[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ownerUid: data.ownerUid || uid,
            type: data.type || 'video',
            title: data.title || 'Untitled',
            channelId: data.channelId || '',
            channelName: data.channelName || 'Channel',
            channelHandle: data.channelHandle || '@channel',
            channelAvatar: data.channelAvatar || '',
            thumbnailUrl: data.thumbnailUrl || '',
            accentGradient: data.accentGradient || 'from-red-700/40 via-zinc-900 to-black',
            duration: data.duration || '0:00',
            viewsCount: Number(data.viewsCount || 0),
            viewsLabel: data.viewsLabel || String(data.viewsCount || 0),
            likesCount: Number(data.likesCount || 0),
            dislikesCount: Number(data.dislikesCount || 0),
            publishedAgo: formatRelativeTime(data.createdAt),
            category: data.category || 'General',
            description: data.description || '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            visibility: data.visibility || 'Public',
            comments: [],
          };
        });
        setOwnedVideos(next);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'videos');
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      }
    );

    const unsubOwnedPosts = onSnapshot(
      query(collection(db, 'posts'), where('ownerUid', '==', uid)),
      (snap) => {
        const next: CommunityPost[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ownerUid: data.ownerUid || uid,
            channelId: data.channelId || '',
            channelName: data.channelName || 'Channel',
            channelAvatar: data.channelAvatar || '',
            timeAgo: formatRelativeTime(data.createdAt),
            status: data.status || 'Published',
            text: data.text || '',
            likesCount: Number(data.likesCount || 0),
            commentsCount: Number(data.commentsCount || 0),
            pollOptions: Array.isArray(data.pollOptions) ? data.pollOptions : undefined,
            quizOptions: Array.isArray(data.quizOptions) ? data.quizOptions : undefined,
            quizExplanation: data.quizExplanation || undefined,
          };
        });
        setOwnedPosts(next);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'posts');
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      }
    );

    return () => {
      unsubUser();
      unsubOwnedVideos();
      unsubOwnedPosts();
    };
  }, [firebaseUser]);

  const subscribeToVideoComments = useCallback((videoId: string) => {
    if (!videoId) return () => {};
    const path = `videos/${videoId}/comments`;
    const q = query(collection(db, 'videos', videoId, 'comments'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: CommentItem[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            authorUid: data.authorUid || '',
            author: data.author || 'Viewer',
            handle: data.handle || '@viewer',
            authorAvatar: data.authorAvatar || '',
            text: data.text || '',
            timeAgo: formatRelativeTime(data.createdAt),
            likes: Number(data.likes || 0),
          };
        });
        setCommentsByVideo((prev) => ({ ...prev, [videoId]: items }));
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, path);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      }
    );
    return unsub;
  }, []);

  // Merge Firestore live collections with local state & user preferences
  const state = useMemo<AppState>(() => {
    const subscribedSet = new Set(userPrefs?.subscribedChannelIds || []);
    const likedSet = new Set(userPrefs?.likedVideoIds || []);
    const dislikedSet = new Set(userPrefs?.dislikedVideoIds || []);
    const watchLaterSet = new Set(userPrefs?.watchLaterIds || []);

    const channelMap = new Map<string, Channel>();
    for (const ch of localState.channels) {
      channelMap.set(ch.id, ch);
    }
    for (const ch of remoteChannels) {
      channelMap.set(ch.id, {
        ...ch,
        isSubscribed: firebaseUser ? subscribedSet.has(ch.id) : ch.isSubscribed,
      });
    }
    const mergedChannels = Array.from(channelMap.values());

    const videoMap = new Map<string, VideoItem>();
    for (const v of localState.videos) {
      videoMap.set(v.id, v);
    }
    for (const v of [...publicVideos, ...ownedVideos]) {
      const existingLocal = videoMap.get(v.id);
      const remoteComments = commentsByVideo[v.id];
      const comments = (remoteComments || existingLocal?.comments || []).map((c) => ({
        ...c,
        isLiked: likedCommentIds[c.id] ?? c.isLiked ?? false,
      }));
      videoMap.set(v.id, {
        ...v,
        videoUrl: localBlobUrls[v.id] || existingLocal?.videoUrl,
        isLiked: firebaseUser ? likedSet.has(v.id) : existingLocal?.isLiked,
        isDisliked: firebaseUser ? dislikedSet.has(v.id) : existingLocal?.isDisliked,
        isWatchLater: firebaseUser ? watchLaterSet.has(v.id) : existingLocal?.isWatchLater,
        isDownloaded: downloadedIds[v.id] ?? existingLocal?.isDownloaded,
        comments,
      });
    }
    const mergedVideos = Array.from(videoMap.values());

    const postMap = new Map<string, CommunityPost>();
    for (const p of localState.posts) {
      postMap.set(p.id, p);
    }
    for (const p of [...publicPosts, ...ownedPosts]) {
      const existingLocal = postMap.get(p.id);
      postMap.set(p.id, {
        ...p,
        votedOptionId: existingLocal?.votedOptionId,
        selectedQuizId: existingLocal?.selectedQuizId,
      });
    }
    const mergedPosts = Array.from(postMap.values());

    // Build Accounts list from user's Firestore channels + local accounts
    const accountMap = new Map<string, AccountProfile>();
    for (const a of localState.accounts) {
      accountMap.set(a.id, a);
    }
    if (firebaseUser) {
      const ownedChannels = mergedChannels.filter((c) => c.ownerUid === firebaseUser.uid);
      for (const ch of ownedChannels) {
        const accId = `fb-${ch.id}`;
        accountMap.set(accId, {
          id: accId,
          ownerName: userPrefs?.ownerName || firebaseUser.displayName || ch.name,
          email: userPrefs?.email || firebaseUser.email || '',
          channelId: ch.id,
          channelName: ch.name,
          handle: ch.handle,
          subscribersCount: ch.subscribersCount,
          avatarUrl: ch.avatarUrl || firebaseUser.photoURL || buildInitialAvatarSvg(ch.name),
          isPrimary: userPrefs?.channelId === ch.id,
        });
      }
    }
    const mergedAccounts = Array.from(accountMap.values());

    let resolvedActiveAccountId = localState.activeAccountId;
    if (firebaseUser) {
      if (userPrefs?.channelId && accountMap.has(`fb-${userPrefs.channelId}`)) {
        resolvedActiveAccountId = `fb-${userPrefs.channelId}`;
      } else {
        const firstOwned = mergedChannels.find((c) => c.ownerUid === firebaseUser.uid);
        if (firstOwned && accountMap.has(`fb-${firstOwned.id}`)) {
          resolvedActiveAccountId = `fb-${firstOwned.id}`;
        }
      }
    }

    const mergedBrand = remoteBrand || localState.appBrand;

    const mergedSearchHistory =
      firebaseUser && userPrefs
        ? userPrefs.searchQueries.map((q, idx) => ({ id: `sq-${idx}`, query: q }))
        : localState.searchHistory;

    const mergedWatchHistoryIds =
      firebaseUser && userPrefs ? userPrefs.watchHistoryIds : localState.watchHistoryIds;
    const mergedWatchHistoryTimestamps =
      firebaseUser && userPrefs
        ? userPrefs.watchHistoryTimestamps
        : localState.watchHistoryTimestamps;

    return {
      ...localState,
      activeAccountId: resolvedActiveAccountId,
      appBrand: mergedBrand,
      accounts: mergedAccounts,
      channels: mergedChannels,
      videos: mergedVideos,
      posts: mergedPosts,
      searchHistory: mergedSearchHistory,
      watchHistoryIds: mergedWatchHistoryIds,
      watchHistoryTimestamps: mergedWatchHistoryTimestamps,
    };
  }, [
    localState,
    remoteBrand,
    remoteChannels,
    publicVideos,
    ownedVideos,
    publicPosts,
    ownedPosts,
    userPrefs,
    firebaseUser,
    commentsByVideo,
    likedCommentIds,
    downloadedIds,
    localBlobUrls,
  ]);

  useEffect(() => {
    document.title = state.appBrand?.name || 'BasharTube';
  }, [state.appBrand?.name]);

  const activeAccount =
    state.activeAccountId
      ? state.accounts.find((a) => a.id === state.activeAccountId) || null
      : null;

  const ownChannel =
    activeAccount
      ? state.channels.find((c) => c.id === activeAccount.channelId) || null
      : null;

  const unreadNotificationsCount = state.notifications.filter((n) => n.isUnread).length;

  const persistUserPrefsUpdate = async (fields: Record<string, unknown>) => {
    if (!firebaseUser) return;
    const path = `users/${firebaseUser.uid}`;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        ...fields,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const clearAuthError = () => setAuthError(null);

  const signInWithGoogle = async (): Promise<User | null> => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      return result.user;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError('Sign-in was cancelled.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Popup was blocked by your browser. Please allow popups and try again.');
      } else if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : '';
        setAuthError(
          `Domain "${host}" is not authorized for Google Sign-In yet. Add it in Firebase Console → Authentication → Settings → Authorized domains.`
        );
      } else {
        setAuthError(err instanceof Error ? err.message : 'Google Sign-In failed.');
      }
      return null;
    }
  };

  const recordWatch = (videoId: string) => {
    if (state.incognitoMode) return;
    const now = Date.now();
    const targetVideo = state.videos.find((v) => v.id === videoId);

    setLocalState((prev) => ({
      ...prev,
      watchHistoryIds: [videoId, ...prev.watchHistoryIds.filter((id) => id !== videoId)].slice(0, 40),
      watchHistoryTimestamps: pruneHistoryTimestamps(
        [videoId, ...prev.watchHistoryIds.filter((id) => id !== videoId)],
        { ...(prev.watchHistoryTimestamps || {}), [videoId]: now }
      ),
      videos: prev.videos.map((v) =>
        v.id === videoId ? { ...v, viewsCount: v.viewsCount + 1 } : v
      ),
    }));

    if (firebaseUser && userPrefsRef.current) {
      const nextIds = [
        videoId,
        ...userPrefsRef.current.watchHistoryIds.filter((id) => id !== videoId),
      ].slice(0, 40);
      const nextTimestamps = pruneHistoryTimestamps(nextIds, {
        ...(userPrefsRef.current.watchHistoryTimestamps || {}),
        [videoId]: now,
      });
      void persistUserPrefsUpdate({
        watchHistoryIds: nextIds,
        watchHistoryTimestamps: nextTimestamps,
      }).catch((e) => setFatalError(e));

      if (targetVideo && (publicVideos.some((v) => v.id === videoId) || ownedVideos.some((v) => v.id === videoId))) {
        const nextViews = targetVideo.viewsCount + 1;
        updateDoc(doc(db, 'videos', videoId), {
          viewsCount: nextViews,
          viewsLabel: formatCount(nextViews),
          updatedAt: serverTimestamp(),
        }).catch((err) => {
          try {
            handleFirestoreError(err, OperationType.UPDATE, `videos/${videoId}`);
          } catch (wrapped) {
            setFatalError(wrapped as Error);
          }
        });
      }
    }
  };

  const toggleLikeVideo = (videoId: string) => {
    const target = state.videos.find((v) => v.id === videoId);
    if (!target) return;
    const nextLiked = !target.isLiked;
    const currentDislikes = target.dislikesCount ?? 0;
    const nextLikesCount = Math.max(0, target.likesCount + (nextLiked ? 1 : -1));
    const nextDislikesCount =
      nextLiked && target.isDisliked ? Math.max(0, currentDislikes - 1) : currentDislikes;

    setLocalState((prev) => ({
      ...prev,
      videos: prev.videos.map((v) =>
        v.id === videoId
          ? {
              ...v,
              isLiked: nextLiked,
              isDisliked: nextLiked ? false : v.isDisliked,
              likesCount: nextLikesCount,
              dislikesCount: nextDislikesCount,
            }
          : v
      ),
    }));

    setPublicVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? { ...v, likesCount: nextLikesCount, dislikesCount: nextDislikesCount }
          : v
      )
    );
    setOwnedVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? { ...v, likesCount: nextLikesCount, dislikesCount: nextDislikesCount }
          : v
      )
    );

    if (firebaseUser && userPrefsRef.current) {
      const nextLikedIds = nextLiked
        ? Array.from(new Set([videoId, ...userPrefsRef.current.likedVideoIds])).slice(0, 200)
        : userPrefsRef.current.likedVideoIds.filter((id) => id !== videoId);
      const nextDislikedIds = nextLiked
        ? userPrefsRef.current.dislikedVideoIds.filter((id) => id !== videoId)
        : userPrefsRef.current.dislikedVideoIds;

      setUserPrefs((prev) =>
        prev
          ? {
              ...prev,
              likedVideoIds: nextLikedIds,
              dislikedVideoIds: nextDislikedIds,
            }
          : prev
      );

      void persistUserPrefsUpdate({
        likedVideoIds: nextLikedIds,
        dislikedVideoIds: nextDislikedIds,
      }).catch((e) => setFatalError(e));

      if (publicVideos.some((v) => v.id === videoId) || ownedVideos.some((v) => v.id === videoId)) {
        updateDoc(doc(db, 'videos', videoId), {
          likesCount: nextLikesCount,
          dislikesCount: nextDislikesCount,
          updatedAt: serverTimestamp(),
        }).catch((err) => {
          try {
            handleFirestoreError(err, OperationType.UPDATE, `videos/${videoId}`);
          } catch (wrapped) {
            setFatalError(wrapped as Error);
          }
        });
      }
    }
  };

  const toggleDislikeVideo = (videoId: string) => {
    const target = state.videos.find((v) => v.id === videoId);
    if (!target) return;
    const nextDisliked = !target.isDisliked;
    const currentDislikes = target.dislikesCount ?? 0;
    const nextLikesCount =
      nextDisliked && target.isLiked ? Math.max(0, target.likesCount - 1) : target.likesCount;
    const nextDislikesCount = Math.max(0, currentDislikes + (nextDisliked ? 1 : -1));

    setLocalState((prev) => ({
      ...prev,
      videos: prev.videos.map((v) =>
        v.id === videoId
          ? {
              ...v,
              isDisliked: nextDisliked,
              isLiked: nextDisliked ? false : v.isLiked,
              likesCount: nextLikesCount,
              dislikesCount: nextDislikesCount,
            }
          : v
      ),
    }));

    setPublicVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? { ...v, likesCount: nextLikesCount, dislikesCount: nextDislikesCount }
          : v
      )
    );
    setOwnedVideos((prev) =>
      prev.map((v) =>
        v.id === videoId
          ? { ...v, likesCount: nextLikesCount, dislikesCount: nextDislikesCount }
          : v
      )
    );

    if (firebaseUser && userPrefsRef.current) {
      const nextDislikedIds = nextDisliked
        ? Array.from(new Set([videoId, ...userPrefsRef.current.dislikedVideoIds])).slice(0, 200)
        : userPrefsRef.current.dislikedVideoIds.filter((id) => id !== videoId);
      const nextLikedIds = nextDisliked
        ? userPrefsRef.current.likedVideoIds.filter((id) => id !== videoId)
        : userPrefsRef.current.likedVideoIds;

      setUserPrefs((prev) =>
        prev
          ? {
              ...prev,
              likedVideoIds: nextLikedIds,
              dislikedVideoIds: nextDislikedIds,
            }
          : prev
      );

      void persistUserPrefsUpdate({
        likedVideoIds: nextLikedIds,
        dislikedVideoIds: nextDislikedIds,
      }).catch((e) => setFatalError(e));

      if (publicVideos.some((v) => v.id === videoId) || ownedVideos.some((v) => v.id === videoId)) {
        updateDoc(doc(db, 'videos', videoId), {
          likesCount: nextLikesCount,
          dislikesCount: nextDislikesCount,
          updatedAt: serverTimestamp(),
        }).catch((err) => {
          try {
            handleFirestoreError(err, OperationType.UPDATE, `videos/${videoId}`);
          } catch (wrapped) {
            setFatalError(wrapped as Error);
          }
        });
      }
    }
  };

  const toggleWatchLater = (videoId: string) => {
    const target = state.videos.find((v) => v.id === videoId);
    const nextWatchLater = !(target?.isWatchLater ?? false);

    setLocalState((prev) => ({
      ...prev,
      videos: prev.videos.map((v) =>
        v.id === videoId ? { ...v, isWatchLater: nextWatchLater } : v
      ),
    }));

    if (firebaseUser && userPrefsRef.current) {
      const nextIds = nextWatchLater
        ? Array.from(new Set([videoId, ...userPrefsRef.current.watchLaterIds])).slice(0, 200)
        : userPrefsRef.current.watchLaterIds.filter((id) => id !== videoId);
      void persistUserPrefsUpdate({ watchLaterIds: nextIds }).catch((e) => setFatalError(e));
    }
  };

  const toggleDownloadVideo = (videoId: string) => {
    const curr = state.videos.find((v) => v.id === videoId)?.isDownloaded ?? false;
    setDownloadedIds((prev) => ({ ...prev, [videoId]: !curr }));
    setLocalState((prev) => ({
      ...prev,
      videos: prev.videos.map((v) =>
        v.id === videoId ? { ...v, isDownloaded: !v.isDownloaded } : v
      ),
    }));
  };

  const deleteAllDownloads = () => {
    setDownloadedIds({});
    setLocalState((prev) => ({
      ...prev,
      videos: prev.videos.map((v) => ({ ...v, isDownloaded: false })),
    }));
  };

  const addComment = (videoId: string, text: string) => {
    const trimmed = text.trim().slice(0, 1000);
    if (!trimmed) return;
    const authorName = activeAccount?.channelName || firebaseUser?.displayName || 'Viewer';
    const authorHandle = activeAccount?.handle || '@viewer';
    const authorAvatar =
      activeAccount?.avatarUrl || firebaseUser?.photoURL || buildInitialAvatarSvg(authorName);
    const commentId = `cmt-${Date.now()}`;

    const newComment: CommentItem = {
      id: commentId,
      authorUid: firebaseUser?.uid || '',
      author: authorName,
      handle: authorHandle,
      authorAvatar,
      text: trimmed,
      timeAgo: 'Just now',
      likes: 0,
      isLiked: false,
    };

    setLocalState((prev) => ({
      ...prev,
      videos: prev.videos.map((v) =>
        v.id === videoId ? { ...v, comments: [newComment, ...v.comments] } : v
      ),
    }));

    if (firebaseUser && (publicVideos.some((v) => v.id === videoId) || ownedVideos.some((v) => v.id === videoId))) {
      const path = `videos/${videoId}/comments/${commentId}`;
      void (async () => {
        try {
          const safeAvatar = await compactMediaDataUrl(authorAvatar, 160, 100000);
          await setDoc(doc(db, 'videos', videoId, 'comments', commentId), {
            id: commentId,
            videoId,
            authorUid: firebaseUser.uid,
            author: authorName.slice(0, 100),
            handle: (authorHandle.length >= 2 ? authorHandle : '@viewer').slice(0, 60),
            authorAvatar: safeAvatar,
            text: trimmed,
            likes: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.CREATE, path);
          } catch (wrapped) {
            setFatalError(wrapped as Error);
          }
        }
      })();
    }
  };

  const toggleCommentLike = (videoId: string, commentId: string) => {
    const targetVideo = state.videos.find((v) => v.id === videoId);
    const targetComment = targetVideo?.comments.find((c) => c.id === commentId);
    const nextLiked = !(targetComment?.isLiked ?? false);
    const nextLikes = Math.max(0, (targetComment?.likes ?? 0) + (nextLiked ? 1 : -1));

    setLikedCommentIds((prev) => ({ ...prev, [commentId]: nextLiked }));
    setLocalState((prev) => ({
      ...prev,
      videos: prev.videos.map((v) => {
        if (v.id !== videoId) return v;
        return {
          ...v,
          comments: v.comments.map((c) =>
            c.id === commentId ? { ...c, isLiked: nextLiked, likes: nextLikes } : c
          ),
        };
      }),
    }));

    if (firebaseUser && (commentsByVideo[videoId] || []).some((c) => c.id === commentId)) {
      const path = `videos/${videoId}/comments/${commentId}`;
      updateDoc(doc(db, 'videos', videoId, 'comments', commentId), {
        likes: nextLikes,
        updatedAt: serverTimestamp(),
      }).catch((err) => {
        try {
          handleFirestoreError(err, OperationType.UPDATE, path);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      });
    }
  };

  const toggleSubscribe = (channelId: string) => {
    const target = state.channels.find((c) => c.id === channelId);
    if (!target) return;
    const nextSub = !target.isSubscribed;
    const nextSubsCount = Math.max(0, target.subscribersCount + (nextSub ? 1 : -1));

    setLocalState((prev) => ({
      ...prev,
      channels: prev.channels.map((ch) =>
        ch.id === channelId ? { ...ch, isSubscribed: nextSub, subscribersCount: nextSubsCount } : ch
      ),
    }));

    if (firebaseUser && userPrefsRef.current) {
      const nextSubIds = nextSub
        ? Array.from(new Set([channelId, ...userPrefsRef.current.subscribedChannelIds])).slice(0, 200)
        : userPrefsRef.current.subscribedChannelIds.filter((id) => id !== channelId);
      void persistUserPrefsUpdate({ subscribedChannelIds: nextSubIds }).catch((e) =>
        setFatalError(e)
      );

      if (remoteChannels.some((c) => c.id === channelId)) {
        const path = `channels/${channelId}`;
        updateDoc(doc(db, 'channels', channelId), {
          subscribersCount: nextSubsCount,
          updatedAt: serverTimestamp(),
        }).catch((err) => {
          try {
            handleFirestoreError(err, OperationType.UPDATE, path);
          } catch (wrapped) {
            setFatalError(wrapped as Error);
          }
        });
      }
    }
  };

  const createAccount = async (payload: {
    ownerName: string;
    email: string;
    password?: string;
    channelName: string;
    handle: string;
    channelDescription?: string;
    avatarUrl?: string;
  }): Promise<AccountProfile | null> => {
    let currentUser = firebaseUser || auth.currentUser;
    if (!currentUser) {
      currentUser = await signInWithGoogle();
      if (!currentUser) return null;
    }

    const cleanName = (payload.channelName.trim() || payload.ownerName.trim() || 'My Channel').slice(
      0,
      100
    );
    const rawHandle = payload.handle.trim().replace(/\s+/g, '');
    const cleanHandle = (
      rawHandle.startsWith('@') ? rawHandle : `@${rawHandle || 'mychannel'}`
    ).slice(0, 60);
    const rawAvatar =
      payload.avatarUrl || currentUser.photoURL || buildInitialAvatarSvg(cleanName);
    const safeAvatar = (await compactMediaDataUrl(rawAvatar, 256, 150000)) || buildInitialAvatarSvg(cleanName);

    const channelId = `ch-${Date.now()}`;
    const accountId = `fb-${channelId}`;

    const newChannel: Channel = {
      id: channelId,
      ownerUid: currentUser.uid,
      name: cleanName,
      handle: cleanHandle,
      subscribersCount: 0,
      videosCount: 0,
      description: (
        payload.channelDescription?.trim() || `Welcome to ${cleanName}!`
      ).slice(0, 1000),
      avatarUrl: safeAvatar,
      bannerGradient: 'from-red-700 via-zinc-900 to-zinc-950',
      bannerTitle: cleanName,
      bannerSubtitle: cleanHandle,
      isSubscribed: false,
      isVerified: false,
      communityEnabled: true,
      subscriptionsPrivate: true,
    };

    const newAccount: AccountProfile = {
      id: accountId,
      ownerName: (payload.ownerName.trim() || currentUser.displayName || cleanName).slice(0, 100),
      email: (currentUser.email || payload.email.trim().toLowerCase() || 'user@gmail.com').slice(
        0,
        200
      ),
      channelId,
      channelName: cleanName,
      handle: cleanHandle,
      subscribersCount: 0,
      avatarUrl: safeAvatar,
      isPrimary: true,
    };

    const channelPath = `channels/${channelId}`;
    try {
      await setDoc(doc(db, 'channels', channelId), {
        id: channelId,
        ownerUid: currentUser.uid,
        name: newChannel.name,
        handle: newChannel.handle,
        description: newChannel.description,
        avatarUrl: newChannel.avatarUrl,
        subscribersCount: 0,
        videosCount: 0,
        bannerGradient: newChannel.bannerGradient,
        bannerTitle: newChannel.bannerTitle,
        bannerSubtitle: newChannel.bannerSubtitle,
        isPublic: true,
        isVerified: false,
        communityEnabled: true,
        subscriptionsPrivate: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.CREATE, channelPath);
      } catch (wrapped) {
        setFatalError(wrapped as Error);
      }
      return null;
    }

    const userPath = `users/${currentUser.uid}`;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          ownerName: newAccount.ownerName,
          channelId,
          avatarUrl: safeAvatar,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(userRef, {
          uid: currentUser.uid,
          email: newAccount.email,
          ownerName: newAccount.ownerName,
          channelId,
          avatarUrl: safeAvatar,
          likedVideoIds: [],
          dislikedVideoIds: [],
          watchLaterIds: [],
          subscribedChannelIds: [],
          watchHistoryIds: [],
          watchHistoryTimestamps: {},
          searchQueries: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, userPath);
      } catch (wrapped) {
        setFatalError(wrapped as Error);
      }
      return null;
    }

    setLocalState((prev) => ({
      ...prev,
      activeAccountId: accountId,
      incognitoMode: false,
    }));

    return newAccount;
  };

  const signOutAccount = () => {
    setLocalState((prev) => ({
      ...prev,
      activeAccountId: null,
      incognitoMode: false,
    }));
    void signOut(auth).catch(() => {});
  };

  const publishVideo = (payload: {
    type: 'video' | 'short';
    title: string;
    description: string;
    visibility: 'Public' | 'Unlisted' | 'Private';
    category: string;
    tags: string[];
    thumbnailUrl: string;
    videoUrl?: string;
    duration: string;
  }) => {
    if (!ownChannel) return null;
    const videoId = `vid-${Date.now()}`;
    const cleanTags = payload.tags
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 10);

    const newVid: VideoItem = {
      id: videoId,
      ownerUid: firebaseUser?.uid || ownChannel.ownerUid || '',
      type: payload.type,
      title: (payload.title.trim() || 'Untitled Creation').slice(0, 160),
      channelId: ownChannel.id,
      channelName: ownChannel.name,
      channelHandle: ownChannel.handle,
      channelAvatar: ownChannel.avatarUrl,
      thumbnailUrl: payload.thumbnailUrl,
      videoUrl: payload.videoUrl,
      accentGradient: 'from-red-700/40 via-zinc-900 to-black',
      duration: (payload.duration || '1:00').slice(0, 20),
      viewsCount: 0,
      viewsLabel: '0',
      likesCount: 0,
      dislikesCount: 0,
      publishedAgo: 'Just now',
      category: (payload.category || 'General').slice(0, 50),
      description: (payload.description || '').slice(0, 2000),
      tags: cleanTags,
      visibility: payload.visibility,
      comments: [],
    };

    if (payload.videoUrl) {
      setLocalBlobUrls((prev) => ({ ...prev, [videoId]: payload.videoUrl! }));
    }

    if (firebaseUser) {
      const videoPath = `videos/${videoId}`;
      void (async () => {
        try {
          const safeThumb = await compactMediaDataUrl(payload.thumbnailUrl, 640, 220000);
          const safeChAvatar = await compactMediaDataUrl(ownChannel.avatarUrl, 160, 120000);
          await setDoc(doc(db, 'videos', videoId), {
            id: videoId,
            ownerUid: firebaseUser.uid,
            type: newVid.type,
            title: newVid.title,
            channelId: ownChannel.id,
            channelName: ownChannel.name.slice(0, 100),
            channelHandle: (ownChannel.handle.length >= 2 ? ownChannel.handle : '@channel').slice(
              0,
              60
            ),
            channelAvatar: safeChAvatar,
            thumbnailUrl: safeThumb,
            accentGradient: newVid.accentGradient,
            duration: newVid.duration,
            viewsCount: 0,
            viewsLabel: '0',
            likesCount: 0,
            dislikesCount: 0,
            publishedAgo: 'Just now',
            category: newVid.category,
            description: newVid.description,
            tags: cleanTags,
            visibility: newVid.visibility,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          if (remoteChannels.some((c) => c.id === ownChannel.id)) {
            await updateDoc(doc(db, 'channels', ownChannel.id), {
              videosCount: ownChannel.videosCount + 1,
              updatedAt: serverTimestamp(),
            });
          }
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.CREATE, videoPath);
          } catch (wrapped) {
            setFatalError(wrapped as Error);
          }
        }
      })();
    } else {
      setLocalState((prev) => ({
        ...prev,
        videos: [newVid, ...prev.videos],
        channels: prev.channels.map((ch) =>
          ch.id === ownChannel.id ? { ...ch, videosCount: ch.videosCount + 1 } : ch
        ),
      }));
    }

    return newVid;
  };

  const publishPost = (payload: {
    text: string;
    pollOptions?: string[];
    quizOptions?: { text: string; isCorrect: boolean }[];
    quizExplanation?: string;
  }) => {
    if (!ownChannel) return;
    const trimmedText = payload.text.trim().slice(0, 1500);
    if (!trimmedText) return;
    const postId = `post-${Date.now()}`;

    const pollOpts = payload.pollOptions
      ? payload.pollOptions
          .filter((p) => p.trim())
          .slice(0, 6)
          .map((p, idx) => ({ id: `po-${Date.now()}-${idx}`, text: p.trim(), votes: 0 }))
      : undefined;

    const quizOpts = payload.quizOptions
      ? payload.quizOptions
          .filter((q) => q.text.trim())
          .slice(0, 6)
          .map((q, idx) => ({
            id: `qz-${Date.now()}-${idx}`,
            text: q.text.trim(),
            isCorrect: q.isCorrect,
          }))
      : undefined;

    const newPost: CommunityPost = {
      id: postId,
      ownerUid: firebaseUser?.uid || ownChannel.ownerUid || '',
      channelId: ownChannel.id,
      channelName: ownChannel.name,
      channelAvatar: ownChannel.avatarUrl,
      timeAgo: 'Just now',
      status: 'Published',
      text: trimmedText,
      likesCount: 0,
      commentsCount: 0,
      pollOptions: pollOpts,
      quizOptions: quizOpts,
      quizExplanation: payload.quizExplanation,
    };

    if (firebaseUser) {
      const path = `posts/${postId}`;
      void (async () => {
        try {
          const safeAvatar = await compactMediaDataUrl(ownChannel.avatarUrl, 160, 120000);
          const docPayload: Record<string, unknown> = {
            id: postId,
            ownerUid: firebaseUser.uid,
            channelId: ownChannel.id,
            channelName: ownChannel.name.slice(0, 100),
            channelAvatar: safeAvatar,
            status: 'Published',
            text: trimmedText,
            likesCount: 0,
            commentsCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          if (pollOpts && pollOpts.length > 0) docPayload.pollOptions = pollOpts;
          if (quizOpts && quizOpts.length > 0) docPayload.quizOptions = quizOpts;
          if (payload.quizExplanation?.trim()) {
            docPayload.quizExplanation = payload.quizExplanation.trim().slice(0, 500);
          }
          await setDoc(doc(db, 'posts', postId), docPayload);
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.CREATE, path);
          } catch (wrapped) {
            setFatalError(wrapped as Error);
          }
        }
      })();
    } else {
      setLocalState((prev) => ({
        ...prev,
        posts: [newPost, ...prev.posts],
      }));
    }
  };

  const votePoll = (postId: string, optionId: string) => {
    const target = state.posts.find((p) => p.id === postId);
    if (!target || !target.pollOptions || target.votedOptionId) return;
    const updatedPollOptions = target.pollOptions.map((opt) =>
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );

    setLocalState((prev) => ({
      ...prev,
      posts: prev.posts.map((post) =>
        post.id === postId
          ? { ...post, votedOptionId: optionId, pollOptions: updatedPollOptions }
          : post
      ),
    }));

    if (firebaseUser && (publicPosts.some((p) => p.id === postId) || ownedPosts.some((p) => p.id === postId))) {
      updateDoc(doc(db, 'posts', postId), {
        pollOptions: updatedPollOptions,
        updatedAt: serverTimestamp(),
      }).catch((err) => {
        try {
          handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      });
    }
  };

  const answerQuiz = (postId: string, optionId: string) => {
    setLocalState((prev) => ({
      ...prev,
      posts: prev.posts.map((post) =>
        post.id !== postId ? post : { ...post, selectedQuizId: optionId }
      ),
    }));
  };

  const updateOwnChannel = (updates: Partial<Channel>) => {
    if (!ownChannel) return;

    setLocalState((prev) => ({
      ...prev,
      channels: prev.channels.map((ch) =>
        ch.id === ownChannel.id ? { ...ch, ...updates } : ch
      ),
      accounts: prev.accounts.map((acc) =>
        acc.channelId === ownChannel.id
          ? {
              ...acc,
              channelName: updates.name ?? acc.channelName,
              handle: updates.handle ?? acc.handle,
            }
          : acc
      ),
    }));

    if (firebaseUser && remoteChannels.some((c) => c.id === ownChannel.id)) {
      const allowedUpdates: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (updates.name !== undefined) allowedUpdates.name = updates.name.slice(0, 100);
      if (updates.handle !== undefined) allowedUpdates.handle = updates.handle.slice(0, 60);
      if (updates.description !== undefined) {
        allowedUpdates.description = updates.description.slice(0, 1000);
      }
      if (updates.communityEnabled !== undefined) {
        allowedUpdates.communityEnabled = updates.communityEnabled;
      }
      if (updates.subscriptionsPrivate !== undefined) {
        allowedUpdates.subscriptionsPrivate = updates.subscriptionsPrivate;
      }
      updateDoc(doc(db, 'channels', ownChannel.id), allowedUpdates).catch((err) => {
        try {
          handleFirestoreError(err, OperationType.UPDATE, `channels/${ownChannel.id}`);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      });
    }
  };

  const switchAccount = (accountId: string) => {
    const targetAcc = state.accounts.find((a) => a.id === accountId);
    setLocalState((prev) => ({
      ...prev,
      activeAccountId: accountId,
      incognitoMode: false,
    }));
    if (firebaseUser && targetAcc) {
      void persistUserPrefsUpdate({ channelId: targetAcc.channelId }).catch((e) =>
        setFatalError(e)
      );
    }
  };

  const toggleIncognito = () => {
    setLocalState((prev) => ({ ...prev, incognitoMode: !prev.incognitoMode }));
  };

  const addSearchQuery = (qStr: string) => {
    const trimmed = qStr.trim();
    if (!trimmed || !state.settings.saveSearchHistory || state.incognitoMode) return;
    setLocalState((prev) => ({
      ...prev,
      searchHistory: [
        { id: `shist-${Date.now()}`, query: trimmed },
        ...prev.searchHistory.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 15),
    }));

    if (firebaseUser && userPrefsRef.current) {
      const nextQueries = [
        trimmed,
        ...userPrefsRef.current.searchQueries.filter(
          (q) => q.toLowerCase() !== trimmed.toLowerCase()
        ),
      ].slice(0, 15);
      void persistUserPrefsUpdate({ searchQueries: nextQueries }).catch((e) => setFatalError(e));
    }
  };

  const removeSearchHistory = (id: string) => {
    const targetItem = state.searchHistory.find((s) => s.id === id);
    setLocalState((prev) => ({
      ...prev,
      searchHistory: prev.searchHistory.filter((item) => item.id !== id),
    }));

    if (firebaseUser && userPrefsRef.current && targetItem) {
      const nextQueries = userPrefsRef.current.searchQueries.filter(
        (q) => q !== targetItem.query
      );
      void persistUserPrefsUpdate({ searchQueries: nextQueries }).catch((e) => setFatalError(e));
    }
  };

  const removeFromWatchHistory = (videoId: string) => {
    setLocalState((prev) => {
      const nextTimestamps = { ...(prev.watchHistoryTimestamps || {}) };
      delete nextTimestamps[videoId];
      return {
        ...prev,
        watchHistoryIds: prev.watchHistoryIds.filter((id) => id !== videoId),
        watchHistoryTimestamps: nextTimestamps,
      };
    });

    if (firebaseUser && userPrefsRef.current) {
      const nextIds = userPrefsRef.current.watchHistoryIds.filter((id) => id !== videoId);
      const nextTimestamps = { ...(userPrefsRef.current.watchHistoryTimestamps || {}) };
      delete nextTimestamps[videoId];
      void persistUserPrefsUpdate({
        watchHistoryIds: nextIds,
        watchHistoryTimestamps: pruneHistoryTimestamps(nextIds, nextTimestamps),
      }).catch((e) => setFatalError(e));
    }
  };

  const clearWatchHistory = () => {
    setLocalState((prev) => ({
      ...prev,
      watchHistoryIds: [],
      watchHistoryTimestamps: {},
    }));

    if (firebaseUser) {
      void persistUserPrefsUpdate({
        watchHistoryIds: [],
        watchHistoryTimestamps: {},
      }).catch((e) => setFatalError(e));
    }
  };

  const markAllNotificationsRead = () => {
    setLocalState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, isUnread: false })),
    }));
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setLocalState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  };

  const updateAppBrand = (updates: Partial<AppBrand>) => {
    const nextBrand: AppBrand = {
      name: (updates.name ?? state.appBrand.name).slice(0, 80) || DEFAULT_BRAND_NAME,
      logoUrl: updates.logoUrl !== undefined ? updates.logoUrl : state.appBrand.logoUrl,
    };

    setLocalState((prev) => ({
      ...prev,
      appBrand: nextBrand,
    }));

    if (firebaseUser && firebaseUser.email === ADMIN_EMAIL && firebaseUser.emailVerified) {
      void (async () => {
        try {
          const safeLogo = nextBrand.logoUrl
            ? await compactMediaDataUrl(nextBrand.logoUrl, 256, 150000)
            : '';
          await setDoc(doc(db, 'appConfig', 'brand'), {
            name: nextBrand.name,
            logoUrl: safeLogo,
            updatedByUid: firebaseUser.uid,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.WRITE, 'appConfig/brand');
          } catch (wrapped) {
            setFatalError(wrapped as Error);
          }
        }
      })();
    }
  };

  const verifyAdminPassword = (input: string) => {
    return input === localState.adminPasswordHash;
  };

  const changeAdminPassword = (newPassword: string) => {
    if (newPassword.trim().length < 8) return;
    setLocalState((prev) => ({ ...prev, adminPasswordHash: newPassword.trim() }));
  };

  const adminAddVideo = (
    video: Omit<VideoItem, 'id' | 'comments'> & { customChannelName?: string }
  ) => {
    const videoId = `adm-vid-${Date.now()}`;
    const existingChannel = state.channels.find((c) => c.id === video.channelId);
    const fallbackName = (
      video.customChannelName?.trim() ||
      video.channelName ||
      state.appBrand.name ||
      'Official Channel'
    ).slice(0, 100);
    const fallbackHandle = `@${fallbackName.replace(/[^a-zA-Z0-9]/g, '') || 'official'}`.slice(
      0,
      60
    );
    const targetChannelId = existingChannel?.id || `ch-adm-${Date.now()}`;

    if (video.videoUrl) {
      setLocalBlobUrls((prev) => ({ ...prev, [videoId]: video.videoUrl! }));
    }

    if (firebaseUser) {
      void (async () => {
        try {
          const safeChAvatar = await compactMediaDataUrl(
            existingChannel?.avatarUrl || state.appBrand.logoUrl || IMG_AVATAR_SDB,
            160,
            120000
          );
          const safeThumb = await compactMediaDataUrl(video.thumbnailUrl, 640, 220000);

          if (!existingChannel) {
            await setDoc(doc(db, 'channels', targetChannelId), {
              id: targetChannelId,
              ownerUid: firebaseUser.uid,
              name: fallbackName,
              handle: fallbackHandle,
              description: `Official channel for ${fallbackName}.`,
              avatarUrl: safeChAvatar,
              subscribersCount: 0,
              videosCount: 1,
              bannerGradient: 'from-red-700 via-zinc-900 to-zinc-950',
              bannerTitle: fallbackName,
              bannerSubtitle: fallbackHandle,
              isPublic: true,
              isVerified: false,
              communityEnabled: true,
              subscriptionsPrivate: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else if (existingChannel.ownerUid === firebaseUser.uid || firebaseUser.email === ADMIN_EMAIL) {
            await updateDoc(doc(db, 'channels', existingChannel.id), {
              videosCount: existingChannel.videosCount + 1,
              updatedAt: serverTimestamp(),
            });
          }

          await setDoc(doc(db, 'videos', videoId), {
            id: videoId,
            ownerUid: firebaseUser.uid,
            type: video.type,
            title: video.title.slice(0, 160),
            channelId: targetChannelId,
            channelName: (existingChannel?.name || fallbackName).slice(0, 100),
            channelHandle: (existingChannel?.handle || fallbackHandle).slice(0, 60),
            channelAvatar: safeChAvatar,
            thumbnailUrl: safeThumb,
            accentGradient: video.accentGradient || 'from-red-700/40 via-zinc-900 to-black',
            duration: (video.duration || '1:00').slice(0, 20),
            viewsCount: 0,
            viewsLabel: '0',
            likesCount: 0,
            dislikesCount: 0,
            publishedAgo: 'Just now',
            category: (video.category || 'General').slice(0, 50),
            description: (video.description || '').slice(0, 2000),
            tags: (video.tags || []).slice(0, 10),
            visibility: video.visibility || 'Public',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          try {
            handleFirestoreError(err, OperationType.CREATE, `videos/${videoId}`);
          } catch (wrapped) {
            setFatalError(wrapped as Error);
          }
        }
      })();
      return;
    }

    setLocalState((prev) => {
      let targetChannel = prev.channels.find((c) => c.id === video.channelId);
      let nextChannels = prev.channels;

      if (!targetChannel) {
        targetChannel = {
          id: targetChannelId,
          name: fallbackName,
          handle: fallbackHandle,
          subscribersCount: 0,
          videosCount: 1,
          description: `Official channel for ${fallbackName}.`,
          avatarUrl: prev.appBrand.logoUrl || IMG_AVATAR_SDB,
          bannerGradient: 'from-red-700 via-zinc-900 to-zinc-950',
          bannerTitle: fallbackName,
          bannerSubtitle: fallbackHandle,
          isSubscribed: false,
          isVerified: true,
          communityEnabled: true,
          subscriptionsPrivate: false,
        };
        nextChannels = [targetChannel, ...prev.channels];
      } else {
        nextChannels = prev.channels.map((ch) =>
          ch.id === targetChannel!.id ? { ...ch, videosCount: ch.videosCount + 1 } : ch
        );
      }

      const item: VideoItem = {
        ...video,
        id: videoId,
        channelId: targetChannel.id,
        channelName: targetChannel.name,
        channelHandle: targetChannel.handle,
        channelAvatar: targetChannel.avatarUrl,
        comments: [],
      };

      return {
        ...prev,
        channels: nextChannels,
        videos: [item, ...prev.videos],
      };
    });
  };

  const adminUpdateVideo = (id: string, updates: Partial<VideoItem>) => {
    setLocalState((prev) => ({
      ...prev,
      videos: prev.videos.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    }));

    if (firebaseUser && (publicVideos.some((v) => v.id === id) || ownedVideos.some((v) => v.id === id))) {
      const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (updates.visibility !== undefined) payload.visibility = updates.visibility;
      if (updates.title !== undefined) payload.title = updates.title.slice(0, 160);
      updateDoc(doc(db, 'videos', id), payload).catch((err) => {
        try {
          handleFirestoreError(err, OperationType.UPDATE, `videos/${id}`);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      });
    }
  };

  const adminDeleteVideo = (id: string) => {
    setLocalState((prev) => ({
      ...prev,
      videos: prev.videos.filter((v) => v.id !== id),
    }));

    if (firebaseUser && (publicVideos.some((v) => v.id === id) || ownedVideos.some((v) => v.id === id))) {
      deleteDoc(doc(db, 'videos', id)).catch((err) => {
        try {
          handleFirestoreError(err, OperationType.DELETE, `videos/${id}`);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      });
    }
  };

  const adminUpdateChannel = (id: string, updates: Partial<Channel>) => {
    setLocalState((prev) => ({
      ...prev,
      channels: prev.channels.map((ch) => (ch.id === id ? { ...ch, ...updates } : ch)),
      accounts: prev.accounts.map((acc) =>
        acc.channelId === id
          ? {
              ...acc,
              subscribersCount: updates.subscribersCount ?? acc.subscribersCount,
              channelName: updates.name ?? acc.channelName,
            }
          : acc
      ),
    }));

    if (firebaseUser && firebaseUser.email === ADMIN_EMAIL && remoteChannels.some((c) => c.id === id)) {
      const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (updates.isVerified !== undefined) payload.isVerified = updates.isVerified;
      if (updates.subscribersCount !== undefined) {
        payload.subscribersCount = updates.subscribersCount;
      }
      updateDoc(doc(db, 'channels', id), payload).catch((err) => {
        try {
          handleFirestoreError(err, OperationType.UPDATE, `channels/${id}`);
        } catch (wrapped) {
          setFatalError(wrapped as Error);
        }
      });
    }
  };

  const adminBroadcastNotification = (payload: {
    title: string;
    channelName: string;
    type: NotificationItem['type'];
  }) => {
    const ch = state.channels.find((c) => c.name === payload.channelName) || ownChannel;
    const chName = ch?.name || payload.channelName || state.appBrand.name;
    const chAvatar = ch?.avatarUrl || state.appBrand.logoUrl || IMG_AVATAR_SDB;
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      section: 'Important',
      type: payload.type,
      channelName: chName,
      channelAvatar: chAvatar,
      title: payload.title,
      timeAgo: 'Just now',
      thumbnailUrl: chAvatar,
      isUnread: true,
    };
    setLocalState((prev) => ({
      ...prev,
      notifications: [notif, ...prev.notifications],
    }));
  };

  const adminDeleteNotification = (id: string) => {
    setLocalState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  };

  const adminResetAll = () => {
    const fresh = createInitialState();
    setLocalState(fresh);
  };

  return (
    <AppContext.Provider
      value={{
        state,
        firebaseUser,
        authReady,
        authError,
        clearAuthError,
        signInWithGoogle,
        activeAccount,
        ownChannel,
        unreadNotificationsCount,
        subscribeToVideoComments,
        recordWatch,
        toggleLikeVideo,
        toggleDislikeVideo,
        toggleWatchLater,
        toggleDownloadVideo,
        deleteAllDownloads,
        addComment,
        toggleCommentLike,
        toggleSubscribe,
        publishVideo,
        publishPost,
        votePoll,
        answerQuiz,
        createAccount,
        signOutAccount,
        updateOwnChannel,
        switchAccount,
        toggleIncognito,
        addSearchQuery,
        removeSearchHistory,
        removeFromWatchHistory,
        clearWatchHistory,
        markAllNotificationsRead,
        updateSettings,
        updateAppBrand,
        verifyAdminPassword,
        changeAdminPassword,
        adminAddVideo,
        adminUpdateVideo,
        adminDeleteVideo,
        adminUpdateChannel,
        adminBroadcastNotification,
        adminDeleteNotification,
        adminResetAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

export function formatCount(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(num);
}
