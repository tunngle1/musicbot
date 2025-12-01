"""
Lyrics Service for fetching song lyrics from Genius API
"""

import requests
from bs4 import BeautifulSoup
import re
from typing import Optional


class LyricsService:
    def __init__(self, genius_token: str):
        """
        Initialize Genius API client
        
        Args:
            genius_token: Genius API access token
        """
        self.token = genius_token
        self.base_url = "https://api.genius.com"
        self.headers = {
            'Authorization': f'Bearer {self.token}',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    def get_lyrics(self, title: str, artist: str) -> Optional[str]:
        """
        Fetch lyrics for a song from Genius, fallback to Lyrics.ovh, then Text-You.ru
        """
        # 1. Try Genius
        lyrics = self._get_from_genius(title, artist)
        if lyrics:
            return lyrics
            
        # 2. Fallback to Lyrics.ovh
        lyrics = self._get_from_lyrics_ovh(title, artist)
        if lyrics:
            return lyrics

        # 3. Fallback to Browser Search (Universal)
        return self._search_via_browser(title, artist)

    def _search_via_browser(self, title: str, artist: str) -> Optional[str]:
        """
        Universal fallback: Search via DuckDuckGo and scrape the first result
        """
        try:
            print(f"🌍 Searching via browser for: {artist} - {title}")
            
            # 1. Search DuckDuckGo
            # We use html.duckduckgo.com which is lighter and easier to scrape
            query = f"{artist} {title} текст песни lyrics"
            search_url = "https://html.duckduckgo.com/html/"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://html.duckduckgo.com/'
            }
            
            response = requests.post(search_url, data={'q': query}, headers=headers, timeout=10)
            if response.status_code != 200:
                return None
                
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find first result link (excluding ads)
            # DDG HTML results are in div.result -> a.result__a
            results = soup.select('a.result__a')
            if not results:
                print("No results in search")
                return None
                
            # Skip YouTube links as they don't have lyrics text usually
            target_url = None
            for link in results:
                href = link.get('href')
                if 'youtube.com' not in href and 'youtu.be' not in href:
                    target_url = href
                    break
            
            if not target_url:
                return None
                
            print(f"   Found source: {target_url}")
            
            # 2. Fetch the target page
            page_response = requests.get(target_url, headers=headers, timeout=10)
            if page_response.status_code != 200:
                return None
                
            page_soup = BeautifulSoup(page_response.text, 'html.parser')
            
            # 3. Smart extraction of lyrics
            # We look for the container with the most <br> tags or newlines
            
            # Remove scripts and styles
            for script in page_soup(["script", "style", "header", "footer", "nav", "iframe"]):
                script.decompose()
                
            # Strategy A: Look for common lyrics classes
            lyrics_div = page_soup.find('div', class_=re.compile(r'lyrics|text|content|words', re.I))
            
            # Strategy B: Find div with most text content that looks like lyrics (short lines)
            if not lyrics_div:
                candidates = page_soup.find_all(['div', 'article', 'pre'])
                best_candidate = None
                max_score = 0
                
                for cand in candidates:
                    text = cand.get_text('\n')
                    lines = [l.strip() for l in text.split('\n') if l.strip()]
                    if len(lines) < 5: continue
                    
                    # Score based on line length (lyrics usually have short lines)
                    short_lines = sum(1 for l in lines if len(l) < 60)
                    score = short_lines / len(lines)
                    
                    if len(lines) > 10 and score > 0.6:
                        if len(lines) > max_score:
                            max_score = len(lines)
                            best_candidate = cand
                
                lyrics_div = best_candidate

            if lyrics_div:
                text = lyrics_div.get_text(separator='\n', strip=True)
                # Basic cleanup
                text = re.sub(r'\n{3,}', '\n\n', text)
                return text[:4000] # Limit length
                
            return None
            
        except Exception as e:
            print(f"Error in browser search: {e}")
            return None

    def _get_from_lyrics_ovh(self, title: str, artist: str) -> Optional[str]:
        """
        Fetch lyrics from Lyrics.ovh (fallback)
        """
        try:
            print(f"Searching lyrics.ovh for: {artist} - {title}")
            # Clean up artist and title for better search
            clean_artist = re.sub(r'\(.*?\)', '', artist).strip()
            clean_title = re.sub(r'\(.*?\)', '', title).strip()
            
            # Helper to fetch with timeout
            def fetch(art, tit):
                url = f"https://api.lyrics.ovh/v1/{art}/{tit}"
                return requests.get(url, timeout=15)

            response = fetch(clean_artist, clean_title)
            
            # If failed and artist has comma (multiple artists), try first artist only
            if response.status_code != 200 and ',' in clean_artist:
                first_artist = clean_artist.split(',')[0].strip()
                print(f"   Retrying with first artist: {first_artist}")
                response = fetch(first_artist, clean_title)
            
            if response.status_code == 200:
                data = response.json()
                lyrics = data.get('lyrics')
                if lyrics:
                    print(f"✅ Found lyrics on lyrics.ovh")
                    return lyrics
            
            print(f"No lyrics found on lyrics.ovh")
            return None
        except Exception as e:
            print(f"Error fetching from lyrics.ovh: {e}")
            return None

    def _get_from_genius(self, title: str, artist: str) -> Optional[str]:
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
            
            # 1. Search for the song
            search_url = f"{self.base_url}/search"
            params = {'q': f"{title} {artist}"}
            
            response = requests.get(search_url, headers=self.headers, params=params, timeout=10)
            
            if response.status_code == 429:
                print(f"⚠️ Rate limit exceeded for Genius API. Please try again later.")
                print(f"   Tip: Genius API has request limits. Wait a few minutes or upgrade your API plan.")
                return None
            
            if response.status_code != 200:
                print(f"Search failed with status {response.status_code}")
                return None
            
            data = response.json()
            
            if not data.get('response') or not data['response'].get('hits'):
                print(f"No results found for: {artist} - {title}")
                return None
            
            # Get the first result
            song_info = data['response']['hits'][0]['result']
            song_url = song_info.get('url')
            
            if not song_url:
                print("No song URL found")
                return None
            
            print(f"Found song: {song_info.get('title')} by {song_info.get('primary_artist', {}).get('name')}")
            
            # 2. Scrape lyrics from the song page
            lyrics = self._scrape_lyrics(song_url)
            
            if lyrics:
                print(f"Successfully fetched lyrics ({len(lyrics)} chars)")
            else:
                print("Failed to scrape lyrics from page")
            
            return lyrics
            
        except Exception as e:
            print(f"Error fetching lyrics: {e}")
            return None

    
    def _scrape_lyrics(self, url: str) -> Optional[str]:
        """
        Scrape lyrics from Genius song page
        
        Args:
            url: Genius song page URL
            
        Returns:
            Lyrics text or None
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code != 200:
                return None
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find lyrics container (Genius uses different div classes)
            lyrics_divs = soup.find_all('div', {'data-lyrics-container': 'true'})
            
            if not lyrics_divs:
                # Try alternative selectors
                lyrics_divs = soup.find_all('div', class_=re.compile(r'Lyrics__Container'))
            
            if not lyrics_divs:
                return None
            
            # Extract text from all lyrics divs
            lyrics_parts = []
            for div in lyrics_divs:
                # Get text and preserve line breaks
                text = div.get_text(separator='\n', strip=True)
                lyrics_parts.append(text)
            
            lyrics = '\n\n'.join(lyrics_parts)
            
            # Clean up
            lyrics = self._clean_lyrics(lyrics)
            
            return lyrics if lyrics else None
            
        except Exception as e:
            print(f"Error scraping lyrics: {e}")
            return None
    
    def _clean_lyrics(self, lyrics: str) -> str:
        """
        Clean up lyrics text by removing unnecessary elements
        
        Args:
            lyrics: Raw lyrics text
            
        Returns:
            Cleaned lyrics text
        """
        # First check: if lyrics look like a playlist (many lines with " - " separator)
        lines_with_dash = sum(1 for line in lyrics.split('\n') if ' - ' in line and len(line) < 100)
        total_lines = len([l for l in lyrics.split('\n') if l.strip()])
        
        # If more than 30% of lines have " - " pattern, it's likely a playlist
        if total_lines > 20 and lines_with_dash / max(total_lines, 1) > 0.3:
            print("Detected playlist format, rejecting lyrics")
            return ""
        
        # Check for common playlist indicators
        playlist_keywords = ['playlist', 'tracklist', 'feel free to comment', 'must play', 'explicit']
        keyword_count = sum(1 for keyword in playlist_keywords if keyword.lower() in lyrics.lower())
        if keyword_count >= 2:
            print("Detected playlist keywords, rejecting lyrics")
            return ""
        
        lines = lyrics.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines (will be handled by join later)
            if not line:
                cleaned_lines.append("")
                continue
            
            # Filter out Genius metadata
            if re.match(r'^\d+\s*Contributors', line, re.IGNORECASE):
                continue
            if re.match(r'^Translations', line, re.IGNORECASE):
                continue
            
            # Filter out "Read More"
            if re.match(r'^Read More$', line, re.IGNORECASE):
                continue
            
            # Filter out track descriptions (multiple patterns)
            # Pattern 1: Starts with quote, contains "is the", "is a", "is about"
            if re.match(r'^[\""].*?[\""]?\s+is\s+(the|a|about)', line, re.IGNORECASE):
                continue
            # Pattern 2: Contains "…" (ellipsis) - often part of descriptions
            if '…' in line and len(line) > 100:
                continue
            # Pattern 3: Ends with ellipsis
            if line.endswith('…'):
                continue
                
            # Common languages headers and garbage
            garbage_lines = [
                'English', 'Russian', 'Español', 'Deutsch', 'Français', 'Italiano', 'Português',
                'Slovenčina', 'Ελληνικά', 'فارسی', 'Magyar', 'Türkçe', 'Русский (Russian)', 
                'Română', 'Polski', 'Українська', '日本語', '한국어',
                'العربية', 'Svenska', 'azərbaycan', 'עברית', 'हिन्दी', 'srpski',
                'Česky', 'Македонски', 'עברית (Hebrew)'
            ]
            if line in garbage_lines:
                continue

            # Filter out bracketed annotations (improved pattern)
            # Matches: [Verse 1], [Chorus], [Pont : version 1], [Couplet 1 : Tito Prince], etc.
            if re.match(r'^\[.+\]$', line):
                continue
                
            # "Song Title Lyrics" header
            if re.match(r'^.*? Lyrics$', line, re.IGNORECASE):
                continue
            # "Embed" at the end
            if re.match(r'^Embed$', line, re.IGNORECASE):
                continue
                
            cleaned_lines.append(line)
        
        # Rejoin lines
        lyrics = '\n'.join(cleaned_lines)
        
        # Remove extra whitespace (more than 2 newlines)
        lyrics = re.sub(r'\n{3,}', '\n\n', lyrics)
        
        return lyrics.strip()

