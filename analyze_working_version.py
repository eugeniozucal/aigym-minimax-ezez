#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright
import time

async def analyze_working_version():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            print("Analyzing working version...")
            await page.goto('https://h3qpx2ydm9tb.space.minimax.io/login')
            await page.wait_for_load_state('networkidle')
            await page.screenshot(path='working_version_login.png')
            print("Working version login page captured")
            
            # Test login
            await page.fill('input[type="email"]', 'dlocal@aiworkify.com')
            await page.fill('input[type="password"]', 'dlocal')
            await page.click('button[type="submit"]')
            
            await page.wait_for_load_state('networkidle')
            await asyncio.sleep(3)
            await page.screenshot(path='working_version_after_login.png')
            print("Working version after login captured")
            
            # Check current URL after login
            current_url = page.url
            print(f"Current URL after login: {current_url}")
            
            # Take additional screenshots if there are tabs/navigation
            await asyncio.sleep(2)
            await page.screenshot(path='working_version_final_state.png')
            print("Working version final state captured")
            
        except Exception as e:
            print(f"Error: {e}")
            await page.screenshot(path='working_version_error.png')
        
        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(analyze_working_version())
