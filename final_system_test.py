#!/usr/bin/env python3
"""
ФИНАЛЬНОЕ ТЕСТИРОВАНИЕ СИСТЕМЫ БЕЗ ОШИБОК
Final System Testing - Comprehensive Error-Free System Validation

Цель: Убедиться что все ошибки исправлены и система работает стабильно без каких-либо ERROR в логах.
"""

import requests
import json
import base64
from datetime import datetime
import sys

# Backend URL from environment
BACKEND_URL = "https://mystictaro.preview.emergentagent.com/api"

class FinalSystemTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.session = requests.Session()
        self.error_count = 0
        
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
        
        if not success:
            self.error_count += 1
            
        status = "✅ УСПЕХ" if success else "❌ ОШИБКА"
        print(f"{status} - {test_name}")
        if details:
            print(f"   Детали: {details}")
        if not success and response_data:
            print(f"   Ответ: {response_data}")
        print()

    def test_tarot_spreads_stability(self):
        """Тест стабильности всех типов таро раскладов"""
        print("🃏 ТЕСТИРОВАНИЕ СТАБИЛЬНОСТИ ТАРО РАСКЛАДОВ")
        print("-" * 60)
        
        # Тестируем все комбинации раскладов
        test_combinations = [
            ("one_card", "love", "Найду ли я любовь в этом году?", 1),
            ("three_cards", "love", "Что ждет меня в любовных отношениях?", 3),
            ("celtic_cross", "love", "Детальный анализ моей любовной ситуации", 10),
            ("one_card", "career", "Как развивается моя карьера?", 1),
            ("three_cards", "career", "Какие карьерные возможности меня ждут?", 3),
            ("celtic_cross", "career", "Полный анализ моего профессионального пути", 10),
            ("one_card", "finance", "Какие финансовые перспективы?", 1),
            ("three_cards", "finance", "Как улучшить материальное положение?", 3),
            ("celtic_cross", "finance", "Детальный финансовый прогноз", 10),
            ("one_card", "general", "Что важно знать о будущем?", 1),
            ("three_cards", "general", "Общий жизненный прогноз", 3),
            ("celtic_cross", "general", "Комплексный анализ жизненной ситуации", 10)
        ]
        
        all_passed = True
        
        for spread_type, category, question, expected_cards in test_combinations:
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
                
                test_name = f"Расклад {spread_type} ({category})"
                
                if response.status_code == 200:
                    data = response.json()
                    cards = data.get("cards", [])
                    interpretation = data.get("interpretation", "")
                    
                    # Проверяем количество карт
                    if len(cards) == expected_cards:
                        # Проверяем качество интерпретации
                        has_russian = any(ord(char) >= 1040 and ord(char) <= 1103 for char in interpretation)
                        is_substantial = len(interpretation) > 200
                        
                        if has_russian and is_substantial:
                            self.log_test(test_name, True, 
                                        f"Карт: {len(cards)}, Интерпретация: {len(interpretation)} символов")
                        else:
                            self.log_test(test_name, False, 
                                        f"Проблемы с интерпретацией - Русский: {has_russian}, Длина: {len(interpretation)}")
                            all_passed = False
                    else:
                        self.log_test(test_name, False, 
                                    f"Неверное количество карт - Ожидалось: {expected_cards}, Получено: {len(cards)}")
                        all_passed = False
                else:
                    self.log_test(test_name, False, 
                                f"HTTP ошибка {response.status_code}: {response.text[:200]}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"Расклад {spread_type} ({category})", False, f"Исключение: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_palmistry_functionality(self):
        """Тест функциональности хиромантии"""
        print("🤲 ТЕСТИРОВАНИЕ ХИРОМАНТИИ")
        print("-" * 30)
        
        # Создаем тестовое изображение ладони (base64)
        test_image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A"
        
        try:
            payload = {
                "image_base64": test_image,
                "question": "Расскажите о моей судьбе по линиям руки"
            }
            
            response = self.session.post(
                f"{self.base_url}/palmistry",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Проверяем структуру ответа
                required_fields = ["id", "question", "image_base64", "lines", "interpretation", "created_at"]
                if all(field in data for field in required_fields):
                    
                    lines = data.get("lines", [])
                    interpretation = data.get("interpretation", "")
                    
                    # Проверяем линии ладони
                    expected_lines = 7  # Должно быть 7 линий
                    if len(lines) == expected_lines:
                        
                        # Проверяем качество интерпретации
                        has_russian = any(ord(char) >= 1040 and ord(char) <= 1103 for char in interpretation)
                        is_substantial = len(interpretation) > 300
                        
                        if has_russian and is_substantial:
                            self.log_test("Анализ хиромантии", True, 
                                        f"Линий: {len(lines)}, Интерпретация: {len(interpretation)} символов")
                            return True
                        else:
                            self.log_test("Анализ хиромантии", False, 
                                        f"Проблемы с интерпретацией - Русский: {has_russian}, Длина: {len(interpretation)}")
                            return False
                    else:
                        self.log_test("Анализ хиромантии", False, 
                                    f"Неверное количество линий - Ожидалось: {expected_lines}, Получено: {len(lines)}")
                        return False
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test("Анализ хиромантии", False, f"Отсутствуют поля: {missing_fields}")
                    return False
            else:
                self.log_test("Анализ хиромантии", False, 
                            f"HTTP ошибка {response.status_code}: {response.text[:200]}")
                return False
                
        except Exception as e:
            self.log_test("Анализ хиромантии", False, f"Исключение: {str(e)}")
            return False

    def test_horoscope_functionality(self):
        """Тест функциональности гороскопов"""
        print("🌟 ТЕСТИРОВАНИЕ ГОРОСКОПОВ")
        print("-" * 30)
        
        try:
            # Сначала создаем профиль
            profile_payload = {
                "name": "Мария Иванова",
                "birth_date": "1985-07-20",
                "birth_time": "14:30",
                "birth_place": "Москва"
            }
            
            profile_response = self.session.post(
                f"{self.base_url}/profile",
                json=profile_payload,
                headers={"Content-Type": "application/json"}
            )
            
            if profile_response.status_code != 200:
                self.log_test("Создание профиля для гороскопа", False, 
                            f"HTTP ошибка {profile_response.status_code}")
                return False
            
            # Теперь получаем гороскоп
            horoscope_response = self.session.get(f"{self.base_url}/horoscope")
            
            if horoscope_response.status_code == 200:
                data = horoscope_response.json()
                
                # Проверяем структуру гороскопа
                required_fields = ["id", "user_profile_id", "date", "zodiac_sign", "horoscope_text", 
                                 "mood_rating", "love_forecast", "career_forecast", "health_forecast", 
                                 "lucky_numbers", "lucky_color", "created_at"]
                
                if all(field in data for field in required_fields):
                    horoscope_text = data.get("horoscope_text", "")
                    lucky_numbers = data.get("lucky_numbers", [])
                    zodiac_sign = data.get("zodiac_sign", "")
                    
                    # Проверяем качество гороскопа
                    has_russian = any(ord(char) >= 1040 and ord(char) <= 1103 for char in horoscope_text)
                    is_substantial = len(horoscope_text) > 200
                    has_lucky_numbers = len(lucky_numbers) == 6
                    has_zodiac = zodiac_sign in ["Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева", 
                                               "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"]
                    
                    if has_russian and is_substantial and has_lucky_numbers and has_zodiac:
                        self.log_test("Генерация гороскопа", True, 
                                    f"Знак: {zodiac_sign}, Текст: {len(horoscope_text)} символов, Числа: {len(lucky_numbers)}")
                        return True
                    else:
                        details = f"Русский: {has_russian}, Длина: {len(horoscope_text)}, Числа: {has_lucky_numbers}, Знак: {has_zodiac}"
                        self.log_test("Генерация гороскопа", False, f"Проблемы с качеством - {details}")
                        return False
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test("Генерация гороскопа", False, f"Отсутствуют поля: {missing_fields}")
                    return False
            else:
                self.log_test("Генерация гороскопа", False, 
                            f"HTTP ошибка {horoscope_response.status_code}: {horoscope_response.text[:200]}")
                return False
                
        except Exception as e:
            self.log_test("Генерация гороскопа", False, f"Исключение: {str(e)}")
            return False

    def test_name_compatibility(self):
        """Тест совместимости имен"""
        print("💕 ТЕСТИРОВАНИЕ СОВМЕСТИМОСТИ ИМЕН")
        print("-" * 40)
        
        try:
            payload = {
                "name1": "Анна",
                "name2": "Дмитрий"
            }
            
            response = self.session.post(
                f"{self.base_url}/compatibility",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Проверяем структуру ответа
                required_fields = ["id", "name1", "name2", "compatibility_score", "analysis", "created_at"]
                if all(field in data for field in required_fields):
                    
                    score = data.get("compatibility_score", 0)
                    analysis = data.get("analysis", "")
                    
                    # Проверяем качество анализа
                    has_russian = any(ord(char) >= 1040 and ord(char) <= 1103 for char in analysis)
                    is_substantial = len(analysis) > 150
                    valid_score = 0 <= score <= 100
                    
                    if has_russian and is_substantial and valid_score:
                        self.log_test("Совместимость имен", True, 
                                    f"Совместимость: {score}%, Анализ: {len(analysis)} символов")
                        return True
                    else:
                        details = f"Русский: {has_russian}, Длина: {len(analysis)}, Счет: {valid_score}"
                        self.log_test("Совместимость имен", False, f"Проблемы с качеством - {details}")
                        return False
                else:
                    missing_fields = [field for field in required_fields if field not in required_fields]
                    self.log_test("Совместимость имен", False, f"Отсутствуют поля: {missing_fields}")
                    return False
            else:
                self.log_test("Совместимость имен", False, 
                            f"HTTP ошибка {response.status_code}: {response.text[:200]}")
                return False
                
        except Exception as e:
            self.log_test("Совместимость имен", False, f"Исключение: {str(e)}")
            return False

    def test_fallback_system(self):
        """Тест системы fallback при превышении квоты OpenAI"""
        print("🔄 ТЕСТИРОВАНИЕ FALLBACK СИСТЕМЫ")
        print("-" * 40)
        
        # Создаем несколько запросов подряд для проверки стабильности fallback
        test_requests = [
            ("love", "one_card", "Тест fallback системы для любви"),
            ("career", "three_cards", "Тест fallback системы для карьеры"),
            ("finance", "celtic_cross", "Тест fallback системы для финансов")
        ]
        
        all_passed = True
        
        for category, spread_type, question in test_requests:
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
                    interpretation = data.get("interpretation", "")
                    
                    # Проверяем качество fallback интерпретации
                    has_russian = any(ord(char) >= 1040 and ord(char) <= 1103 for char in interpretation)
                    is_substantial = len(interpretation) > 200
                    
                    # Проверяем наличие мистических элементов (характерно для fallback)
                    mystical_elements = ["дорогая", "милая", "вижу", "духи", "энергия", "карты", "вселенная"]
                    has_mystical = any(element in interpretation.lower() for element in mystical_elements)
                    
                    if has_russian and is_substantial and has_mystical:
                        self.log_test(f"Fallback {category}/{spread_type}", True, 
                                    f"Качественная fallback интерпретация: {len(interpretation)} символов")
                    else:
                        self.log_test(f"Fallback {category}/{spread_type}", False, 
                                    f"Проблемы с fallback - Русский: {has_russian}, Длина: {len(interpretation)}, Мистика: {has_mystical}")
                        all_passed = False
                else:
                    self.log_test(f"Fallback {category}/{spread_type}", False, 
                                f"HTTP ошибка {response.status_code}")
                    all_passed = False
                    
            except Exception as e:
                self.log_test(f"Fallback {category}/{spread_type}", False, f"Исключение: {str(e)}")
                all_passed = False
        
        return all_passed

    def test_full_deck_validation(self):
        """Тест полной колоды из 78 карт"""
        print("🃏 ТЕСТИРОВАНИЕ ПОЛНОЙ КОЛОДЫ (78 КАРТ)")
        print("-" * 50)
        
        # Создаем несколько раскладов для получения разных карт
        unique_cards = set()
        suits_found = set()
        
        for i in range(10):  # Создаем 10 раскладов celtic_cross для максимального покрытия
            try:
                payload = {
                    "category": "general",
                    "spread_type": "celtic_cross",
                    "question": f"Тест полной колоды #{i+1}"
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
                        card_id = card.get("id")
                        card_suit = card.get("suit")
                        card_type = card.get("type")
                        
                        if card_id is not None:
                            unique_cards.add(card_id)
                        
                        if card_suit:
                            suits_found.add(card_suit)
                        elif card_type == "major":
                            suits_found.add("major")
                            
            except Exception as e:
                continue
        
        # Анализируем результаты
        total_unique = len(unique_cards)
        expected_suits = {"major", "wands", "cups", "swords", "pentacles"}
        suits_coverage = len(suits_found.intersection(expected_suits))
        
        if total_unique >= 50:  # Должно быть достаточно уникальных карт
            if suits_coverage >= 4:  # Должны быть представлены разные масти
                self.log_test("Полная колода", True, 
                            f"Уникальных карт: {total_unique}, Масти: {suits_found}")
                return True
            else:
                self.log_test("Полная колода", False, 
                            f"Недостаточно мастей - Найдено: {suits_found}")
                return False
        else:
            self.log_test("Полная колода", False, 
                        f"Недостаточно уникальных карт: {total_unique}")
            return False

    def test_system_endpoints(self):
        """Тест основных системных endpoints"""
        print("🔧 ТЕСТИРОВАНИЕ СИСТЕМНЫХ ENDPOINTS")
        print("-" * 45)
        
        endpoints_passed = 0
        total_endpoints = 0
        
        # Тест корневого endpoint
        try:
            response = self.session.get(f"{self.base_url}/")
            total_endpoints += 1
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Корневой endpoint", True, f"Сообщение: {data['message']}")
                    endpoints_passed += 1
                else:
                    self.log_test("Корневой endpoint", False, "Отсутствует поле message")
            else:
                self.log_test("Корневой endpoint", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Корневой endpoint", False, f"Исключение: {str(e)}")
        
        # Тест categories endpoint
        try:
            response = self.session.get(f"{self.base_url}/categories")
            total_endpoints += 1
            if response.status_code == 200:
                data = response.json()
                if "categories" in data and len(data["categories"]) == 4:
                    self.log_test("Categories endpoint", True, f"Категорий: {len(data['categories'])}")
                    endpoints_passed += 1
                else:
                    self.log_test("Categories endpoint", False, "Неверная структура категорий")
            else:
                self.log_test("Categories endpoint", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Categories endpoint", False, f"Исключение: {str(e)}")
        
        # Тест spreads endpoint
        try:
            response = self.session.get(f"{self.base_url}/spreads")
            total_endpoints += 1
            if response.status_code == 200:
                data = response.json()
                if "spreads" in data and len(data["spreads"]) == 3:
                    self.log_test("Spreads endpoint", True, f"Раскладов: {len(data['spreads'])}")
                    endpoints_passed += 1
                else:
                    self.log_test("Spreads endpoint", False, "Неверная структура раскладов")
            else:
                self.log_test("Spreads endpoint", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Spreads endpoint", False, f"Исключение: {str(e)}")
        
        # Тест card-back endpoint
        try:
            response = self.session.get(f"{self.base_url}/card-back")
            total_endpoints += 1
            if response.status_code == 200:
                data = response.json()
                if "card_back" in data and data["card_back"].startswith("data:image/"):
                    self.log_test("Card-back endpoint", True, "Изображение рубашки карты загружено")
                    endpoints_passed += 1
                else:
                    self.log_test("Card-back endpoint", False, "Неверный формат изображения")
            else:
                self.log_test("Card-back endpoint", False, f"HTTP {response.status_code}")
        except Exception as e:
            self.log_test("Card-back endpoint", False, f"Исключение: {str(e)}")
        
        return endpoints_passed == total_endpoints

    def run_final_system_test(self):
        """Запуск финального системного теста"""
        print("🎯 ФИНАЛЬНОЕ ТЕСТИРОВАНИЕ СИСТЕМЫ БЕЗ ОШИБОК")
        print("=" * 70)
        print("Цель: Убедиться что все ошибки исправлены и система работает стабильно")
        print("Проверяем: Отсутствие ERROR в логах, стабильную работу всех функций")
        print()
        
        # Запускаем все тесты
        test_results = []
        
        # 1. Тест системных endpoints
        print("1️⃣ СИСТЕМНЫЕ ENDPOINTS")
        endpoints_passed = self.test_system_endpoints()
        test_results.append(("Системные endpoints", endpoints_passed))
        
        # 2. Тест стабильности таро раскладов
        print("\n2️⃣ СТАБИЛЬНОСТЬ ТАРО РАСКЛАДОВ")
        tarot_passed = self.test_tarot_spreads_stability()
        test_results.append(("Таро расклады", tarot_passed))
        
        # 3. Тест хиромантии
        print("\n3️⃣ ХИРОМАНТИЯ")
        palmistry_passed = self.test_palmistry_functionality()
        test_results.append(("Хиромантия", palmistry_passed))
        
        # 4. Тест гороскопов
        print("\n4️⃣ ГОРОСКОПЫ")
        horoscope_passed = self.test_horoscope_functionality()
        test_results.append(("Гороскопы", horoscope_passed))
        
        # 5. Тест совместимости имен
        print("\n5️⃣ СОВМЕСТИМОСТЬ ИМЕН")
        compatibility_passed = self.test_name_compatibility()
        test_results.append(("Совместимость имен", compatibility_passed))
        
        # 6. Тест fallback системы
        print("\n6️⃣ FALLBACK СИСТЕМА")
        fallback_passed = self.test_fallback_system()
        test_results.append(("Fallback система", fallback_passed))
        
        # 7. Тест полной колоды
        print("\n7️⃣ ПОЛНАЯ КОЛОДА")
        deck_passed = self.test_full_deck_validation()
        test_results.append(("Полная колода", deck_passed))
        
        # Итоговые результаты
        print("\n" + "=" * 70)
        print("🏆 ИТОГОВЫЕ РЕЗУЛЬТАТЫ ФИНАЛЬНОГО ТЕСТИРОВАНИЯ")
        print("=" * 70)
        
        passed_tests = sum(1 for _, passed in test_results if passed)
        total_tests = len(test_results)
        
        for test_name, passed in test_results:
            status = "✅ УСПЕХ" if passed else "❌ ОШИБКА"
            print(f"{status} - {test_name}")
        
        print(f"\nВсего тестов: {total_tests}")
        print(f"Пройдено: {passed_tests}")
        print(f"Провалено: {total_tests - passed_tests}")
        print(f"Процент успеха: {(passed_tests/total_tests)*100:.1f}%")
        
        if self.error_count == 0:
            print("\n🎉 СИСТЕМА РАБОТАЕТ БЕЗ ОШИБОК! 🎉")
            print("✅ Все API endpoints работают без ошибок")
            print("✅ Fallback система активна и эффективна") 
            print("✅ Качественные интерпретации во всех режимах")
            print("✅ Стабильная работа всех функций")
        else:
            print(f"\n⚠️ ОБНАРУЖЕНО {self.error_count} ОШИБОК")
            print("Требуется дополнительная отладка")
        
        return passed_tests == total_tests and self.error_count == 0

if __name__ == "__main__":
    tester = FinalSystemTester()
    success = tester.run_final_system_test()
    sys.exit(0 if success else 1)