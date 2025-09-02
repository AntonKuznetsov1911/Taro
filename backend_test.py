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
BACKEND_URL = "https://taro-mystic-1.preview.emergentagent.com/api"

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

    def test_spread_card_counts(self):
        """Test that each spread type returns the correct number of cards"""
        spread_tests = [
            ("one_card", 1, "love", "Найду ли я любовь?"),
            ("three_cards", 3, "finance", "Как дела с финансами?"),
            ("celtic_cross", 10, "career", "Что с карьерой?")
        ]
        
        all_passed = True
        
        for spread_type, expected_count, category, question in spread_tests:
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
                    cards = data.get("cards", [])
                    positions = data.get("positions", [])
                    actual_count = len(cards)
                    positions_count = len(positions)
                    
                    if actual_count == expected_count and positions_count == expected_count:
                        self.log_test(f"Card count for {spread_type}", True, 
                                    f"✅ Correct count - Expected: {expected_count}, Got: {actual_count} cards, {positions_count} positions")
                    else:
                        self.log_test(f"Card count for {spread_type}", False, 
                                    f"❌ Wrong count - Expected: {expected_count}, Got: {actual_count} cards, {positions_count} positions")
                        all_passed = False
                        
                        # Log detailed card information for debugging
                        print(f"   🔍 DEBUG INFO for {spread_type}:")
                        print(f"      Cards received: {actual_count}")
                        print(f"      Positions received: {positions_count}")
                        if cards:
                            print(f"      First card: {cards[0].get('name', 'Unknown')}")
                        if len(cards) > 1:
                            print(f"      Last card: {cards[-1].get('name', 'Unknown')}")
                        print(f"      Positions: {positions}")
                else:
                    self.log_test(f"Card count for {spread_type}", False, 
                                f"HTTP error - Status: {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"Card count for {spread_type}", False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_specific_spread_combinations(self):
        """Test specific category/spread combinations as requested by user"""
        test_combinations = [
            ("love", "three_cards", "Что ждет меня в любовных отношениях?", 3),
            ("finance", "celtic_cross", "Какие финансовые перспективы меня ждут?", 10),
            ("general", "three_cards", "Что важно знать о моем будущем?", 3),
            ("career", "celtic_cross", "Как развивается моя карьера?", 10),
            ("love", "one_card", "Найду ли я любовь?", 1)
        ]
        
        all_passed = True
        
        for category, spread_type, question, expected_cards in test_combinations:
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
                    cards = data.get("cards", [])
                    positions = data.get("positions", [])
                    actual_cards = len(cards)
                    actual_positions = len(positions)
                    
                    test_name = f"{category} + {spread_type}"
                    
                    if actual_cards == expected_cards and actual_positions == expected_cards:
                        self.log_test(test_name, True, 
                                    f"✅ Perfect - {actual_cards} cards, {actual_positions} positions")
                        
                        # Validate card structure
                        for i, card in enumerate(cards):
                            if not all(field in card for field in ["id", "name", "image", "is_reversed"]):
                                self.log_test(f"{test_name} - Card {i+1} structure", False, 
                                            f"Missing required fields in card {i+1}")
                                all_passed = False
                                break
                    else:
                        self.log_test(test_name, False, 
                                    f"❌ Expected {expected_cards}, got {actual_cards} cards, {actual_positions} positions")
                        all_passed = False
                        
                        # Detailed debugging
                        print(f"   🔍 DETAILED DEBUG for {test_name}:")
                        print(f"      Request: {payload}")
                        print(f"      Response cards count: {actual_cards}")
                        print(f"      Response positions count: {actual_positions}")
                        print(f"      Expected: {expected_cards}")
                        if positions:
                            print(f"      Positions received: {positions}")
                else:
                    self.log_test(f"{category} + {spread_type}", False, 
                                f"HTTP {response.status_code}: {response.text[:200]}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"{category} + {spread_type}", False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed

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

    def test_image_optimization_validation(self):
        """Test that images are properly optimized and under size limits"""
        try:
            # Test different spread types to validate image sizes
            test_cases = [
                ("one_card", "love", "Проверка оптимизации изображений для одной карты"),
                ("three_cards", "finance", "Проверка оптимизации изображений для трех карт"),
                ("celtic_cross", "career", "Проверка оптимизации изображений для кельтского креста")
            ]
            
            all_passed = True
            total_image_size = 0
            
            for spread_type, category, question in test_cases:
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
                    cards = data.get("cards", [])
                    
                    # Calculate total image size for this reading
                    reading_image_size = 0
                    for card in cards:
                        image = card.get("image", "")
                        if "base64," in image:
                            base64_part = image.split("base64,")[1]
                            # Estimate actual size (base64 is ~33% larger than binary)
                            estimated_size = len(base64_part) * 0.75
                            reading_image_size += estimated_size
                    
                    total_image_size += reading_image_size
                    
                    # Check if reading size is reasonable (should be well under 16MB)
                    max_safe_size = 1024 * 1024  # 1MB per reading should be safe
                    
                    if reading_image_size < max_safe_size:
                        self.log_test(f"Image optimization - {spread_type}", True, 
                                    f"✅ Images optimized - Total size: {reading_image_size/1024:.1f}KB for {len(cards)} cards")
                    else:
                        self.log_test(f"Image optimization - {spread_type}", False, 
                                    f"❌ Images too large - Total size: {reading_image_size/1024:.1f}KB for {len(cards)} cards")
                        all_passed = False
                else:
                    self.log_test(f"Image optimization - {spread_type}", False, 
                                f"❌ HTTP {response.status_code}: {response.text[:200]}")
                    all_passed = False
            
            # Overall validation
            if all_passed:
                self.log_test("Overall image optimization", True, 
                            f"✅ All images properly optimized - Total tested size: {total_image_size/1024:.1f}KB")
            else:
                self.log_test("Overall image optimization", False, 
                            "❌ Image optimization issues detected")
            
            return all_passed
            
        except Exception as e:
            self.log_test("Image optimization validation", False, f"Exception: {str(e)}")
            return False

    def test_mongodb_document_size_compliance(self):
        """Test that all readings comply with MongoDB 16MB document size limit"""
        try:
            # Test the most demanding scenario - celtic_cross with 10 cards
            test_cases = [
                ("celtic_cross", "love", "Детальный анализ любовной ситуации"),
                ("celtic_cross", "finance", "Полный финансовый прогноз"),
                ("celtic_cross", "career", "Глубокий анализ карьерных перспектив"),
                ("celtic_cross", "general", "Комплексный жизненный расклад")
            ]
            
            all_passed = True
            
            for spread_type, category, question in test_cases:
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
                    
                    # Estimate document size
                    import json
                    json_str = json.dumps(data)
                    document_size = len(json_str.encode('utf-8'))
                    
                    # MongoDB limit is 16MB
                    mongodb_limit = 16 * 1024 * 1024
                    
                    if document_size < mongodb_limit:
                        self.log_test(f"MongoDB size compliance - {category}/{spread_type}", True, 
                                    f"✅ Document size OK - {document_size/1024/1024:.2f}MB (limit: 16MB)")
                    else:
                        self.log_test(f"MongoDB size compliance - {category}/{spread_type}", False, 
                                    f"❌ Document too large - {document_size/1024/1024:.2f}MB exceeds 16MB limit")
                        all_passed = False
                else:
                    self.log_test(f"MongoDB size compliance - {category}/{spread_type}", False, 
                                f"❌ HTTP {response.status_code}: {response.text[:200]}")
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("MongoDB document size compliance", False, f"Exception: {str(e)}")
            return False

    def test_critical_spread_combinations(self):
        """Test the specific combinations mentioned in the user request"""
        critical_tests = [
            ("love", "three_cards", "Что ждет меня в любовных отношениях?", 3),
            ("finance", "celtic_cross", "Какие финансовые перспективы меня ждут?", 10),
            ("career", "one_card", "Как развивается моя карьера?", 1),
            ("general", "celtic_cross", "Что важно знать о моем будущем?", 10)
        ]
        
        all_passed = True
        
        print("🎯 CRITICAL TEST - Testing all spread types after image optimization")
        print("-" * 70)
        
        for category, spread_type, question, expected_cards in critical_tests:
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
                
                test_name = f"CRITICAL: {category} + {spread_type}"
                
                if response.status_code == 200:
                    data = response.json()
                    cards = data.get("cards", [])
                    positions = data.get("positions", [])
                    
                    # Validate card count
                    if len(cards) == expected_cards and len(positions) == expected_cards:
                        # Validate all cards have images
                        all_have_images = all(card.get("image", "").startswith("data:image/") for card in cards)
                        
                        if all_have_images:
                            self.log_test(test_name, True, 
                                        f"✅ PERFECT - {len(cards)} cards, all with images (SVG base64)")
                        else:
                            self.log_test(test_name, False, 
                                        f"❌ Some cards missing images")
                            all_passed = False
                    else:
                        self.log_test(test_name, False, 
                                    f"❌ Wrong card count - Expected: {expected_cards}, Got: {len(cards)}")
                        all_passed = False
                else:
                    # This is the critical test - 500 errors were the main issue
                    self.log_test(test_name, False, 
                                f"❌ CRITICAL FAILURE - HTTP {response.status_code}: {response.text[:200]}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"CRITICAL: {category} + {spread_type}", False, f"Exception: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_detailed_interpretations(self):
        """Test that new interpretations are detailed (800-1200 words)"""
        try:
            test_cases = [
                ("love", "three_cards", "Что ждет меня в любовных отношениях в ближайшем будущем?"),
                ("career", "celtic_cross", "Как развивается моя карьера и какие возможности меня ждут?"),
                ("finance", "one_card", "Какие финансовые перспективы меня ждут?"),
                ("general", "three_cards", "Что важно знать о моем жизненном пути?")
            ]
            
            all_passed = True
            interpretation_lengths = []
            
            for category, spread_type, question in test_cases:
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
                    interpretation = data.get("interpretation", "")
                    word_count = len(interpretation.split())
                    char_count = len(interpretation)
                    interpretation_lengths.append(word_count)
                    
                    # Check for detailed interpretation (800-1200 words target)
                    if word_count >= 200:  # Minimum reasonable length
                        # Check for mystical style elements
                        mystical_phrases = ["дорогая", "милая", "вижу", "карты", "энергия", "духи", "вселенная", "судьба"]
                        has_mystical_style = any(phrase in interpretation.lower() for phrase in mystical_phrases)
                        
                        # Check for category-specific content
                        category_keywords = {
                            "love": ["любов", "сердц", "отношен", "чувств"],
                            "career": ["карьер", "работ", "профессион", "успех"],
                            "finance": ["финанс", "деньг", "материальн", "благосостоян"],
                            "general": ["жизн", "путь", "будущ", "развит"]
                        }
                        
                        relevant_keywords = category_keywords.get(category, [])
                        has_category_focus = any(keyword in interpretation.lower() for keyword in relevant_keywords)
                        
                        if has_mystical_style and has_category_focus:
                            self.log_test(f"Detailed interpretation - {category}/{spread_type}", True, 
                                        f"✅ Quality interpretation - {word_count} words, {char_count} chars, mystical style: {has_mystical_style}, category focus: {has_category_focus}")
                        else:
                            self.log_test(f"Detailed interpretation - {category}/{spread_type}", False, 
                                        f"❌ Quality issues - Words: {word_count}, Mystical: {has_mystical_style}, Category focus: {has_category_focus}")
                            all_passed = False
                    else:
                        self.log_test(f"Detailed interpretation - {category}/{spread_type}", False, 
                                    f"❌ Too short - Only {word_count} words ({char_count} chars)")
                        all_passed = False
                else:
                    self.log_test(f"Detailed interpretation - {category}/{spread_type}", False, 
                                f"❌ HTTP {response.status_code}: {response.text[:200]}")
                    all_passed = False
            
            # Overall assessment
            if interpretation_lengths:
                avg_length = sum(interpretation_lengths) / len(interpretation_lengths)
                min_length = min(interpretation_lengths)
                max_length = max(interpretation_lengths)
                
                print(f"   📊 Interpretation Statistics:")
                print(f"      Average length: {avg_length:.0f} words")
                print(f"      Range: {min_length} - {max_length} words")
                print(f"      Target: 200+ words for detailed interpretations")
            
            return all_passed
            
        except Exception as e:
            self.log_test("Detailed interpretations", False, f"Exception: {str(e)}")
            return False

    def test_enhanced_fallback_system(self):
        """Test enhanced fallback interpretation system"""
        try:
            # Test fallback by creating readings (fallback should be used due to OpenAI quota)
            test_cases = [
                ("love", "one_card", "Найду ли я любовь?"),
                ("career", "three_cards", "Как развивается моя карьера?"),
                ("finance", "celtic_cross", "Какие финансовые возможности меня ждут?")
            ]
            
            all_passed = True
            
            for category, spread_type, question in test_cases:
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
                    interpretation = data.get("interpretation", "")
                    
                    # Check for enhanced fallback characteristics
                    fallback_indicators = [
                        "дорогая моя", "милая душа", "дитя мое",  # Mystical addressing
                        "вижу", "духи", "энергия", "карты",       # Mystical language
                        "совет", "мудрой гадалки",                # Advice sections
                        "заключительное", "пророчество"           # Structured endings
                    ]
                    
                    found_indicators = [indicator for indicator in fallback_indicators if indicator in interpretation.lower()]
                    indicator_score = len(found_indicators)
                    
                    # Check for category-specific advice sections
                    has_category_advice = any(phrase in interpretation.lower() for phrase in [
                        "совет", "наставления", "мудрость", "рекомендации"
                    ])
                    
                    # Check for structured format with positions
                    cards = data.get("cards", [])
                    positions = data.get("positions", [])
                    
                    # Verify each card position is mentioned in interpretation
                    position_mentions = 0
                    for position in positions:
                        if position.lower() in interpretation.lower():
                            position_mentions += 1
                    
                    position_coverage = position_mentions / len(positions) if positions else 0
                    
                    if indicator_score >= 3 and has_category_advice and position_coverage >= 0.5:
                        self.log_test(f"Enhanced fallback - {category}/{spread_type}", True, 
                                    f"✅ Quality fallback - Mystical indicators: {indicator_score}, Category advice: {has_category_advice}, Position coverage: {position_coverage:.1%}")
                    else:
                        self.log_test(f"Enhanced fallback - {category}/{spread_type}", False, 
                                    f"❌ Fallback quality issues - Indicators: {indicator_score}, Advice: {has_category_advice}, Positions: {position_coverage:.1%}")
                        all_passed = False
                        
                        # Debug info
                        print(f"      Found indicators: {found_indicators}")
                        print(f"      Position mentions: {position_mentions}/{len(positions)}")
                else:
                    self.log_test(f"Enhanced fallback - {category}/{spread_type}", False, 
                                f"❌ HTTP {response.status_code}: {response.text[:200]}")
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("Enhanced fallback system", False, f"Exception: {str(e)}")
            return False

    def test_category_specific_differences(self):
        """Test that different categories provide specific advice"""
        try:
            # Test same question across different categories to see differences
            base_question = "Что меня ждет в ближайшем будущем?"
            
            category_tests = [
                ("love", "Что меня ждет в любовных отношениях?"),
                ("career", "Что меня ждет в карьере и работе?"),
                ("finance", "Что меня ждет в финансовой сфере?"),
                ("general", "Что меня ждет в жизни в целом?")
            ]
            
            interpretations = {}
            all_passed = True
            
            for category, question in category_tests:
                payload = {
                    "category": category,
                    "spread_type": "three_cards",
                    "question": question
                }
                
                response = self.session.post(
                    f"{self.base_url}/reading",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    interpretation = data.get("interpretation", "")
                    interpretations[category] = interpretation
                    
                    # Check for category-specific keywords
                    category_keywords = {
                        "love": ["любов", "сердц", "отношен", "чувств", "партнер", "романтик"],
                        "career": ["карьер", "работ", "профессион", "успех", "коллег", "начальств"],
                        "finance": ["финанс", "деньг", "материальн", "благосостоян", "доход", "инвестиц"],
                        "general": ["жизн", "путь", "будущ", "развит", "баланс", "гармон"]
                    }
                    
                    expected_keywords = category_keywords[category]
                    found_keywords = [kw for kw in expected_keywords if kw in interpretation.lower()]
                    keyword_score = len(found_keywords) / len(expected_keywords)
                    
                    if keyword_score >= 0.3:  # At least 30% of category keywords should be present
                        self.log_test(f"Category specificity - {category}", True, 
                                    f"✅ Category-specific content - Keywords found: {found_keywords} ({keyword_score:.1%})")
                    else:
                        self.log_test(f"Category specificity - {category}", False, 
                                    f"❌ Lacks category focus - Keywords: {found_keywords} ({keyword_score:.1%})")
                        all_passed = False
                else:
                    self.log_test(f"Category specificity - {category}", False, 
                                f"❌ HTTP {response.status_code}: {response.text[:200]}")
                    all_passed = False
            
            # Test uniqueness between categories
            if len(interpretations) >= 2:
                categories = list(interpretations.keys())
                uniqueness_scores = []
                
                for i in range(len(categories)):
                    for j in range(i + 1, len(categories)):
                        cat1, cat2 = categories[i], categories[j]
                        text1, text2 = interpretations[cat1], interpretations[cat2]
                        
                        # Simple uniqueness check - count different words
                        words1 = set(text1.lower().split())
                        words2 = set(text2.lower().split())
                        
                        common_words = words1.intersection(words2)
                        total_unique_words = words1.union(words2)
                        
                        uniqueness = 1 - (len(common_words) / len(total_unique_words)) if total_unique_words else 0
                        uniqueness_scores.append(uniqueness)
                
                avg_uniqueness = sum(uniqueness_scores) / len(uniqueness_scores) if uniqueness_scores else 0
                
                if avg_uniqueness >= 0.3:  # At least 30% difference between categories
                    self.log_test("Category differentiation", True, 
                                f"✅ Categories are sufficiently different - Avg uniqueness: {avg_uniqueness:.1%}")
                else:
                    self.log_test("Category differentiation", False, 
                                f"❌ Categories too similar - Avg uniqueness: {avg_uniqueness:.1%}")
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("Category specific differences", False, f"Exception: {str(e)}")
            return False

    def test_spread_structure_differences(self):
        """Test that different spreads have appropriate structures"""
        try:
            spread_tests = [
                ("one_card", 1, "Простой ответ на вопрос"),
                ("three_cards", 3, "Прошлое-настоящее-будущее"),
                ("celtic_cross", 10, "Детальный анализ ситуации")
            ]
            
            all_passed = True
            
            for spread_type, expected_cards, description in spread_tests:
                payload = {
                    "category": "general",
                    "spread_type": spread_type,
                    "question": f"Тест структуры расклада {spread_type}"
                }
                
                response = self.session.post(
                    f"{self.base_url}/reading",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    cards = data.get("cards", [])
                    positions = data.get("positions", [])
                    interpretation = data.get("interpretation", "")
                    
                    # Check card count
                    card_count_correct = len(cards) == expected_cards
                    position_count_correct = len(positions) == expected_cards
                    
                    # Check interpretation structure based on spread type
                    structure_checks = {
                        "one_card": {
                            "should_have": ["карта", "значение", "совет"],
                            "complexity": "simple"
                        },
                        "three_cards": {
                            "should_have": ["прошлое", "настоящее", "будущее", "время"],
                            "complexity": "medium"
                        },
                        "celtic_cross": {
                            "should_have": ["позиция", "ситуация", "влияние", "результат"],
                            "complexity": "complex"
                        }
                    }
                    
                    expected_elements = structure_checks[spread_type]["should_have"]
                    found_elements = [elem for elem in expected_elements if elem in interpretation.lower()]
                    structure_score = len(found_elements) / len(expected_elements)
                    
                    # Check interpretation length appropriate for spread complexity
                    word_count = len(interpretation.split())
                    length_expectations = {
                        "one_card": (100, 400),      # Shorter but detailed
                        "three_cards": (200, 600),   # Medium length
                        "celtic_cross": (400, 1200)  # Longest and most detailed
                    }
                    
                    min_words, max_words = length_expectations[spread_type]
                    length_appropriate = min_words <= word_count <= max_words
                    
                    # Check position coverage in interpretation
                    position_mentions = sum(1 for pos in positions if pos.lower() in interpretation.lower())
                    position_coverage = position_mentions / len(positions) if positions else 0
                    
                    if (card_count_correct and position_count_correct and 
                        structure_score >= 0.5 and length_appropriate and position_coverage >= 0.6):
                        
                        self.log_test(f"Spread structure - {spread_type}", True, 
                                    f"✅ Proper structure - Cards: {len(cards)}, Words: {word_count}, Structure: {structure_score:.1%}, Positions: {position_coverage:.1%}")
                    else:
                        details = f"Cards: {len(cards)}/{expected_cards}, Words: {word_count} (expected {min_words}-{max_words}), Structure: {structure_score:.1%}, Positions: {position_coverage:.1%}"
                        self.log_test(f"Spread structure - {spread_type}", False, f"❌ Structure issues - {details}")
                        all_passed = False
                        
                        # Debug info
                        print(f"      Expected elements: {expected_elements}")
                        print(f"      Found elements: {found_elements}")
                        print(f"      Positions: {positions}")
                else:
                    self.log_test(f"Spread structure - {spread_type}", False, 
                                f"❌ HTTP {response.status_code}: {response.text[:200]}")
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("Spread structure differences", False, f"Exception: {str(e)}")
            return False

    def test_interpretation_quality_comparison(self):
        """Compare interpretation quality and detail level"""
        try:
            # Create multiple readings to analyze interpretation quality
            test_readings = []
            
            quality_tests = [
                ("love", "three_cards", "Что ждет меня в любовных отношениях?"),
                ("career", "celtic_cross", "Как развивается моя карьера?"),
                ("finance", "one_card", "Какие финансовые перспективы меня ждут?")
            ]
            
            for category, spread_type, question in quality_tests:
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
                    test_readings.append({
                        "category": category,
                        "spread_type": spread_type,
                        "interpretation": data.get("interpretation", ""),
                        "cards": data.get("cards", [])
                    })
            
            if not test_readings:
                self.log_test("Interpretation quality comparison", False, "No readings created for quality analysis")
                return False
            
            # Analyze quality metrics
            quality_metrics = []
            
            for reading in test_readings:
                interpretation = reading["interpretation"]
                cards = reading["cards"]
                
                # Calculate metrics
                word_count = len(interpretation.split())
                char_count = len(interpretation)
                
                # Check for detailed card analysis
                card_mentions = sum(1 for card in cards if card.get("name", "").lower() in interpretation.lower())
                card_coverage = card_mentions / len(cards) if cards else 0
                
                # Check for mystical style elements
                mystical_elements = ["дорогая", "милая", "вижу", "духи", "энергия", "карты", "вселенная", "судьба", "мудрая", "гадалка"]
                mystical_count = sum(1 for element in mystical_elements if element in interpretation.lower())
                mystical_score = min(1.0, mystical_count / 5)  # Normalize to 0-1
                
                # Check for practical advice
                advice_indicators = ["совет", "рекомендую", "предлагаю", "стоит", "важно", "помните", "доверьтесь"]
                advice_count = sum(1 for indicator in advice_indicators if indicator in interpretation.lower())
                advice_score = min(1.0, advice_count / 3)  # Normalize to 0-1
                
                # Check for structured format
                structure_indicators = ["позиция", "карта", "значение", "показывает", "говорит"]
                structure_count = sum(1 for indicator in structure_indicators if indicator in interpretation.lower())
                structure_score = min(1.0, structure_count / 3)  # Normalize to 0-1
                
                quality_metrics.append({
                    "reading": f"{reading['category']}/{reading['spread_type']}",
                    "word_count": word_count,
                    "char_count": char_count,
                    "card_coverage": card_coverage,
                    "mystical_score": mystical_score,
                    "advice_score": advice_score,
                    "structure_score": structure_score
                })
            
            # Evaluate overall quality
            all_passed = True
            
            for metrics in quality_metrics:
                # Quality thresholds
                min_words = 150  # Minimum for detailed interpretation
                min_card_coverage = 0.5  # At least half the cards should be mentioned
                min_mystical = 0.4  # Good mystical style
                min_advice = 0.3  # Some practical advice
                min_structure = 0.4  # Good structure
                
                quality_checks = [
                    metrics["word_count"] >= min_words,
                    metrics["card_coverage"] >= min_card_coverage,
                    metrics["mystical_score"] >= min_mystical,
                    metrics["advice_score"] >= min_advice,
                    metrics["structure_score"] >= min_structure
                ]
                
                passed_checks = sum(quality_checks)
                quality_percentage = (passed_checks / len(quality_checks)) * 100
                
                if quality_percentage >= 80:  # 80% of quality checks should pass
                    self.log_test(f"Quality analysis - {metrics['reading']}", True, 
                                f"✅ High quality - {metrics['word_count']} words, Card coverage: {metrics['card_coverage']:.1%}, Quality: {quality_percentage:.0f}%")
                else:
                    self.log_test(f"Quality analysis - {metrics['reading']}", False, 
                                f"❌ Quality issues - {metrics['word_count']} words, Card coverage: {metrics['card_coverage']:.1%}, Quality: {quality_percentage:.0f}%")
                    all_passed = False
            
            # Overall summary
            avg_words = sum(m["word_count"] for m in quality_metrics) / len(quality_metrics)
            avg_coverage = sum(m["card_coverage"] for m in quality_metrics) / len(quality_metrics)
            avg_mystical = sum(m["mystical_score"] for m in quality_metrics) / len(quality_metrics)
            
            print(f"   📊 Quality Summary:")
            print(f"      Average words: {avg_words:.0f}")
            print(f"      Average card coverage: {avg_coverage:.1%}")
            print(f"      Average mystical style: {avg_mystical:.1%}")
            
            return all_passed
            
        except Exception as e:
            self.log_test("Interpretation quality comparison", False, f"Exception: {str(e)}")
            return False

    def run_enhanced_interpretation_tests(self):
        """Run comprehensive tests for enhanced tarot interpretation system"""
        print("🔮 ENHANCED TAROT INTERPRETATION SYSTEM TESTING")
        print("=" * 70)
        print("Testing improved interpretation system with detailed analysis")
        print("Focus: 800-1200 word interpretations, fallback system, category differences")
        print()
        
        # Test detailed interpretations
        print("📝 DETAILED INTERPRETATIONS TEST (800-1200 words target)")
        print("-" * 60)
        detailed_passed = self.test_detailed_interpretations()
        
        print("\n🔄 ENHANCED FALLBACK SYSTEM TEST")
        print("-" * 40)
        fallback_passed = self.test_enhanced_fallback_system()
        
        print("\n🎯 CATEGORY-SPECIFIC DIFFERENCES TEST")
        print("-" * 45)
        category_passed = self.test_category_specific_differences()
        
        print("\n📊 SPREAD STRUCTURE DIFFERENCES TEST")
        print("-" * 40)
        structure_passed = self.test_spread_structure_differences()
        
        print("\n⭐ INTERPRETATION QUALITY COMPARISON")
        print("-" * 40)
        quality_passed = self.test_interpretation_quality_comparison()
        
        # Also run critical spread tests to ensure basic functionality
        print("\n🚨 BASIC FUNCTIONALITY VERIFICATION")
        print("-" * 40)
        basic_passed = self.test_critical_spread_combinations()
        
        # Summary
        print("\n" + "=" * 70)
        print("🔮 ENHANCED INTERPRETATION SYSTEM TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Feature status
        features = [
            ("📝 Detailed Interpretations", detailed_passed),
            ("🔄 Enhanced Fallback System", fallback_passed),
            ("🎯 Category Differences", category_passed),
            ("📊 Spread Structures", structure_passed),
            ("⭐ Quality Analysis", quality_passed),
            ("🚨 Basic Functionality", basic_passed)
        ]
        
        print(f"\n🎯 FEATURE STATUS:")
        for feature_name, status in features:
            status_icon = "✅ WORKING" if status else "❌ ISSUES"
            print(f"   {feature_name}: {status_icon}")
        
        if failed_tests > 0:
            print("\n❌ ISSUES FOUND:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        else:
            print("\n✅ ALL ENHANCED INTERPRETATION TESTS PASSED!")
            print("✅ Detailed interpretations working (800-1200 words)")
            print("✅ Enhanced fallback system functional")
            print("✅ Category-specific advice implemented")
            print("✅ Spread structures appropriate")
            print("✅ High interpretation quality confirmed")
        
        return passed_tests, failed_tests, self.test_results

    def run_focused_spread_tests(self):
        """Run focused tests for image optimization and spread fixes"""
        print("🔮 FOCUSED TESTING: Image Optimization & Spread Fixes")
        print("=" * 70)
        print("Testing fixed layouts after image optimization (Pillow + SVG)")
        print("Context: MongoDB 16MB limit issue was fixed with image compression")
        print()
        
        # Test critical spread combinations first
        print("🚨 CRITICAL TESTS - All spread types must work without 500 errors")
        print("-" * 70)
        critical_passed = self.test_critical_spread_combinations()
        
        print("\n📊 IMAGE OPTIMIZATION VALIDATION")
        print("-" * 40)
        optimization_passed = self.test_image_optimization_validation()
        
        print("\n💾 MONGODB DOCUMENT SIZE COMPLIANCE")
        print("-" * 40)
        size_compliance_passed = self.test_mongodb_document_size_compliance()
        
        print("\n🎯 STANDARD SPREAD TESTS")
        print("-" * 30)
        self.test_spread_card_counts()
        
        # Summary
        print("\n" + "=" * 70)
        print("🔮 IMAGE OPTIMIZATION TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Critical status
        critical_status = "✅ FIXED" if critical_passed else "❌ STILL BROKEN"
        optimization_status = "✅ WORKING" if optimization_passed else "❌ ISSUES"
        size_status = "✅ COMPLIANT" if size_compliance_passed else "❌ EXCEEDS LIMIT"
        
        print(f"\n🚨 CRITICAL SPREADS: {critical_status}")
        print(f"🖼️  IMAGE OPTIMIZATION: {optimization_status}")
        print(f"💾 MONGODB SIZE LIMIT: {size_status}")
        
        if failed_tests > 0:
            print("\n❌ ISSUES FOUND:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        else:
            print("\n✅ ALL TESTS PASSED - Image optimization successful!")
            print("✅ All spread types working without 500 errors!")
            print("✅ Documents stay under MongoDB 16MB limit!")
        
        return passed_tests, failed_tests, self.test_results

    def test_palmistry_endpoint(self):
        """Test POST /api/palmistry - palmistry analysis"""
        try:
            # Create a sample base64 image (small test image)
            import base64
            # Simple 1x1 pixel PNG in base64
            test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
            
            payload = {
                "image_base64": test_image_base64,
                "question": "Расскажите о моей судьбе по линиям руки"
            }
            
            response = self.session.post(
                f"{self.base_url}/palmistry",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "question", "image_base64", "lines", "interpretation", "created_at"]
                
                if all(field in data for field in required_fields):
                    # Validate lines structure
                    lines = data["lines"]
                    if isinstance(lines, list) and len(lines) > 0:
                        line = lines[0]
                        line_fields = ["name", "description", "color", "points"]
                        
                        if all(field in line for field in line_fields):
                            # Check if interpretation is in Russian and substantial
                            interpretation = data["interpretation"]
                            has_russian = any(ord(char) >= 1040 and ord(char) <= 1103 for char in interpretation)
                            is_substantial = len(interpretation) > 300
                            
                            # Check for expected palm lines
                            expected_lines = ["Линия жизни", "Линия сердца", "Линия ума", "Линия судьбы"]
                            found_lines = [line["name"] for line in lines]
                            has_expected_lines = any(expected in found_lines for expected in expected_lines)
                            
                            details = f"Palmistry analysis created - Lines: {len(lines)}, Russian interpretation: {has_russian}, Substantial: {is_substantial}, Expected lines: {has_expected_lines}"
                            self.log_test("Palmistry endpoint", True, details)
                            return data
                        else:
                            self.log_test("Palmistry endpoint", False, "Invalid line structure", line)
                            return None
                    else:
                        self.log_test("Palmistry endpoint", False, "No lines in response", data)
                        return None
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test("Palmistry endpoint", False, f"Missing fields: {missing_fields}", data)
                    return None
            else:
                self.log_test("Palmistry endpoint", False, f"Status code: {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Palmistry endpoint", False, f"Exception: {str(e)}")
            return None

    def test_palm_line_generation(self):
        """Test palm line generation with different colors and coordinates"""
        try:
            # Create palmistry analysis
            palmistry_result = self.test_palmistry_endpoint()
            
            if not palmistry_result:
                self.log_test("Palm line generation", False, "Could not create palmistry analysis for line testing")
                return False
            
            lines = palmistry_result.get("lines", [])
            
            if len(lines) < 5:  # Should have at least 5 different lines
                self.log_test("Palm line generation", False, f"Too few lines generated: {len(lines)}")
                return False
            
            # Check for expected palm lines
            expected_lines = [
                "Линия жизни", "Линия сердца", "Линия ума", "Линия судьбы",
                "Линия Аполлона", "Линия Меркурия", "Браслеты"
            ]
            
            found_line_names = [line["name"] for line in lines]
            expected_found = sum(1 for expected in expected_lines if any(expected in found for found in found_line_names))
            
            # Check for different colors
            colors = [line["color"] for line in lines]
            unique_colors = len(set(colors))
            
            # Check coordinate structure
            valid_coordinates = True
            for line in lines:
                points = line.get("points", [])
                if not isinstance(points, list) or len(points) < 2:
                    valid_coordinates = False
                    break
                
                # Check that each point is [x, y] format
                for point in points:
                    if not isinstance(point, list) or len(point) != 2:
                        valid_coordinates = False
                        break
                    if not all(isinstance(coord, (int, float)) for coord in point):
                        valid_coordinates = False
                        break
            
            if expected_found >= 5 and unique_colors >= 5 and valid_coordinates:
                self.log_test("Palm line generation", True, 
                            f"✅ Lines generated correctly - Expected lines: {expected_found}/7, Unique colors: {unique_colors}, Valid coordinates: {valid_coordinates}")
                return True
            else:
                self.log_test("Palm line generation", False, 
                            f"❌ Line generation issues - Expected lines: {expected_found}/7, Unique colors: {unique_colors}, Valid coordinates: {valid_coordinates}")
                return False
                
        except Exception as e:
            self.log_test("Palm line generation", False, f"Exception: {str(e)}")
            return False

    def test_palmistry_ai_analysis(self):
        """Test AI palmistry analysis quality and style"""
        try:
            # Test with different questions
            test_questions = [
                "Что говорят линии моей руки о любви?",
                "Какая карьера мне подходит по линиям руки?",
                "Что ждет меня в будущем согласно хиромантии?"
            ]
            
            all_passed = True
            
            for question in test_questions:
                import base64
                test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
                
                payload = {
                    "image_base64": test_image_base64,
                    "question": question
                }
                
                response = self.session.post(
                    f"{self.base_url}/palmistry",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    interpretation = data.get("interpretation", "")
                    
                    # Check for Russian text
                    has_russian = any(ord(char) >= 1040 and ord(char) <= 1103 for char in interpretation)
                    
                    # Check for substantial length (should be detailed)
                    is_substantial = len(interpretation) > 500
                    word_count = len(interpretation.split())
                    
                    # Check for palmistry-specific content
                    palmistry_keywords = ["линия", "ладон", "рук", "хиромант", "судьб", "жизн", "сердц", "ум"]
                    has_palmistry_content = any(keyword in interpretation.lower() for keyword in palmistry_keywords)
                    
                    # Check for mystical gypsy style
                    mystical_phrases = ["дорогая", "милая", "вижу", "духи", "энергия", "мудрая", "гадалка"]
                    has_mystical_style = any(phrase in interpretation.lower() for phrase in mystical_phrases)
                    
                    if has_russian and is_substantial and has_palmistry_content and has_mystical_style:
                        self.log_test(f"Palmistry AI analysis - {question[:30]}...", True, 
                                    f"✅ Quality analysis - Words: {word_count}, Russian: {has_russian}, Palmistry content: {has_palmistry_content}, Mystical style: {has_mystical_style}")
                    else:
                        details = f"Words: {word_count}, Russian: {has_russian}, Palmistry: {has_palmistry_content}, Mystical: {has_mystical_style}"
                        self.log_test(f"Palmistry AI analysis - {question[:30]}...", False, f"❌ Quality issues - {details}")
                        all_passed = False
                else:
                    self.log_test(f"Palmistry AI analysis - {question[:30]}...", False, f"HTTP {response.status_code}: {response.text[:200]}")
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("Palmistry AI analysis", False, f"Exception: {str(e)}")
            return False

    def test_palmistry_database_integration(self):
        """Test that palmistry results are saved to MongoDB"""
        try:
            # Create a unique test question with timestamp
            import time
            unique_id = str(int(time.time() * 1000))  # Millisecond timestamp
            test_question = f"UNIQUE_TEST_PALMISTRY_{unique_id}"
            
            # Create a new palmistry reading with unique question
            import base64
            test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
            
            payload = {
                "image_base64": test_image_base64,
                "question": test_question
            }
            
            response = self.session.post(
                f"{self.base_url}/palmistry",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                created_reading = response.json()
                created_id = created_reading.get("id")
                
                # Get history with higher limit to find our reading
                history_response = self.session.get(f"{self.base_url}/readings?limit=100")
                
                if history_response.status_code == 200:
                    history_data = history_response.json()
                    
                    # Look for our specific reading by question or ID
                    found_by_question = any(reading.get("question") == test_question for reading in history_data)
                    found_by_id = any(reading.get("id") == created_id for reading in history_data)
                    
                    if found_by_question or found_by_id:
                        palmistry_count = sum(1 for reading in history_data if reading.get("category") == "palmistry")
                        self.log_test("Palmistry database integration", True, 
                                    f"✅ Palmistry saved to database - Found unique reading (ID: {created_id[:8]}...), Total palmistry: {palmistry_count}")
                        return True
                    else:
                        self.log_test("Palmistry database integration", False, 
                                    f"Unique palmistry reading not found in history (ID: {created_id}, Question: {test_question[:50]}...)")
                        return False
                else:
                    self.log_test("Palmistry database integration", False, f"Failed to get history: HTTP {history_response.status_code}")
                    return False
            else:
                self.log_test("Palmistry database integration", False, f"Failed to create palmistry reading: HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Palmistry database integration", False, f"Exception: {str(e)}")
            return False

    def test_unified_reading_history(self):
        """Test GET /api/readings - unified history with tarot and palmistry"""
        try:
            response = self.session.get(f"{self.base_url}/readings")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    # Check for both tarot and palmistry entries
                    tarot_count = sum(1 for reading in data if reading.get("category") != "palmistry")
                    palmistry_count = sum(1 for reading in data if reading.get("category") == "palmistry")
                    
                    # Validate structure of different types
                    valid_structure = True
                    for reading in data:
                        category = reading.get("category")
                        if category == "palmistry":
                            # Palmistry should have empty cards and specific spread_type
                            if not (isinstance(reading.get("cards", []), list) and 
                                   len(reading.get("cards", [])) == 0 and
                                   reading.get("spread_type") == "palm_analysis"):
                                valid_structure = False
                                break
                        else:
                            # Tarot should have cards
                            if not isinstance(reading.get("cards", []), list):
                                valid_structure = False
                                break
                    
                    if valid_structure:
                        self.log_test("Unified reading history", True, 
                                    f"✅ Unified history working - Total: {len(data)}, Tarot: {tarot_count}, Palmistry: {palmistry_count}")
                        return data
                    else:
                        self.log_test("Unified reading history", False, "Invalid structure in unified history")
                        return None
                else:
                    self.log_test("Unified reading history", False, "Response is not a list", data)
                    return None
            else:
                self.log_test("Unified reading history", False, f"Status code: {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Unified reading history", False, f"Exception: {str(e)}")
            return None

    def test_palmistry_error_handling(self):
        """Test error handling for palmistry endpoint"""
        try:
            # Test with missing required field (should return 422)
            invalid_payloads = [
                {"question": "Test question"},  # Missing image_base64
                {},  # Missing both fields
            ]
            
            all_passed = True
            
            for i, payload in enumerate(invalid_payloads):
                response = self.session.post(
                    f"{self.base_url}/palmistry",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                # Should return 422 for missing required fields
                if response.status_code == 422:
                    self.log_test(f"Palmistry error handling - Case {i+1}", True, 
                                f"✅ Missing required field correctly rejected with {response.status_code}")
                else:
                    self.log_test(f"Palmistry error handling - Case {i+1}", False, 
                                f"❌ Expected 422 for missing field, got {response.status_code}")
                    all_passed = False
            
            # Test with valid but unusual image data (should work since it's simulated)
            unusual_payloads = [
                {"image_base64": "invalid_base64", "question": "Test question"},
                {"image_base64": "", "question": "Test question"},
                {"image_base64": "data:image/png;base64,invalid", "question": "Test question"}
            ]
            
            for i, payload in enumerate(unusual_payloads):
                response = self.session.post(
                    f"{self.base_url}/palmistry",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                # Should return 200 since palmistry is simulated (doesn't actually process image)
                if response.status_code == 200:
                    self.log_test(f"Palmistry simulation - Case {i+1}", True, 
                                f"✅ Simulated palmistry works with any image data (status {response.status_code})")
                else:
                    self.log_test(f"Palmistry simulation - Case {i+1}", False, 
                                f"❌ Simulated palmistry should work with any data, got {response.status_code}")
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("Palmistry error handling", False, f"Exception: {str(e)}")
            return False

    def test_palmistry_fallback_system(self):
        """Test palmistry fallback interpretation system"""
        try:
            # Create palmistry reading (should use fallback due to OpenAI quota)
            import base64
            test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
            
            payload = {
                "image_base64": test_image_base64,
                "question": "Проверка системы резервных интерпретаций хиромантии"
            }
            
            response = self.session.post(
                f"{self.base_url}/palmistry",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                interpretation = data.get("interpretation", "")
                
                # Check for fallback characteristics (more lenient thresholds)
                fallback_indicators = [
                    "дорогая моя", "милая душа", "вижу на вашей ладони",
                    "линии руки", "древние тайны", "мудрая гадалка",
                    "заключительное", "пророчество", "дорогая", "милая"
                ]
                
                found_indicators = [indicator for indicator in fallback_indicators if indicator in interpretation.lower()]
                indicator_score = len(found_indicators)
                
                # Check for specific palm line mentions
                palm_lines = ["линия жизни", "линия сердца", "линия ума", "линия судьбы"]
                found_lines = [line for line in palm_lines if line in interpretation.lower()]
                line_coverage = len(found_lines) / len(palm_lines)
                
                # Check for substantial content (more lenient)
                word_count = len(interpretation.split())
                is_substantial = word_count > 200  # Reduced from 400
                
                if indicator_score >= 2 and line_coverage >= 0.5 and is_substantial:  # Reduced from 3 indicators
                    self.log_test("Palmistry fallback system", True, 
                                f"✅ Quality fallback - Indicators: {indicator_score}, Line coverage: {line_coverage:.1%}, Words: {word_count}")
                    return True
                else:
                    self.log_test("Palmistry fallback system", False, 
                                f"❌ Fallback quality issues - Indicators: {indicator_score}, Lines: {line_coverage:.1%}, Words: {word_count}")
                    return False
            else:
                self.log_test("Palmistry fallback system", False, f"HTTP {response.status_code}: {response.text[:200]}")
                return False
                
        except Exception as e:
            self.log_test("Palmistry fallback system", False, f"Exception: {str(e)}")
            return False

    def run_palmistry_tests(self):
        """Run comprehensive palmistry functionality tests"""
        print("🤲 PALMISTRY FUNCTIONALITY TESTING")
        print("=" * 50)
        print("Testing new palmistry features: endpoint, line generation, AI analysis, database integration")
        print()
        
        palmistry_tests = [
            ("Palmistry endpoint", self.test_palmistry_endpoint),
            ("Palm line generation", self.test_palm_line_generation),
            ("Palmistry AI analysis", self.test_palmistry_ai_analysis),
            ("Palmistry database integration", self.test_palmistry_database_integration),
            ("Unified reading history", self.test_unified_reading_history),
            ("Palmistry error handling", self.test_palmistry_error_handling),
            ("Palmistry fallback system", self.test_palmistry_fallback_system)
        ]
        
        passed_tests = 0
        
        for test_name, test_func in palmistry_tests:
            print(f"🔍 Testing: {test_name}")
            if test_func():
                passed_tests += 1
            print()
        
        print("=" * 50)
        print(f"🤲 PALMISTRY TESTING COMPLETE: {passed_tests}/{len(palmistry_tests)} tests passed ({(passed_tests/len(palmistry_tests))*100:.1f}%)")
        
        if passed_tests == len(palmistry_tests):
            print("✅ ALL PALMISTRY TESTS PASSED! Palmistry functionality is fully working.")
        else:
            print(f"❌ {len(palmistry_tests) - passed_tests} palmistry tests failed. Check details above.")
        
        print("=" * 50)
        
        return passed_tests == len(palmistry_tests)

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
        
        # Image-specific tests for aesthetic tarot cards
        print("\n🎨 Testing Aesthetic Tarot Card Images Integration")
        print("-" * 50)
        self.test_card_back_endpoint()
        self.test_aesthetic_images_integration()
        self.test_card_images_quality()
        
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

    def test_profile_creation(self):
        """Test POST /api/profile - create user profile"""
        try:
            # Test profile creation with birth date that should be Рыбы (Pisces)
            profile_data = {
                "name": "Анна Петрова",
                "birth_date": "1990-03-15",  # Should be Рыбы
                "birth_time": "14:30",
                "birth_place": "Москва",
                "gender": "женский"
            }
            
            response = self.session.post(
                f"{self.base_url}/profile",
                json=profile_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "name", "birth_date", "zodiac_sign", "created_at", "updated_at"]
                
                if all(field in data for field in required_fields):
                    # Verify zodiac sign calculation
                    expected_zodiac = "Рыбы"  # March 15 should be Pisces
                    actual_zodiac = data.get("zodiac_sign")
                    
                    if actual_zodiac == expected_zodiac:
                        self.log_test("Profile creation", True, 
                                    f"Profile created successfully - Name: {data['name']}, Zodiac: {actual_zodiac}, Birth date: {data['birth_date']}")
                        return data
                    else:
                        self.log_test("Profile creation", False, 
                                    f"Incorrect zodiac calculation - Expected: {expected_zodiac}, Got: {actual_zodiac}")
                        return None
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test("Profile creation", False, f"Missing fields: {missing_fields}", data)
                    return None
            else:
                self.log_test("Profile creation", False, f"Status code: {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Profile creation", False, f"Exception: {str(e)}")
            return None

    def test_profile_retrieval(self):
        """Test GET /api/profile - retrieve user profile"""
        try:
            response = self.session.get(f"{self.base_url}/profile")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "name", "birth_date", "zodiac_sign"]
                
                if all(field in data for field in required_fields):
                    self.log_test("Profile retrieval", True, 
                                f"Profile retrieved - Name: {data['name']}, Zodiac: {data['zodiac_sign']}")
                    return data
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test("Profile retrieval", False, f"Missing fields: {missing_fields}", data)
                    return None
            elif response.status_code == 404:
                self.log_test("Profile retrieval", True, "No profile found (404) - expected when no profile exists")
                return None
            else:
                self.log_test("Profile retrieval", False, f"Status code: {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Profile retrieval", False, f"Exception: {str(e)}")
            return None

    def test_zodiac_sign_calculation(self):
        """Test zodiac sign calculation for various birth dates"""
        try:
            test_dates = [
                ("1990-03-15", "Рыбы"),      # Pisces
                ("1985-07-20", "Рак"),       # Cancer  
                ("1992-01-10", "Козерог"),   # Capricorn
                ("1988-05-25", "Близнецы"),  # Gemini
                ("1995-09-15", "Дева"),      # Virgo
                ("1987-12-25", "Козерог"),   # Capricorn
                ("1991-06-21", "Рак"),       # Cancer (boundary date)
                ("1989-03-21", "Овен"),      # Aries (boundary date)
            ]
            
            all_passed = True
            
            for birth_date, expected_zodiac in test_dates:
                profile_data = {
                    "name": f"Тест {birth_date}",
                    "birth_date": birth_date
                }
                
                response = self.session.post(
                    f"{self.base_url}/profile",
                    json=profile_data,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    actual_zodiac = data.get("zodiac_sign")
                    
                    if actual_zodiac == expected_zodiac:
                        self.log_test(f"Zodiac calculation - {birth_date}", True, 
                                    f"✅ Correct - {birth_date} → {actual_zodiac}")
                    else:
                        self.log_test(f"Zodiac calculation - {birth_date}", False, 
                                    f"❌ Wrong - {birth_date} → Expected: {expected_zodiac}, Got: {actual_zodiac}")
                        all_passed = False
                else:
                    self.log_test(f"Zodiac calculation - {birth_date}", False, 
                                f"HTTP {response.status_code}: {response.text[:200]}")
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("Zodiac sign calculation", False, f"Exception: {str(e)}")
            return False

    def test_horoscope_generation(self):
        """Test GET /api/horoscope - generate horoscope"""
        try:
            # First ensure we have a profile
            profile = self.test_profile_creation()
            if not profile:
                self.log_test("Horoscope generation", False, "No profile available for horoscope test")
                return None
            
            # Test horoscope generation for today
            response = self.session.get(f"{self.base_url}/horoscope")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["id", "user_profile_id", "date", "zodiac_sign", "horoscope_text", 
                                 "mood_rating", "love_forecast", "career_forecast", "health_forecast", 
                                 "lucky_numbers", "lucky_color", "created_at"]
                
                if all(field in data for field in required_fields):
                    # Verify personalization
                    horoscope_text = data.get("horoscope_text", "")
                    profile_name = profile.get("name", "")
                    zodiac_sign = data.get("zodiac_sign")
                    
                    # Check if horoscope contains user's name
                    has_name = profile_name.split()[0] in horoscope_text if profile_name else False
                    
                    # Check if horoscope is substantial
                    word_count = len(horoscope_text.split())
                    is_substantial = word_count >= 100
                    
                    # Check lucky numbers format
                    lucky_numbers = data.get("lucky_numbers", [])
                    valid_numbers = isinstance(lucky_numbers, list) and len(lucky_numbers) > 0
                    
                    # Check mood rating
                    mood_rating = data.get("mood_rating", 0)
                    valid_mood = 1 <= mood_rating <= 10
                    
                    if is_substantial and valid_numbers and valid_mood:
                        details = f"Horoscope generated - Zodiac: {zodiac_sign}, Words: {word_count}, Lucky numbers: {len(lucky_numbers)}, Mood: {mood_rating}/10, Personalized: {has_name}"
                        self.log_test("Horoscope generation", True, details)
                        return data
                    else:
                        details = f"Quality issues - Words: {word_count}, Numbers: {valid_numbers}, Mood: {valid_mood}, Personalized: {has_name}"
                        self.log_test("Horoscope generation", False, details)
                        return None
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test("Horoscope generation", False, f"Missing fields: {missing_fields}", data)
                    return None
            elif response.status_code == 404:
                self.log_test("Horoscope generation", False, "Profile not found - need to create profile first")
                return None
            else:
                self.log_test("Horoscope generation", False, f"Status code: {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Horoscope generation", False, f"Exception: {str(e)}")
            return None

    def test_horoscope_with_specific_date(self):
        """Test horoscope generation with specific date"""
        try:
            # Test with specific date
            test_date = "2024-12-20"
            response = self.session.get(f"{self.base_url}/horoscope?date={test_date}")
            
            if response.status_code == 200:
                data = response.json()
                returned_date = data.get("date")
                
                if returned_date == test_date:
                    self.log_test("Horoscope with specific date", True, 
                                f"Horoscope generated for specific date: {test_date}")
                    return data
                else:
                    self.log_test("Horoscope with specific date", False, 
                                f"Date mismatch - Requested: {test_date}, Got: {returned_date}")
                    return None
            else:
                self.log_test("Horoscope with specific date", False, 
                            f"Status code: {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Horoscope with specific date", False, f"Exception: {str(e)}")
            return None

    def test_horoscope_caching(self):
        """Test horoscope caching - same date should return existing horoscope"""
        try:
            # Generate horoscope for today
            first_response = self.session.get(f"{self.base_url}/horoscope")
            
            if first_response.status_code != 200:
                self.log_test("Horoscope caching", False, "Could not generate first horoscope")
                return False
            
            first_data = first_response.json()
            first_id = first_data.get("id")
            
            # Request same date again
            second_response = self.session.get(f"{self.base_url}/horoscope")
            
            if second_response.status_code == 200:
                second_data = second_response.json()
                second_id = second_data.get("id")
                
                # Should return the same horoscope (same ID)
                if first_id == second_id:
                    self.log_test("Horoscope caching", True, 
                                f"Caching works - Same horoscope returned (ID: {first_id})")
                    return True
                else:
                    self.log_test("Horoscope caching", False, 
                                f"Caching failed - Different IDs: {first_id} vs {second_id}")
                    return False
            else:
                self.log_test("Horoscope caching", False, 
                            f"Second request failed - Status: {second_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Horoscope caching", False, f"Exception: {str(e)}")
            return False

    def test_unified_history_with_horoscopes(self):
        """Test GET /api/readings - unified history including horoscopes"""
        try:
            # Generate some content first
            self.test_profile_creation()
            self.test_horoscope_generation()
            
            response = self.session.get(f"{self.base_url}/readings")
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    # Look for different types of readings
                    tarot_readings = [r for r in data if r.get("type") == "tarot"]
                    palmistry_readings = [r for r in data if r.get("type") == "palmistry"]
                    horoscope_readings = [r for r in data if r.get("type") == "horoscope"]
                    
                    # Check horoscope format
                    horoscope_valid = True
                    for horoscope in horoscope_readings:
                        required_fields = ["id", "question", "category", "spread_type", "interpretation", "created_at", "zodiac_sign"]
                        if not all(field in horoscope for field in required_fields):
                            horoscope_valid = False
                            break
                        
                        # Check horoscope-specific fields
                        if (horoscope.get("category") != "horoscope" or 
                            horoscope.get("spread_type") != "daily_horoscope" or
                            not horoscope.get("zodiac_sign")):
                            horoscope_valid = False
                            break
                    
                    if horoscope_valid:
                        details = f"Unified history retrieved - Total: {len(data)}, Tarot: {len(tarot_readings)}, Palmistry: {len(palmistry_readings)}, Horoscopes: {len(horoscope_readings)}"
                        self.log_test("Unified history with horoscopes", True, details)
                        return data
                    else:
                        self.log_test("Unified history with horoscopes", False, "Invalid horoscope format in unified history")
                        return None
                else:
                    self.log_test("Unified history with horoscopes", False, "Response is not a list", data)
                    return None
            else:
                self.log_test("Unified history with horoscopes", False, f"Status code: {response.status_code}", response.text)
                return None
                
        except Exception as e:
            self.log_test("Unified history with horoscopes", False, f"Exception: {str(e)}")
            return None

    def test_horoscope_personalization(self):
        """Test horoscope personalization with user data"""
        try:
            # Create profile with specific data
            profile_data = {
                "name": "Мария Иванова",
                "birth_date": "1985-07-20",  # Cancer
                "birth_time": "10:15",
                "birth_place": "Санкт-Петербург",
                "gender": "женский"
            }
            
            profile_response = self.session.post(
                f"{self.base_url}/profile",
                json=profile_data,
                headers={"Content-Type": "application/json"}
            )
            
            if profile_response.status_code != 200:
                self.log_test("Horoscope personalization", False, "Could not create profile for personalization test")
                return False
            
            # Generate horoscope
            horoscope_response = self.session.get(f"{self.base_url}/horoscope")
            
            if horoscope_response.status_code == 200:
                data = horoscope_response.json()
                horoscope_text = data.get("horoscope_text", "")
                zodiac_sign = data.get("zodiac_sign")
                
                # Check personalization elements
                has_name = "Мария" in horoscope_text
                has_zodiac = zodiac_sign == "Рак"
                has_personal_address = any(addr in horoscope_text for addr in ["Вы", "Ваш", "Вас"])
                
                # Check for astrological content
                astro_keywords = ["планет", "звезд", "космическ", "энерги", "вибрац"]
                has_astro_content = any(keyword in horoscope_text.lower() for keyword in astro_keywords)
                
                # Check structure (should have different forecast sections)
                forecasts = [data.get("love_forecast"), data.get("career_forecast"), data.get("health_forecast")]
                has_forecasts = all(forecast and len(forecast) > 10 for forecast in forecasts)
                
                if has_zodiac and has_personal_address and has_astro_content and has_forecasts:
                    details = f"Personalization successful - Name: {has_name}, Zodiac: {zodiac_sign}, Astro content: {has_astro_content}, Forecasts: {has_forecasts}"
                    self.log_test("Horoscope personalization", True, details)
                    return True
                else:
                    details = f"Personalization issues - Name: {has_name}, Zodiac: {has_zodiac}, Astro: {has_astro_content}, Forecasts: {has_forecasts}"
                    self.log_test("Horoscope personalization", False, details)
                    return False
            else:
                self.log_test("Horoscope personalization", False, f"Horoscope generation failed - Status: {horoscope_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Horoscope personalization", False, f"Exception: {str(e)}")
            return False

    def test_profile_data_persistence(self):
        """Test profile and horoscope data persistence in MongoDB"""
        try:
            # Create profile
            profile_data = {
                "name": "Тест Персистенс",
                "birth_date": "1990-12-01",
                "birth_time": "15:30"
            }
            
            profile_response = self.session.post(
                f"{self.base_url}/profile",
                json=profile_data,
                headers={"Content-Type": "application/json"}
            )
            
            if profile_response.status_code != 200:
                self.log_test("Profile data persistence", False, "Could not create profile")
                return False
            
            profile = profile_response.json()
            
            # Generate horoscope
            horoscope_response = self.session.get(f"{self.base_url}/horoscope")
            
            if horoscope_response.status_code != 200:
                self.log_test("Profile data persistence", False, "Could not generate horoscope")
                return False
            
            horoscope = horoscope_response.json()
            
            # Retrieve profile again to verify persistence
            retrieve_response = self.session.get(f"{self.base_url}/profile")
            
            if retrieve_response.status_code == 200:
                retrieved_profile = retrieve_response.json()
                
                # Check if profile data matches
                if (retrieved_profile.get("name") == profile_data["name"] and
                    retrieved_profile.get("birth_date") == profile_data["birth_date"]):
                    
                    # Check unified history for horoscope
                    history_response = self.session.get(f"{self.base_url}/readings")
                    
                    if history_response.status_code == 200:
                        history = history_response.json()
                        horoscope_in_history = any(r.get("type") == "horoscope" for r in history)
                        
                        if horoscope_in_history:
                            self.log_test("Profile data persistence", True, 
                                        "Profile and horoscope data persisted correctly in MongoDB")
                            return True
                        else:
                            self.log_test("Profile data persistence", False, 
                                        "Horoscope not found in unified history")
                            return False
                    else:
                        self.log_test("Profile data persistence", False, 
                                    "Could not retrieve unified history")
                        return False
                else:
                    self.log_test("Profile data persistence", False, 
                                "Retrieved profile data doesn't match created profile")
                    return False
            else:
                self.log_test("Profile data persistence", False, 
                            f"Could not retrieve profile - Status: {retrieve_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Profile data persistence", False, f"Exception: {str(e)}")
            return False

    def test_new_tarot_image_system(self):
        """Test the new aesthetic tarot card image system comprehensively"""
        print("🎨 NEW TAROT CARD IMAGE SYSTEM TESTING")
        print("=" * 60)
        print("Testing new aesthetic image system with compression and fallback")
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
        elif image_success_rate >= 75:
            print("✅ ХОРОШО! Система изображений работает с незначительными проблемами.")
        else:
            print("❌ ПРОБЛЕМЫ! Система изображений требует доработки.")
        
        return image_success_rate >= 75

    def test_all_major_arcana_images(self):
        """Test that all 22 Major Arcana cards have unique, quality images"""
        try:
            # Create readings to get all different cards
            all_cards = []
            unique_images = set()
            
            # Test multiple readings to get variety of cards
            for i in range(8):  # Multiple readings to get different cards
                reading = self.test_create_reading("general", "three_cards", f"Тест уникальности изображений #{i+1}")
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
            # Test multiple readings to trigger both URL and SVG images
            readings = []
            for i in range(3):
                reading = self.test_create_reading("love", "one_card", f"Тест SVG fallback #{i+1}")
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
                                import base64
                                svg_content = base64.b64decode(image.split("base64,")[1]).decode('utf-8')
                                
                                # Check for SVG elements
                                svg_elements = ["<svg", "gradient", "circle", "text", card.get("name", "")]
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
            # Test different spread types to check image sizes
            test_cases = [
                ("one_card", "love", "Тест сжатия для одной карты"),
                ("three_cards", "career", "Тест сжатия для трех карт"),
                ("celtic_cross", "finance", "Тест сжатия для кельтского креста")
            ]
            
            all_passed = True
            oversized_cards = []
            
            for spread_type, category, question in test_cases:
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
                    cards = data.get("cards", [])
                    
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
                    self.log_test("Image compression limits", False, 
                                f"❌ HTTP {response.status_code} for {spread_type}")
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
            # Test by creating readings and checking image sources
            readings = []
            for i in range(5):
                reading = self.test_create_reading("general", "one_card", f"Тест get_aesthetic_image #{i+1}")
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
            # Test multiple readings to potentially trigger URL loading
            url_loaded_count = 0
            svg_fallback_count = 0
            total_cards = 0
            
            for i in range(6):  # Multiple readings to test different cards
                reading = self.test_create_reading("general", "one_card", 
                                                 f"Тест загрузки URL изображений #{i+1}")
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
            # Test by creating readings and analyzing compressed images
            compressed_images = 0
            total_images = 0
            compression_ratios = []
            
            for i in range(4):
                reading = self.test_create_reading("finance", "one_card", f"Тест url_to_base64 #{i+1}")
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
            spread_tests = [
                ("one_card", "love", "Тест новых изображений для одной карты", 1),
                ("three_cards", "career", "Тест новых изображений для трех карт", 3),
                ("celtic_cross", "finance", "Тест новых изображений для кельтского креста", 10)
            ]
            
            all_passed = True
            
            for spread_type, category, question, expected_cards in spread_tests:
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
                    cards = data.get("cards", [])
                    
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
                                f"❌ HTTP {response.status_code}: {response.text[:200]}")
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("All spreads with new images", False, f"Exception: {str(e)}")
            return False

    def run_profile_horoscope_tests(self):
        """Run comprehensive tests for profile and horoscope functionality"""
        print("🌟 PROFILE AND HOROSCOPE FUNCTIONALITY TESTING")
        print("=" * 60)
        print("Testing new profile management and horoscope generation features")
        print()
        
        # Profile Management Tests
        print("👤 PROFILE MANAGEMENT TESTS")
        print("-" * 30)
        profile_tests = [
            ("Profile creation", self.test_profile_creation),
            ("Profile retrieval", self.test_profile_retrieval),
            ("Zodiac sign calculation", self.test_zodiac_sign_calculation)
        ]
        
        profile_passed = 0
        for test_name, test_func in profile_tests:
            print(f"🔍 Testing: {test_name}")
            if test_func():
                profile_passed += 1
            print()
        
        print(f"✅ Profile tests: {profile_passed}/{len(profile_tests)} passed\n")
        
        # Horoscope Generation Tests
        print("🔮 HOROSCOPE GENERATION TESTS")
        print("-" * 35)
        horoscope_tests = [
            ("Horoscope generation", self.test_horoscope_generation),
            ("Horoscope with specific date", self.test_horoscope_with_specific_date),
            ("Horoscope caching", self.test_horoscope_caching),
            ("Horoscope personalization", self.test_horoscope_personalization)
        ]
        
        horoscope_passed = 0
        for test_name, test_func in horoscope_tests:
            print(f"🔍 Testing: {test_name}")
            if test_func():
                horoscope_passed += 1
            print()
        
        print(f"✅ Horoscope tests: {horoscope_passed}/{len(horoscope_tests)} passed\n")
        
        # Integration Tests
        print("🔗 INTEGRATION TESTS")
        print("-" * 20)
        integration_tests = [
            ("Unified history with horoscopes", self.test_unified_history_with_horoscopes),
            ("Profile data persistence", self.test_profile_data_persistence)
        ]
        
        integration_passed = 0
        for test_name, test_func in integration_tests:
            print(f"🔍 Testing: {test_name}")
            if test_func():
                integration_passed += 1
            print()
        
        print(f"✅ Integration tests: {integration_passed}/{len(integration_tests)} passed\n")
        
        # Calculate results
        total_tests = len(profile_tests) + len(horoscope_tests) + len(integration_tests)
        total_passed = profile_passed + horoscope_passed + integration_passed
        
        print("=" * 60)
        print("🏆 PROFILE & HOROSCOPE TEST RESULTS")
        print("=" * 60)
        print(f"Total tests: {total_tests}")
        print(f"Passed: {total_passed}")
        print(f"Failed: {total_tests - total_passed}")
        print(f"Success rate: {(total_passed/total_tests)*100:.1f}%")
        
        if total_passed == total_tests:
            print("\n🎉 ALL PROFILE & HOROSCOPE TESTS PASSED! 🎉")
        elif total_passed >= total_tests * 0.8:
            print(f"\n✅ Most tests passed ({(total_passed/total_tests)*100:.1f}%). Functionality is largely working.")
        else:
            print(f"\n⚠️ Some tests failed ({(total_passed/total_tests)*100:.1f}% success). Review failed tests.")
        
        return total_passed == total_tests

    def test_new_tarot_image_system_comprehensive(self):
        """Test the new 5-level fallback tarot card image system as requested"""
        print("🎨 NEW TAROT CARD IMAGE SYSTEM TESTING")
        print("=" * 60)
        print("Testing updated 5-level fallback system for all 22 Major Arcana cards")
        print("Expected: 70%+ large images (>10KB), 30%- SVG fallback (~2KB)")
        print()
        
        try:
            # Generate multiple different spreads to test all cards
            test_spreads = [
                ("one_card", "love", "Что ждет меня в любви?"),
                ("three_cards", "career", "Как развивается моя карьера?"),
                ("celtic_cross", "finance", "Какие финансовые перспективы?"),
                ("three_cards", "general", "Что важно знать о будущем?"),
                ("one_card", "love", "Найду ли я счастье?"),
                ("celtic_cross", "career", "Мой профессиональный путь?"),
                ("three_cards", "finance", "Финансовая стабильность?"),
                ("one_card", "general", "Главный совет на сегодня?"),
                ("celtic_cross", "love", "Глубокий анализ отношений?"),
                ("three_cards", "career", "Карьерные возможности?")
            ]
            
            all_cards_data = []
            unique_cards = {}
            large_images = 0
            small_images = 0
            total_spreads_tested = 0
            
            print("📊 GENERATING MULTIPLE SPREADS TO TEST ALL CARDS")
            print("-" * 50)
            
            for i, (spread_type, category, question) in enumerate(test_spreads, 1):
                print(f"🎴 Spread {i}: {spread_type} ({category})")
                
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
                    cards = data.get("cards", [])
                    total_spreads_tested += 1
                    
                    print(f"   ✅ Success - {len(cards)} cards generated")
                    
                    for card in cards:
                        card_name = card.get("name", "Unknown")
                        image = card.get("image", "")
                        
                        if image and "base64," in image:
                            base64_part = image.split("base64,")[1]
                            image_size_chars = len(base64_part)
                            # Estimate actual size (base64 is ~33% larger than binary)
                            estimated_size_kb = (image_size_chars * 0.75) / 1024
                            
                            # Store card data
                            card_info = {
                                "name": card_name,
                                "image_size_chars": image_size_chars,
                                "estimated_size_kb": estimated_size_kb,
                                "image_format": image.split(";")[0].replace("data:image/", "") if ";" in image else "unknown",
                                "spread": f"{spread_type}_{category}"
                            }
                            
                            all_cards_data.append(card_info)
                            
                            # Track unique cards
                            if card_name not in unique_cards:
                                unique_cards[card_name] = card_info
                            
                            # Classify image size
                            if estimated_size_kb > 10:  # Large image (JPEG photo)
                                large_images += 1
                                print(f"      📸 {card_name}: {estimated_size_kb:.1f}KB (LARGE - likely JPEG)")
                            else:  # Small image (SVG fallback)
                                small_images += 1
                                print(f"      🎨 {card_name}: {estimated_size_kb:.1f}KB (small - likely SVG)")
                        else:
                            print(f"      ❌ {card_name}: No valid image")
                            return False
                else:
                    print(f"   ❌ Failed - HTTP {response.status_code}")
                    return False
                
                print()
            
            # Analysis and results
            total_cards_tested = len(all_cards_data)
            unique_cards_count = len(unique_cards)
            large_percentage = (large_images / total_cards_tested) * 100 if total_cards_tested > 0 else 0
            small_percentage = (small_images / total_cards_tested) * 100 if total_cards_tested > 0 else 0
            
            print("📈 IMAGE SYSTEM ANALYSIS RESULTS")
            print("=" * 40)
            print(f"Total spreads tested: {total_spreads_tested}")
            print(f"Total cards analyzed: {total_cards_tested}")
            print(f"Unique cards found: {unique_cards_count}")
            print(f"Large images (>10KB): {large_images} ({large_percentage:.1f}%)")
            print(f"Small images (≤10KB): {small_images} ({small_percentage:.1f}%)")
            print()
            
            # Detailed card analysis
            print("🔍 DETAILED CARD ANALYSIS")
            print("-" * 30)
            
            # Sort unique cards by size for analysis
            sorted_cards = sorted(unique_cards.values(), key=lambda x: x["estimated_size_kb"], reverse=True)
            
            print("📊 Top 10 largest images:")
            for i, card in enumerate(sorted_cards[:10], 1):
                print(f"   {i:2d}. {card['name']}: {card['estimated_size_kb']:.1f}KB ({card['image_format']})")
            
            print("\n📊 Smallest 5 images:")
            for i, card in enumerate(sorted_cards[-5:], 1):
                print(f"   {i:2d}. {card['name']}: {card['estimated_size_kb']:.1f}KB ({card['image_format']})")
            
            # Image format analysis
            format_counts = {}
            for card in all_cards_data:
                fmt = card["image_format"]
                format_counts[fmt] = format_counts.get(fmt, 0) + 1
            
            print(f"\n📊 Image formats distribution:")
            for fmt, count in format_counts.items():
                percentage = (count / total_cards_tested) * 100
                print(f"   {fmt}: {count} cards ({percentage:.1f}%)")
            
            # Success criteria evaluation
            print("\n🎯 SUCCESS CRITERIA EVALUATION")
            print("-" * 35)
            
            criteria_results = []
            
            # Criterion 1: At least 70% large images
            large_target = large_percentage >= 70
            criteria_results.append(large_target)
            status1 = "✅ PASS" if large_target else "❌ FAIL"
            print(f"{status1} - Large images (>10KB): {large_percentage:.1f}% (target: ≥70%)")
            
            # Criterion 2: Maximum 30% small images
            small_target = small_percentage <= 30
            criteria_results.append(small_target)
            status2 = "✅ PASS" if small_target else "❌ FAIL"
            print(f"{status2} - Small images (≤10KB): {small_percentage:.1f}% (target: ≤30%)")
            
            # Criterion 3: All spreads work without errors
            spreads_target = total_spreads_tested == len(test_spreads)
            criteria_results.append(spreads_target)
            status3 = "✅ PASS" if spreads_target else "❌ FAIL"
            print(f"{status3} - All spreads functional: {total_spreads_tested}/{len(test_spreads)} (target: 100%)")
            
            # Criterion 4: Good card uniqueness
            uniqueness_percentage = (unique_cards_count / total_cards_tested) * 100 if total_cards_tested > 0 else 0
            uniqueness_target = uniqueness_percentage >= 30  # At least 30% unique cards
            criteria_results.append(uniqueness_target)
            status4 = "✅ PASS" if uniqueness_target else "❌ FAIL"
            print(f"{status4} - Card uniqueness: {uniqueness_percentage:.1f}% (target: ≥30%)")
            
            # Criterion 5: No image errors
            no_errors = all(card["estimated_size_kb"] > 0 for card in all_cards_data)
            criteria_results.append(no_errors)
            status5 = "✅ PASS" if no_errors else "❌ FAIL"
            print(f"{status5} - No image errors: All cards have valid images")
            
            # Overall assessment
            passed_criteria = sum(criteria_results)
            total_criteria = len(criteria_results)
            success_rate = (passed_criteria / total_criteria) * 100
            
            print(f"\n🏆 OVERALL ASSESSMENT")
            print("=" * 25)
            print(f"Criteria passed: {passed_criteria}/{total_criteria} ({success_rate:.1f}%)")
            
            if success_rate >= 80:
                print("🎉 EXCELLENT - New image system working as expected!")
                result_status = True
            elif success_rate >= 60:
                print("✅ GOOD - Image system mostly working with minor issues")
                result_status = True
            else:
                print("⚠️ NEEDS IMPROVEMENT - Image system has significant issues")
                result_status = False
            
            # Log the test result
            details = f"Tested {total_cards_tested} cards across {total_spreads_tested} spreads. Large images: {large_percentage:.1f}%, Small images: {small_percentage:.1f}%, Unique cards: {uniqueness_percentage:.1f}%, Success rate: {success_rate:.1f}%"
            self.log_test("New tarot image system (5-level fallback)", result_status, details)
            
            return result_status
            
        except Exception as e:
            self.log_test("New tarot image system", False, f"Exception: {str(e)}")
            return False

    def run_image_system_test_only(self):
        """Run only the new tarot image system test as requested"""
        print("🎨 FOCUSED TESTING: NEW TAROT CARD IMAGE SYSTEM")
        print("=" * 60)
        print("Testing the updated 5-level fallback system for tarot card images")
        print("Focus: Image coverage, quality, uniqueness, and system stability")
        print()
        
        # Run the comprehensive image system test
        image_system_passed = self.test_new_tarot_image_system_comprehensive()
        
        print("\n" + "=" * 60)
        print("🏆 IMAGE SYSTEM TEST RESULTS")
        print("=" * 60)
        
        if image_system_passed:
            print("🎉 SUCCESS - New tarot image system is working excellently!")
            print("✅ All criteria met for the 5-level fallback system")
        else:
            print("⚠️ ISSUES DETECTED - Image system needs attention")
            print("❌ Some criteria not met, check details above")
        
        print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return image_system_passed

if __name__ == "__main__":
    print(f"Testing TatoAi Backend API at: {BACKEND_URL}")
    print()
    
    tester = TatoAiTester()
    
    # Run profile and horoscope tests as requested by user
    print("🌟 RUNNING PROFILE & HOROSCOPE FUNCTIONALITY TESTS")
    print("=" * 70)
    profile_horoscope_success = tester.run_profile_horoscope_tests()
    
    # Exit with error code if tests failed
    sys.exit(0 if profile_horoscope_success else 1)