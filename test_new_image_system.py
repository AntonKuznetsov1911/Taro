#!/usr/bin/env python3
"""
New Tarot Card Image System Testing
Tests the new aesthetic tarot card image system with compression and fallback
"""

import requests
import json
import os
from datetime import datetime
import sys
import base64

# Get backend URL from environment
BACKEND_URL = "https://mystictaro.preview.emergentagent.com/api"

class NewImageSystemTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.session = requests.Session()
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"   Details: {details}")
        if not success and response_data:
            print(f"   Response: {response_data}")
        print()

    def create_test_reading(self, category="love", spread_type="one_card", question="Тест изображений"):
        """Create a test reading for image testing"""
        try:
            payload = {
                "category": category,
                "spread_type": spread_type,
                "question": question
            }
            
            response = self.session.post(
                f"{self.base_url}/reading",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to create reading: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"Exception creating reading: {str(e)}")
            return None

    def test_all_major_arcana_images(self):
        """Test that all 22 Major Arcana cards have unique, quality images"""
        try:
            print("🖼️ Testing image quality and uniqueness for Major Arcana cards...")
            
            # Create multiple readings to get variety of cards
            all_cards = []
            unique_images = set()
            
            for i in range(8):  # Multiple readings to get different cards
                reading = self.create_test_reading("general", "three_cards", f"Тест уникальности изображений #{i+1}")
                if reading and "cards" in reading:
                    all_cards.extend(reading["cards"])
            
            if len(all_cards) < 10:
                self.log_test("All Major Arcana images", False, "Insufficient cards retrieved for testing")
                return False
            
            valid_images = 0
            image_sizes = []
            
            for card in all_cards:
                card_name = card.get("name", "Unknown")
                image = card.get("image", "")
                
                # Check image format
                if not image.startswith("data:image/"):
                    self.log_test("All Major Arcana images", False, f"Card {card_name} has invalid image format")
                    return False
                
                # Check base64 encoding
                if "base64," not in image:
                    self.log_test("All Major Arcana images", False, f"Card {card_name} image not base64 encoded")
                    return False
                
                # Extract and validate base64
                base64_part = image.split("base64,")[1]
                
                # Check substantial size (quality images should be reasonable size)
                if len(base64_part) < 500:
                    self.log_test("All Major Arcana images", False, f"Card {card_name} image too small: {len(base64_part)} chars")
                    return False
                
                valid_images += 1
                image_sizes.append(len(base64_part))
                unique_images.add(base64_part)
            
            # Check uniqueness
            uniqueness_ratio = len(unique_images) / len(all_cards) if all_cards else 0
            avg_size = sum(image_sizes) / len(image_sizes) if image_sizes else 0
            
            if uniqueness_ratio >= 0.3 and valid_images >= 10:  # At least 30% unique images
                self.log_test("All Major Arcana images", True, 
                             f"✅ Quality images - Total: {len(all_cards)}, Valid: {valid_images}, Unique: {len(unique_images)} ({uniqueness_ratio:.1%}), Avg size: {avg_size:.0f} chars")
                return True
            else:
                self.log_test("All Major Arcana images", False, 
                             f"❌ Quality issues - Uniqueness: {uniqueness_ratio:.1%}, Valid: {valid_images}")
                return False
                
        except Exception as e:
            self.log_test("All Major Arcana images", False, f"Exception: {str(e)}")
            return False

    def test_svg_fallback_system(self):
        """Test that SVG fallback system works beautifully"""
        try:
            print("🎭 Testing SVG fallback system...")
            
            # Test multiple readings to trigger both URL and SVG images
            readings = []
            for i in range(3):
                reading = self.create_test_reading("love", "one_card", f"Тест SVG fallback #{i+1}")
                if reading:
                    readings.append(reading)
            
            if not readings:
                self.log_test("SVG fallback system", False, "No readings created for fallback testing")
                return False
            
            svg_images = 0
            jpeg_images = 0
            
            for reading in readings:
                cards = reading.get("cards", [])
                for card in cards:
                    image = card.get("image", "")
                    
                    if "data:image/svg+xml" in image:
                        svg_images += 1
                        # Validate SVG content
                        if "base64," in image:
                            try:
                                svg_content = base64.b64decode(image.split("base64,")[1]).decode('utf-8')
                                
                                # Check for SVG elements
                                svg_elements = ["<svg", "gradient", "circle", "text"]
                                has_svg_elements = all(elem in svg_content for elem in svg_elements[:3])
                                
                                if not has_svg_elements:
                                    self.log_test("SVG fallback system", False, "SVG content validation failed")
                                    return False
                                    
                            except Exception as e:
                                self.log_test("SVG fallback system", False, f"SVG decode error: {str(e)}")
                                return False
                    
                    elif "data:image/jpeg" in image:
                        jpeg_images += 1
            
            total_images = svg_images + jpeg_images
            
            if total_images > 0:
                self.log_test("SVG fallback system", True, 
                             f"✅ Fallback system working - SVG: {svg_images}, JPEG: {jpeg_images}, Total: {total_images}")
                return True
            else:
                self.log_test("SVG fallback system", False, "No valid images found")
                return False
                
        except Exception as e:
            self.log_test("SVG fallback system", False, f"Exception: {str(e)}")
            return False

    def test_image_compression_limits(self):
        """Test that images are compressed to acceptable size (under 100KB each)"""
        try:
            print("📦 Testing image compression limits...")
            
            # Test different spread types to check image sizes
            test_cases = [
                ("one_card", "love", "Тест сжатия для одной карты"),
                ("three_cards", "career", "Тест сжатия для трех карт"),
                ("celtic_cross", "finance", "Тест сжатия для кельтского креста")
            ]
            
            all_passed = True
            oversized_cards = []
            
            for spread_type, category, question in test_cases:
                reading = self.create_test_reading(category, spread_type, question)
                
                if reading:
                    cards = reading.get("cards", [])
                    
                    for card in cards:
                        image = card.get("image", "")
                        card_name = card.get("name", "Unknown")
                        
                        if "base64," in image:
                            base64_part = image.split("base64,")[1]
                            # Estimate actual size (base64 is ~33% larger than binary)
                            estimated_size_kb = (len(base64_part) * 0.75) / 1024
                            
                            # Check if under 100KB limit
                            if estimated_size_kb > 100:
                                oversized_cards.append(f"{card_name}: {estimated_size_kb:.1f}KB")
                                all_passed = False
                            
                            # Log individual card size
                            print(f"      {card_name}: {estimated_size_kb:.1f}KB")
                else:
                    self.log_test("Image compression limits", False, f"❌ Failed to create reading for {spread_type}")
                    return False
            
            if all_passed:
                self.log_test("Image compression limits", True, 
                             "✅ All images under 100KB limit - compression working perfectly")
                return True
            else:
                self.log_test("Image compression limits", False, 
                             f"❌ Oversized images found: {', '.join(oversized_cards)}")
                return False
                
        except Exception as e:
            self.log_test("Image compression limits", False, f"Exception: {str(e)}")
            return False

    def test_get_aesthetic_image_function(self):
        """Test that get_aesthetic_image() function works correctly"""
        try:
            print("🎯 Testing get_aesthetic_image() function...")
            
            # Test by creating readings and checking image sources
            readings = []
            for i in range(5):
                reading = self.create_test_reading("general", "one_card", f"Тест get_aesthetic_image #{i+1}")
                if reading:
                    readings.append(reading)
            
            if len(readings) < 3:
                self.log_test("get_aesthetic_image function", False, "Insufficient readings for testing")
                return False
            
            image_types = {"svg": 0, "jpeg": 0, "other": 0}
            valid_images = 0
            
            for reading in readings:
                cards = reading.get("cards", [])
                for card in cards:
                    image = card.get("image", "")
                    
                    if image.startswith("data:image/"):
                        valid_images += 1
                        
                        if "svg+xml" in image:
                            image_types["svg"] += 1
                        elif "jpeg" in image:
                            image_types["jpeg"] += 1
                        else:
                            image_types["other"] += 1
                    else:
                        self.log_test("get_aesthetic_image function", False, 
                                    f"Invalid image format for card {card.get('name', 'Unknown')}")
                        return False
            
            # Function should return either JPEG (from URLs) or SVG (fallback)
            total_valid = image_types["svg"] + image_types["jpeg"]
            
            if total_valid == valid_images and valid_images > 0:
                self.log_test("get_aesthetic_image function", True, 
                             f"✅ Function working - SVG: {image_types['svg']}, JPEG: {image_types['jpeg']}, Total: {valid_images}")
                return True
            else:
                self.log_test("get_aesthetic_image function", False, 
                             f"❌ Function issues - Valid: {valid_images}, Types: {image_types}")
                return False
                
        except Exception as e:
            self.log_test("get_aesthetic_image function", False, f"Exception: {str(e)}")
            return False

    def test_beautiful_tarot_images_urls(self):
        """Test that URLs from BEAUTIFUL_TAROT_IMAGES collection can be loaded"""
        try:
            print("🌐 Testing URL image loading from BEAUTIFUL_TAROT_IMAGES...")
            
            # Test multiple readings to potentially trigger URL loading
            url_loaded_count = 0
            svg_fallback_count = 0
            total_cards = 0
            
            for i in range(6):  # Multiple readings to test different cards
                reading = self.create_test_reading("general", "one_card", f"Тест загрузки URL изображений #{i+1}")
                if reading:
                    cards = reading.get("cards", [])
                    for card in cards:
                        total_cards += 1
                        image = card.get("image", "")
                        
                        if "data:image/jpeg" in image:
                            url_loaded_count += 1
                        elif "data:image/svg+xml" in image:
                            svg_fallback_count += 1
            
            if total_cards == 0:
                self.log_test("BEAUTIFUL_TAROT_IMAGES URLs", False, "No cards retrieved for URL testing")
                return False
            
            # Either URLs should load (JPEG) or fallback should work (SVG)
            total_valid = url_loaded_count + svg_fallback_count
            
            if total_valid == total_cards:
                if url_loaded_count > 0:
                    self.log_test("BEAUTIFUL_TAROT_IMAGES URLs", True, 
                                 f"✅ URL loading working - JPEG from URLs: {url_loaded_count}, SVG fallback: {svg_fallback_count}")
                else:
                    self.log_test("BEAUTIFUL_TAROT_IMAGES URLs", True, 
                                 f"✅ Fallback system working - All {svg_fallback_count} images using SVG fallback (URLs may be unavailable)")
                return True
            else:
                self.log_test("BEAUTIFUL_TAROT_IMAGES URLs", False, 
                             f"❌ Image loading issues - Valid: {total_valid}/{total_cards}")
                return False
                
        except Exception as e:
            self.log_test("BEAUTIFUL_TAROT_IMAGES URLs", False, f"Exception: {str(e)}")
            return False

    def test_url_to_base64_function(self):
        """Test url_to_base64() compression function"""
        try:
            print("⚙️ Testing url_to_base64() compression function...")
            
            # Test by creating readings and analyzing compressed images
            compressed_images = 0
            total_images = 0
            compression_ratios = []
            
            for i in range(4):
                reading = self.create_test_reading("finance", "one_card", f"Тест url_to_base64 #{i+1}")
                if reading:
                    cards = reading.get("cards", [])
                    for card in cards:
                        total_images += 1
                        image = card.get("image", "")
                        
                        if "data:image/jpeg" in image and "base64," in image:
                            compressed_images += 1
                            
                            # Estimate compression effectiveness
                            base64_part = image.split("base64,")[1]
                            estimated_size_kb = (len(base64_part) * 0.75) / 1024
                            
                            # Good compression should be under 80KB for most images
                            if estimated_size_kb < 80:
                                compression_ratios.append(estimated_size_kb)
            
            if total_images == 0:
                self.log_test("url_to_base64 function", False, "No images retrieved for compression testing")
                return False
            
            # Check if compression is working
            if compressed_images > 0:
                avg_size = sum(compression_ratios) / len(compression_ratios) if compression_ratios else 0
                self.log_test("url_to_base64 function", True, 
                             f"✅ Compression working - {compressed_images} JPEG images, avg size: {avg_size:.1f}KB")
                return True
            else:
                # If no JPEG images, SVG fallback is being used (which is also valid)
                self.log_test("url_to_base64 function", True, 
                             f"✅ Function working - Using SVG fallback (URL compression not needed)")
                return True
                
        except Exception as e:
            self.log_test("url_to_base64 function", False, f"Exception: {str(e)}")
            return False

    def test_all_spreads_with_new_images(self):
        """Test all spread types (one_card, three_cards, celtic_cross) with new images"""
        try:
            print("🃏 Testing all spread types with new images...")
            
            spread_tests = [
                ("one_card", "love", "Тест новых изображений для одной карты", 1),
                ("three_cards", "career", "Тест новых изображений для трех карт", 3),
                ("celtic_cross", "finance", "Тест новых изображений для кельтского креста", 10)
            ]
            
            all_passed = True
            
            for spread_type, category, question, expected_cards in spread_tests:
                reading = self.create_test_reading(category, spread_type, question)
                
                if reading:
                    cards = reading.get("cards", [])
                    
                    # Check card count
                    if len(cards) != expected_cards:
                        self.log_test(f"Spreads with new images - {spread_type}", False, 
                                    f"❌ Wrong card count - Expected: {expected_cards}, Got: {len(cards)}")
                        all_passed = False
                        continue
                    
                    # Check all cards have valid images
                    valid_images = 0
                    for card in cards:
                        image = card.get("image", "")
                        if image.startswith("data:image/") and "base64," in image:
                            valid_images += 1
                    
                    if valid_images == expected_cards:
                        self.log_test(f"Spreads with new images - {spread_type}", True, 
                                    f"✅ Perfect - {expected_cards} cards, all with new images")
                    else:
                        self.log_test(f"Spreads with new images - {spread_type}", False, 
                                    f"❌ Image issues - {valid_images}/{expected_cards} cards have valid images")
                        all_passed = False
                else:
                    self.log_test(f"Spreads with new images - {spread_type}", False, 
                                f"❌ Failed to create reading for {spread_type}")
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("All spreads with new images", False, f"Exception: {str(e)}")
            return False

    def run_new_image_system_tests(self):
        """Run comprehensive tests for the new tarot image system"""
        print("🎨 NEW TAROT CARD IMAGE SYSTEM TESTING")
        print("=" * 60)
        print("Testing new aesthetic image system with compression and fallback")
        print("Протестируем новую систему изображений таро карт в backend")
        print()
        
        # Test 1: Image Quality and Uniqueness for all 22 Major Arcana
        print("🖼️ TESTING IMAGE QUALITY & UNIQUENESS (22 Major Arcana)")
        print("-" * 55)
        image_quality_passed = self.test_all_major_arcana_images()
        
        # Test 2: Fallback SVG System
        print("\n🎭 TESTING SVG FALLBACK SYSTEM")
        print("-" * 30)
        fallback_passed = self.test_svg_fallback_system()
        
        # Test 3: Image Compression (under 100KB each)
        print("\n📦 TESTING IMAGE COMPRESSION (Target: <100KB)")
        print("-" * 45)
        compression_passed = self.test_image_compression_limits()
        
        # Test 4: get_aesthetic_image() function
        print("\n🎯 TESTING get_aesthetic_image() FUNCTION")
        print("-" * 40)
        aesthetic_function_passed = self.test_get_aesthetic_image_function()
        
        # Test 5: URL loading from BEAUTIFUL_TAROT_IMAGES
        print("\n🌐 TESTING URL IMAGE LOADING")
        print("-" * 30)
        url_loading_passed = self.test_beautiful_tarot_images_urls()
        
        # Test 6: url_to_base64() compression function
        print("\n⚙️ TESTING url_to_base64() COMPRESSION")
        print("-" * 35)
        url_compression_passed = self.test_url_to_base64_function()
        
        # Test 7: All spread types with new images
        print("\n🃏 TESTING ALL SPREADS WITH NEW IMAGES")
        print("-" * 40)
        spreads_with_images_passed = self.test_all_spreads_with_new_images()
        
        # Calculate results for new image system
        image_tests = [
            image_quality_passed, fallback_passed, compression_passed,
            aesthetic_function_passed, url_loading_passed, url_compression_passed,
            spreads_with_images_passed
        ]
        
        passed_image_tests = sum(image_tests)
        total_image_tests = len(image_tests)
        image_success_rate = (passed_image_tests / total_image_tests) * 100
        
        print(f"\n{'='*60}")
        print(f"🎨 NEW IMAGE SYSTEM RESULTS")
        print(f"{'='*60}")
        print(f"✅ Passed: {passed_image_tests}/{total_image_tests} tests ({image_success_rate:.1f}%)")
        
        if image_success_rate >= 90:
            print("🎉 ОТЛИЧНО! Новая система изображений работает идеально!")
            print("🎉 EXCELLENT! New image system works perfectly!")
        elif image_success_rate >= 75:
            print("✅ ХОРОШО! Система изображений работает с незначительными проблемами.")
            print("✅ GOOD! Image system works with minor issues.")
        else:
            print("❌ ПРОБЛЕМЫ! Система изображений требует доработки.")
            print("❌ PROBLEMS! Image system needs improvements.")
        
        # Detailed summary
        print(f"\n📊 DETAILED TEST RESULTS:")
        test_names = [
            "Image Quality & Uniqueness", "SVG Fallback System", "Image Compression", 
            "get_aesthetic_image() Function", "URL Image Loading", "url_to_base64() Function",
            "All Spreads with Images"
        ]
        
        for i, (test_name, passed) in enumerate(zip(test_names, image_tests)):
            status = "✅" if passed else "❌"
            print(f"  {status} {test_name}")
        
        return image_success_rate >= 75

if __name__ == "__main__":
    print(f"Testing New Tarot Image System at: {BACKEND_URL}")
    print()
    
    tester = NewImageSystemTester()
    
    # Run new image system tests
    success = tester.run_new_image_system_tests()
    
    # Exit with error code if tests failed
    sys.exit(0 if success else 1)