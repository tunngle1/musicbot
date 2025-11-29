export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  audioUrl: string;
  duration: number; // in seconds
  isLocal?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  coverUrl: string;
  trackIds: string[];
}

export interface RadioStation {
  id: string;
  name: string;
  genre: string;
  url: string;
  image: string;
}

export interface User {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_admin: boolean;
  is_premium: boolean;
}

export interface Lyrics {
  track_id: string;
  title: string;
  artist: string;
  lyrics_text: string;
  source: string;
}

export enum ViewState {
  HOME = 'home',
  PLAYLISTS = 'playlists',
  FAVORITES = 'favorites',
  LIBRARY = 'library',
  PLAYLIST_DETAILS = 'PLAYLIST_DETAILS',
  ADMIN = 'admin'
}

export type RepeatMode = 'none' | 'all' | 'one';
export type SearchMode = 'all' | 'artist' | 'track';
