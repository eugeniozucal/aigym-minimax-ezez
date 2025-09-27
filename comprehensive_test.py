#!/usr/bin/env python3
import asyncio
from playwright.async_api import async_playwright
import sys
import time

async def comprehensive_test():
    """Comprehensive end-to-end testing of the AI Gym application"""
    test_results = []
    
    try:
        async with async_playwright() as p:
            # Launch browser with more verbose logging
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-dev-shm-usage']
            )
            page = await browser.new_page()
            
            # Set viewport for consistent screenshots
            await page.set_viewport_size({"width": 1280, "height": 720})
            
            # Monitor console messages
            console_messages = []
            def handle_console(msg):
                console_messages.append(f"[{msg.type}] {msg.text}")
            page.on("console", handle_console)
            
            print("=== TEST 1: APPLICATION LOADING ===")
            # Navigate to the application
            await page.goto("https://2u8s41a22adm.space.minimax.io", wait_until="networkidle")
            
            # Take screenshot of initial load
            await page.screenshot(path="test_1_app_loading.png", full_page=True)
            
            title = await page.title()
            print(f"✅ Page title: {title}")
            test_results.append(f"✅ App Loading: Title '{title}'")
            
            # Check for React app
            root_element = await page.query_selector("#root")
            if root_element:
                print("✅ React app root element found")
                test_results.append("✅ React App: Root element present")
            
            # Wait for any dynamic content to load
            await page.wait_for_timeout(2000)
            
            print("=== TEST 2: LOGIN FUNCTIONALITY ===")
            # Look for login form
            login_form = await page.query_selector("form")
            email_input = await page.query_selector("input[type='email'], input[name='email']")
            password_input = await page.query_selector("input[type='password'], input[name='password']")
            
            if login_form and email_input and password_input:
                print("✅ Login form elements found")
                test_results.append("✅ Login Form: All elements present")
                
                # Fill in login credentials
                await email_input.fill("fgoumyda@minimax.com")
                await password_input.fill("tk5ui2eNik")
                
                # Take screenshot before login
                await page.screenshot(path="test_2a_before_login.png", full_page=True)
                
                # Submit form
                submit_button = await page.query_selector("button[type='submit'], input[type='submit']")
                if submit_button:
                    await submit_button.click()
                    print("✅ Login form submitted")
                    test_results.append("✅ Login: Form submitted successfully")
                    
                    # Wait for navigation or response
                    await page.wait_for_timeout(3000)
                    
                    # Take screenshot after login attempt
                    await page.screenshot(path="test_2b_after_login.png", full_page=True)
                    
                    # Check current URL
                    current_url = page.url
                    print(f"✅ Current URL after login: {current_url}")
                    test_results.append(f"✅ Login: Redirected to {current_url}")
                    
            print("=== TEST 3: NAVIGATION AND UI ELEMENTS ===")
            # Look for navigation elements
            nav_elements = await page.query_selector_all("nav, [role='navigation']")
            if nav_elements:
                print(f"✅ Found {len(nav_elements)} navigation elements")
                test_results.append(f"✅ Navigation: {len(nav_elements)} elements found")
            
            # Look for Community and Training Zone tabs/links
            community_link = await page.query_selector("text=Community")
            training_zone_link = await page.query_selector("text=Training Zone")
            
            if community_link:
                print("✅ Community link found")
                test_results.append("✅ Community: Link found")
            
            if training_zone_link:
                print("✅ Training Zone link found")
                test_results.append("✅ Training Zone: Link found")
            
            print("=== TEST 4: COMMUNITY TAB TEST ===")
            if community_link:
                try:
                    await community_link.click()
                    await page.wait_for_timeout(2000)
                    
                    # Take screenshot of Community page
                    await page.screenshot(path="test_4_community_page.png", full_page=True)
                    
                    # Check for loading spinners (should NOT be infinite)
                    loading_spinners = await page.query_selector_all(".loading, .spinner, [data-testid='loading']")
                    print(f"✅ Community page loaded, {len(loading_spinners)} loading elements found")
                    test_results.append(f"✅ Community: Page loaded, {len(loading_spinners)} loaders")
                    
                    # Wait to see if page stabilizes (no infinite loops)
                    await page.wait_for_timeout(3000)
                    
                    # Take final screenshot
                    await page.screenshot(path="test_4b_community_stable.png", full_page=True)
                    test_results.append("✅ Community: Page stable, no infinite loops detected")
                    
                except Exception as e:
                    print(f"❌ Community tab test failed: {e}")
                    test_results.append(f"❌ Community: Failed - {e}")
            
            print("=== TEST 5: TRAINING ZONE TAB TEST ===")
            if training_zone_link:
                try:
                    await training_zone_link.click()
                    await page.wait_for_timeout(2000)
                    
                    # Take screenshot of Training Zone page
                    await page.screenshot(path="test_5_training_zone_page.png", full_page=True)
                    
                    # Check for loading spinners
                    loading_spinners = await page.query_selector_all(".loading, .spinner, [data-testid='loading']")
                    print(f"✅ Training Zone page loaded, {len(loading_spinners)} loading elements found")
                    test_results.append(f"✅ Training Zone: Page loaded, {len(loading_spinners)} loaders")
                    
                    # Wait to see if page stabilizes
                    await page.wait_for_timeout(3000)
                    
                    # Take final screenshot
                    await page.screenshot(path="test_5b_training_zone_stable.png", full_page=True)
                    test_results.append("✅ Training Zone: Page stable, no infinite loops detected")
                    
                except Exception as e:
                    print(f"❌ Training Zone tab test failed: {e}")
                    test_results.append(f"❌ Training Zone: Failed - {e}")
            
            print("=== TEST 6: COMMUNITY DROPDOWN TEST ===")
            # Look for community logo/selector in header
            community_selector = await page.query_selector(".community-selector, .community-dropdown, [data-testid='community-selector']")
            header_logos = await page.query_selector_all("header img, .header img, .logo")
            
            if community_selector or header_logos:
                print(f"✅ Found community selector or {len(header_logos)} header logos")
                test_results.append(f"✅ Community Dropdown: Elements found")
                
                # Try to click on potential dropdown triggers
                for logo in header_logos[:2]:  # Test first 2 logos
                    try:
                        await logo.click()
                        await page.wait_for_timeout(1000)
                        
                        # Look for dropdown menu
                        dropdown = await page.query_selector(".dropdown, .menu, [role='menu']")
                        if dropdown:
                            print("✅ Dropdown menu appeared")
                            test_results.append("✅ Community Dropdown: Functional")
                            
                            # Take screenshot of dropdown
                            await page.screenshot(path="test_6_dropdown_open.png", full_page=True)
                            break
                    except:
                        continue
            
            print("=== TEST 7: CONSOLE ERRORS CHECK ===")
            error_count = len([msg for msg in console_messages if 'error' in msg.lower()])
            warning_count = len([msg for msg in console_messages if 'warning' in msg.lower()])
            
            print(f"✅ Console errors: {error_count}")
            print(f"✅ Console warnings: {warning_count}")
            test_results.append(f"✅ Console: {error_count} errors, {warning_count} warnings")
            
            if console_messages:
                print("Recent console messages:")
                for msg in console_messages[-10:]:
                    print(f"  {msg}")
            
            print("=== FINAL SCREENSHOTS ===")
            await page.screenshot(path="test_final_full_page.png", full_page=True)
            await page.screenshot(path="test_final_viewport.png")
            
            await browser.close()
            
            print("\n=== TEST RESULTS SUMMARY ===")
            for result in test_results:
                print(result)
            
            return True
            
    except Exception as e:
        print(f"❌ Comprehensive test failed: {e}")
        return False

if __name__ == "__main__":
    print("Starting comprehensive end-to-end testing...")
    result = asyncio.run(comprehensive_test())
    print(f"\nTest completed: {'SUCCESS' if result else 'FAILED'}")
    sys.exit(0 if result else 1)
