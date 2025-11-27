import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Track } from '../types';

import { Playlist } from '../types';

interface MusicDB extends DBSchema {
    tracks: {
        key: string;
        value: Track & {
            audioBlob: Blob;
            coverBlob?: Blob;
            savedAt: number;
        };
        indexes: { 'by-date': number };
    };
    playlists: {
        key: string;
        value: Playlist & {
            createdAt: number;
        };
        indexes: { 'by-date': number };
    };
}

const DB_NAME = 'tg-music-player-db';
const DB_VERSION = 3;

class StorageService {
    private dbPromise: Promise<IDBPDatabase<MusicDB>>;

    constructor() {
        this.dbPromise = openDB<MusicDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion, transaction) {
                console.log(`Upgrading DB from ${oldVersion} to ${newVersion}`);
                if (oldVersion < 1) {
                    const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
                    trackStore.createIndex('by-date', 'savedAt');
                }
                if (oldVersion < 2) {
                    const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
                    playlistStore.createIndex('by-date', 'createdAt');
                }
            },
            blocked(currentVersion, blockedVersion, event) {
                console.warn("DB Open Blocked: Another tab has the DB open", currentVersion, blockedVersion);
            },
            blocking(currentVersion, blockedVersion, event) {
                console.warn("DB Open Blocking: This tab is blocking a version upgrade", currentVersion, blockedVersion);
                // Закрываем соединение, чтобы дать возможность обновиться
                const db = (event.target as any).result;
                db.close();
            },
            terminated() {
                console.error("DB Connection Terminated Abruptly");
            },
        });
    }

    async saveTrack(track: Track, audioBlob: Blob, coverBlob?: Blob): Promise<void> {
        const db = await this.dbPromise;
        await db.put('tracks', {
            ...track,
            audioBlob,
            coverBlob,
            savedAt: Date.now(),
            isLocal: true
        });
    }

    async getTrack(id: string): Promise<(Track & { audioBlob: Blob; coverBlob?: Blob }) | undefined> {
        const db = await this.dbPromise;
        return db.get('tracks', id);
    }

    async getAllTracks(): Promise<Track[]> {
        const db = await this.dbPromise;
        const tracks = await db.getAllFromIndex('tracks', 'by-date');
        // Возвращаем треки без блобов для списка, чтобы не забивать память
        return tracks.map(({ audioBlob, coverBlob, ...track }) => ({
            ...track,
            isLocal: true
        }));
    }

    async deleteTrack(id: string): Promise<void> {
        const db = await this.dbPromise;
        await db.delete('tracks', id);
    }

    async isTrackDownloaded(id: string): Promise<boolean> {
        const db = await this.dbPromise;
        const key = await db.getKey('tracks', id);
        return !!key;
    }

    // Playlist methods

    async savePlaylist(playlist: Playlist): Promise<void> {
        const db = await this.dbPromise;
        // Проверяем, существует ли уже плейлист, чтобы сохранить дату создания
        const existing = await db.get('playlists', playlist.id);

        await db.put('playlists', {
            ...playlist,
            createdAt: existing ? existing.createdAt : Date.now()
        });
    }

    async getAllPlaylists(): Promise<Playlist[]> {
        const db = await this.dbPromise;
        const playlists = await db.getAllFromIndex('playlists', 'by-date');
        return playlists.map(({ createdAt, ...playlist }) => playlist);
    }

    async deletePlaylist(id: string): Promise<void> {
        const db = await this.dbPromise;
        await db.delete('playlists', id);
    }

    async updatePlaylist(playlist: Playlist): Promise<void> {
        await this.savePlaylist(playlist);
    }
}

export const storage = new StorageService();
