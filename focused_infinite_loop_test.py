#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright
import sys
import time

async def test_infinite_loops():
    """Focused test specifically for infinite loop issues"""
    
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-dev-shm-usage']
            )
            page = await browser.new_page()
            await page.set_viewport_size({"width": 1280, "height": 720})
            
            # Monitor network requests to detect infinite loops
            request_count = 0
            repeated_requests = {}
            
            def handle_request(request):
                nonlocal request_count
                request_count += 1
                url = request.url
                if url in repeated_requests:
                    repeated_requests[url] += 1
                else:
                    repeated_requests[url] = 1
            
            page.on("request", handle_request)
            
            console_errors = []
            def handle_console(msg):
                if msg.type == "error":
                    console_errors.append(msg.text)
            page.on("console", handle_console)
            
            print("=== INFINITE LOOP TEST: NAVIGATION TO APP ===")
            await page.goto("https://2u8s41a22adm.space.minimax.io", wait_until="networkidle")
            await page.screenshot(path="infinite_test_1_home.png", full_page=True)
            
            print(f"Initial requests: {request_count}")
            
            # Try to login first
            email_input = await page.query_selector("input[type='email'], input[name='email']")
            password_input = await page.query_selector("input[type='password'], input[name='password']")
            
            if email_input and password_input:
                await email_input.fill("fgoumyda@minimax.com")
                await password_input.fill("tk5ui2eNik")
                
                submit_button = await page.query_selector("button[type='submit'], input[type='submit']")
                if submit_button:
                    request_count = 0  # Reset counter
                    await submit_button.click()
                    await page.wait_for_timeout(3000)
                    print(f"Requests after login: {request_count}")
            
            print("=== INFINITE LOOP TEST: COMMUNITY TAB ===")
            # Reset request counter for Community test
            request_count = 0
            repeated_requests = {}
            
            # Look for Community tab/link
            community_links = await page.query_selector_all("a[href*='community'], a[href*='/user/community']")
            community_text_links = await page.query_selector_all("text=Community")
            
            all_community_links = community_links + community_text_links
            
            if all_community_links:
                await all_community_links[0].click()
                print("Clicked Community link")
                
                # Wait and monitor for infinite requests
                for i in range(5):  # Monitor for 10 seconds
                    await page.wait_for_timeout(2000)
                    print(f"Community tab - Time: {(i+1)*2}s, Requests: {request_count}")
                    
                    if request_count > 50:  # Too many requests = possible infinite loop
                        print("❌ POTENTIAL INFINITE LOOP DETECTED IN COMMUNITY TAB")
                        break
                
                await page.screenshot(path="infinite_test_2_community.png", full_page=True)
                
                # Check for repeated requests (sign of infinite loops)
                excessive_requests = {url: count for url, count in repeated_requests.items() if count > 10}
                if excessive_requests:
                    print(f"❌ Excessive repeated requests detected: {excessive_requests}")
                else:
                    print("✅ No excessive repeated requests - Community tab looks good")
            
            print("=== INFINITE LOOP TEST: TRAINING ZONE TAB ===")
            # Reset request counter for Training Zone test
            request_count = 0
            repeated_requests = {}
            
            # Look for Training Zone tab/link
            training_links = await page.query_selector_all("a[href*='training'], a[href*='/user/training']")
            training_text_links = await page.query_selector_all("text=Training Zone")
            
            all_training_links = training_links + training_text_links
            
            if all_training_links:
                await all_training_links[0].click()
                print("Clicked Training Zone link")
                
                # Wait and monitor for infinite requests
                for i in range(5):  # Monitor for 10 seconds
                    await page.wait_for_timeout(2000)
                    print(f"Training Zone - Time: {(i+1)*2}s, Requests: {request_count}")
                    
                    if request_count > 50:  # Too many requests = possible infinite loop
                        print("❌ POTENTIAL INFINITE LOOP DETECTED IN TRAINING ZONE")
                        break
                
                await page.screenshot(path="infinite_test_3_training_zone.png", full_page=True)
                
                # Check for repeated requests
                excessive_requests = {url: count for url, count in repeated_requests.items() if count > 10}
                if excessive_requests:
                    print(f"❌ Excessive repeated requests detected: {excessive_requests}")
                else:
                    print("✅ No excessive repeated requests - Training Zone looks good")
            else:
                print("No Training Zone links found")
            
            print("=== DROPDOWN TEST ===")
            # Look for community dropdown in header
            header_elements = await page.query_selector_all("header *, .header *, .community-selector, .community-dropdown")
            
            for element in header_elements[:5]:  # Test first 5 header elements
                try:
                    await element.click()
                    await page.wait_for_timeout(500)
                    
                    # Look for dropdown
                    dropdown = await page.query_selector(".dropdown, .menu, [role='menu'], .dropdown-menu")
                    if dropdown:
                        print("✅ Dropdown menu found!")
                        await page.screenshot(path="infinite_test_4_dropdown.png", full_page=True)
                        break
                except:
                    continue
            
            print("=== CONSOLE ERRORS SUMMARY ===")
            if console_errors:
                print(f"Found {len(console_errors)} console errors:")
                for error in console_errors[-5:]:
                    print(f"  {error[:100]}...")
            else:
                print("✅ No console errors detected")
            
            await browser.close()
            return True
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_infinite_loops())
    sys.exit(0 if result else 1)
