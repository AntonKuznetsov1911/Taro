#!/usr/bin/env python3
"""
ФИНАЛЬНОЕ ТЕСТИРОВАНИЕ СИСТЕМЫ ИЗОБРАЖЕНИЙ КАРТ ТАРО
Comprehensive testing of the tarot card image system as requested
"""

import requests
import json
import base64
from datetime import datetime
import sys
import random

# Get backend URL from environment
BACKEND_URL = "https://mystictaro.preview.emergentagent.com/api"

class CardImageSystemTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_results = []
        self.session = requests.Session()
        self.all_cards_tested = []
        self.image_statistics = {
            "total_cards": 0,
            "jpeg_images": 0,
            "svg_images": 0,
            "null_images": 0,
            "invalid_images": 0,
            "small_images": 0,
            "large_images": 0
        }
        
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

    def analyze_image(self, image_data, card_name="Unknown"):
        """Analyze a single card image and return statistics"""
        if not image_data:
            self.image_statistics["null_images"] += 1
            return {
                "type": "null",
                "size_bytes": 0,
                "size_chars": 0,
                "format": "none",
                "valid": False,
                "card_name": card_name
            }
        
        if not image_data.startswith("data:image/"):
            self.image_statistics["invalid_images"] += 1
            return {
                "type": "invalid",
                "size_bytes": 0,
                "size_chars": len(image_data),
                "format": "unknown",
                "valid": False,
                "card_name": card_name
            }
        
        try:
            # Extract format and base64 data
            format_part = image_data.split(";")[0].replace("data:image/", "")
            base64_part = image_data.split("base64,")[1]
            
            # Decode to get actual size
            decoded_data = base64.b64decode(base64_part)
            size_bytes = len(decoded_data)
            size_chars = len(base64_part)
            
            # Determine image type based on size and format
            if format_part.lower() in ["svg+xml", "svg"]:
                image_type = "svg"
                self.image_statistics["svg_images"] += 1
            elif format_part.lower() in ["jpeg", "jpg", "png"]:
                image_type = "jpeg"
                self.image_statistics["jpeg_images"] += 1
            else:
                image_type = "unknown"
            
            # Size classification
            if size_bytes < 1000:
                self.image_statistics["small_images"] += 1
                size_category = "small"
            else:
                self.image_statistics["large_images"] += 1
                size_category = "large"
            
            return {
                "type": image_type,
                "size_bytes": size_bytes,
                "size_chars": size_chars,
                "format": format_part,
                "valid": True,
                "size_category": size_category,
                "card_name": card_name
            }
            
        except Exception as e:
            self.image_statistics["invalid_images"] += 1
            return {
                "type": "invalid",
                "size_bytes": 0,
                "size_chars": len(image_data),
                "format": "decode_error",
                "valid": False,
                "error": str(e),
                "card_name": card_name
            }

    def test_single_spread_images(self, category, spread_type, question):
        """Test images in a single spread"""
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
            
            if response.status_code != 200:
                return False, f"HTTP {response.status_code}: {response.text[:200]}"
            
            data = response.json()
            cards = data.get("cards", [])
            
            if not cards:
                return False, "No cards in response"
            
            # Analyze each card image
            card_analyses = []
            null_count = 0
            invalid_count = 0
            small_count = 0
            
            for card in cards:
                self.image_statistics["total_cards"] += 1
                card_name = card.get("name", "Unknown")
                image_data = card.get("image", "")
                
                analysis = self.analyze_image(image_data, card_name)
                card_analyses.append(analysis)
                
                # Track issues
                if not analysis["valid"]:
                    if analysis["type"] == "null":
                        null_count += 1
                    else:
                        invalid_count += 1
                elif analysis["size_bytes"] < 1000:
                    small_count += 1
                
                # Store for overall analysis
                self.all_cards_tested.append(analysis)
            
            # Check if all cards have valid images
            all_valid = all(analysis["valid"] for analysis in card_analyses)
            all_sufficient_size = all(analysis["size_bytes"] >= 1000 for analysis in card_analyses if analysis["valid"])
            
            if all_valid and all_sufficient_size:
                return True, f"All {len(cards)} cards have valid images (>1000 bytes)"
            else:
                issues = []
                if null_count > 0:
                    issues.append(f"{null_count} null images")
                if invalid_count > 0:
                    issues.append(f"{invalid_count} invalid images")
                if small_count > 0:
                    issues.append(f"{small_count} images <1000 bytes")
                
                return False, f"Image issues: {', '.join(issues)}"
                
        except Exception as e:
            return False, f"Exception: {str(e)}"

    def test_comprehensive_image_coverage(self):
        """Test 6-8 different spreads to check comprehensive image coverage"""
        print("🎨 COMPREHENSIVE IMAGE COVERAGE TEST")
        print("=" * 50)
        print("Testing 7 different spreads to validate all card images")
        print()
        
        test_spreads = [
            ("love", "one_card", "Найду ли я любовь в этом году?"),
            ("career", "three_cards", "Как развивается моя карьера?"),
            ("finance", "celtic_cross", "Какие финансовые перспективы меня ждут?"),
            ("general", "three_cards", "Что важно знать о моем будущем?"),
            ("love", "celtic_cross", "Детальный анализ любовной ситуации"),
            ("career", "one_card", "Какой совет для карьеры?"),
            ("finance", "three_cards", "Прошлое, настоящее и будущее финансов")
        ]
        
        all_passed = True
        total_cards_tested = 0
        
        for i, (category, spread_type, question) in enumerate(test_spreads, 1):
            print(f"📋 Тест {i}/7: {category} + {spread_type}")
            
            success, details = self.test_single_spread_images(category, spread_type, question)
            
            if success:
                self.log_test(f"Расклад {i}: {category}/{spread_type}", True, details)
            else:
                self.log_test(f"Расклад {i}: {category}/{spread_type}", False, details)
                all_passed = False
            
            # Count cards in this spread
            spread_configs = {
                "one_card": 1,
                "three_cards": 3,
                "celtic_cross": 10
            }
            total_cards_tested += spread_configs.get(spread_type, 0)
        
        print(f"\n📊 ОБЩАЯ СТАТИСТИКА ПОКРЫТИЯ:")
        print(f"   Всего карт протестировано: {self.image_statistics['total_cards']}")
        print(f"   JPEG изображения (реальные фото): {self.image_statistics['jpeg_images']}")
        print(f"   SVG placeholder изображения: {self.image_statistics['svg_images']}")
        print(f"   Null/пустые изображения: {self.image_statistics['null_images']}")
        print(f"   Невалидные изображения: {self.image_statistics['invalid_images']}")
        print(f"   Маленькие изображения (<1000 байт): {self.image_statistics['small_images']}")
        print(f"   Большие изображения (≥1000 байт): {self.image_statistics['large_images']}")
        
        # Calculate success percentage
        valid_images = self.image_statistics['jpeg_images'] + self.image_statistics['svg_images']
        total_images = self.image_statistics['total_cards']
        success_percentage = (valid_images / total_images * 100) if total_images > 0 else 0
        
        print(f"\n🎯 ПРОЦЕНТ УСПЕШНОСТИ: {success_percentage:.1f}% ({valid_images}/{total_images})")
        
        return all_passed

    def test_image_quality_validation(self):
        """Test image quality - JPEG vs SVG, sizes, validity"""
        print("\n🔍 КАЧЕСТВО ИЗОБРАЖЕНИЙ")
        print("=" * 30)
        
        if not self.all_cards_tested:
            self.log_test("Image quality validation", False, "No cards tested yet - run coverage test first")
            return False
        
        # Analyze image quality metrics
        jpeg_images = [card for card in self.all_cards_tested if card["type"] == "jpeg"]
        svg_images = [card for card in self.all_cards_tested if card["type"] == "svg"]
        valid_images = [card for card in self.all_cards_tested if card["valid"]]
        
        # Quality checks
        quality_checks = []
        
        # 1. All images should be valid base64
        all_valid = len(valid_images) == len(self.all_cards_tested)
        quality_checks.append(("All images valid base64", all_valid))
        
        # 2. Should have mix of JPEG and SVG
        has_jpeg = len(jpeg_images) > 0
        has_svg = len(svg_images) > 0
        has_mix = has_jpeg and has_svg
        quality_checks.append(("Mix of JPEG + SVG images", has_mix))
        
        # 3. JPEG images should be large (>10KB)
        large_jpeg = [img for img in jpeg_images if img["size_bytes"] > 10240]  # 10KB
        jpeg_quality_good = len(large_jpeg) == len(jpeg_images) if jpeg_images else True
        quality_checks.append(("JPEG images >10KB", jpeg_quality_good))
        
        # 4. SVG images should be smaller (~2-5KB)
        appropriate_svg = [img for img in svg_images if 1000 <= img["size_bytes"] <= 5120]  # 1-5KB
        svg_size_good = len(appropriate_svg) >= len(svg_images) * 0.8 if svg_images else True  # 80% should be in range
        quality_checks.append(("SVG images 1-5KB range", svg_size_good))
        
        # 5. No images should be null or empty
        no_null_images = self.image_statistics["null_images"] == 0
        quality_checks.append(("No null/empty images", no_null_images))
        
        # 6. Minimum size requirement (>1000 bytes)
        sufficient_size = [img for img in valid_images if img["size_bytes"] >= 1000]
        size_requirement_met = len(sufficient_size) == len(valid_images)
        quality_checks.append(("All images ≥1000 bytes", size_requirement_met))
        
        # Report quality results
        passed_checks = sum(1 for _, passed in quality_checks if passed)
        total_checks = len(quality_checks)
        
        print(f"📋 ПРОВЕРКИ КАЧЕСТВА ({passed_checks}/{total_checks} прошли):")
        for check_name, passed in quality_checks:
            status = "✅" if passed else "❌"
            print(f"   {status} {check_name}")
        
        # Detailed statistics
        if jpeg_images:
            avg_jpeg_size = sum(img["size_bytes"] for img in jpeg_images) / len(jpeg_images)
            print(f"\n📊 JPEG СТАТИСТИКА:")
            print(f"   Количество JPEG: {len(jpeg_images)}")
            print(f"   Средний размер: {avg_jpeg_size/1024:.1f}KB")
            print(f"   Диапазон: {min(img['size_bytes'] for img in jpeg_images)/1024:.1f}KB - {max(img['size_bytes'] for img in jpeg_images)/1024:.1f}KB")
        
        if svg_images:
            avg_svg_size = sum(img["size_bytes"] for img in svg_images) / len(svg_images)
            print(f"\n📊 SVG СТАТИСТИКА:")
            print(f"   Количество SVG: {len(svg_images)}")
            print(f"   Средний размер: {avg_svg_size/1024:.1f}KB")
            print(f"   Диапазон: {min(img['size_bytes'] for img in svg_images)/1024:.1f}KB - {max(img['size_bytes'] for img in svg_images)/1024:.1f}KB")
        
        # Overall quality assessment
        quality_percentage = (passed_checks / total_checks) * 100
        quality_passed = quality_percentage >= 85  # 85% of checks should pass
        
        if quality_passed:
            self.log_test("Image quality validation", True, f"Quality excellent - {quality_percentage:.0f}% checks passed")
        else:
            self.log_test("Image quality validation", False, f"Quality issues - only {quality_percentage:.0f}% checks passed")
        
        return quality_passed

    def test_system_stability(self):
        """Test system stability - no crashes, all cards display correctly"""
        print("\n⚡ СТАБИЛЬНОСТЬ СИСТЕМЫ")
        print("=" * 25)
        
        # Test multiple rapid requests to check stability
        stability_tests = [
            ("love", "three_cards", "Стабильность системы - тест 1"),
            ("career", "celtic_cross", "Стабильность системы - тест 2"),
            ("finance", "one_card", "Стабильность системы - тест 3"),
            ("general", "three_cards", "Стабильность системы - тест 4"),
            ("love", "one_card", "Стабильность системы - тест 5")
        ]
        
        all_stable = True
        error_count = 0
        
        for i, (category, spread_type, question) in enumerate(stability_tests, 1):
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
                    
                    # Check that all cards have images
                    all_have_images = all(
                        card.get("image", "").startswith("data:image/") 
                        for card in cards
                    )
                    
                    if all_have_images:
                        print(f"   ✅ Тест стабильности {i}: {len(cards)} карт, все с изображениями")
                    else:
                        print(f"   ❌ Тест стабильности {i}: некоторые карты без изображений")
                        all_stable = False
                        error_count += 1
                else:
                    print(f"   ❌ Тест стабильности {i}: HTTP {response.status_code}")
                    all_stable = False
                    error_count += 1
                    
            except Exception as e:
                print(f"   ❌ Тест стабильности {i}: Exception {str(e)}")
                all_stable = False
                error_count += 1
        
        if all_stable:
            self.log_test("System stability", True, f"All {len(stability_tests)} stability tests passed - no crashes, all cards display correctly")
        else:
            self.log_test("System stability", False, f"{error_count}/{len(stability_tests)} tests failed - system stability issues detected")
        
        return all_stable

    def test_unique_card_distribution(self):
        """Test that we get different cards across spreads (good randomization)"""
        print("\n🎲 УНИКАЛЬНОСТЬ КАРТ")
        print("=" * 20)
        
        if not self.all_cards_tested:
            self.log_test("Card uniqueness", False, "No cards tested yet")
            return False
        
        # Count unique cards by name
        card_names = [card["card_name"] for card in self.all_cards_tested if card["valid"]]
        unique_cards = len(set(card_names))
        total_cards = len(card_names)
        
        # Calculate uniqueness ratio
        uniqueness_ratio = unique_cards / total_cards if total_cards > 0 else 0
        
        # Check for good distribution
        good_uniqueness = uniqueness_ratio >= 0.7  # At least 70% should be unique
        
        print(f"📊 АНАЛИЗ УНИКАЛЬНОСТИ:")
        print(f"   Всего карт: {total_cards}")
        print(f"   Уникальных карт: {unique_cards}")
        print(f"   Коэффициент уникальности: {uniqueness_ratio:.1%}")
        
        # Show some examples of cards found
        unique_card_names = list(set(card_names))[:10]  # Show first 10 unique cards
        print(f"   Примеры карт: {', '.join(unique_card_names[:5])}...")
        
        if good_uniqueness:
            self.log_test("Card uniqueness", True, f"Good card distribution - {uniqueness_ratio:.1%} uniqueness ({unique_cards}/{total_cards})")
        else:
            self.log_test("Card uniqueness", False, f"Poor card distribution - only {uniqueness_ratio:.1%} uniqueness ({unique_cards}/{total_cards})")
        
        return good_uniqueness

    def generate_final_report(self):
        """Generate comprehensive final report"""
        print("\n" + "="*70)
        print("🎯 ФИНАЛЬНЫЙ ОТЧЕТ - СИСТЕМА ИЗОБРАЖЕНИЙ КАРТ ТАРО")
        print("="*70)
        
        # Calculate overall statistics
        total_cards = self.image_statistics["total_cards"]
        valid_images = self.image_statistics["jpeg_images"] + self.image_statistics["svg_images"]
        success_rate = (valid_images / total_cards * 100) if total_cards > 0 else 0
        
        print(f"\n📊 ОБЩАЯ СТАТИСТИКА:")
        print(f"   Всего карт протестировано: {total_cards}")
        print(f"   Карты с валидными изображениями: {valid_images}")
        print(f"   Процент успешности: {success_rate:.1f}%")
        print(f"   JPEG изображения (реальные): {self.image_statistics['jpeg_images']}")
        print(f"   SVG placeholder изображения: {self.image_statistics['svg_images']}")
        print(f"   Проблемные изображения: {self.image_statistics['null_images'] + self.image_statistics['invalid_images']}")
        
        # Test results summary
        passed_tests = sum(1 for result in self.test_results if result["success"])
        total_tests = len(self.test_results)
        test_success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"\n🧪 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:")
        print(f"   Пройдено тестов: {passed_tests}/{total_tests}")
        print(f"   Процент успешности тестов: {test_success_rate:.1f}%")
        
        # Expected results validation
        print(f"\n✅ ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ:")
        
        # 1. 100% cards have images (no nulls)
        no_nulls = self.image_statistics["null_images"] == 0
        print(f"   {'✅' if no_nulls else '❌'} 100% карт имеют изображения (без null): {no_nulls}")
        
        # 2. Mix of JPEG + SVG images
        has_mix = self.image_statistics["jpeg_images"] > 0 and self.image_statistics["svg_images"] > 0
        print(f"   {'✅' if has_mix else '❌'} Смесь JPEG + SVG изображений: {has_mix}")
        
        # 3. All images valid and display
        all_valid = self.image_statistics["invalid_images"] == 0
        print(f"   {'✅' if all_valid else '❌'} Все изображения валидны: {all_valid}")
        
        # 4. No errors in image system
        no_system_errors = test_success_rate >= 85
        print(f"   {'✅' if no_system_errors else '❌'} Система без ошибок: {no_system_errors}")
        
        # Overall assessment
        all_criteria_met = no_nulls and has_mix and all_valid and no_system_errors
        
        print(f"\n🎯 ИТОГОВАЯ ОЦЕНКА:")
        if all_criteria_met:
            print("   ✅ ВСЕ ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ ДОСТИГНУТЫ!")
            print("   ✅ Система изображений карт работает отлично")
            print("   ✅ 100% покрытие изображениями")
            print("   ✅ Качественные JPEG + красивые SVG placeholder")
            print("   ✅ Стабильная работа без ошибок")
        else:
            print("   ❌ НЕКОТОРЫЕ ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ НЕ ДОСТИГНУТЫ")
            if not no_nulls:
                print("   ❌ Найдены карты без изображений")
            if not has_mix:
                print("   ❌ Отсутствует смесь типов изображений")
            if not all_valid:
                print("   ❌ Найдены невалидные изображения")
            if not no_system_errors:
                print("   ❌ Обнаружены ошибки в системе")
        
        return all_criteria_met

    def run_comprehensive_test_suite(self):
        """Run the complete test suite for card image system"""
        print("🎨 ФИНАЛЬНОЕ ТЕСТИРОВАНИЕ СИСТЕМЫ ИЗОБРАЖЕНИЙ КАРТ")
        print("="*60)
        print("Цель: Убедиться что ВСЕ карты имеют изображения - JPEG или SVG placeholder")
        print("Тестируем: 6-8 раскладов, качество изображений, стабильность системы")
        print()
        
        # 1. Comprehensive image coverage test (6-8 spreads)
        coverage_passed = self.test_comprehensive_image_coverage()
        
        # 2. Image quality validation
        quality_passed = self.test_image_quality_validation()
        
        # 3. System stability test
        stability_passed = self.test_system_stability()
        
        # 4. Card uniqueness test
        uniqueness_passed = self.test_unique_card_distribution()
        
        # 5. Generate final report
        final_assessment = self.generate_final_report()
        
        # Return overall success
        all_tests_passed = coverage_passed and quality_passed and stability_passed and uniqueness_passed
        
        print(f"\n🏁 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ:")
        if all_tests_passed and final_assessment:
            print("✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")
            print("✅ СИСТЕМА ИЗОБРАЖЕНИЙ КАРТ РАБОТАЕТ ОТЛИЧНО!")
        else:
            print("❌ ОБНАРУЖЕНЫ ПРОБЛЕМЫ В СИСТЕМЕ ИЗОБРАЖЕНИЙ")
            print("❌ ТРЕБУЕТСЯ ДОПОЛНИТЕЛЬНАЯ РАБОТА")
        
        return all_tests_passed and final_assessment

def main():
    """Main test execution"""
    print("🔮 Запуск финального тестирования системы изображений карт таро...")
    print()
    
    tester = CardImageSystemTester()
    
    try:
        success = tester.run_comprehensive_test_suite()
        
        if success:
            print("\n🎉 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО УСПЕШНО!")
            sys.exit(0)
        else:
            print("\n⚠️ ТЕСТИРОВАНИЕ ВЫЯВИЛО ПРОБЛЕМЫ!")
            sys.exit(1)
            
    except Exception as e:
        print(f"\n💥 КРИТИЧЕСКАЯ ОШИБКА ТЕСТИРОВАНИЯ: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()