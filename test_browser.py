#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright
import json
import time

async def comprehensive_test():
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Collect console logs
        console_logs = []
        
        def handle_console(msg):
            console_logs.append({
                'type': msg.type,
                'text': msg.text,
                'timestamp': time.time()
            })
            print(f"Console [{msg.type}]: {msg.text}")
        
        page.on('console', handle_console)
        
        try:
            print("Step 1: Navigating to login page...")
            await page.goto('https://4auczw79kdjp.space.minimax.io/')
            await page.wait_for_load_state('networkidle')
            await page.screenshot(path='screenshot_1_login_page.png')
            print("✓ Login page loaded and screenshot taken")
            
            print("\nStep 2: Logging in...")
            # Fill login form
            await page.fill('input[type="email"]', 'ed@aiworkify.com')
            await page.fill('input[type="password"]', '12345678')
            await page.click('button[type="submit"]')
            
            # Wait for login to complete
            await page.wait_for_load_state('networkidle')
            await asyncio.sleep(3)  # Additional wait for any async operations
            await page.screenshot(path='screenshot_2_after_login.png')
            print("✓ Login completed and screenshot taken")
            
            print("\nStep 3: Testing Community page...")
            # Navigate to Community tab
            community_tab = page.locator('[data-testid="community-tab"]')
            if await community_tab.count() > 0:
                await community_tab.click()
                await page.wait_for_load_state('networkidle')
                await asyncio.sleep(2)
                await page.screenshot(path='screenshot_3_community_page.png')
                print("✓ Community page loaded and screenshot taken")
            else:
                print("⚠ Community tab not found, trying alternative selector")
                # Try alternative selectors
                alt_selectors = [
                    'text="Community"',
                    '[href*="community"]',
                    'a:has-text("Community")'
                ]
                for selector in alt_selectors:
                    try:
                        await page.click(selector, timeout=2000)
                        await page.wait_for_load_state('networkidle')
                        await asyncio.sleep(2)
                        await page.screenshot(path='screenshot_3_community_page.png')
                        print(f"✓ Community page loaded using selector: {selector}")
                        break
                    except:
                        continue
            
            print("\nStep 4: Testing Training Zone page...")
            # Navigate to Training Zone tab
            training_tab = page.locator('[data-testid="training-zone-tab"]')
            if await training_tab.count() > 0:
                await training_tab.click()
                await page.wait_for_load_state('networkidle')
                await asyncio.sleep(2)
                await page.screenshot(path='screenshot_4_training_zone.png')
                print("✓ Training Zone page loaded and screenshot taken")
            else:
                print("⚠ Training Zone tab not found, trying alternative selector")
                alt_selectors = [
                    'text="Training Zone"',
                    '[href*="training"]',
                    'a:has-text("Training")',
                    'a:has-text("Training Zone")'
                ]
                for selector in alt_selectors:
                    try:
                        await page.click(selector, timeout=2000)
                        await page.wait_for_load_state('networkidle')
                        await asyncio.sleep(2)
                        await page.screenshot(path='screenshot_4_training_zone.png')
                        print(f"✓ Training Zone page loaded using selector: {selector}")
                        break
                    except:
                        continue
            
            print("\nStep 5: Testing Community Dropdown...")
            # Look for the community dropdown in the header
            dropdown_selectors = [
                '[data-testid="community-dropdown"]',
                '[data-testid="community-selector"]',
                'button:has-text("Community")',
                '.community-dropdown',
                'button[aria-haspopup="true"]'
            ]
            
            dropdown_found = False
            for selector in dropdown_selectors:
                try:
                    dropdown = page.locator(selector)
                    if await dropdown.count() > 0:
                        await dropdown.click()
                        await asyncio.sleep(1)
                        await page.screenshot(path='screenshot_5_dropdown_open.png')
                        print(f"✓ Community dropdown opened using selector: {selector}")
                        dropdown_found = True
                        break
                except:
                    continue
            
            if not dropdown_found:
                print("⚠ Community dropdown not found with any selector")
                # Take a screenshot of the current state for analysis
                await page.screenshot(path='screenshot_5_dropdown_not_found.png')
            
            print("\nStep 6: Final state screenshot...")
            await page.screenshot(path='screenshot_6_final_state.png')
            
            print("\n" + "="*50)
            print("TEST SUMMARY")
            print("="*50)
            print(f"Total console messages: {len(console_logs)}")
            
            # Categorize console logs
            errors = [log for log in console_logs if log['type'] == 'error']
            warnings = [log for log in console_logs if log['type'] == 'warning']
            info = [log for log in console_logs if log['type'] in ['log', 'info']]
            
            print(f"Errors: {len(errors)}")
            print(f"Warnings: {len(warnings)}")
            print(f"Info/Log: {len(info)}")
            
            if errors:
                print("\nERRORS FOUND:")
                for error in errors[:5]:  # Show first 5 errors
                    print(f"  - {error['text']}")
            
            if warnings:
                print("\nWARNINGS FOUND:")
                for warning in warnings[:5]:  # Show first 5 warnings
                    print(f"  - {warning['text']}")
            
            # Save detailed logs
            with open('console_logs.json', 'w') as f:
                json.dump(console_logs, f, indent=2)
            print("\nDetailed console logs saved to console_logs.json")
            
        except Exception as e:
            print(f"Test failed with error: {e}")
            await page.screenshot(path='screenshot_error.png')
        
        finally:
            await browser.close()
            print("\nBrowser closed. Test completed.")

if __name__ == '__main__':
    asyncio.run(comprehensive_test())
