import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Disc,
  Flashlight,
  FlipHorizontal,
  Globe,
  Image as ImageIcon,
  Layers,
  Lock,
  Music,
  Plus,
  Radio,
  Sparkles,
  Sun,
  Trash2,
  UserPlus,
  Video,
  Wand2,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { IMG_FISHING, IMG_FOOD, IMG_NASHEED, IMG_NATOK, IMG_TECH } from '../data/seedData';
import { MediaThumb } from './MediaThumb';

type CreateMode = 'Video' | 'Short' | 'Live' | 'Post';
type SubScreen = 'main' | 'video-details' | 'ai-playground' | 'ai-video' | 'ai-music' | 'ai-avatar';

export const CreateFlowModal: React.FC<{
  onClose: () => void;
  onPublished: (type: 'video' | 'short' | 'post') => void;
  onRequestCreateAccount: () => void;
}> = ({ onClose, onPublished, onRequestCreateAccount }) => {
  const { ownChannel, publishVideo, publishPost } = useApp();
  const [mode, setMode] = useState<CreateMode>('Short');
  const [subScreen, setSubScreen] = useState<SubScreen>('main');

  // Short Recorder State
  const [durationSec, setDurationSec] = useState<'15s' | '60s'>('15s');
  const [speed, setSpeed] = useState<'0.5x' | '1x' | '2x'>('1x');
  const [recording, setRecording] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [greenScreen, setGreenScreen] = useState(false);
  const [selectedSound, setSelectedSound] = useState('Add sound');

  // Video Upload Details State
  const [selectedThumb, setSelectedThumb] = useState(IMG_TECH);
  const [videoFileUrl, setVideoFileUrl] = useState<string | undefined>(undefined);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'Public' | 'Unlisted' | 'Private'>('Public');
  const [category, setCategory] = useState('Tech');
  const [tagsInput, setTagsInput] = useState('#bangla #youtube');
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Post Creator State
  const [postType, setPostType] = useState<'text' | 'poll' | 'quiz'>('text');
  const [postText, setPostText] = useState('');
  const [pollOptions, setPollOptions] = useState(['Option 1', 'Option 2']);
  const [quizOptions, setQuizOptions] = useState([
    { text: 'Answer 1', isCorrect: true },
    { text: 'Answer 2', isCorrect: false },
  ]);
  const [quizExplanation, setQuizExplanation] = useState('');

  // AI Playground State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPercent, setAiPercent] = useState(0);
  const [aiTrackLyrics, setAiTrackLyrics] = useState(false);

  const handleStartAiGeneration = () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiPercent(12);
    const interval = setInterval(() => {
      setAiPercent((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setAiGenerating(false);
          publishVideo({
            type: 'short',
            title: aiPrompt.slice(0, 60),
            description: `Generated with AI Playground: ${aiPrompt}`,
            visibility: 'Public',
            category: 'AI Creation',
            tags: ['#shorts', '#aiplayground'],
            thumbnailUrl: IMG_TECH,
            duration: '0:15',
          });
          onPublished('short');
          return 100;
        }
        return p + 22;
      });
    }, 350);
  };

  const handleThumbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSelectedThumb(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVideoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFileName(file.name);
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
    if (file.size <= 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setVideoFileUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setVideoFileUrl(URL.createObjectURL(file));
    }
  };

  if (!ownChannel) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col bg-[#0F0F0F] text-white p-5">
        <div className="flex justify-start">
          <button
            onClick={onClose}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-4">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold">Create an account to upload</h2>
          <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
            No account exists yet. Create a new BasharTube account and channel first to upload videos, Shorts, or community posts.
          </p>
          <button
            onClick={() => {
              onClose();
              onRequestCreateAccount();
            }}
            className="w-full max-w-xs h-11 rounded-full bg-[#FF0000] hover:bg-red-600 text-white text-sm font-semibold transition-colors"
          >
            Create New Account
          </button>
        </div>
      </div>
    );
  }

  const handleUploadSubmit = () => {
    publishVideo({
      type: mode === 'Short' ? 'short' : 'video',
      title: title || 'New Upload',
      description,
      visibility,
      category,
      tags: tagsInput.split(' ').filter(Boolean),
      thumbnailUrl: selectedThumb,
      videoUrl: videoFileUrl,
      duration: mode === 'Short' ? '0:45' : '3:33',
    });
    onPublished(mode === 'Short' ? 'short' : 'video');
  };

  const handlePublishPost = () => {
    if (!postText.trim()) return;
    publishPost({
      text: postText,
      pollOptions: postType === 'poll' ? pollOptions : undefined,
      quizOptions: postType === 'quiz' ? quizOptions : undefined,
      quizExplanation: postType === 'quiz' ? quizExplanation : undefined,
    });
    onPublished('post');
  };

  if (subScreen === 'video-details') {
    return (
      <div className="absolute inset-0 z-50 flex flex-col bg-[#0F0F0F] text-white">
        <header className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <button onClick={() => setSubScreen('main')} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold">Add details</h2>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
            <MediaThumb src={selectedThumb} alt="Selected media" className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1.5">
              <div className="flex gap-1.5">
                {[IMG_TECH, IMG_NATOK, IMG_NASHEED, IMG_FISHING].map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedThumb(img)}
                    className={`w-8 h-8 rounded-md overflow-hidden border-2 ${
                      selectedThumb === img ? 'border-white' : 'border-transparent opacity-70'
                    }`}
                  >
                    <MediaThumb src={img} alt="Option" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <label className="px-2.5 py-1.5 rounded-lg bg-black/70 text-[11px] font-medium flex items-center gap-1 cursor-pointer">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Custom cover</span>
                <input type="file" accept="image/*" onChange={handleThumbUpload} className="hidden" />
              </label>
            </div>
          </div>

          <label className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between cursor-pointer hover:border-zinc-600">
            <span className="flex items-center gap-2 truncate">
              <Video className="w-4 h-4 text-red-500 shrink-0" />
              <span className="truncate">{videoFileName || 'Select video file from device (optional)'}</span>
            </span>
            <span className="text-blue-400 font-medium shrink-0 ml-2">Browse</span>
            <input type="file" accept="video/*" onChange={handleVideoFileUpload} className="hidden" />
          </label>

          <div className="flex items-center gap-3">
            <MediaThumb src={ownChannel.avatarUrl} alt={ownChannel.name} className="w-10 h-10 rounded-full object-cover bg-zinc-800" />
            <div>
              <p className="text-sm font-semibold">{ownChannel.name}</p>
              <p className="text-xs text-zinc-400">{ownChannel.handle}</p>
            </div>
          </div>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Create a title (type @ to mention a channel)"
            className="w-full bg-transparent border-b border-zinc-700 py-2.5 text-sm outline-none focus:border-white"
          />

          <div className="space-y-2 pt-1">
            <button
              onClick={() =>
                setVisibility((v) =>
                  v === 'Public' ? 'Unlisted' : v === 'Unlisted' ? 'Private' : 'Public'
                )
              }
              className="w-full flex items-center justify-between py-2.5 text-left"
            >
              <div className="flex items-center gap-3.5">
                {visibility === 'Public' ? <Globe className="w-5 h-5 text-zinc-300" /> : <Lock className="w-5 h-5 text-zinc-300" />}
                <div>
                  <p className="text-xs text-zinc-400">Visibility</p>
                  <p className="text-sm font-medium">{visibility}</p>
                </div>
              </div>
              <span className="text-xs text-blue-400">Tap to switch</span>
            </button>

            <div className="py-1">
              <label className="text-xs text-zinc-400 block mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your video..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs outline-none focus:border-zinc-600"
              />
            </div>

            <button
              onClick={() => setShowMoreOptions((s) => !s)}
              className="w-full py-2.5 rounded-full bg-zinc-800 text-xs font-semibold"
            >
              {showMoreOptions ? 'Show less' : 'Show more (Category, Tags, Audience)'}
            </button>

            {showMoreOptions && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs outline-none"
                  >
                    <option value="Tech">Tech</option>
                    <option value="Education">Education</option>
                    <option value="Islamic">Islamic</option>
                    <option value="Drama">Drama</option>
                    <option value="Entertainment">Entertainment</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">AI use, Tags</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={handleUploadSubmit}
            className="w-full h-11 rounded-full bg-white text-black font-semibold text-sm active:scale-[0.99] transition-transform"
          >
            {mode === 'Short' ? 'Upload Short' : 'Upload'}
          </button>
        </div>
      </div>
    );
  }

  if (subScreen === 'ai-playground' || subScreen === 'ai-video' || subScreen === 'ai-music' || subScreen === 'ai-avatar') {
    return (
      <div className="absolute inset-0 z-50 flex flex-col bg-[#0F0F0F] text-white">
        <header className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSubScreen(subScreen === 'ai-playground' ? 'main' : 'ai-playground')}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold">
              {subScreen === 'ai-playground'
                ? 'AI playground'
                : subScreen === 'ai-video'
                ? 'Create video'
                : subScreen === 'ai-music'
                ? 'Create a track'
                : 'Create an avatar'}
            </h2>
          </div>
        </header>

        {aiGenerating ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-52 h-80 rounded-2xl bg-gradient-to-br from-fuchsia-900 via-purple-900 to-zinc-900 border border-white/15 mb-6 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-fuchsia-300 animate-pulse" />
            </div>
            <p className="text-3xl font-bold tabular-nums">{aiPercent}%</p>
            <p className="text-xs text-zinc-400 mt-1">Getting started...</p>
            <button
              onClick={() => setAiGenerating(false)}
              className="mt-8 w-full max-w-xs h-11 rounded-full bg-zinc-800 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        ) : subScreen === 'ai-playground' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { icon: Video, label: 'Create video', target: 'ai-video' as SubScreen },
                { icon: UserPlus, label: 'Add avatar', target: 'ai-avatar' as SubScreen },
                { icon: Disc, label: 'Photo to vid...', target: 'ai-video' as SubScreen },
                { icon: Music, label: 'Create music', target: 'ai-music' as SubScreen },
              ].map((tool) => (
                <button
                  key={tool.label}
                  onClick={() => setSubScreen(tool.target)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="w-full aspect-square rounded-xl bg-zinc-800/90 flex items-center justify-center">
                    <tool.icon className="w-5 h-5 text-zinc-200" />
                  </div>
                  <span className="text-[11px] text-zinc-300 truncate w-full">{tool.label}</span>
                </button>
              ))}
            </div>

            <div>
              <h3 className="text-base font-bold mb-2.5">Get inspired</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { img: IMG_FISHING, author: '@villagefishingbd', stats: '530K views · 19K likes' },
                  { img: IMG_FOOD, author: '@CreativeAi-bd', stats: '1.2M views · 52K likes' },
                ].map((card, i) => (
                  <button
                    key={i}
                    onClick={() => setSubScreen('ai-video')}
                    className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 text-left"
                  >
                    <MediaThumb src={card.img} alt={card.author} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs font-semibold">{card.author}</p>
                      <p className="text-[10px] text-zinc-300">{card.stats}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : subScreen === 'ai-avatar' ? (
          <div className="flex-1 flex flex-col justify-between p-5 text-center">
            <div className="space-y-4 pt-4">
              <div className="w-40 h-56 mx-auto rounded-2xl overflow-hidden border-2 border-white/20 bg-zinc-900">
                <MediaThumb src={IMG_NATOK} alt="Avatar preview" className="w-full h-full object-cover" />
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded bg-white text-black text-[11px] font-bold">
                Experiment
              </span>
              <h3 className="text-xl font-bold leading-snug">
                Create an avatar that looks and sounds like you
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed text-left">
                Jump into any scene by recording your face and voice. You are in control of your avatar and can delete your recording anytime.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSubScreen('ai-playground')}
                className="h-11 rounded-full bg-zinc-800 text-sm font-medium"
              >
                No thanks
              </button>
              <button
                onClick={() => {
                  setAiPrompt('My AI Avatar Short');
                  setSubScreen('ai-video');
                }}
                className="h-11 rounded-full bg-zinc-700 text-sm font-semibold"
              >
                I agree
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between p-4">
            <div className="space-y-3">
              {subScreen === 'ai-video' ? (
                <>
                  <p className="text-xs text-zinc-400 text-center">
                    Only use photos of others with their permission
                  </p>
                  {[
                    'Make me film a pack with me vlog to travel to Mars',
                    'Make me a chef in a zero-gravity kitchen',
                    'Make me a pilot flying through a black hole',
                    'Make me a time traveler that ends up in ancient Rome',
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setAiPrompt(prompt)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-zinc-800/80 text-left text-xs hover:bg-zinc-800"
                    >
                      <Sparkles className="w-4 h-4 text-fuchsia-400 shrink-0" />
                      <span>{prompt}</span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <p className="text-sm text-zinc-400">Describe your track</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAiPrompt('breeze bossa nova song about sipping coconut')}
                      className="p-3 rounded-xl border border-zinc-700 text-xs text-left text-zinc-300"
                    >
                      breeze bossa nova song about sipping coconut...
                    </button>
                    <button
                      onClick={() => setAiPrompt('empty highway at midnight, nostalgic analog synth')}
                      className="p-3 rounded-xl border border-zinc-700 text-xs text-left text-zinc-300"
                    >
                      empty highway at midnight, nostalgic...
                    </button>
                  </div>
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <p className="text-sm font-medium">Lyrics</p>
                      <p className="text-xs text-zinc-400">Create a track with vocals</p>
                    </div>
                    <button
                      onClick={() => setAiTrackLyrics((l) => !l)}
                      className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                        aiTrackLyrics ? 'bg-blue-600' : 'bg-zinc-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          aiTrackLyrics ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe your idea"
                className="w-full bg-transparent text-sm outline-none"
              />
              <div className="flex items-center justify-between">
                <button className="px-3 py-1.5 rounded-full bg-zinc-800 text-xs font-medium flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add image
                </button>
                <button
                  onClick={handleStartAiGeneration}
                  disabled={!aiPrompt.trim()}
                  className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center disabled:opacity-40"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#0F0F0F] text-white">
      {/* Main Create Body */}
      {mode === 'Short' && (
        <div className="relative flex-1 bg-gradient-to-b from-zinc-700/40 via-zinc-900 to-black flex flex-col justify-between p-3">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <button onClick={onClose} className="min-h-[44px] min-w-[44px] rounded-full bg-black/40 flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() =>
                setSelectedSound((s) =>
                  s === 'Add sound' ? '♪ Bangla Nasheed Beat' : 'Add sound'
                )
              }
              className="px-4 py-2 rounded-full bg-black/50 text-xs font-semibold flex items-center gap-1.5"
            >
              <Music className="w-4 h-4" />
              <span>{selectedSound}</span>
            </button>
            <button
              onClick={() => setSubScreen('ai-playground')}
              aria-label="AI Playground"
              className="min-h-[44px] min-w-[44px] rounded-full bg-gradient-to-tr from-fuchsia-600 to-blue-600 flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>

          {/* Right Vertical Studio Tools (Matching Screenshot) */}
          <div className="self-end bg-black/45 backdrop-blur-md rounded-2xl p-1.5 flex flex-col items-center gap-2.5">
            <button onClick={() => setFlashOn((f) => !f)} className="p-2 flex flex-col items-center gap-0.5 text-[10px]">
              <FlipHorizontal className="w-4 h-4" />
              <span>Flip</span>
            </button>
            <button onClick={() => setDurationSec((d) => (d === '15s' ? '60s' : '15s'))} className="p-2 flex flex-col items-center gap-0.5 text-[10px]">
              <Clock className="w-4 h-4" />
              <span>{durationSec}</span>
            </button>
            <button onClick={() => setSpeed((s) => (s === '1x' ? '2x' : s === '2x' ? '0.5x' : '1x'))} className="p-2 flex flex-col items-center gap-0.5 text-[10px]">
              <span className="font-mono font-bold text-xs">{speed}</span>
              <span>Speed</span>
            </button>
            <button onClick={() => setGreenScreen((g) => !g)} className={`p-2 flex flex-col items-center gap-0.5 text-[10px] ${greenScreen ? 'text-emerald-400' : ''}`}>
              <Layers className="w-4 h-4" />
              <span>Green</span>
            </button>
            <button onClick={() => setFlashOn((f) => !f)} className={`p-2 flex flex-col items-center gap-0.5 text-[10px] ${flashOn ? 'text-amber-300' : ''}`}>
              <Flashlight className="w-4 h-4" />
              <span>Flash</span>
            </button>
          </div>

          {/* Bottom Capture Controls */}
          <div className="flex items-center justify-between px-4 pb-2">
            <button
              onClick={() => setSubScreen('video-details')}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/40">
                <MediaThumb src={IMG_TECH} alt="Gallery" className="w-full h-full object-cover" />
              </div>
              <span className="text-[11px] font-medium">Add</span>
            </button>

            <button
              onClick={() => {
                if (recording) {
                  setRecording(false);
                  setSubScreen('video-details');
                } else {
                  setRecording(true);
                }
              }}
              aria-label="Record Short"
              className="w-18 h-18 rounded-full border-4 border-white flex items-center justify-center"
            >
              <div
                className={`transition-all ${
                  recording ? 'w-7 h-7 rounded-md bg-red-600' : 'w-14 h-14 rounded-full bg-red-600'
                }`}
              />
            </button>

            <button
              onClick={() => setSubScreen('ai-playground')}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-fuchsia-400" />
              </div>
              <span className="text-[11px] font-medium">AI Studio</span>
            </button>
          </div>
        </div>
      )}

      {mode === 'Video' && (
        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-base font-bold">Upload from gallery</h2>
            </div>
            <button
              onClick={() => setSubScreen('video-details')}
              className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold"
            >
              Next
            </button>
          </header>
          <div className="grid grid-cols-3 gap-1 p-1 flex-1 overflow-y-auto content-start">
            {[
              { img: IMG_TECH, dur: '3:33' },
              { img: IMG_NATOK, dur: '7:24' },
              { img: IMG_NASHEED, dur: '4:17' },
              { img: IMG_FISHING, dur: '0:58' },
              { img: IMG_FOOD, dur: '0:39' },
              { img: IMG_TECH, dur: '1:01' },
            ].map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedThumb(item.img);
                  setSubScreen('video-details');
                }}
                className={`relative aspect-square bg-zinc-900 overflow-hidden ${
                  selectedThumb === item.img ? 'ring-2 ring-white' : ''
                }`}
              >
                <MediaThumb src={item.img} alt="Gallery clip" className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[10px] font-mono tabular-nums">
                  {item.dur}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'Live' && (
        <div className="flex-1 flex flex-col p-4">
          <div className="flex justify-start">
            <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>
          {ownChannel.subscribersCount < 50 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center mb-5">
                <Radio className="w-10 h-10 text-sky-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Almost there!</h2>
              <p className="text-sm text-zinc-400 max-w-xs leading-relaxed">
                Try creating more Shorts to reach 50 subscribers and unlock live streaming.
              </p>
              <p className="text-xs text-zinc-500 mt-2 tabular-nums">
                Current subscribers: {ownChannel.subscribersCount} / 50
              </p>
              <button
                onClick={() => setMode('Short')}
                className="mt-7 w-full max-w-xs h-11 rounded-full bg-white text-black font-semibold text-sm"
              >
                Create Shorts
              </button>
              <button
                onClick={() => setMode('Post')}
                className="mt-2.5 w-full max-w-xs h-11 rounded-full bg-zinc-800 text-white font-medium text-sm"
              >
                Create Community Post
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center text-red-500">
                <Radio className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold">Live Streaming Unlocked</h2>
              <p className="text-xs text-zinc-400">
                Your channel has {ownChannel.subscribersCount} subscribers. You can go live anytime!
              </p>
              <button
                onClick={() => {
                  publishVideo({
                    type: 'video',
                    title: `${ownChannel.name} Live Replay`,
                    description: 'Recorded live stream session.',
                    visibility: 'Public',
                    category: 'Live',
                    tags: ['#live'],
                    thumbnailUrl: IMG_TECH,
                    duration: '12:00',
                  });
                  onPublished('video');
                }}
                className="w-full max-w-xs h-11 rounded-full bg-red-600 text-white font-semibold text-sm"
              >
                Start Broadcast
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'Post' && (
        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-base font-bold">Create post</h2>
            </div>
            <button
              onClick={handlePublishPost}
              disabled={!postText.trim()}
              className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold disabled:opacity-40"
            >
              Post
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center gap-3">
              <MediaThumb src={ownChannel.avatarUrl} alt={ownChannel.name} className="w-10 h-10 rounded-full object-cover bg-zinc-800" />
              <div>
                <p className="text-sm font-semibold">{ownChannel.name}</p>
                <span className="text-xs text-zinc-400">Public</span>
              </div>
            </div>

            <div className="flex gap-2">
              {(['text', 'poll', 'quiz'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setPostType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                    postType === t ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder={
                postType === 'quiz'
                  ? 'Quiz your community...'
                  : postType === 'poll'
                  ? 'Ask your community...'
                  : 'Share a sneak peek of your next video...'
              }
              className="w-full bg-transparent text-sm outline-none resize-none"
            />

            {postType === 'poll' && (
              <div className="space-y-2">
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) =>
                        setPollOptions((prev) =>
                          prev.map((o, i) => (i === idx ? e.target.value : o))
                        )
                      }
                      className="flex-1 h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs outline-none"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        onClick={() => setPollOptions((p) => p.filter((_, i) => i !== idx))}
                        className="p-2 text-zinc-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setPollOptions((p) => [...p, `Option ${p.length + 1}`])}
                  className="w-full h-10 rounded-xl bg-zinc-800 text-xs font-medium flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add option
                </button>
              </div>
            )}

            {postType === 'quiz' && (
              <div className="space-y-2">
                {quizOptions.map((q, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-2 rounded-xl border ${
                      q.isCorrect ? 'border-emerald-500 bg-emerald-950/20' : 'border-zinc-700'
                    }`}
                  >
                    <button
                      onClick={() =>
                        setQuizOptions((prev) =>
                          prev.map((item, i) => ({ ...item, isCorrect: i === idx }))
                        )
                      }
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        q.isCorrect ? 'bg-emerald-500 text-black' : 'bg-zinc-700 text-white'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) =>
                        setQuizOptions((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, text: e.target.value } : item))
                        )
                      }
                      className="flex-1 bg-transparent text-xs outline-none"
                    />
                  </div>
                ))}
                <input
                  type="text"
                  value={quizExplanation}
                  onChange={(e) => setQuizExplanation(e.target.value)}
                  placeholder="Add an explanation (optional)"
                  className="w-full h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs outline-none"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Mode Switcher: Video | Short | Live | Post */}
      <div className="shrink-0 flex items-center justify-center gap-2 py-3 bg-black border-t border-zinc-800">
        {(['Video', 'Short', 'Live', 'Post'] as CreateMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              mode === m ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
};
