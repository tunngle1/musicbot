import React, { useRef, useEffect, useState } from 'react';
import { Upload, FileAudio, Music2, Trash2, Play } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Track } from '../types';
import { storage } from '../utils/storage';

const LibraryView: React.FC = () => {
  const { addTrack, playTrack, currentTrack, isPlaying, removeDownloadedTrack, togglePlay } = usePlayer();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [libraryTracks, setLibraryTracks] = useState<Track[]>([]);
  const [storageInfo, setStorageInfo] = useState<{
    usedMB: string;
    quotaMB: string;
    isPersisted: boolean;
  } | null>(null);

  useEffect(() => {
    loadLibraryTracks();
    loadStorageInfo();
  }, []);

  const loadLibraryTracks = async () => {
    const tracks = await storage.getAllTracks();
    // Сортируем: сначала новые
    setLibraryTracks(tracks.reverse());
  };

  const loadStorageInfo = async () => {
    try {
      let isPersisted = false;
      if (navigator.storage && navigator.storage.persisted) {
        isPersisted = await navigator.storage.persisted();
      }

      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usedMB = ((estimate.usage || 0) / 1024 / 1024).toFixed(2);
        const quotaMB = ((estimate.quota || 0) / 1024 / 1024).toFixed(2);

        setStorageInfo({ usedMB, quotaMB, isPersisted });
      }
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        // Создаем временный URL для локального файла
        const objectUrl = URL.createObjectURL(file);

        // Попытка извлечь метаданные (здесь упрощенно используем имя файла)
        const nameParts = file.name.replace(/\.[^/.]+$/, "").split('-');
        const artist = nameParts.length > 1 ? nameParts[0].trim() : 'Неизвестный исполнитель';
        const title = nameParts.length > 1 ? nameParts[1].trim() : nameParts[0].trim();

        const newTrack: Track = {
          id: `local_${Date.now()}_${Math.random()}`,
          title,
          artist,
          coverUrl: `https://picsum.photos/400/400?random=${Date.now()}`,
          audioUrl: objectUrl,
          duration: 0,
          isLocal: true
        };

        addTrack(newTrack);
        // Можно также сохранять загруженные файлы в storage, но пока оставим только в памяти
      });
    }
  };

  const handleDelete = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    if (confirm('Удалить этот трек из загрузок?')) {
      await removeDownloadedTrack(trackId);
      setLibraryTracks(prev => prev.filter(t => t.id !== trackId));
      // Reload storage info after deletion
      loadStorageInfo();
    }
  };

  return (
    <div className="px-4 py-8 space-y-6 animate-fade-in-up pb-24">
      <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
        Медиатека
      </h1>

      {/* Storage Info Card */}
      {storageInfo && (
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 rounded-xl p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Хранилище</h3>
              <p className="text-xs text-gray-400">
                Использовано: {storageInfo.usedMB} МБ / {storageInfo.quotaMB} МБ
              </p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${storageInfo.isPersisted
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
              }`}>
              {storageInfo.isPersisted ? '🔒 Защищено' : '⚠️ Не защищено'}
            </div>
          </div>
          {!storageInfo.isPersisted && (
            <p className="text-xs text-gray-500 mt-2">
              💡 Данные могут быть удалены при нехватке места. Не очищайте кэш Telegram вручную.
            </p>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-24 border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center bg-gray-900/30 hover:bg-gray-800/50 transition-colors cursor-pointer group"
      >
        <Upload size={24} className="text-gray-500 group-hover:text-blue-400 mb-2 transition-colors" />
        <span className="text-sm font-medium text-gray-400 group-hover:text-gray-300">Загрузить файл</span>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*"
          multiple
          className="hidden"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-200">
          <Music2 size={20} className="text-blue-500" />
          <span>Скачанные треки</span>
          <span className="text-xs text-gray-500 font-normal ml-2">({libraryTracks.length})</span>
        </h2>

        {libraryTracks.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm bg-white/5 rounded-2xl">
            <Music2 size={32} className="mx-auto mb-3 opacity-20" />
            <p>Здесь пока пусто.</p>
            <p className="text-xs mt-1">Скачивайте музыку, чтобы слушать её офлайн.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {libraryTracks.map(track => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => {
                    if (currentTrack?.id === track.id) {
                      togglePlay();
                    } else {
                      playTrack(track, libraryTracks);
                    }
                  }}
                  className={`flex items-center p-3 rounded-xl transition-all cursor-pointer ${isCurrent ? 'bg-white/10 border border-white/5' : 'bg-gray-800/30 border border-transparent hover:bg-gray-800/50'
                    }`}
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 mr-3">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(track.artist)}&size=200&background=random`;
                      }}
                    />
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center ${isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
                      {isCurrent && isPlaying ? (
                        <div className="flex space-x-[2px] items-end h-3">
                          <div className="w-[2px] bg-white animate-bounce h-2"></div>
                          <div className="w-[2px] bg-white animate-bounce h-3 delay-75"></div>
                          <div className="w-[2px] bg-white animate-bounce h-2 delay-150"></div>
                        </div>
                      ) : (
                        <Play size={16} fill="white" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium truncate ${isCurrent ? 'text-blue-400' : 'text-white'}`}>{track.title}</h4>
                    <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, track.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryView;