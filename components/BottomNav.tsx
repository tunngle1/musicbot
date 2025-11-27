import React from 'react';
import { Home, Library, ListMusic } from 'lucide-react';
import { ViewState } from '../types';

interface BottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const getItemClass = (view: ViewState) => `flex flex-col items-center justify-center space-y-1 w-full h-full ${currentView === view ? 'text-blue-500' : 'text-gray-400 hover:text-white'} transition-colors`;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-black/90 backdrop-blur-md border-t border-white/10 flex justify-between items-center px-6 z-40 pb-safe">
      <button className={getItemClass(ViewState.HOME)} onClick={() => onNavigate(ViewState.HOME)}>
        <Home size={24} />
        <span className="text-[10px] font-medium">Главная</span>
      </button>
      <button className={getItemClass(ViewState.PLAYLISTS)} onClick={() => onNavigate(ViewState.PLAYLISTS)}>
        <ListMusic size={24} />
        <span className="text-[10px] font-medium">Плейлисты</span>
      </button>
      <button className={getItemClass(ViewState.LIBRARY)} onClick={() => onNavigate(ViewState.LIBRARY)}>
        <Library size={24} />
        <span className="text-[10px] font-medium">Медиатека</span>
      </button>
    </div>
  );
};

export default BottomNav;