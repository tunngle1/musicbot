import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { addToHomeScreen, checkHomeScreenStatus, isTelegramWebApp } from '../utils/telegram';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const InstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isTelegram, setIsTelegram] = useState(false);

    useEffect(() => {
        // 1. Check for Telegram WebApp environment
        if (isTelegramWebApp()) {
            setIsTelegram(true);
            checkHomeScreenStatus((status) => {
                console.log("Telegram Home Screen Status:", status);
                if (status === 'missed' || status === 'unknown') {
                    setIsVisible(true);
                }
            });
            return;
        }

        // 2. Fallback to standard Browser PWA
        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        // Handle Telegram Install
        if (isTelegram) {
            addToHomeScreen();
            setIsVisible(false);
            return;
        }

        // Handle Browser Install
        if (!deferredPrompt) return;

        // Hide the app provided install promotion
        setIsVisible(false);
        // Show the install prompt
        await deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                        <Download size={20} />
                    </div>
                    <div>
                        <h3 className="font-medium text-white text-sm">Установить приложение</h3>
                        <p className="text-xs text-zinc-400">Для быстрого доступа</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
                    >
                        Установить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPrompt;
