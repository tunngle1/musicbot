import React, { useState, useEffect } from 'react';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { NotificationProvider } from './context/NotificationContext';
import { ViewState } from './types';
import BottomNav from './components/BottomNav';
import MiniPlayer from './components/MiniPlayer';
import FullPlayer from './components/FullPlayer';
import SubscriptionBlocker from './components/SubscriptionBlocker';
import HomeView from './views/HomeView';
import PlaylistsView from './views/PlaylistsView';
import FavoritesView from './views/FavoritesView';
import RadioView from './views/RadioView';
import LibraryView from './views/LibraryView';
import AdminView from './views/AdminView';
import ReferralView from './views/ReferralView';
import { initTelegramWebApp } from './utils/telegram';
import { API_BASE_URL } from './constants';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const { currentTrack, resetSearch, user, refreshSubscriptionStatus } = usePlayer();

  const handleNavigate = (view: ViewState) => {
    if (view === ViewState.HOME && currentView === ViewState.HOME) {
      resetSearch();
    }
    setCurrentView(view);
  };

  // Проверка доступа
  const hasAccess = user?.subscription_status?.has_access ?? true;

  // Инициализация Telegram WebApp
  useEffect(() => {
    initTelegramWebApp();

    // Handle referral registration from start parameter
    const handleReferral = async () => {
      if (!user) return;

      const initData = window.Telegram?.WebApp?.initDataUnsafe;
      const startParam = (initData as any)?.start_param;

      if (startParam && startParam.startsWith('REF')) {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/referral/register?user_id=${user.id}&referral_code=${startParam}`,
            { method: 'POST' }
          );

          if (response.ok) {
            console.log('✅ Referral registered successfully');
            // Optionally show notification to user
          }
        } catch (error) {
          console.error('Failed to register referral:', error);
        }
      }
    };

    handleReferral();

    // Request persistent storage to prevent automatic cleanup
    const requestPersistentStorage = async () => {
      if (navigator.storage && navigator.storage.persist) {
        try {
          const isPersisted = await navigator.storage.persist();
          console.log(`🔒 Persistent storage: ${isPersisted ? 'GRANTED ✅' : 'DENIED ❌'}`);

          if (isPersisted) {
            console.log('✅ Downloaded tracks will be protected from automatic cleanup');
          } else {
            console.warn('⚠️ Storage may be cleared automatically. Download tracks at your own risk.');
          }
        } catch (error) {
          console.error('Error requesting persistent storage:', error);
        }
      }

      // Check if storage is already persisted
      if (navigator.storage && navigator.storage.persisted) {
        try {
          const isPersisted = await navigator.storage.persisted();
          console.log(`📦 Storage persistence status: ${isPersisted}`);
        } catch (error) {
          console.error('Error checking storage persistence:', error);
        }
      }

      // Log storage usage
      if (navigator.storage && navigator.storage.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          const usedMB = ((estimate.usage || 0) / 1024 / 1024).toFixed(2);
          const quotaMB = ((estimate.quota || 0) / 1024 / 1024).toFixed(2);
          console.log(`💾 Storage used: ${usedMB} MB / ${quotaMB} MB`);
        } catch (error) {
          console.error('Error estimating storage:', error);
        }
      }
    };

    requestPersistentStorage();
  }, [user]);

  // Prevent background scroll when player is open
  useEffect(() => {
    if (isFullPlayerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullPlayerOpen]);

  // Handle swipe down from top to close WebApp
  useEffect(() => {
    let touchStartY: number | null = null;

    const onTouchStart = (e: TouchEvent) => {
      // Only track if touch starts in top 50px
      if (e.touches[0].clientY < 50) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (touchStartY === null) return;

      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchEndY - touchStartY;

      // If swiped down more than 100px from top
      if (diffY > 100) {
        // Close WebApp
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.close();
        }
      }
      <AppContent />
      </NotificationProvider >
    </PlayerProvider >
  );
};

export default App;