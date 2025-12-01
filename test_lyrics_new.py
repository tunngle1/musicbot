import asyncio
from backend.lyrics_service import LyricsService

async def test():
    service = LyricsService()
    # Тестируем именно тот случай, который не работал
    title = "Как есть"
    artist = "Баста, ГУФ"
    
    print(f"Testing search for: {artist} - {title}")
    lyrics = service.get_lyrics(title, artist)
    
    if lyrics:
        print("\n✅ SUCCESS! Lyrics found:")
        print(lyrics[:200] + "...")
    else:
        print("\n❌ FAILED. No lyrics found.")

if __name__ == "__main__":
    asyncio.run(test())
