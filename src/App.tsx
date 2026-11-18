import React, { useState } from 'react';
import { Plus, UserCircle2 } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { HomeSubTab, MainTab, VideoItem } from './types';
import { HomeFeedView } from './components/HomeFeedView';
import { ShortsView } from './components/ShortsView';
import { CreateFlowModal } from './components/CreateFlowModal';
import { CreateAccountModal } from './components/CreateAccountModal';
import { ChannelAndYouView } from './components/ChannelAndYouView';
import { SearchOverlay, NotificationsView } from './components/SearchAndNotifications';
import { SettingsView } from './components/SettingsView';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { AdminPanel } from './components/AdminPanel';
import { MediaThumb } from './components/MediaThumb';
import { ErrorBoundary } from './components/ErrorBoundary';
import { YouTubeHomeNavIcon, YouTubeShortsNavIcon } from './components/YouTubeIcons';

const MobileAppShell: React.FC = () => {
  const { state, activeAccount, recordWatch } = useApp();

  const [mode, setMode] = useState<'mobile' | 'admin'>('mobile');
  const [mainTab, setMainTab] = useState<MainTab>('home');
  const [homeSubTab, setHomeSubTab] = useState<HomeSubTab>('Home');

  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [activeShortId, setActiveShortId] = useState<string | null>(null);
  const [channelIdToView, setChannelIdToView] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handlePlayVideo = (video: VideoItem) => {
    recordWatch(video.id);
    if (video.type === 'short') {
      setActiveVideo(null);
      setActiveShortId(video.id);
      setMainTab('shorts');
    } else {
      setActiveVideo(video);
    }
    setShowSearch(false);
    setShowNotifications(false);
  };

  const handleOpenShort = (shortId: string) => {
    recordWatch(shortId);
    setActiveVideo(null);
    setActiveShortId(shortId);
    setMainTab('shorts');
    setShowSearch(false);
    setShowNotifications(false);
  };

  const handleOpenChannel = (channelId: string) => {
    setActiveVideo(null);
    setChannelIdToView(channelId);
    setMainTab('you');
  };

  const handlePlayVideoById = (videoId: string) => {
    const found = state.videos.find((v) => v.id === videoId);
    if (found) handlePlayVideo(found);
  };

  return (
    <div className="min-h-dvh w-full bg-[#07080A] text-white flex flex-col items-center justify-center p-[4px] sm:py-4 sm:px-4 overflow-x-hidden">
      {/* Strictly Mobile-Sized Frame with Rotating Multicolor Outer Border Around All Four Sides */}
      <div className="relative w-full max-w-[404px] h-[calc(100dvh-8px)] sm:h-[820px] sm:max-h-[90vh] p-[2px] rounded-[24px] sm:rounded-[36px]">
        {/* Soft Ambient Outer Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[2px] sm:-inset-[8px] rounded-[26px] sm:rounded-[44px] aurora-conic-bg opacity-45 sm:opacity-50 blur-[6px] sm:blur-[16px]"
        />
        {/* Crisp Rotating Edge Illumination Ring */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[24px] sm:rounded-[36px] aurora-conic-bg"
        />

        {/* Strictly Mobile-Sized Frame (No Android Status Bar!) */}
        <div className="relative z-10 w-full h-full bg-white dark:bg-[#0F0F0F] rounded-[22px] sm:rounded-[34px] shadow-2xl overflow-hidden flex flex-col ring-1 ring-white/10">
          {mode === 'admin' ? (
            <AdminPanel onBackToApp={() => setMode('mobile')} />
          ) : (
          <>
            {/* Active Tab Viewport */}
            {mainTab === 'home' && (
              <HomeFeedView
                subTab={homeSubTab}
                onChangeSubTab={setHomeSubTab}
                onOpenSearch={() => setShowSearch(true)}
                onOpenNotifications={() => setShowNotifications(true)}
                onPlayVideo={handlePlayVideo}
                onOpenShort={handleOpenShort}
                onOpenChannel={handleOpenChannel}
                onOpenAdmin={() => setMode('admin')}
                onOpenCreate={() => setShowCreate(true)}
              />
            )}

            {mainTab === 'shorts' && (
              <ShortsView
                initialShortId={activeShortId}
                onOpenSearch={() => setShowSearch(true)}
                onOpenChannel={handleOpenChannel}
                onOpenCreate={() => setShowCreate(true)}
                onRequestCreateAccount={() => setShowCreateAccount(true)}
              />
            )}

            {mainTab === 'you' && (
              <ChannelAndYouView
                initialChannelId={channelIdToView}
                onClearInitialChannel={() => setChannelIdToView(null)}
                onPlayVideo={handlePlayVideo}
                onOpenShort={handleOpenShort}
                onOpenSettings={() => setShowSettings(true)}
                onOpenSearch={() => setShowSearch(true)}
                onOpenAdmin={() => setMode('admin')}
                onRequestCreateAccount={() => setShowCreateAccount(true)}
              />
            )}

            {/* Fixed Bottom Navigation Bar */}
            <nav className="shrink-0 h-14 bg-white/95 dark:bg-[#0F0F0F]/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800/80 grid grid-cols-4 items-center px-2 z-30">
              <button
                onClick={() => {
                  setMainTab('home');
                  setChannelIdToView(null);
                }}
                className={`flex flex-col items-center justify-center min-h-[44px] gap-0.5 ${
                  mainTab === 'home'
                    ? 'text-zinc-900 dark:text-white'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <YouTubeHomeNavIcon active={mainTab === 'home'} className="w-[22px] h-[22px]" />
                <span className="text-[10px] font-medium">Home</span>
              </button>

              <button
                onClick={() => setMainTab('shorts')}
                className={`flex flex-col items-center justify-center min-h-[44px] gap-0.5 ${
                  mainTab === 'shorts'
                    ? 'text-zinc-900 dark:text-white'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <YouTubeShortsNavIcon active={mainTab === 'shorts'} className="w-[22px] h-[22px]" />
                <span className="text-[10px] font-medium">Shorts</span>
              </button>

              <button
                onClick={() => setShowCreate(true)}
                aria-label="Create"
                className="flex items-center justify-center min-h-[44px]"
              >
                <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-900 dark:text-white active:scale-95 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
              </button>

              <button
                onClick={() => {
                  setChannelIdToView(null);
                  setMainTab('you');
                }}
                className={`flex flex-col items-center justify-center min-h-[44px] gap-0.5 ${
                  mainTab === 'you'
                    ? 'text-zinc-900 dark:text-white'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full overflow-hidden border flex items-center justify-center ${
                    mainTab === 'you' ? 'border-zinc-900 dark:border-white' : 'border-transparent'
                  }`}
                >
                  {activeAccount ? (
                    <MediaThumb
                      src={activeAccount.avatarUrl}
                      alt={activeAccount.channelName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle2 className="w-6 h-6" />
                  )}
                </div>
                <span className="text-[10px] font-medium">You</span>
              </button>
            </nav>

            {/* Full-screen Modals inside Mobile Frame */}
            {activeVideo && (
              <VideoPlayerModal
                video={activeVideo}
                onClose={() => setActiveVideo(null)}
                onSelectVideo={handlePlayVideo}
                onOpenChannel={handleOpenChannel}
                onRequestCreateAccount={() => setShowCreateAccount(true)}
              />
            )}

            {showCreate && (
              <CreateFlowModal
                onClose={() => setShowCreate(false)}
                onRequestCreateAccount={() => setShowCreateAccount(true)}
                onPublished={(type) => {
                  setShowCreate(false);
                  if (type === 'short') setMainTab('shorts');
                  else if (type === 'post') setMainTab('you');
                  else setMainTab('home');
                }}
              />
            )}

            {showCreateAccount && (
              <CreateAccountModal onClose={() => setShowCreateAccount(false)} />
            )}

            {showSearch && (
              <SearchOverlay
                onClose={() => setShowSearch(false)}
                onPlayVideo={handlePlayVideo}
                onOpenShort={handleOpenShort}
              />
            )}

            {showNotifications && (
              <NotificationsView
                onClose={() => setShowNotifications(false)}
                onOpenSearch={() => {
                  setShowNotifications(false);
                  setShowSearch(true);
                }}
                onPlayVideoId={handlePlayVideoById}
              />
            )}

            {showSettings && (
              <SettingsView
                onClose={() => setShowSettings(false)}
                onOpenAdmin={() => {
                  setShowSettings(false);
                  setMode('admin');
                }}
              />
            )}

          </>
        )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MobileAppShell />
      </AppProvider>
    </ErrorBoundary>
  );
}
