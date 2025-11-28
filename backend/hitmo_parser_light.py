import httpx
from bs4 import BeautifulSoup
import re
from typing import List, Dict, Optional
import urllib.parse

class HitmoParser:
    """
    Lightweight parser for Hitmo using httpx and BeautifulSoup.
    Suitable for Vercel/Serverless environments.
    """
    
    BASE_URL = "https://rus.hitmotop.com"
    SEARCH_URL = f"{BASE_URL}/search"
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': self.BASE_URL,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        }
        
    def search(self, query: str, limit: int = 20, page: int = 1) -> List[Dict]:
        """
        Search for tracks
        """
        try:
            params = {
                'q': query,
                'start': (page - 1) * 48 # Hitmo usually shows 48 tracks per page
            }
            
            with httpx.Client(headers=self.headers, timeout=10.0) as client:
                response = client.get(self.SEARCH_URL, params=params)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                tracks = []
                
                # Find all track blocks
                # Based on typical structure, tracks are usually in li.tracks__item or similar
                # We'll look for the specific structure we saw in the markdown
                
                track_elements = soup.select('.tracks__item')
                
                for el in track_elements:
                    if len(tracks) >= limit:
                        break
                        
                    try:
                        # Extract basic info
                        title_el = el.select_one('.track__title')
                        artist_el = el.select_one('.track__desc')
                        time_el = el.select_one('.track__fulltime')
                        download_el = el.select_one('a.track__download-btn')
                        cover_el = el.select_one('.track__img')
                        
                        if not (title_el and download_el):
                            continue
                            
                        title = title_el.text.strip()
                        artist = artist_el.text.strip() if artist_el else "Unknown"
                        duration_str = time_el.text.strip() if time_el else "00:00"
                        
                        # Parse duration to seconds
                        try:
                            mins, secs = map(int, duration_str.split(':'))
                            duration = mins * 60 + secs
                        except:
                            duration = 0
                            
                        # URL
                        url = download_el.get('href')
                        if not url:
                            continue
                            
                        # ID
                        # Try to get from data-id or extract from URL
                        track_id = el.get('data-track-id')
                        if not track_id:
                            # Fallback: hash of artist+title
                            track_id = f"gen_{abs(hash(artist + title))}"
                            
                        # Cover
                        image = None
                        
                        # Try to get high quality cover from iTunes
                        try:
                            image = self._get_itunes_cover(artist, title)
                        except Exception as e:
                            print(f"iTunes cover error: {e}")
                            
                        # Fallback to Hitmo cover if iTunes failed
                        if not image and cover_el:
                            style = cover_el.get('style', '')
                            # Extract url('...') from style
                            match = re.search(r"url\(['\"]?(.*?)['\"]?\)", style)
                            if match:
                                image = match.group(1)
                        
                        if not image:
                            # Fallback image
                            image = f"https://ui-avatars.com/api/?name={urllib.parse.quote(artist)}&size=200&background=random"
                            
                        tracks.append({
                            'id': track_id,
                            'title': title,
                            'artist': artist,
                            'duration': duration,
                            'url': url,
                            'image': image
                        })
                        
                    except Exception as e:
                        print(f"Error parsing track: {e}")
                        continue
                        
                return tracks
                
        except Exception as e:
            print(f"Search error: {e}")
            return []

    def _get_itunes_cover(self, artist: str, title: str) -> Optional[str]:
        """
        Get high quality cover from iTunes API
        """
        try:
            term = f"{artist} {title}"
            params = {
                'term': term,
                'media': 'music',
                'entity': 'song',
                'limit': 1
            }
            
            with httpx.Client(timeout=3.0) as client:
                response = client.get("https://itunes.apple.com/search", params=params)
                if response.status_code == 200:
                    data = response.json()
                    if data['resultCount'] > 0:
                        # Get artwork url and replace size with 600x600
                        artwork = data['results'][0].get('artworkUrl100')
                        if artwork:
                            # Replace any size (e.g. 100x100bb, 60x60bb) with 600x600bb
                            return re.sub(r'\d+x\d+bb', '600x600bb', artwork)
            return None
        except:
            return None
    
    def get_genre_tracks(self, genre_id: int, limit: int = 20, page: int = 1) -> List[Dict]:
        """
        Get tracks from a specific genre
        """
        try:
            url = f"{self.BASE_URL}/genre/{genre_id}"
            params = {
                'start': (page - 1) * 48
            }
            
            with httpx.Client(headers=self.headers, timeout=10.0, follow_redirects=True) as client:
                response = client.get(url, params=params)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.text, 'html.parser')
                tracks = []
                
                # Find all track blocks (same structure as search)
                track_elements = soup.select('.tracks__item')
                
                for el in track_elements:
                    if len(tracks) >= limit:
                        break
                        
                    try:
                        # Extract basic info
                        title_el = el.select_one('.track__title')
                        artist_el = el.select_one('.track__desc')
                        time_el = el.select_one('.track__fulltime')
                        download_el = el.select_one('a.track__download-btn')
                        cover_el = el.select_one('.track__img')
                        
                        if not (title_el and download_el):
                            continue
                            
                        title = title_el.text.strip()
                        artist = artist_el.text.strip() if artist_el else "Unknown"
                        duration_str = time_el.text.strip() if time_el else "00:00"
                        
                        # Parse duration to seconds
                        try:
                            mins, secs = map(int, duration_str.split(':'))
                            duration = mins * 60 + secs
                        except:
                            duration = 0
                            
                        # URL
                        url = download_el.get('href')
                        if not url:
                            continue
                            
                        # ID
                        track_id = el.get('data-track-id')
                        if not track_id:
                            track_id = f"gen_{abs(hash(artist + title))}"
                            
                        # Cover
                        image = None
                        
                        # Try to get high quality cover from iTunes
                        try:
                            image = self._get_itunes_cover(artist, title)
                        except Exception as e:
                            print(f"iTunes cover error: {e}")
                            
                        # Fallback to Hitmo cover if iTunes failed
                        if not image and cover_el:
                            style = cover_el.get('style', '')
                            match = re.search(r"url\(['\"]?(.*?)['\"]?\)", style)
                            if match:
                                image = match.group(1)
                        
                        if not image:
                            image = f"https://ui-avatars.com/api/?name={urllib.parse.quote(artist)}&size=200&background=random"
                            
                        tracks.append({
                            'id': track_id,
                            'title': title,
                            'artist': artist,
                            'duration': duration,
                            'url': url,
                            'image': image
                        })
                        
                    except Exception as e:
                        print(f"Error parsing track: {e}")
                        continue
                        
                return tracks
                
        except Exception as e:
            print(f"Genre tracks error: {e}")
            return []

    def get_radio_stations(self) -> List[Dict]:
        """
        Get list of popular radio stations
        Since Hitmo doesn't have a dedicated radio section, we'll provide popular Russian radio streams
        """
        # Popular Russian radio stations with direct stream URLs
        stations = [
            {
                'id': 'radio_energy',
                'name': 'Energy',
                'genre': 'Хиты',
                'url': 'https://pub0302.101.ru:8443/stream/air/aac/64/99',
                'image': 'https://cdn-radiotime-logos.tunein.com/s24939q.png'
            },
            {
                'id': 'radio_europa_plus',
                'name': 'Европа Плюс',
                'genre': 'Поп',
                'url': 'https://ep128.hostingradio.ru:8030/ep128',
                'image': 'https://cdn-profiles.tunein.com/s8439/images/logog.png'
            },
            {
                'id': 'radio_record',
                'name': 'Radio Record',
                'genre': 'Электроника',
                'url': 'https://radiorecord.hostingradio.ru/rr_main96.aacp',
                'image': 'https://cdn-radiotime-logos.tunein.com/s25419q.png'
            },
            {
                'id': 'radio_maximum',
                'name': 'Maximum',
                'genre': 'Рок',
                'url': 'https://maximum.hostingradio.ru/maximum96.aacp',
                'image': 'https://cdn-radiotime-logos.tunein.com/s6882q.png'
            },
            {
                'id': 'radio_monte_carlo',
                'name': 'Monte Carlo',
                'genre': 'Релакс',
                'url': 'https://montecarlo.hostingradio.ru/montecarlo96.aacp',
                'image': 'https://cdn-radiotime-logos.tunein.com/s6883q.png'
            },
            {
                'id': 'radio_dfm',
                'name': 'DFM',
                'genre': 'Танцевальная',
                'url': 'https://dfm.hostingradio.ru/dfm96.aacp',
                'image': 'https://cdn-radiotime-logos.tunein.com/s6881q.png'
            },
            {
                'id': 'radio_retro',
                'name': 'Ретро FM',
                'genre': 'Ретро',
                'url': 'https://retro.hostingradio.ru:8043/retro128',
                'image': 'https://cdn-radiotime-logos.tunein.com/s6884q.png'
            },
            {
                'id': 'radio_chanson',
                'name': 'Шансон',
                'genre': 'Шансон',
                'url': 'https://chanson.hostingradio.ru:8041/chanson128.mp3',
                'image': 'https://cdn-radiotime-logos.tunein.com/s6885q.png'
            },
            {
                'id': 'radio_jazz',
                'name': 'Jazz FM',
                'genre': 'Джаз',
                'url': 'https://nashe1.hostingradio.ru/jazz-128.mp3',
                'image': 'https://cdn-radiotime-logos.tunein.com/s25418q.png'
            },
            {
                'id': 'radio_relax',
                'name': 'Relax FM',
                'genre': 'Релакс',
                'url': 'https://relaxfm.hostingradio.ru/relax128.mp3',
                'image': 'https://cdn-radiotime-logos.tunein.com/s6886q.png'
            },
            {
                'id': 'radio_hits',
                'name': 'Хит FM',
                'genre': 'Хиты',
                'url': 'https://hitfm.hostingradio.ru/hitfm96.aacp',
                'image': 'https://cdn-radiotime-logos.tunein.com/s6887q.png'
            },
            {
                'id': 'radio_comedy',
                'name': 'Comedy Radio',
                'genre': 'Юмор',
                'url': 'https://pub0302.101.ru:8443/stream/reg/aac/64/102',
                'image': 'https://cdn-radiotime-logos.tunein.com/s6888q.png'
            }
        ]
        
        return stations

    def close(self):
        pass
