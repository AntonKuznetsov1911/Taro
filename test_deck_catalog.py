#!/usr/bin/env python3
"""
Test script specifically for the new deck catalog endpoints
"""

import requests
import json
import time
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://mystictaro.preview.emergentagent.com/api"

class DeckCatalogTester:
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

    def test_deck_catalog_endpoint(self):
        """Test GET /api/deck - full deck catalog (lightweight payload)"""
        try:
            response = self.session.get(f"{self.base_url}/deck")
            
            if response.status_code == 200:
                data = response.json()
                
                if "cards" in data and isinstance(data["cards"], list):
                    cards = data["cards"]
                    
                    # Check we have all 78 cards
                    if len(cards) != 78:
                        self.log_test("Deck catalog endpoint", False, f"Expected 78 cards, got {len(cards)}")
                        return False
                    
                    # Check lightweight payload structure
                    required_fields = ["id", "name", "name_en", "type", "suit", "image", "keywords"]
                    all_valid = True
                    cards_with_images = 0
                    cards_with_suits = 0
                    major_count = 0
                    minor_count = 0
                    
                    for card in cards:
                        # Check required fields
                        for field in required_fields:
                            if field not in card:
                                all_valid = False
                                break
                        
                        # Check image presence (base64 data URL)
                        image = card.get("image", "")
                        if image and image.startswith("data:image/") and "base64," in image:
                            cards_with_images += 1
                        
                        # Check suit for minor arcana
                        card_type = card.get("type")
                        if card_type == "major":
                            major_count += 1
                        elif card_type == "minor":
                            minor_count += 1
                            if card.get("suit"):
                                cards_with_suits += 1
                    
                    # Calculate response size (performance check)
                    response_size = len(json.dumps(data).encode('utf-8'))
                    response_size_mb = response_size / (1024 * 1024)
                    
                    # Validate results
                    image_coverage = cards_with_images / len(cards) * 100
                    suit_coverage = cards_with_suits / minor_count * 100 if minor_count > 0 else 0
                    
                    if (all_valid and image_coverage >= 95 and 
                        major_count >= 20 and minor_count >= 50 and
                        response_size_mb < 5):  # Lightweight - under 5MB
                        
                        details = f"✅ Full deck catalog - 78 cards, Images: {image_coverage:.1f}%, Major: {major_count}, Minor: {minor_count}, Suits: {suit_coverage:.1f}%, Size: {response_size_mb:.2f}MB"
                        self.log_test("Deck catalog endpoint", True, details)
                        return True
                    else:
                        details = f"❌ Issues - Valid structure: {all_valid}, Images: {image_coverage:.1f}%, Major: {major_count}, Minor: {minor_count}, Size: {response_size_mb:.2f}MB"
                        self.log_test("Deck catalog endpoint", False, details)
                        return False
                else:
                    self.log_test("Deck catalog endpoint", False, "Invalid response format - no cards array", data)
                    return False
            else:
                self.log_test("Deck catalog endpoint", False, f"Status code: {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_test("Deck catalog endpoint", False, f"Exception: {str(e)}")
            return False

    def test_single_card_endpoint(self):
        """Test GET /api/card/{id} - get single card data"""
        try:
            # Test with various card IDs
            test_card_ids = [0, 1, 21, 22, 36, 50, 64, 77]  # Mix of Major and Minor Arcana
            all_passed = True
            
            for card_id in test_card_ids:
                response = self.session.get(f"{self.base_url}/card/{card_id}")
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if "card" in data:
                        card = data["card"]
                        
                        # Check full card structure
                        required_fields = ["id", "name", "name_en", "type", "image", "keywords", "upright_meaning", "reversed_meaning"]
                        
                        if all(field in card for field in required_fields):
                            # Validate specific fields
                            card_type = card.get("type")
                            suit = card.get("suit")
                            image = card.get("image", "")
                            
                            # Check image format
                            valid_image = image.startswith("data:image/") and "base64," in image
                            
                            # Check suit for minor arcana
                            suit_valid = True
                            if card_type == "minor" and card_id > 21:
                                suit_valid = suit in ["wands", "cups", "swords", "pentacles"]
                            elif card_type == "major":
                                suit_valid = True  # Major arcana may not have suit
                            
                            if valid_image and suit_valid:
                                self.log_test(f"Single card endpoint - ID {card_id}", True, 
                                            f"✅ Card {card['name']} - Type: {card_type}, Suit: {suit}, Image: valid")
                            else:
                                self.log_test(f"Single card endpoint - ID {card_id}", False, 
                                            f"❌ Validation failed - Image: {valid_image}, Suit: {suit_valid}")
                                all_passed = False
                        else:
                            missing_fields = [field for field in required_fields if field not in card]
                            self.log_test(f"Single card endpoint - ID {card_id}", False, 
                                        f"Missing fields: {missing_fields}")
                            all_passed = False
                    else:
                        self.log_test(f"Single card endpoint - ID {card_id}", False, 
                                    "No card field in response", data)
                        all_passed = False
                elif response.status_code == 404:
                    self.log_test(f"Single card endpoint - ID {card_id}", False, 
                                f"Card not found (404) - ID {card_id} should exist")
                    all_passed = False
                else:
                    self.log_test(f"Single card endpoint - ID {card_id}", False, 
                                f"Status code: {response.status_code}")
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("Single card endpoint", False, f"Exception: {str(e)}")
            return False

    def test_card_interpretation_endpoint(self):
        """Test POST /api/card-interpretation - get card interpretation"""
        try:
            # Test with different cards and reversed states
            test_cases = [
                (0, False, "The Fool upright"),
                (0, True, "The Fool reversed"),
                (21, False, "The World upright"),
                (22, False, "Ace of Wands upright"),
                (36, True, "Ace of Cups reversed"),
                (50, False, "Two of Swords upright"),
                (77, True, "Ten of Pentacles reversed")
            ]
            
            all_passed = True
            interpretation_lengths = []
            
            for card_id, reversed, description in test_cases:
                payload = {
                    "card_id": card_id,
                    "reversed": reversed
                }
                
                response = self.session.post(
                    f"{self.base_url}/card-interpretation",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if "interpretation" in data:
                        interpretation = data["interpretation"]
                        
                        # Check interpretation quality
                        word_count = len(interpretation.split())
                        char_count = len(interpretation)
                        interpretation_lengths.append(word_count)
                        
                        # Check for Russian text
                        has_russian = any(ord(char) >= 1040 and ord(char) <= 1103 for char in interpretation)
                        
                        # Check for substantial content
                        is_substantial = word_count >= 50  # Minimum reasonable length
                        
                        # Check for mystical/tarot style
                        mystical_keywords = ["карт", "энерг", "духов", "вселенн", "судьб", "мудр", "совет"]
                        has_mystical_style = any(keyword in interpretation.lower() for keyword in mystical_keywords)
                        
                        # Check for reversed indication if applicable
                        reversed_mentioned = "перевернут" in interpretation.lower() if reversed else True
                        
                        if has_russian and is_substantial and has_mystical_style and reversed_mentioned:
                            self.log_test(f"Card interpretation - {description}", True, 
                                        f"✅ Quality interpretation - {word_count} words, Russian: {has_russian}, Mystical: {has_mystical_style}")
                        else:
                            details = f"Words: {word_count}, Russian: {has_russian}, Mystical: {has_mystical_style}, Reversed noted: {reversed_mentioned}"
                            self.log_test(f"Card interpretation - {description}", False, f"❌ Quality issues - {details}")
                            all_passed = False
                    else:
                        self.log_test(f"Card interpretation - {description}", False, 
                                    "No interpretation field in response", data)
                        all_passed = False
                else:
                    self.log_test(f"Card interpretation - {description}", False, 
                                f"Status code: {response.status_code}", response.text[:200])
                    all_passed = False
            
            # Overall assessment
            if interpretation_lengths:
                avg_length = sum(interpretation_lengths) / len(interpretation_lengths)
                min_length = min(interpretation_lengths)
                max_length = max(interpretation_lengths)
                
                print(f"   📊 Interpretation Statistics:")
                print(f"      Average length: {avg_length:.0f} words")
                print(f"      Range: {min_length} - {max_length} words")
                print(f"      Tests passed: {sum(1 for case in test_cases if all_passed)}/{len(test_cases)}")
            
            return all_passed
            
        except Exception as e:
            self.log_test("Card interpretation endpoint", False, f"Exception: {str(e)}")
            return False

    def test_deck_catalog_performance(self):
        """Test deck catalog performance and response size"""
        try:
            # Measure response time
            start_time = time.time()
            response = self.session.get(f"{self.base_url}/deck")
            end_time = time.time()
            
            response_time = end_time - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Measure response size
                response_size = len(json.dumps(data).encode('utf-8'))
                response_size_kb = response_size / 1024
                
                # Count cards and validate lightweight payload
                cards = data.get("cards", [])
                card_count = len(cards)
                
                # Check if payload is truly lightweight (no heavy fields)
                heavy_fields = ["upright_meaning", "reversed_meaning", "description"]
                has_heavy_fields = any(
                    any(field in card for field in heavy_fields)
                    for card in cards
                )
                
                # Performance thresholds
                acceptable_time = 3.0  # 3 seconds max
                acceptable_size = 2048  # 2MB max for lightweight
                
                if (response_time <= acceptable_time and 
                    response_size_kb <= acceptable_size and 
                    card_count == 78 and 
                    not has_heavy_fields):
                    
                    details = f"✅ Performance good - Time: {response_time:.2f}s, Size: {response_size_kb:.1f}KB, Cards: {card_count}, Lightweight: {not has_heavy_fields}"
                    self.log_test("Deck catalog performance", True, details)
                    return True
                else:
                    details = f"❌ Performance issues - Time: {response_time:.2f}s (max {acceptable_time}s), Size: {response_size_kb:.1f}KB (max {acceptable_size}KB), Cards: {card_count}, Heavy fields: {has_heavy_fields}"
                    self.log_test("Deck catalog performance", False, details)
                    return False
            else:
                self.log_test("Deck catalog performance", False, f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Deck catalog performance", False, f"Exception: {str(e)}")
            return False

    def test_deck_catalog_fallback_system(self):
        """Test that card interpretation uses fallback when OpenAI unavailable"""
        try:
            # Test interpretation fallback (should be used due to OpenAI quota)
            payload = {
                "card_id": 0,  # The Fool
                "reversed": False
            }
            
            response = self.session.post(
                f"{self.base_url}/card-interpretation",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                interpretation = data.get("interpretation", "")
                
                # Check for fallback characteristics
                fallback_indicators = [
                    "карта", "энерг", "проявляются", "совет", "мудрой гадалки",
                    "прислушайтесь", "внутреннему голосу", "вселенная"
                ]
                
                found_indicators = [indicator for indicator in fallback_indicators if indicator in interpretation.lower()]
                indicator_score = len(found_indicators)
                
                # Check for Russian text and reasonable length
                has_russian = any(ord(char) >= 1040 and ord(char) <= 1103 for char in interpretation)
                word_count = len(interpretation.split())
                is_substantial = word_count >= 30
                
                if indicator_score >= 2 and has_russian and is_substantial:
                    self.log_test("Deck catalog fallback system", True, 
                                f"✅ Fallback working - Indicators: {indicator_score}, Words: {word_count}, Russian: {has_russian}")
                    return True
                else:
                    self.log_test("Deck catalog fallback system", False, 
                                f"❌ Fallback issues - Indicators: {indicator_score}, Words: {word_count}, Russian: {has_russian}")
                    return False
            else:
                self.log_test("Deck catalog fallback system", False, f"Status code: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Deck catalog fallback system", False, f"Exception: {str(e)}")
            return False

    def test_deck_catalog_error_handling(self):
        """Test error handling for deck catalog endpoints"""
        try:
            all_passed = True
            
            # Test invalid card ID
            invalid_ids = [999, -1, "invalid"]
            
            for invalid_id in invalid_ids:
                response = self.session.get(f"{self.base_url}/card/{invalid_id}")
                
                if response.status_code == 404:
                    self.log_test(f"Error handling - Invalid ID {invalid_id}", True, 
                                f"✅ Correctly returned 404 for invalid ID {invalid_id}")
                else:
                    self.log_test(f"Error handling - Invalid ID {invalid_id}", False, 
                                f"❌ Expected 404, got {response.status_code}")
                    all_passed = False
            
            # Test invalid interpretation request
            invalid_payloads = [
                {},  # Missing card_id
                {"card_id": "invalid"},  # Invalid card_id type
                {"card_id": 999},  # Non-existent card_id
                {"card_id": -1},  # Negative card_id
            ]
            
            for i, payload in enumerate(invalid_payloads):
                response = self.session.post(
                    f"{self.base_url}/card-interpretation",
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                
                # Should return 422 for validation errors or 404 for non-existent cards
                if response.status_code in [404, 422]:
                    self.log_test(f"Error handling - Invalid payload {i+1}", True, 
                                f"✅ Correctly returned {response.status_code} for invalid payload")
                else:
                    self.log_test(f"Error handling - Invalid payload {i+1}", False, 
                                f"❌ Expected 404/422, got {response.status_code}")
                    all_passed = False
            
            return all_passed
            
        except Exception as e:
            self.log_test("Deck catalog error handling", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all deck catalog tests"""
        print("🃏 DECK CATALOG ENDPOINTS TESTING")
        print("=" * 60)
        print("Testing new deck catalog endpoints as requested:")
        print("1) GET /api/deck - returns full list of 78 cards (lightweight payload)")
        print("2) GET /api/card/{id} - returns full data for one card")
        print("3) POST /api/card-interpretation - returns card interpretation")
        print()
        
        deck_tests = [
            ("Deck catalog endpoint", self.test_deck_catalog_endpoint),
            ("Single card endpoint", self.test_single_card_endpoint),
            ("Card interpretation endpoint", self.test_card_interpretation_endpoint),
            ("Deck catalog performance", self.test_deck_catalog_performance),
            ("Deck catalog fallback system", self.test_deck_catalog_fallback_system),
            ("Deck catalog error handling", self.test_deck_catalog_error_handling)
        ]
        
        passed_tests = 0
        
        for test_name, test_func in deck_tests:
            print(f"🔍 Testing: {test_name}")
            if test_func():
                passed_tests += 1
            print()
        
        print("=" * 60)
        print(f"🃏 DECK CATALOG TESTING COMPLETE")
        print(f"Results: {passed_tests}/{len(deck_tests)} tests passed ({(passed_tests/len(deck_tests))*100:.1f}%)")
        
        if passed_tests == len(deck_tests):
            print("✅ ALL DECK CATALOG TESTS PASSED! New endpoints are fully working.")
        else:
            print(f"❌ {len(deck_tests) - passed_tests} deck catalog tests failed. Check details above.")
        
        print("=" * 60)
        
        return passed_tests, len(deck_tests), self.test_results

if __name__ == "__main__":
    print(f"Testing TatoAi Deck Catalog Endpoints at: {BACKEND_URL}")
    print()
    
    tester = DeckCatalogTester()
    passed, total, results = tester.run_all_tests()
    
    print("\n🔮 FINAL SUMMARY")
    print("=" * 40)
    print(f"Total Tests: {total}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {total - passed} ❌")
    print(f"Success Rate: {(passed/total)*100:.1f}%")
    
    if total - passed > 0:
        print("\n❌ Failed Tests:")
        for result in results:
            if not result["success"]:
                print(f"  - {result['test']}: {result['details']}")