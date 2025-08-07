#!/usr/bin/env python3
"""
TatoAi Backend API Testing Suite
Tests all backend functionality for the tarot reading application
"""

import requests
import json
import os
from datetime import datetime
import sys

# Get backend URL from environment
BACKEND_URL = "https://1ea778e4-270b-4cd1-b1d9-1b0124068876.preview.emergentagent.com/api"

class TatoAiTester:
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

    def test_root_endpoint(self):
        """Test GET /api/ - welcome message"""
        try:
            response = self.session.get(f"{self.base_url}/")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "TatoAi" in data["message"]:
                    self.log_test("Root endpoint", True, f"Message: {data['message']}")
                    return True
                else:
                    self.log_test("Root endpoint", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Root endpoint", False, f"Status code: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Root endpoint", False, f"Exception: {str(e)}")
            return False

    def test_categories_endpoint(self):
        """Test GET /api/categories - question categories"""
        try:
            response = self.session.get(f"{self.base_url}/categories")
            
            if response.status_code == 200:
                data = response.json()
                if "categories" in data and isinstance(data["categories"], list):
                    categories = data["categories"]
                    expected_categories = ["love", "career", "finance", "general"]
                    found_categories = [cat["id"] for cat in categories]
                    
                    if all(cat in found_categories for cat in expected_categories):
                        self.log_test("Categories endpoint", True, f"Found {len(categories)} categories: {found_categories}")
                        return True
                    else:
                        self.log_test("Categories endpoint", False, f"Missing expected categories. Found: {found_categories}")
                        return False
                else:
                    self.log_test("Categories endpoint", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Categories endpoint", False, f"Status code: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Categories endpoint", False, f"Exception: {str(e)}")
            return False

    def test_spreads_endpoint(self):
        """Test GET /api/spreads - spread types"""
        try:
            response = self.session.get(f"{self.base_url}/spreads")
            
            if response.status_code == 200:
                data = response.json()
                if "spreads" in data and isinstance(data["spreads"], dict):
                    spreads = data["spreads"]
                    expected_spreads = ["one_card", "three_cards", "celtic_cross"]
                    
                    if all(spread in spreads for spread in expected_spreads):
                        spread_info = []
                        for spread_id, spread_data in spreads.items():
                            spread_info.append(f"{spread_id} ({spread_data['cards_count']} cards)")
                        
                        self.log_test("Spreads endpoint", True, f"Found spreads: {', '.join(spread_info)}")
                        return True
                    else:
                        self.log_test("Spreads endpoint", False, f"Missing expected spreads. Found: {list(spreads.keys())}")
                        return False
                else:
                    self.log_test("Spreads endpoint", False, "Invalid response format", data)
                    return False
            else:
                self.log_test("Spreads endpoint", False, f"Status code: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Spreads endpoint", False, f"Exception: {str(e)}")
            return False

    def test_create_reading(self, category="love", spread_type="one_card", question="Что ждет меня в любви?"):
        """Test POST /api/reading - create tarot reading"""
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
                data = response.json()
                required_fields = ["id", "question", "category", "spread_type", "cards", "positions", "interpretation", "created_at"]
                
                if all(field in data for field in required_fields):
                    # Validate cards structure
                    cards = data["cards"]
                    if isinstance(cards, list) and len(cards) > 0:
                        card = cards[0]
                        card_fields = ["id", "name", "name_en", "type", "image", "keywords", "upright_meaning", "reversed_meaning", "is_reversed"]
                        
                        if all(field in card for field in card_fields):
                            # Check if interpretation is in Russian
                            interpretation = data["interpretation"]
                            has_russian = any(ord(char) >= 1040 and ord(char) <= 1103 for char in interpretation)
                            
                            details = f"Reading created - Category: {category}, Spread: {spread_type}, Cards: {len(cards)}, Russian interpretation: {has_russian}"
                            self.log_test(f"Create reading ({category}/{spread_type})", True, details)
                            return data
                        else:
                            self.log_test(f"Create reading ({category}/{spread_type})", False, "Invalid card structure", card)
                            return None
                    else:
                        self.log_test(f"Create reading ({category}/{spread_type})", False, "No cards in response", data)
                        return None
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test(f"Create reading ({category}/{spread_type})", False, f"Missing fields: {missing_fields}", data)
                    return None
            else:
                self.log_test(f"Create reading ({category}/{spread_type})", False, f"Status code: {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test(f"Create reading ({category}/{spread_type})", False, f"Exception: {str(e)}")
            return None

    def test_reading_history(self):
        """Test GET /api/readings - reading history"""
        try:
            response = self.session.get(f"{self.base_url}/readings")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Reading history", True, f"Retrieved {len(data)} readings from history")
                    return data
                else:
                    self.log_test("Reading history", False, "Response is not a list", data)
                    return None
            else:
                self.log_test("Reading history", False, f"Status code: {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Reading history", False, f"Exception: {str(e)}")
            return None

    def test_openai_integration(self):
        """Test OpenAI integration by creating readings and checking interpretations"""
        try:
            # Create a reading and check if interpretation looks AI-generated
            reading = self.test_create_reading("general", "three_cards", "Какие перемены ждут меня в ближайшем будущем?")
            
            if reading and "interpretation" in reading:
                interpretation = reading["interpretation"]
                
                # Check for Russian text
                has_russian = any(ord(char) >= 1040 and ord(char) <= 1103 for char in interpretation)
                
                # Check for reasonable length (AI should generate substantial text)
                is_substantial = len(interpretation) > 200
                
                # Check for tarot-related keywords in Russian
                tarot_keywords = ["карт", "расклад", "толкование", "будущее", "прошлое", "настоящее", "совет", "ситуац"]
                has_tarot_content = any(keyword in interpretation.lower() for keyword in tarot_keywords)
                
                if has_russian and is_substantial and has_tarot_content:
                    self.log_test("OpenAI integration", True, f"AI interpretation generated - Length: {len(interpretation)} chars, Russian: {has_russian}")
                    return True
                else:
                    details = f"Interpretation quality check failed - Russian: {has_russian}, Length: {len(interpretation)}, Tarot content: {has_tarot_content}"
                    self.log_test("OpenAI integration", False, details, interpretation[:200] + "...")
                    return False
            else:
                self.log_test("OpenAI integration", False, "No interpretation in reading response")
                return False
                
        except Exception as e:
            self.log_test("OpenAI integration", False, f"Exception: {str(e)}")
            return False

    def test_database_persistence(self):
        """Test MongoDB database persistence"""
        try:
            # Get initial count
            initial_history = self.test_reading_history()
            initial_count = len(initial_history) if initial_history else 0
            
            # Create a new reading
            test_question = f"Тестовый вопрос для проверки базы данных - {datetime.now().isoformat()}"
            new_reading = self.test_create_reading("finance", "one_card", test_question)
            
            if new_reading:
                # Get updated history
                updated_history = self.test_reading_history()
                updated_count = len(updated_history) if updated_history else 0
                
                # Check if count increased
                if updated_count > initial_count:
                    # Check if our reading is in the history
                    found_reading = any(reading.get("question") == test_question for reading in updated_history)
                    
                    if found_reading:
                        self.log_test("Database persistence", True, f"Reading saved and retrieved from database. Count: {initial_count} -> {updated_count}")
                        return True
                    else:
                        self.log_test("Database persistence", False, "Reading not found in history after creation")
                        return False
                else:
                    self.log_test("Database persistence", False, f"Reading count did not increase: {initial_count} -> {updated_count}")
                    return False
            else:
                self.log_test("Database persistence", False, "Failed to create reading for persistence test")
                return False
                
        except Exception as e:
            self.log_test("Database persistence", False, f"Exception: {str(e)}")
            return False

    def test_different_combinations(self):
        """Test different category and spread combinations"""
        combinations = [
            ("love", "one_card", "Найду ли я любовь в этом году?"),
            ("career", "three_cards", "Как развивается моя карьера?"),
            ("finance", "celtic_cross", "Какие финансовые возможности меня ждут?"),
            ("general", "three_cards", "Что важно знать о моем будущем?")
        ]
        
        success_count = 0
        for category, spread_type, question in combinations:
            reading = self.test_create_reading(category, spread_type, question)
            if reading:
                success_count += 1
        
        total_tests = len(combinations)
        if success_count == total_tests:
            self.log_test("Different combinations", True, f"All {total_tests} combinations worked successfully")
            return True
        else:
            self.log_test("Different combinations", False, f"Only {success_count}/{total_tests} combinations worked")
            return False

    def test_error_handling(self):
        """Test error handling for invalid requests"""
        try:
            # Test invalid spread type
            invalid_payload = {
                "category": "love",
                "spread_type": "invalid_spread",
                "question": "Test question"
            }
            
            response = self.session.post(
                f"{self.base_url}/reading",
                json=invalid_payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 400:
                self.log_test("Error handling", True, "Invalid spread type correctly rejected with 400 status")
                return True
            else:
                self.log_test("Error handling", False, f"Expected 400 status for invalid spread, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Error handling", False, f"Exception: {str(e)}")
            return False

    def test_card_back_endpoint(self):
        """Test GET /api/card-back - card back image"""
        try:
            response = self.session.get(f"{self.base_url}/card-back")
            
            if response.status_code == 200:
                data = response.json()
                if "card_back" in data:
                    card_back = data["card_back"]
                    
                    # Check if it's a valid base64 image
                    if card_back.startswith("data:image/") and "base64," in card_back:
                        # Extract base64 part
                        base64_part = card_back.split("base64,")[1]
                        
                        # Check if base64 is not empty and has reasonable length
                        if len(base64_part) > 100:
                            self.log_test("Card back endpoint", True, f"Card back image loaded - Format: {card_back.split(';')[0]}, Size: {len(base64_part)} chars")
                            return True
                        else:
                            self.log_test("Card back endpoint", False, f"Card back image too small: {len(base64_part)} chars")
                            return False
                    else:
                        self.log_test("Card back endpoint", False, "Invalid image format - not base64 data URL")
                        return False
                else:
                    self.log_test("Card back endpoint", False, "No card_back field in response", data)
                    return False
            else:
                self.log_test("Card back endpoint", False, f"Status code: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Card back endpoint", False, f"Exception: {str(e)}")
            return False

    def test_card_images_quality(self):
        """Test card images quality and uniqueness"""
        try:
            # Create multiple readings to get different cards
            readings = []
            for i in range(3):
                reading = self.test_create_reading("general", "three_cards", f"Тест изображений карт #{i+1}")
                if reading:
                    readings.append(reading)
            
            if len(readings) < 2:
                self.log_test("Card images quality", False, "Could not create enough readings for image testing")
                return False
            
            all_images = []
            valid_images = 0
            
            for reading in readings:
                cards = reading.get("cards", [])
                for card in cards:
                    image = card.get("image", "")
                    
                    # Check if image is valid base64 data URL
                    if image.startswith("data:image/") and "base64," in image:
                        base64_part = image.split("base64,")[1]
                        
                        # Check if base64 is substantial (not empty or too small)
                        if len(base64_part) > 100:
                            valid_images += 1
                            all_images.append(base64_part)
                        else:
                            self.log_test("Card images quality", False, f"Card {card.get('name', 'Unknown')} has too small image: {len(base64_part)} chars")
                            return False
                    else:
                        self.log_test("Card images quality", False, f"Card {card.get('name', 'Unknown')} has invalid image format")
                        return False
            
            # Check for image uniqueness (at least some should be different)
            unique_images = len(set(all_images))
            total_images = len(all_images)
            
            if unique_images >= 2:  # At least 2 different images
                self.log_test("Card images quality", True, f"Images valid - Total: {total_images}, Valid: {valid_images}, Unique: {unique_images}")
                return True
            else:
                self.log_test("Card images quality", False, f"All images are identical - Total: {total_images}, Unique: {unique_images}")
                return False
                
        except Exception as e:
            self.log_test("Card images quality", False, f"Exception: {str(e)}")
            return False

    def test_aesthetic_images_integration(self):
        """Test new aesthetic tarot card images integration"""
        try:
            # Test reading creation with focus on image data
            reading = self.test_create_reading("love", "one_card", "Проверка эстетичных изображений таро-карт")
            
            if not reading:
                self.log_test("Aesthetic images integration", False, "Could not create reading for image testing")
                return False
            
            cards = reading.get("cards", [])
            if not cards:
                self.log_test("Aesthetic images integration", False, "No cards in reading response")
                return False
            
            card = cards[0]
            image = card.get("image", "")
            
            # Detailed image validation
            if not image:
                self.log_test("Aesthetic images integration", False, "Card has no image field")
                return False
            
            # Check if it's a proper data URL
            if not image.startswith("data:image/"):
                self.log_test("Aesthetic images integration", False, "Image is not a data URL")
                return False
            
            # Check for base64 encoding
            if "base64," not in image:
                self.log_test("Aesthetic images integration", False, "Image is not base64 encoded")
                return False
            
            # Extract and validate base64 content
            try:
                base64_part = image.split("base64,")[1]
                
                # Check substantial size (aesthetic images should be larger)
                if len(base64_part) < 1000:
                    self.log_test("Aesthetic images integration", False, f"Image too small for aesthetic image: {len(base64_part)} chars")
                    return False
                
                # Try to decode base64 to verify it's valid
                import base64
                decoded = base64.b64decode(base64_part)
                
                if len(decoded) < 500:
                    self.log_test("Aesthetic images integration", False, f"Decoded image too small: {len(decoded)} bytes")
                    return False
                
                # Check image format from data URL
                image_format = image.split(";")[0].replace("data:image/", "")
                
                self.log_test("Aesthetic images integration", True, 
                             f"Aesthetic image loaded - Card: {card.get('name', 'Unknown')}, Format: {image_format}, Base64 size: {len(base64_part)} chars, Decoded size: {len(decoded)} bytes")
                return True
                
            except Exception as decode_error:
                self.log_test("Aesthetic images integration", False, f"Invalid base64 encoding: {str(decode_error)}")
                return False
                
        except Exception as e:
            self.log_test("Aesthetic images integration", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all tests"""
        print("🔮 Starting TatoAi Backend API Tests")
        print("=" * 50)
        
        # Basic endpoint tests
        self.test_root_endpoint()
        self.test_categories_endpoint()
        self.test_spreads_endpoint()
        
        # Core functionality tests
        self.test_create_reading()
        self.test_reading_history()
        
        # Advanced tests
        self.test_openai_integration()
        self.test_database_persistence()
        self.test_different_combinations()
        self.test_error_handling()
        
        # Summary
        print("=" * 50)
        print("🔮 Test Summary")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        return passed_tests, failed_tests, self.test_results

if __name__ == "__main__":
    print(f"Testing TatoAi Backend API at: {BACKEND_URL}")
    print()
    
    tester = TatoAiTester()
    passed, failed, results = tester.run_all_tests()
    
    # Exit with error code if tests failed
    sys.exit(0 if failed == 0 else 1)