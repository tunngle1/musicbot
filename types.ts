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

export enum ViewState {
  HOME = 'HOME',
  PLAYLISTS = 'PLAYLISTS',
  LIBRARY = 'LIBRARY',
  PLAYLIST_DETAILS = 'PLAYLIST_DETAILS'
}

export type RepeatMode = 'none' | 'all' | 'one';
