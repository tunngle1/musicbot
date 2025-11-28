import React, { useState } from 'react';
import { ChevronDown, Play, Pause, SkipBack, SkipForward, Repeat, Repeat1, Download, Share2, Shuffle, FileText } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { formatTime } from '../utils/format';
import { getLyrics } from '../utils/api';
import LyricsModal from './LyricsModal';

interface FullPlayerProps {
  onCollapse: () => void;
}

const FullPlayer: React.FC<FullPlayerProps> = ({ onCollapse }) => {
  const {
    currentTrack,
    currentRadio,
    isRadioMode,
    isPlaying,
    togglePlay,
    nextTrack,
    prevTrack,
    currentTime,
    duration,
    seek,
    repeatMode,
    toggleRepeat,
    isShuffle,
    toggleShuffle,
    downloadTrack
  } = usePlayer();

  // Lyrics state
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);

  const handleShowLyrics = async () => {
    if (!currentTrack) return;

    setShowLyrics(true);
    setLyricsLoading(true);
    setLyricsError(null);

    try {
      const response = await getLyrics(currentTrack.id, currentTrack.title, currentTrack.artist);
      setLyrics(response.lyrics_text);
    } catch (error: any) {
      setLyricsError(error.message || 'Не удалось загрузить текст песни');
    } finally {
      setLyricsLoading(false);
    }
  };

  if (!currentTrack && !currentRadio) return null;

  const title = isRadioMode ? currentRadio?.name : currentTrack?.title;
  const subtitle = isRadioMode ? currentRadio?.genre : currentTrack?.artist;
  const coverUrl = isRadioMode ? currentRadio?.image : currentTrack?.coverUrl;

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    seek(Number(e.target.value));
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 z-50 flex flex-col items-center pt-safe pb-safe animate-fade-in">
      {/* Header */}
      <div className="w-full flex justify-between items-center px-6 py-6">
        <button onClick={onCollapse} className="text-white/80 hover:text-white">
          <ChevronDown size={32} />
        </button>
        <div className="text-xs font-medium tracking-widest text-gray-400 uppercase">Сейчас играет</div>
        <button className="text-white/80 hover:text-white" onClick={() => { }}>
          <Share2 size={24} />
        </button>
      </div>

      {/* Cover Art */}
      <div className="flex-1 flex items-center justify-center w-full px-8">
        <div className="relative w-full aspect-square max-w-sm rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/10">
          <img
            src={coverUrl}
            alt="Album Art"
            className={`w-full h-full object-cover transform transition-transform duration-700 hover:scale-105 ${isRadioMode && isPlaying ? 'animate-pulse-slow' : ''}`}
          />
          {isRadioMode && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-lg animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              LIVE
            </div>
          )}
        </div>
      </div>

      {/* Track Info & Controls */}
      <div className="w-full px-8 pb-12 flex flex-col space-y-6">

        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white truncate max-w-[250px]">{title}</h2>
            <p className="text-lg text-gray-400">{subtitle}</p>
          </div>
          {!isRadioMode && currentTrack && (
            <div className="flex gap-2">
              <button
                onClick={handleShowLyrics}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                title="Текст песни"
              >
                <FileText size={20} className="text-purple-400" />
              </button>
              <button
                onClick={() => downloadTrack(currentTrack)}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                title="Скачать"
              >
                <Download size={20} className="text-blue-400" />
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar - Hidden for Radio */}
        {!isRadioMode ? (
          <div className="w-full space-y-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%)`
              }}
            />
            <div className="flex justify-between text-xs font-medium text-gray-500">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        ) : (
          <div className="w-full py-4 flex items-center justify-center space-x-2">
            <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce"></div>
            <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce delay-100"></div>
            <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce delay-200"></div>
            <span className="text-red-500 font-medium text-sm">Прямой эфир</span>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-between items-center px-4">
          <button
            onClick={toggleRepeat}
            className={`transition-colors ${repeatMode !== 'none' ? 'text-blue-500' : 'text-gray-500'} ${isRadioMode ? 'opacity-0 pointer-events-none' : ''}`}
            disabled={isRadioMode}
          >
            {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
          </button>

          <div className="flex items-center space-x-6">
            <button
              onClick={prevTrack}
              className={`text-white hover:text-gray-300 transition-transform active:scale-95 ${isRadioMode ? 'opacity-30 pointer-events-none' : ''}`}
              disabled={isRadioMode}
            >
              <SkipBack size={32} fill="currentColor" />
            </button>

            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 hover:bg-blue-400 transition-all active:scale-95"
            >
              {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>

            <button
              onClick={nextTrack}
              className={`text-white hover:text-gray-300 transition-transform active:scale-95 ${isRadioMode ? 'opacity-30 pointer-events-none' : ''}`}
              disabled={isRadioMode}
            >
              <SkipForward size={32} fill="currentColor" />
            </button>
          </div>

          <button
            onClick={toggleShuffle}
            className={`transition-colors ${isShuffle ? 'text-blue-500' : 'text-gray-500'} ${isRadioMode ? 'opacity-0 pointer-events-none' : ''}`}
            disabled={isRadioMode}
          >
            <Shuffle size={20} />
          </button>
        </div>
      </div>

      {/* Lyrics Modal */}
      <LyricsModal
        isOpen={showLyrics}
        onClose={() => setShowLyrics(false)}
        title={currentTrack?.title || ''}
        artist={currentTrack?.artist || ''}
        lyrics={lyrics}
        isLoading={lyricsLoading}
        error={lyricsError}
      />
    </div>
  );
};

export default FullPlayer;