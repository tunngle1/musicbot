import React from 'react';
import { Play, Pause, Radio } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

interface MiniPlayerProps {
  onExpand: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ onExpand }) => {
  const { currentTrack, currentRadio, isRadioMode, isPlaying, togglePlay, duration, currentTime } = usePlayer();

  if (!currentTrack && !currentRadio) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="fixed bottom-16 left-2 right-2 mb-2 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 flex items-center shadow-2xl z-30"
      onClick={onExpand}
    >
      {/* Прогресс бар сверху - скрыт для радио */}
      {!isRadioMode && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gray-700 rounded-t-xl overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-300 ease-linear" style={{ width: `${progress}%` }}></div>
        </div>
      )}

      <img
        src={isRadioMode ? currentRadio?.image : currentTrack?.coverUrl}
        alt="Cover"
        className={`w-10 h-10 rounded-lg object-cover mr-3 ${isPlaying ? 'animate-spin-slow' : ''}`}
        style={{ animationDuration: '10s' }}
      />

      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-2">
          <h4 className="text-white text-sm font-semibold truncate">
            {isRadioMode ? currentRadio?.name : currentTrack?.title}
          </h4>
          {isRadioMode && (
            <span className="px-1.5 py-0.5 bg-red-500 rounded text-[8px] font-bold text-white flex items-center gap-1 flex-shrink-0">
              <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
              LIVE
            </span>
          )}
        </div>
        <p className="text-gray-400 text-xs truncate">
          {isRadioMode ? currentRadio?.genre : currentTrack?.artist}
        </p>
      </div>

      <button
        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          togglePlay();
        }}
      >
        {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-1" />}
      </button>
    </div>
  );
};

export default MiniPlayer;