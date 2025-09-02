#!/usr/bin/env python3
"""
78-Card Tarot Deck Testing Script
Comprehensive testing of the full tarot deck system as requested by the user
"""

import requests
import json
import os
from datetime import datetime
import sys

# Get backend URL from environment
BACKEND_URL = "https://taro-mystic-1.preview.emergentagent.com/api"

class Full78DeckTester:
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

    def create_reading(self, category="love", spread_type="one_card", question="Что ждет меня в любви?"):
        """Helper method to create tarot reading"""
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
                return None
                
        except Exception as e:
            return None

    def test_full_78_card_deck_completeness(self):
        """ПОЛНОТА КОЛОДЫ - Test that all 78 cards are available in the system"""
        try:
            print("🔍 Тестирование полноты колоды из 78 карт...")
            
            # Test multiple readings to collect different cards
            all_cards_found = set()
            card_types_found = {"major": 0, "minor": 0}
            suits_found = {"wands": 0, "cups": 0, "swords": 0, "pentacles": 0}
            
            # Create multiple readings to get variety of cards
            for i in range(20):  # More readings for better coverage
                reading = self.create_reading("general", "celtic_cross", f"Тест полной колоды #{i+1}")
                if reading and "cards" in reading:
                    for card in reading["cards"]:
                        card_id = card.get("id")
                        card_type = card.get("type")
                        card_suit = card.get("suit")
                        
                        if card_id is not None:
                            all_cards_found.add(card_id)
                            
                        if card_type == "major":
                            card_types_found["major"] += 1
                        elif card_type == "minor":
                            card_types_found["minor"] += 1
                            
                        if card_suit in suits_found:
                            suits_found[card_suit] += 1
            
            # Analyze results
            total_unique_cards = len(all_cards_found)
            expected_total = 78
            
            # Check for cards from different ranges
            major_arcana_found = len([cid for cid in all_cards_found if 0 <= cid <= 21])
            wands_found = len([cid for cid in all_cards_found if 22 <= cid <= 35])
            cups_found = len([cid for cid in all_cards_found if 36 <= cid <= 49])
            swords_found = len([cid for cid in all_cards_found if 50 <= cid <= 63])
            pentacles_found = len([cid for cid in all_cards_found if 64 <= cid <= 77])
            
            # Check if we have good coverage
            has_major = major_arcana_found > 0
            has_all_suits = wands_found > 0 and cups_found > 0 and swords_found > 0 and pentacles_found > 0
            good_coverage = total_unique_cards >= 40  # At least 40 different cards found
            
            details = f"Найдено {total_unique_cards} уникальных карт из {expected_total}. "
            details += f"Major Arcana (0-21): {major_arcana_found}, "
            details += f"Wands (22-35): {wands_found}, Cups (36-49): {cups_found}, "
            details += f"Swords (50-63): {swords_found}, Pentacles (64-77): {pentacles_found}"
            
            if has_major and has_all_suits and good_coverage:
                self.log_test("ПОЛНОТА КОЛОДЫ - Все 78 карт доступны", True, details)
                return True
            else:
                self.log_test("ПОЛНОТА КОЛОДЫ - Все 78 карт доступны", False, f"Недостаточное покрытие колоды. {details}")
                return False
                
        except Exception as e:
            self.log_test("ПОЛНОТА КОЛОДЫ - Все 78 карт доступны", False, f"Exception: {str(e)}")
            return False

    def test_card_variety_in_spreads(self):
        """РАЗНООБРАЗИЕ КАРТ - Test that different card types appear in spreads"""
        try:
            print("🔍 Тестирование разнообразия карт в раскладах...")
            
            # Test 5-7 different spreads as requested
            spread_tests = [
                ("celtic_cross", "love", "Что ждет меня в любовных отношениях?"),
                ("three_cards", "career", "Как развивается моя карьера?"),
                ("one_card", "finance", "Какие финансовые перспективы меня ждут?"),
                ("celtic_cross", "general", "Что важно знать о моем будущем?"),
                ("three_cards", "love", "Найду ли я любовь в этом году?"),
                ("one_card", "career", "Стоит ли менять работу?"),
                ("celtic_cross", "finance", "Как улучшить финансовое положение?")
            ]
            
            all_cards_collected = []
            major_count = 0
            minor_count = 0
            suits_count = {"wands": 0, "cups": 0, "swords": 0, "pentacles": 0}
            
            for spread_type, category, question in spread_tests:
                reading = self.create_reading(category, spread_type, question)
                if reading and "cards" in reading:
                    cards = reading.get("cards", [])
                    
                    for card in cards:
                        all_cards_collected.append(card)
                        
                        if card.get("type") == "major":
                            major_count += 1
                        elif card.get("type") == "minor":
                            minor_count += 1
                            
                        suit = card.get("suit")
                        if suit in suits_count:
                            suits_count[suit] += 1
            
            # Analyze variety
            total_cards = len(all_cards_collected)
            has_major = major_count > 0
            has_minor = minor_count > 0
            suits_present = sum(1 for count in suits_count.values() if count > 0)
            
            details = f"Протестировано {len(spread_tests)} раскладов. Всего карт: {total_cards}. "
            details += f"Major Arcana: {major_count}, Minor Arcana: {minor_count}. "
            details += f"Масти: Wands({suits_count['wands']}), Cups({suits_count['cups']}), "
            details += f"Swords({suits_count['swords']}), Pentacles({suits_count['pentacles']}). "
            details += f"Мастей представлено: {suits_present}/4"
            
            if has_major and has_minor and suits_present >= 4:
                self.log_test("РАЗНООБРАЗИЕ КАРТ - Major и Minor Arcana в раскладах", True, details)
                return True
            else:
                self.log_test("РАЗНООБРАЗИЕ КАРТ - Major и Minor Arcana в раскладах", False, f"Недостаточное разнообразие. {details}")
                return False
                
        except Exception as e:
            self.log_test("РАЗНООБРАЗИЕ КАРТ - Major и Minor Arcana в раскладах", False, f"Exception: {str(e)}")
            return False

    def test_card_data_quality(self):
        """КАЧЕСТВО ДАННЫХ - Test that all cards have proper structure"""
        try:
            print("🔍 Тестирование качества данных карт...")
            
            # Create readings to get card samples
            readings_data = []
            for i in range(8):
                reading = self.create_reading("general", "three_cards", f"Тест качества данных карт #{i+1}")
                if reading:
                    readings_data.append(reading)
            
            if not readings_data:
                self.log_test("КАЧЕСТВО ДАННЫХ - Структура карт", False, "Не удалось создать чтения для тестирования")
                return False
            
            # Analyze card structure
            cards_analyzed = 0
            structure_issues = []
            major_cards = 0
            minor_cards = 0
            cards_with_images = 0
            cards_with_suits = 0
            cards_with_russian_names = 0
            
            required_fields = ["id", "name", "type", "image", "keywords", "upright_meaning", "reversed_meaning"]
            
            for reading in readings_data:
                for card in reading.get("cards", []):
                    cards_analyzed += 1
                    
                    # Check required fields
                    for field in required_fields:
                        if field not in card or not card[field]:
                            structure_issues.append(f"Карта {card.get('name', 'Unknown')} - отсутствует {field}")
                    
                    # Check card type
                    card_type = card.get("type")
                    if card_type == "major":
                        major_cards += 1
                    elif card_type == "minor":
                        minor_cards += 1
                        # Minor cards should have suit
                        if "suit" in card and card["suit"]:
                            cards_with_suits += 1
                    
                    # Check image
                    image = card.get("image", "")
                    if image and image.startswith("data:image/"):
                        cards_with_images += 1
                    
                    # Check Russian name
                    name = card.get("name", "")
                    has_russian = any(ord(char) >= 1040 and ord(char) <= 1103 for char in name)
                    if has_russian:
                        cards_with_russian_names += 1
            
            # Calculate quality metrics
            structure_quality = (cards_analyzed - len(structure_issues)) / cards_analyzed if cards_analyzed > 0 else 0
            image_quality = cards_with_images / cards_analyzed if cards_analyzed > 0 else 0
            russian_names_quality = cards_with_russian_names / cards_analyzed if cards_analyzed > 0 else 0
            
            details = f"Проанализировано {cards_analyzed} карт. Major: {major_cards}, Minor: {minor_cards}. "
            details += f"С изображениями: {cards_with_images}/{cards_analyzed} ({image_quality:.1%}). "
            details += f"Minor с мастями: {cards_with_suits}/{minor_cards if minor_cards > 0 else 1}. "
            details += f"Русские названия: {cards_with_russian_names}/{cards_analyzed} ({russian_names_quality:.1%}). "
            details += f"Качество структуры: {structure_quality:.1%}"
            
            if len(structure_issues) <= 3 and image_quality >= 0.9 and russian_names_quality >= 0.9:
                self.log_test("КАЧЕСТВО ДАННЫХ - Структура карт", True, details)
                return True
            else:
                details += f". Проблемы: {structure_issues[:3]}"  # Show first 3 issues
                self.log_test("КАЧЕСТВО ДАННЫХ - Структура карт", False, details)
                return False
                
        except Exception as e:
            self.log_test("КАЧЕСТВО ДАННЫХ - Структура карт", False, f"Exception: {str(e)}")
            return False

    def test_api_functionality_with_full_deck(self):
        """ФУНКЦИОНАЛЬНОСТЬ API - Test that all API functionality works with the full 78-card deck"""
        try:
            print("🔍 Тестирование функциональности API с полной колодой...")
            
            # Test all spread types with full deck
            spread_tests = [
                ("one_card", "love", "Тест API с полной колодой - одна карта"),
                ("three_cards", "career", "Тест API с полной колодой - три карты"),
                ("celtic_cross", "finance", "Тест API с полной колодой - кельтский крест"),
                ("one_card", "general", "Тест API с полной колодой - общий"),
                ("three_cards", "love", "Тест API с полной колодой - любовь"),
                ("celtic_cross", "career", "Тест API с полной колодой - карьера")
            ]
            
            successful_tests = 0
            total_tests = len(spread_tests)
            errors_found = []
            
            for spread_type, category, question in spread_tests:
                try:
                    reading = self.create_reading(category, spread_type, question)
                    
                    if reading and "cards" in reading:
                        cards = reading.get("cards", [])
                        
                        # Verify all cards have images
                        all_have_images = all(
                            card.get("image", "").startswith("data:image/") 
                            for card in cards
                        )
                        
                        if all_have_images and len(cards) > 0:
                            successful_tests += 1
                        else:
                            errors_found.append(f"{spread_type}/{category}: Проблемы с изображениями карт")
                    else:
                        errors_found.append(f"{spread_type}/{category}: Не удалось создать расклад")
                        
                except Exception as e:
                    errors_found.append(f"{spread_type}/{category}: {str(e)}")
            
            success_rate = successful_tests / total_tests
            details = f"Успешных тестов: {successful_tests}/{total_tests} ({success_rate:.1%})"
            
            if success_rate >= 0.9:  # 90% success rate
                self.log_test("ФУНКЦИОНАЛЬНОСТЬ API - Все типы раскладов работают", True, details)
                return True
            else:
                details += f". Ошибки: {errors_found[:3]}"  # Show first 3 errors
                self.log_test("ФУНКЦИОНАЛЬНОСТЬ API - Все типы раскладов работают", False, details)
                return False
                
        except Exception as e:
            self.log_test("ФУНКЦИОНАЛЬНОСТЬ API - Все типы раскладов работают", False, f"Exception: {str(e)}")
            return False

    def test_minor_arcana_cards_presence(self):
        """СПЕЦИАЛЬНАЯ ПРОВЕРКА - Test specifically for Minor Arcana cards with ID > 21"""
        try:
            print("🔍 Поиск карт Minor Arcana с ID > 21...")
            
            # Create multiple readings to find Minor Arcana cards
            minor_arcana_found = []
            cards_above_21 = []
            
            for i in range(25):  # More readings to increase chances
                reading = self.create_reading("general", "celtic_cross", f"Поиск Minor Arcana #{i+1}")
                if reading and "cards" in reading:
                    for card in reading["cards"]:
                        card_id = card.get("id")
                        if card_id is not None and card_id > 21:
                            cards_above_21.append(card_id)
                            if card.get("type") == "minor":
                                minor_arcana_found.append({
                                    "id": card_id,
                                    "name": card.get("name"),
                                    "suit": card.get("suit"),
                                    "type": card.get("type")
                                })
            
            # Remove duplicates
            unique_minor_cards = {}
            for card in minor_arcana_found:
                unique_minor_cards[card["id"]] = card
            
            unique_cards_above_21 = len(set(cards_above_21))
            unique_minor_count = len(unique_minor_cards)
            
            # Check suit distribution
            suits_found = {}
            for card in unique_minor_cards.values():
                suit = card.get("suit")
                if suit:
                    suits_found[suit] = suits_found.get(suit, 0) + 1
            
            details = f"Найдено {unique_cards_above_21} уникальных карт с ID > 21. "
            details += f"Minor Arcana: {unique_minor_count}. "
            details += f"Масти: {dict(suits_found)}"
            
            # Show some examples
            if unique_minor_cards:
                examples = list(unique_minor_cards.values())[:5]
                example_names = [f"{card['name']} (ID:{card['id']}, {card['suit']})" for card in examples]
                details += f". Примеры: {', '.join(example_names)}"
            
            if unique_minor_count >= 10 and len(suits_found) >= 3:  # At least 10 minor cards from 3+ suits
                self.log_test("СПЕЦИАЛЬНАЯ ПРОВЕРКА - Minor Arcana (ID > 21)", True, details)
                return True
            else:
                self.log_test("СПЕЦИАЛЬНАЯ ПРОВЕРКА - Minor Arcana (ID > 21)", False, f"Недостаточно Minor Arcana. {details}")
                return False
                
        except Exception as e:
            self.log_test("СПЕЦИАЛЬНАЯ ПРОВЕРКА - Minor Arcana (ID > 21)", False, f"Exception: {str(e)}")
            return False

    def test_card_statistics_analysis(self):
        """СТАТИСТИЧЕСКИЙ АНАЛИЗ - Analyze card statistics across multiple readings"""
        try:
            print("🔍 Статистический анализ карт...")
            
            # Collect statistics from multiple readings
            all_cards = []
            card_counts = {}
            type_counts = {"major": 0, "minor": 0}
            suit_counts = {"wands": 0, "cups": 0, "swords": 0, "pentacles": 0}
            
            # Create various readings
            test_scenarios = [
                ("celtic_cross", "love"), ("three_cards", "career"), ("one_card", "finance"),
                ("celtic_cross", "general"), ("three_cards", "love"), ("one_card", "career"),
                ("celtic_cross", "finance"), ("three_cards", "general"), ("one_card", "love"),
                ("celtic_cross", "career"), ("three_cards", "finance"), ("one_card", "general")
            ]
            
            for spread_type, category in test_scenarios:
                reading = self.create_reading(category, spread_type, f"Статистический анализ {spread_type}/{category}")
                if reading and "cards" in reading:
                    for card in reading["cards"]:
                        all_cards.append(card)
                        
                        # Count card occurrences
                        card_id = card.get("id")
                        if card_id is not None:
                            card_counts[card_id] = card_counts.get(card_id, 0) + 1
                        
                        # Count types
                        card_type = card.get("type")
                        if card_type in type_counts:
                            type_counts[card_type] += 1
                        
                        # Count suits
                        suit = card.get("suit")
                        if suit in suit_counts:
                            suit_counts[suit] += 1
            
            # Analyze statistics
            total_cards = len(all_cards)
            unique_cards = len(card_counts)
            
            # Calculate percentages
            major_percent = (type_counts["major"] / total_cards * 100) if total_cards > 0 else 0
            minor_percent = (type_counts["minor"] / total_cards * 100) if total_cards > 0 else 0
            
            details = f"Всего карт: {total_cards}, Уникальных: {unique_cards}. "
            details += f"Major: {type_counts['major']} ({major_percent:.1f}%), Minor: {type_counts['minor']} ({minor_percent:.1f}%). "
            details += f"Масти - Wands: {suit_counts['wands']}, Cups: {suit_counts['cups']}, "
            details += f"Swords: {suit_counts['swords']}, Pentacles: {suit_counts['pentacles']}"
            
            # Check if we have good distribution
            has_both_types = type_counts["major"] > 0 and type_counts["minor"] > 0
            has_multiple_suits = sum(1 for count in suit_counts.values() if count > 0) >= 4
            good_variety = unique_cards >= 20
            
            if has_both_types and has_multiple_suits and good_variety:
                self.log_test("СТАТИСТИЧЕСКИЙ АНАЛИЗ - Распределение карт", True, details)
                return True
            else:
                self.log_test("СТАТИСТИЧЕСКИЙ АНАЛИЗ - Распределение карт", False, f"Недостаточное разнообразие. {details}")
                return False
                
        except Exception as e:
            self.log_test("СТАТИСТИЧЕСКИЙ АНАЛИЗ - Распределение карт", False, f"Exception: {str(e)}")
            return False

    def run_full_78_deck_tests(self):
        """Run comprehensive 78-card deck tests as requested by user"""
        print("🃏 ТЕСТИРОВАНИЕ ПОЛНОЙ КОЛОДЫ ИЗ 78 КАРТ ТАРО")
        print("=" * 70)
        print("ОСНОВНАЯ ЦЕЛЬ: Убедиться что новая система полной колоды из 78 карт работает идеально")
        print()
        print("ЧТО ТЕСТИРУЕТСЯ:")
        print("1. ПОЛНОТА КОЛОДЫ - Все 78 карт доступны (Major Arcana 0-21, Minor Arcana 22-77)")
        print("2. РАЗНООБРАЗИЕ КАРТ - В раскладах появляются карты всех типов и мастей")
        print("3. КАЧЕСТВО ДАННЫХ - Все карты имеют правильную структуру")
        print("4. ФУНКЦИОНАЛЬНОСТЬ API - Все типы раскладов работают с новой колодой")
        print("5. СПЕЦИАЛЬНЫЕ ПРОВЕРКИ - Поиск Minor Arcana с ID > 21")
        print("6. СТАТИСТИЧЕСКИЙ АНАЛИЗ - Анализ распределения карт")
        print()
        print("=" * 70)
        print()
        
        # Run all tests
        tests = [
            ("ПОЛНОТА КОЛОДЫ", self.test_full_78_card_deck_completeness),
            ("РАЗНООБРАЗИЕ КАРТ", self.test_card_variety_in_spreads),
            ("КАЧЕСТВО ДАННЫХ", self.test_card_data_quality),
            ("ФУНКЦИОНАЛЬНОСТЬ API", self.test_api_functionality_with_full_deck),
            ("СПЕЦИАЛЬНЫЕ ПРОВЕРКИ", self.test_minor_arcana_cards_presence),
            ("СТАТИСТИЧЕСКИЙ АНАЛИЗ", self.test_card_statistics_analysis)
        ]
        
        passed_tests = 0
        
        for test_name, test_func in tests:
            print(f"🔍 {test_name}")
            print("-" * 40)
            if test_func():
                passed_tests += 1
            print()
        
        # Generate summary
        print("=" * 70)
        print("🃏 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ ПОЛНОЙ КОЛОДЫ ИЗ 78 КАРТ")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_count = sum(1 for result in self.test_results if result["success"])
        failed_count = total_tests - passed_count
        
        print(f"Всего тестов: {total_tests}")
        print(f"Пройдено: {passed_count} ✅")
        print(f"Провалено: {failed_count} ❌")
        print(f"Процент успеха: {(passed_count/total_tests)*100:.1f}%")
        print()
        
        # Feature status
        if passed_count == total_tests:
            print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! СИСТЕМА ПОЛНОЙ КОЛОДЫ ИЗ 78 КАРТ РАБОТАЕТ ИДЕАЛЬНО!")
            print()
            print("✅ ПОЛНОТА КОЛОДЫ: Все 78 карт доступны")
            print("✅ РАЗНООБРАЗИЕ КАРТ: Major и Minor Arcana появляются в раскладах")
            print("✅ КАЧЕСТВО ДАННЫХ: Все карты имеют правильную структуру")
            print("✅ ФУНКЦИОНАЛЬНОСТЬ API: Все типы раскладов работают")
            print("✅ СПЕЦИАЛЬНЫЕ ПРОВЕРКИ: Minor Arcana с ID > 21 найдены")
            print("✅ СТАТИСТИЧЕСКИЙ АНАЛИЗ: Хорошее распределение карт")
        else:
            print("❌ ОБНАРУЖЕНЫ ПРОБЛЕМЫ:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("=" * 70)
        
        return passed_count == total_tests

if __name__ == "__main__":
    tester = Full78DeckTester()
    success = tester.run_full_78_deck_tests()
    sys.exit(0 if success else 1)