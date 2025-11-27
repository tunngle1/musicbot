import React from 'react';
import { Play, Pause, X } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';

interface MiniPlayerProps {
  onExpand: () => void;
}

const MiniPlayer: React.FC<MiniPlayerProps> = ({ onExpand }) => {
  const { currentTrack, isPlaying, togglePlay, duration, currentTime } = usePlayer();

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div 
      className="fixed bottom-16 left-2 right-2 mb-2 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 flex items-center shadow-2xl z-30"
      onClick={onExpand}
    >
      {/* Прогресс бар сверху */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gray-700 rounded-t-xl overflow-hidden">
         <div className="h-full bg-blue-500 transition-all duration-300 ease-linear" style={{ width: `${progress}%` }}></div>
      </div>

      <img 
        src={currentTrack.coverUrl} 
        alt="Cover" 
        className={`w-10 h-10 rounded-lg object-cover mr-3 ${isPlaying ? 'animate-spin-slow' : ''}`} 
        style={{ animationDuration: '10s' }}
      />
      
      <div className="flex-1 min-w-0 pr-2">
        <h4 className="text-white text-sm font-semibold truncate">{currentTrack.title}</h4>
        <p className="text-gray-400 text-xs truncate">{currentTrack.artist}</p>
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