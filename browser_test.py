#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright
import sys

async def test_browser():
    try:
        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            print("Browser launched successfully")
            
            # Test the application
            await page.goto("https://2u8s41a22adm.space.minimax.io")
            print(f"Page loaded: {page.url}")
            
            # Take screenshot
            await page.screenshot(path="app_loading.png")
            print("Screenshot taken: app_loading.png")
            
            # Check for errors in console
            console_errors = []
            page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
            
            # Wait for page to load
            await page.wait_for_timeout(3000)
            
            # Get page title
            title = await page.title()
            print(f"Page title: {title}")
            
            # Check if React app loaded
            root_element = await page.query_selector("#root")
            if root_element:
                print("React app root element found")
            else:
                print("React app root element NOT found")
            
            # Look for login form or main content
            login_form = await page.query_selector("form")
            if login_form:
                print("Login form found")
            
            # Print any console errors
            if console_errors:
                print(f"Console errors: {console_errors}")
            else:
                print("No console errors detected")
            
            await browser.close()
            return True
            
    except Exception as e:
        print(f"Browser test failed: {e}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_browser())
    sys.exit(0 if result else 1)
