"""
Lyrics Service for fetching song lyrics from Genius API
"""

import lyricsgenius
import re
from typing import Optional


class LyricsService:
    def __init__(self, genius_token: str):
        """
        Initialize Genius API client
        
        Args:
            genius_token: Genius API access token
        """
        self.genius = lyricsgenius.Genius(
            genius_token,
            skip_non_songs=True,
            remove_section_headers=True,
            verbose=False,
            timeout=15
        )
    
    def get_lyrics(self, title: str, artist: str) -> Optional[str]:
        """
        Fetch lyrics for a song from Genius
        
        Args:
            title: Song title
            artist: Artist name
            
        Returns:
            Lyrics text or None if not found
        """
        try:
            print(f"Searching lyrics for: {artist} - {title}")
            
            # Search for the song
            song = self.genius.search_song(title, artist)
            
            if not song:
                print(f"Song not found: {artist} - {title}")
                return None
            
            # Get lyrics
            lyrics = song.lyrics
            
            if not lyrics:
                return None
            
            # Clean up lyrics
            lyrics = self._clean_lyrics(lyrics)
            
            print(f"Successfully fetched lyrics ({len(lyrics)} chars)")
            return lyrics
            
        except Exception as e:
            print(f"Error fetching lyrics: {e}")
            return None
    
    def _clean_lyrics(self, lyrics: str) -> str:
        """
        Clean up lyrics text by removing unnecessary elements
        
        Args:
            lyrics: Raw lyrics text
            
        Returns:
            Cleaned lyrics text
        """
        # Remove "X Lyrics" at the beginning
        lyrics = re.sub(r'^.*?Lyrics\n', '', lyrics, flags=re.IGNORECASE)
        
        # Remove "Embed" at the end
        lyrics = lyrics.replace('Embed', '').strip()
        
        # Remove extra whitespace
        lyrics = re.sub(r'\n{3,}', '\n\n', lyrics)
        
        # Remove numbers at the end (song ID)
        lyrics = re.sub(r'\d+$', '', lyrics).strip()
        
        return lyrics
