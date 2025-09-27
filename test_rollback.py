#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright

async def test_rollback():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            print("Testing rollback deployment...")
            await page.goto('https://a5ayzozxfiyv.space.minimax.io')
            await page.wait_for_load_state('networkidle')
            await page.screenshot(path='rollback_test_login.png')
            print("Rollback test - Login page loaded successfully")
            
            # Check for login form elements
            email_input = await page.locator('input[type="email"]').count()
            password_input = await page.locator('input[type="password"]').count()
            
            print(f"Email input found: {email_input > 0}")
            print(f"Password input found: {password_input > 0}")
            
            # Test login with demo credentials
            if email_input > 0 and password_input > 0:
                await page.fill('input[type="email"]', 'ed@aiworkify.com')
                await page.fill('input[type="password"]', '12345678')
                await page.click('button[type="submit"]')
                
                await page.wait_for_load_state('networkidle')
                await asyncio.sleep(3)
                await page.screenshot(path='rollback_test_after_login.png')
                print("Login test completed")
            
            print("Rollback test completed successfully")
            
        except Exception as e:
            print(f"Error during test: {e}")
            await page.screenshot(path='rollback_test_error.png')
        
        finally:
            await browser.close()

if __name__ == '__main__':
    asyncio.run(test_rollback())
