import React, { useState, useEffect } from 'react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { ViewState } from './types';
import BottomNav from './components/BottomNav';
import MiniPlayer from './components/MiniPlayer';
import FullPlayer from './components/FullPlayer';
import HomeView from './views/HomeView';
import PlaylistsView from './views/PlaylistsView';
import LibraryView from './views/LibraryView';
import { initTelegramWebApp } from './utils/telegram';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const { currentTrack, resetSearch } = usePlayer();

  const handleNavigate = (view: ViewState) => {
    if (view === ViewState.HOME && currentView === ViewState.HOME) {
      resetSearch();
    }
    setCurrentView(view);
  };

  // Инициализация Telegram WebApp
  useEffect(() => {
    initTelegramWebApp();
  }, []);

  const renderView = () => {
    switch (currentView) {
      case ViewState.HOME:
        return <HomeView />;
      case ViewState.PLAYLISTS:
        return <PlaylistsView />;
      case ViewState.LIBRARY:
        return <LibraryView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white pb-24 overflow-x-hidden">

      {/* Main Content Area */}
      <main className="w-full max-w-md mx-auto min-h-screen relative">
        {renderView()}
      </main>

      {/* Floating UI Elements */}
      <div className="fixed bottom-0 w-full max-w-md left-1/2 transform -translate-x-1/2 z-50">
        {!isFullPlayerOpen && currentTrack && (
          <MiniPlayer onExpand={() => setIsFullPlayerOpen(true)} />
        )}
        <BottomNav currentView={currentView} onNavigate={handleNavigate} />
      </div>

      {/* Full Screen Player Modal */}
      {isFullPlayerOpen && (
        <FullPlayer onCollapse={() => setIsFullPlayerOpen(false)} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <PlayerProvider>
      <AppContent />
    </PlayerProvider>
  );
};

export default App;