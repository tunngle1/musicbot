import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Track } from '../types';

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
}

const DB_NAME = 'tg-music-player-db';
const DB_VERSION = 1;

class StorageService {
    private dbPromise: Promise<IDBPDatabase<MusicDB>>;

    constructor() {
        this.dbPromise = openDB<MusicDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
                trackStore.createIndex('by-date', 'savedAt');
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
}

export const storage = new StorageService();
