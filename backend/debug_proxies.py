import asyncio
import os
import httpx
from dotenv import load_dotenv
import random

# Load environment variables
load_dotenv()

async def check_identity(proxy_url=None, run_id=1):
    """
    Sends a request to httpbin to see how the server sees us.
    """
    
    # Mimic the headers from hitmo_parser_light.py
    headers = {
        'User-Agent': f'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestRun/{run_id}',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    }

    proxies = None
    if proxy_url:
        proxies = {"http://": proxy_url, "https://": proxy_url}

    try:
        async with httpx.AsyncClient(proxies=proxies, headers=headers, timeout=10) as client:
            # 1. Get IP address
            response_ip = await client.get("https://api.ipify.org?format=json")
            real_ip = response_ip.json().get('ip')

            # 2. Get Headers info
            response_headers = await client.get("https://httpbin.org/headers")
            server_seen_headers = response_headers.json().get('headers')
            user_agent = server_seen_headers.get('User-Agent')

            status = "✅ OK"
            print(f"Run #{run_id}: {status}")
            print(f"   Input Proxy: {proxy_url if proxy_url else 'DIRECT (No Proxy)'}")
            print(f"   Visible IP:  {real_ip}")
            print(f"   User-Agent:  {user_agent}")
            print("-" * 40)
            
    except Exception as e:
        print(f"Run #{run_id}: ❌ FAILED")
        print(f"   Input Proxy: {proxy_url}")
        print(f"   Error: {e}")
        print("-" * 40)

async def main():
    print("=== PROXY & IDENTITY CHECKER ===\n")
    
    # 1. Get proxies from .env
    proxy_list_str = os.getenv("PROXY_LIST", "")
    proxy_list = [p.strip() for p in proxy_list_str.split(",") if p.strip()]

    if not proxy_list:
        print("⚠️ No PROXY_LIST found in .env file.")
        print("Testing direct connection only...\n")
        await check_identity(None, 1)
        return

    print(f"Found {len(proxy_list)} proxies in configuration.")
    print("Simulating requests...\n")

    # 2. Test each proxy (or a sample)
    tasks = []
    for i, proxy in enumerate(proxy_list):
        tasks.append(check_identity(proxy, i + 1))
    
    # Run them
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
