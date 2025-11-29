import React from 'react';
import { User } from '../types';

interface SubscriptionBadgeProps {
    user: User | null;
}

const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({ user }) => {
    if (!user?.subscription_status) return null;

    const { reason, days_left } = user.subscription_status;

    // Показываем только для пробного периода
    if (reason !== 'trial') return null;

    const getDaysWord = (days: number): string => {
        if (days === 1) return 'день';
        if (days >= 2 && days <= 4) return 'дня';
        return 'дней';
    };

    const isExpiringSoon = days_left !== undefined && days_left <= 1;

    return (
        <div className="mb-4 px-4">
            <div
                className={`
          rounded-2xl p-4 border
          ${isExpiringSoon
                        ? 'bg-red-500/10 border-red-500/20'
                        : 'bg-white/5 border-white/10'
                    }
          transition-all duration-300
          ${isExpiringSoon ? 'animate-pulse' : ''}
        `}
            >
                <div className="flex items-center justify-between">
                    <span className={`font-semibold ${isExpiringSoon ? 'text-red-300' : 'text-white/60'}`}>
                        🎁 Пробный период: {days_left} {getDaysWord(days_left || 0)}
                    </span>

                    {isExpiringSoon && (
                        <span className="text-xs text-red-400 font-medium">
                            ⚠️ Скоро истечет
                        </span>
                    )}
                </div>

                {days_left !== undefined && days_left > 1 && (
                    <p className="text-xs text-white/40 mt-2">
                        Оформите премиум-подписку для продолжения использования сервиса
                    </p>
                )}
            </div>
        </div>
    );
};

export default SubscriptionBadge;
