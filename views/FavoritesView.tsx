import React from 'react';
import { Play, Heart } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { hapticFeedback } from '../utils/telegram';

const FavoritesView: React.FC = () => {
    const { favorites, playTrack, toggleFavorite, currentTrack, isPlaying } = usePlayer();

    const handlePlay = (index: number) => {
        hapticFeedback.light();
        playTrack(favorites[index], favorites);
    };

    if (favorites.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
                <Heart size={64} className="text-gray-600 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Нет избранных треков</h2>
                <p className="text-gray-400">Добавьте треки в избранное, чтобы они появились здесь</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">Избранное</h2>

            <div className="space-y-2">
                {favorites.map((track, index) => (
                    <div
                        key={track.id}
                        className={`glass-panel p-4 rounded-xl flex items-center gap-4 transition-all hover:bg-white/10 ${currentTrack?.id === track.id ? 'ring-2 ring-blue-500' : ''
                            }`}
                    >
                        <div className="relative flex-shrink-0">
                            <img
                                src={track.coverUrl}
                                alt={track.title}
                                className="w-14 h-14 rounded-lg object-cover"
                            />
                            {currentTrack?.id === track.id && isPlaying && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold truncate">{track.title}</h3>
                            <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePlay(index)}
                                className="p-3 rounded-full glass-button text-white/80 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <Play size={20} fill="currentColor" />
                            </button>
                            <button
                                onClick={() => toggleFavorite(track)}
                                className="p-3 rounded-full glass-button text-red-500 hover:bg-white/10 transition-all"
                            >
                                <Heart size={20} fill="currentColor" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FavoritesView;
