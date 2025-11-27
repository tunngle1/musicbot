import React, { useState } from 'react';
import { Plus, Music, ChevronLeft, Play, Trash2, MoreVertical } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Playlist, Track } from '../types';

const PlaylistsView: React.FC = () => {
  const { playlists, createPlaylist, allTracks, playTrack, currentTrack, isPlaying, togglePlay } = usePlayer();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName, coverFile || undefined);
      setNewPlaylistName('');
      setCoverFile(null);
      setCoverPreview(null);
      setShowCreateModal(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const playPlaylist = (playlist: Playlist) => {
    const playlistTracks = allTracks.filter(t => playlist.trackIds.includes(t.id));
    if (playlistTracks.length > 0) {
      playTrack(playlistTracks[0], playlistTracks);
    }
  };

  const getPlaylistTracks = (playlist: Playlist) => {
    return allTracks.filter(t => playlist.trackIds.includes(t.id));
  };

  // Render Playlist Details View
  if (selectedPlaylist) {
    const tracks = getPlaylistTracks(selectedPlaylist);

    return (
      <div className="px-4 py-8 space-y-6 animate-fade-in-up pb-24">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedPlaylist(null)}
            className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold truncate flex-1">{selectedPlaylist.name}</h1>
        </div>

        {/* Cover & Info */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-2xl relative group">
            <img src={selectedPlaylist.coverUrl} alt={selectedPlaylist.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => playPlaylist(selectedPlaylist)}>
              <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center pl-1 shadow-lg hover:scale-105 transition-transform">
                <Play size={24} fill="white" />
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">{tracks.length} треков</p>
          </div>

          <button
            onClick={() => playPlaylist(selectedPlaylist)}
            className="px-8 py-3 bg-blue-600 rounded-full font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 transition-colors flex items-center space-x-2"
          >
            <Play size={18} fill="white" />
            <span>Слушать</span>
          </button>
        </div>

        {/* Add Tracks Hint */}
        <div className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between border border-white/5">
          <div className="text-sm text-gray-300">
            <p className="font-medium">Добавить треки</p>
            <p className="text-xs text-gray-500">Ищите музыку и нажимайте на три точки</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <MoreVertical size={16} className="text-gray-400" />
          </div>
        </div>

        {/* Track List */}
        <div className="space-y-2">
          {tracks.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              В этом плейлисте пока нет треков.
              <br />
              Добавьте их из поиска или медиатеки.
            </div>
          ) : (
            tracks.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div
                  key={`${track.id}-${index}`}
                  onClick={() => {
                    if (isCurrent) {
                      togglePlay();
                    } else {
                      playTrack(track, tracks);
                    }
                  }}
                  className={`flex items-center p-3 rounded-xl transition-all cursor-pointer ${isCurrent ? 'bg-white/10 border border-white/5' : 'bg-gray-800/30 border border-transparent hover:bg-gray-800/50'
                    }`}
                >
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 mr-3">
                    <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                    {isCurrent && isPlaying && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="flex space-x-[2px] items-end h-3">
                          <div className="w-[2px] bg-white animate-bounce h-2"></div>
                          <div className="w-[2px] bg-white animate-bounce h-3 delay-75"></div>
                          <div className="w-[2px] bg-white animate-bounce h-2 delay-150"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium truncate ${isCurrent ? 'text-blue-400' : 'text-white'}`}>{track.title}</h4>
                    <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                  </div>

                  <button className="p-2 text-gray-500 hover:text-white">
                    <MoreVertical size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Render Playlists Grid
  return (
    <div className="px-4 py-8 space-y-6 animate-fade-in-up pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Мои плейлисты</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-2 bg-blue-600 rounded-full hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus size={24} color="white" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="group relative bg-gray-900 rounded-2xl overflow-hidden border border-white/5 active:scale-95 transition-transform cursor-pointer"
            onClick={() => setSelectedPlaylist(playlist)}
          >
            <div className="aspect-square w-full relative">
              <img src={playlist.coverUrl} alt={playlist.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play size={20} className="ml-0.5" fill="white" />
                </div>
              </div>
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm text-white truncate">{playlist.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{playlist.trackIds.length} треков</p>
            </div>
          </div>
        ))}

        {/* Create New Card Placeholder */}
        <div
          onClick={() => setShowCreateModal(true)}
          className="aspect-[3/4] rounded-2xl border-2 border-dashed border-gray-700 flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-gray-500 transition-colors cursor-pointer bg-gray-900/30"
        >
          <Music size={32} className="mb-2 opacity-50" />
          <span className="text-xs font-medium">Создать новый</span>
        </div>
      </div>

      {/* Simple Modal for Creation */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 animate-fade-in">
          <div className="bg-gray-800 w-full max-w-sm p-6 rounded-2xl border border-white/10 shadow-2xl transform transition-all scale-100">
            <h3 className="text-lg font-bold mb-4">Новый плейлист</h3>

            {/* Cover Upload */}
            <div
              className="w-full aspect-square bg-gray-900 rounded-xl mb-4 border-2 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors overflow-hidden relative group"
              onClick={() => fileInputRef.current?.click()}
            >
              {coverPreview ? (
                <>
                  <img src={coverPreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-medium">Изменить</span>
                  </div>
                </>
              ) : (
                <>
                  <Music size={40} className="text-gray-600 mb-2" />
                  <span className="text-sm text-gray-500">Загрузить обложку</span>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <input
              autoFocus
              type="text"
              placeholder="Название плейлиста..."
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 mb-6"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCoverFile(null);
                  setCoverPreview(null);
                }}
                className="flex-1 py-3 bg-gray-700 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={!newPlaylistName.trim()}
                className="flex-1 py-3 bg-blue-600 rounded-lg font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaylistsView;