import React, { useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Captions,
  ChevronRight,
  Clock,
  Download,
  Film,
  HelpCircle,
  History,
  Info,
  Languages,
  Lock,
  MessageSquare,
  Monitor,
  PlayCircle,
  Settings,
  Shield,
  Sliders,
  UserCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

type SettingPage =
  | 'root'
  | 'general'
  | 'family'
  | 'languages'
  | 'time'
  | 'notifications'
  | 'quality'
  | 'playback'
  | 'captions'
  | 'data-saving'
  | 'downloads'
  | 'live-chat'
  | 'accessibility';

export const SettingsView: React.FC<{
  onClose: () => void;
  onOpenAdmin: () => void;
}> = ({ onClose, onOpenAdmin }) => {
  const { state, updateSettings, deleteAllDownloads } = useApp();
  const s = state.settings;
  const [page, setPage] = useState<SettingPage>('root');
  const [showShortsLimitSheet, setShowShortsLimitSheet] = useState(false);

  const pageTitles: Record<SettingPage, string> = {
    root: 'Settings',
    general: 'General',
    family: 'Family Center',
    languages: 'Languages',
    time: 'Time management',
    notifications: 'Notifications',
    quality: 'Quality',
    playback: 'Playback',
    captions: 'Caption Preferences',
    'data-saving': 'Data saving',
    downloads: 'Downloads',
    'live-chat': 'Live chat',
    accessibility: 'Accessibility',
  };

  const ToggleRow: React.FC<{
    title: string;
    subtitle?: string;
    checked: boolean;
    onChange: (val: boolean) => void;
  }> = ({ title, subtitle, checked, onChange }) => (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {subtitle && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>
      <div
        className={`w-11 h-6 rounded-full p-0.5 shrink-0 transition-colors ${
          checked ? 'bg-blue-500' : 'bg-zinc-400 dark:bg-zinc-600'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </div>
    </button>
  );

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white dark:bg-[#0F0F0F] text-zinc-900 dark:text-white overflow-hidden">
      <header className="flex items-center gap-2 px-2.5 py-2 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <button
          onClick={() => (page === 'root' ? onClose() : setPage('root'))}
          aria-label="Back"
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-bold">{pageTitles[page]}</h2>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {page === 'root' && (
          <div className="py-2 space-y-4">
            <section>
              <p className="px-4 py-1.5 text-xs font-bold text-zinc-500">Account</p>
              {[
                { icon: Settings, label: 'General', target: 'general' as SettingPage },
                { icon: Users, label: 'Family Center', target: 'family' as SettingPage },
                { icon: Languages, label: 'Languages', target: 'languages' as SettingPage },
                { icon: Clock, label: 'Time management', target: 'time' as SettingPage },
                { icon: Bell, label: 'Notifications', target: 'notifications' as SettingPage },
              ].map((row) => (
                <button
                  key={row.label}
                  onClick={() => setPage(row.target)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-left"
                >
                  <row.icon className="w-5 h-5 text-zinc-500 shrink-0" />
                  <span className="text-sm font-medium flex-1">{row.label}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
              ))}
            </section>

            <section className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <p className="px-4 py-1.5 text-xs font-bold text-zinc-500">Video and audio preferences</p>
              {[
                { icon: Monitor, label: 'Quality', target: 'quality' as SettingPage },
                { icon: PlayCircle, label: 'Playback', target: 'playback' as SettingPage },
                { icon: Captions, label: 'Captions', target: 'captions' as SettingPage },
                { icon: Sliders, label: 'Data saving', target: 'data-saving' as SettingPage },
                { icon: Download, label: 'Downloads', target: 'downloads' as SettingPage },
                { icon: MessageSquare, label: 'Live chat', target: 'live-chat' as SettingPage },
                { icon: UserCheck, label: 'Accessibility', target: 'accessibility' as SettingPage },
              ].map((row) => (
                <button
                  key={row.label}
                  onClick={() => setPage(row.target)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-left"
                >
                  <row.icon className="w-5 h-5 text-zinc-500 shrink-0" />
                  <span className="text-sm font-medium flex-1">{row.label}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-400" />
                </button>
              ))}
            </section>

            <section className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <p className="px-4 py-1.5 text-xs font-bold text-zinc-500">Administration & Policy</p>
              <button
                onClick={onOpenAdmin}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 text-left text-red-500"
              >
                <Shield className="w-5 h-5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Admin Panel</p>
                  <p className="text-xs text-zinc-500">Password-protected content & channel control</p>
                </div>
                <Lock className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4 px-4 py-3 text-zinc-500">
                <HelpCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm">Help & Terms of Service</span>
              </div>
              <div className="flex items-center gap-4 px-4 py-3 text-zinc-500">
                <Info className="w-5 h-5 shrink-0" />
                <span className="text-sm">About {state.appBrand.name}</span>
              </div>
            </section>
          </div>
        )}

        {page === 'general' && (
          <div className="py-2 divide-y divide-zinc-200 dark:divide-zinc-800/60">
            <button
              onClick={() =>
                updateSettings({ appearance: s.appearance === 'dark' ? 'light' : 'dark' })
              }
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <div>
                <p className="text-sm font-medium">Appearance</p>
                <p className="text-xs text-zinc-500 capitalize">{s.appearance} theme</p>
              </div>
              <span className="text-xs font-semibold text-blue-500">Switch</span>
            </button>

            <ToggleRow
              title="Rotate Shorts"
              subtitle="Enable landscape layout for Shorts when portrait lock is off"
              checked={s.rotateShorts}
              onChange={(v) => updateSettings({ rotateShorts: v })}
            />
            <ToggleRow
              title="Playback in feeds"
              subtitle="Choose whether videos play as you browse"
              checked={s.playbackInFeeds}
              onChange={(v) => updateSettings({ playbackInFeeds: v })}
            />
            <div className="px-4 py-3.5">
              <p className="text-sm font-medium">Voice search language</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.voiceSearchLanguage}</p>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-sm font-medium">Location</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.location}</p>
            </div>
            <ToggleRow
              title="Restricted Mode"
              subtitle="Helps hide potentially mature videos on this device"
              checked={s.restrictedMode}
              onChange={(v) => updateSettings({ restrictedMode: v })}
            />
            <ToggleRow
              title="Enable stats for nerds"
              checked={s.statsForNerds}
              onChange={(v) => updateSettings({ statsForNerds: v })}
            />
            <ToggleRow
              title="Earn badges"
              subtitle="Receive badges across all BasharTube apps"
              checked={s.earnBadges}
              onChange={(v) => updateSettings({ earnBadges: v })}
            />
          </div>
        )}

        {page === 'family' && (
          <div className="p-4 space-y-5">
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <h3 className="text-base font-bold">Manage what they watch</h3>
              <p className="text-xs text-zinc-500">
                Pick from three content settings to help your kids find age-appropriate videos.
              </p>
            </div>
            <div className="space-y-2.5">
              <p className="text-sm font-bold">Add family members</p>
              <button className="w-full h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-medium">
                Add a kid account
              </button>
              <button className="w-full h-11 rounded-full bg-zinc-100 dark:bg-zinc-800 text-sm font-medium">
                Invite a teen
              </button>
            </div>
          </div>
        )}

        {page === 'languages' && (
          <div className="p-4 space-y-4">
            <div>
              <p className="text-sm font-medium">App language</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.appLanguage}</p>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-sm font-medium">Preferred Languages</p>
                <p className="text-xs text-zinc-500 mt-0.5">{s.preferredLanguages.join(', ')}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        )}

        {page === 'time' && (
          <div className="p-4 space-y-5">
            <div>
              <p className="text-lg font-bold tabular-nums">2 hr 11 min daily average</p>
              <p className="text-xs text-zinc-500">↓ 46% from last week</p>
            </div>

            <div className="h-32 flex items-end gap-2.5 pt-4 pb-1 border-b border-zinc-200 dark:border-zinc-800">
              {[
                { day: 'Tue', h: 65 },
                { day: 'Wed', h: 72 },
                { day: 'Thu', h: 78 },
                { day: 'Fri', h: 95 },
                { day: 'Sat', h: 0 },
                { day: 'Sun', h: 0 },
                { day: 'Today', h: 0 },
              ].map((bar) => (
                <div key={bar.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    style={{ height: `${bar.h}%` }}
                    className="w-full rounded-t bg-blue-500"
                  />
                  <span className="text-[10px] text-zinc-500">{bar.day}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm tabular-nums">
              <div className="flex justify-between">
                <span>Today</span>
                <span className="text-zinc-500">0 min</span>
              </div>
              <div className="flex justify-between">
                <span>Last 7 days</span>
                <span className="text-zinc-500">15 hr 14 min</span>
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-1">
              <p className="text-sm font-bold px-1 mb-1">Reminders</p>
              <ToggleRow
                title="Remind me when it's bedtime"
                subtitle={s.bedtimeReminder ? '11:00 PM – 6:00 AM' : 'Off'}
                checked={s.bedtimeReminder}
                onChange={(v) => updateSettings({ bedtimeReminder: v })}
              />
              <ToggleRow
                title="Remind me to take a break"
                subtitle={s.breakReminder ? 'Every 60 minutes' : 'Off'}
                checked={s.breakReminder}
                onChange={(v) => updateSettings({ breakReminder: v })}
              />
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
              <p className="text-sm font-bold mb-2">Daily limits</p>
              <button
                onClick={() => setShowShortsLimitSheet(true)}
                className="w-full flex items-center justify-between py-2 text-left"
              >
                <div>
                  <p className="text-sm font-medium">Shorts feed limit</p>
                  <p className="text-xs text-zinc-500">
                    Current: {s.shortsFeedLimitMinutes} minutes
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>
        )}

        {page === 'notifications' && (
          <div className="py-2 space-y-1">
            <p className="px-4 py-2 text-xs font-bold text-zinc-500">Mobile notifications</p>
            <ToggleRow title="Scheduled digest" subtitle="Daily digest at 7:00 PM" checked={s.scheduledDigest} onChange={(v) => updateSettings({ scheduledDigest: v })} />
            <ToggleRow title="Subscriptions" subtitle="Activity from subscribed channels" checked={s.notifySubscriptions} onChange={(v) => updateSettings({ notifySubscriptions: v })} />
            <ToggleRow title="Recommended videos" checked={s.notifyRecommended} onChange={(v) => updateSettings({ notifyRecommended: v })} />
            <ToggleRow title="Recommended ways to create" checked={s.notifyCreateTrends} onChange={(v) => updateSettings({ notifyCreateTrends: v })} />
            <ToggleRow title="Activity on my channel" checked={s.notifyChannelActivity} onChange={(v) => updateSettings({ notifyChannelActivity: v })} />
            <ToggleRow title="Mentions" checked={s.notifyMentions} onChange={(v) => updateSettings({ notifyMentions: v })} />
            <ToggleRow title="Disable sounds & vibrations" checked={s.disableSoundsVibrations} onChange={(v) => updateSettings({ disableSoundsVibrations: v })} />
            <ToggleRow title="New badges" checked={s.notifyBadges} onChange={(v) => updateSettings({ notifyBadges: v })} />
          </div>
        )}

        {page === 'quality' && (
          <div className="p-4 space-y-5">
            <div>
              <p className="text-xs font-bold text-zinc-500 mb-2">Video quality on mobile networks</p>
              {(['auto', 'higher', 'saver'] as const).map((opt) => (
                <button
                  key={`mob-${opt}`}
                  onClick={() => updateSettings({ mobileQuality: opt })}
                  className="w-full flex items-center justify-between py-2.5 text-left"
                >
                  <span className="text-sm capitalize">
                    {opt === 'auto' ? 'Auto (recommended)' : opt === 'higher' ? 'Higher picture quality' : 'Data saver'}
                  </span>
                  <span className={`w-4 h-4 rounded-full border-2 ${s.mobileQuality === opt ? 'border-blue-500 bg-blue-500' : 'border-zinc-500'}`} />
                </button>
              ))}
            </div>
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <p className="text-xs font-bold text-zinc-500 mb-2">Video quality on Wi-Fi</p>
              {(['auto', 'higher', 'saver'] as const).map((opt) => (
                <button
                  key={`wifi-${opt}`}
                  onClick={() => updateSettings({ wifiQuality: opt })}
                  className="w-full flex items-center justify-between py-2.5 text-left"
                >
                  <span className="text-sm capitalize">
                    {opt === 'auto' ? 'Auto (recommended)' : opt === 'higher' ? 'Higher picture quality' : 'Data saver'}
                  </span>
                  <span className={`w-4 h-4 rounded-full border-2 ${s.wifiQuality === opt ? 'border-blue-500 bg-blue-500' : 'border-zinc-500'}`} />
                </button>
              ))}
            </div>
          </div>
        )}

        {page === 'playback' && (
          <div className="py-2">
            <ToggleRow title="Autoplay next video" subtitle="Suggested video automatically plays next" checked={s.autoplayNext} onChange={(v) => updateSettings({ autoplayNext: v })} />
            <button
              onClick={() => updateSettings({ doubleTapSeekSeconds: s.doubleTapSeekSeconds === 10 ? 5 : 10 })}
              className="w-full px-4 py-3.5 text-left"
            >
              <p className="text-sm font-medium">Double-tap to seek</p>
              <p className="text-xs text-zinc-500 mt-0.5 tabular-nums">{s.doubleTapSeekSeconds} seconds</p>
            </button>
            <ToggleRow title="Zoom to fill screen" checked={s.zoomToFill} onChange={(v) => updateSettings({ zoomToFill: v })} />
            <ToggleRow title="Picture-in-picture" checked={s.pictureInPicture} onChange={(v) => updateSettings({ pictureInPicture: v })} />
          </div>
        )}

        {page === 'captions' && (
          <div className="p-4 space-y-5">
            <div className="h-36 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-950 flex flex-col justify-end p-4 gap-1.5">
              <div className="w-3/4 h-3 rounded-full bg-zinc-800" />
              <div className="w-1/2 h-3 rounded-full bg-zinc-800" />
              {s.showCaptions && (
                <span className="inline-block self-start px-2 py-0.5 rounded bg-blue-900 text-yellow-300 text-xs font-medium mt-1">
                  বাংলা ক্যাপশন প্রিভিউ
                </span>
              )}
            </div>
            <div className="rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800">
              <ToggleRow title="Show captions" checked={s.showCaptions} onChange={(v) => updateSettings({ showCaptions: v })} />
              <div className="px-4 py-3 flex justify-between text-sm">
                <span>Caption size and style</span>
                <span className="text-xs text-zinc-500">{s.captionStyle}</span>
              </div>
              <div className="px-4 py-3 flex justify-between text-sm">
                <span>Language</span>
                <span className="text-xs text-zinc-500">{s.captionLanguage}</span>
              </div>
            </div>
          </div>
        )}

        {page === 'data-saving' && (
          <div className="py-2">
            <ToggleRow title="Data saving mode" subtitle="Automatically adjusts settings to save mobile data" checked={s.dataSavingMode} onChange={(v) => updateSettings({ dataSavingMode: v })} />
            <ToggleRow title="Reduce video quality" checked={s.reduceVideoQuality} onChange={(v) => updateSettings({ reduceVideoQuality: v })} />
            <ToggleRow title="Reduce download quality" checked={s.reduceDownloadQuality} onChange={(v) => updateSettings({ reduceDownloadQuality: v })} />
            <ToggleRow title="Only download over Wi-Fi" checked={s.wifiOnlyDownloads} onChange={(v) => updateSettings({ wifiOnlyDownloads: v })} />
            <ToggleRow title="Upload over Wi-Fi only" checked={s.wifiOnlyUploads} onChange={(v) => updateSettings({ wifiOnlyUploads: v })} />
            <ToggleRow title="Select quality for every video" checked={s.selectQualityEveryVideo} onChange={(v) => updateSettings({ selectQualityEveryVideo: v })} />
          </div>
        )}

        {page === 'downloads' && (
          <div className="p-4 space-y-4">
            <div>
              <p className="text-sm font-medium">Download quality</p>
              <p className="text-xs text-zinc-500">{s.downloadQuality}</p>
            </div>
            <ToggleRow title="Download over Wi-Fi only" checked={s.wifiOnlyDownloads} onChange={(v) => updateSettings({ wifiOnlyDownloads: v })} />
            <ToggleRow title="Recommend downloads" checked={s.recommendDownloads} onChange={(v) => updateSettings({ recommendDownloads: v })} />
            <button
              onClick={deleteAllDownloads}
              className="w-full py-2.5 text-left text-sm font-semibold text-red-500"
            >
              Delete all downloads
            </button>
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <p className="text-sm font-medium">Available storage</p>
              <div className="w-full h-2.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div className="w-[8%] h-full bg-blue-500" />
              </div>
              <div className="flex justify-between text-xs text-zinc-500 tabular-nums">
                <span>9.05 GB used</span>
                <span>106.6 GB free</span>
              </div>
            </div>
          </div>
        )}

        {page === 'live-chat' && (
          <div className="py-2">
            <ToggleRow title="Hold for review" subtitle="Potentially inappropriate messages will be held" checked={s.holdForReview} onChange={(v) => updateSettings({ holdForReview: v })} />
            <ToggleRow title="Top fans leaderboard" subtitle="Earn XP for engagement in live chat" checked={s.topFansLeaderboard} onChange={(v) => updateSettings({ topFansLeaderboard: v })} />
            <ToggleRow title="Watch time XP" checked={s.watchTimeXp} onChange={(v) => updateSettings({ watchTimeXp: v })} />
            <ToggleRow title="Super Chat celebrations" checked={s.superChatCelebrations} onChange={(v) => updateSettings({ superChatCelebrations: v })} />
          </div>
        )}

        {page === 'accessibility' && (
          <div className="py-2">
            <ToggleRow title="Accessibility player" subtitle="Display accessibility controls in the player" checked={s.accessibilityPlayer} onChange={(v) => updateSettings({ accessibilityPlayer: v })} />
            <div className="px-4 py-3.5">
              <p className="text-sm font-medium">Hide player controls</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.hidePlayerControls}</p>
            </div>
          </div>
        )}

      </div>

      {/* Shorts Feed Limit Modal */}
      {showShortsLimitSheet && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-end" onClick={() => setShowShortsLimitSheet(false)}>
          <div
            className="w-full bg-[#1C1C1E] text-white rounded-t-2xl p-4 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mb-2" />
            <h3 className="text-base font-bold mb-2">Shorts feed limit</h3>
            {[0, 15, 30, 45, 60, 120].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  updateSettings({ shortsFeedLimitMinutes: mins });
                  setShowShortsLimitSheet(false);
                }}
                className="w-full flex items-center gap-3 py-2.5 text-sm text-left"
              >
                <span
                  className={`w-4 h-4 rounded-full border-2 ${
                    s.shortsFeedLimitMinutes === mins ? 'border-blue-500 bg-blue-500' : 'border-zinc-500'
                  }`}
                />
                <span>{mins >= 60 ? `${mins / 60} hour${mins > 60 ? 's' : ''}` : `${mins} minutes`}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
