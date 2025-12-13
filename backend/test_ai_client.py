"""
Простой тест для проверки AI Client
"""

import sys
import os

# Добавляем текущую директорию в путь для импорта
sys.path.insert(0, os.path.dirname(__file__))

# Загружаем переменные окружения
from dotenv import load_dotenv
load_dotenv()

print("="*60)
print("ТЕСТ AI CLIENT")
print("="*60)

# Проверяем наличие ключей
print("\n1. Проверка переменных окружения:")
print(f"   ANTHROPIC_API_KEY: {'+  Установлен' if os.getenv('ANTHROPIC_API_KEY') else '- Отсутствует'}")
print(f"   XAI_API_KEY: {'+ Установлен' if os.getenv('XAI_API_KEY') else '- Отсутствует'}")

# Импортируем AI Client
print("\n2. Инициализация AI Client...")
try:
    from ai_client import ai_client
    print("   + AI Client импортирован успешно")
except Exception as e:
    print(f"   - Ошибка импорта: {e}")
    sys.exit(1)

# Проверяем статус
print("\n3. Статус AI клиентов:")
status = ai_client.get_status()
print(f"   Claude:")
print(f"      - Доступен: {status['claude']['available']}")
print(f"      - Модель: {status['claude']['model']}")
print(f"      - Квота превышена: {status['claude']['quota_exceeded']}")
print(f"   XAI:")
print(f"      - Доступен: {status['xai']['available']}")
print(f"      - Модель: {status['xai']['model']}")
print(f"      - Квота превышена: {status['xai']['quota_exceeded']}")

# Проверяем доступность
print(f"\n4. Хотя бы один AI доступен: {'+ Да' if ai_client.is_available() else '- Нет'}")

# Тестируем генерацию текста
if ai_client.is_available():
    print("\n5. Тест генерации текста...")
    try:
        result = ai_client.generate_text(
            prompt="Скажи 'Привет' одним словом",
            max_tokens=10,
            temperature=0.7
        )
        print(f"   + Результат: {result[:50]}...")
        print("\n" + "="*60)
        print("+ ВСЕ ТЕСТЫ ПРОЙДЕНЫ!")
        print("="*60)
    except Exception as e:
        print(f"   - Ошибка генерации: {e}")
        print("\n" + "="*60)
        print("- ТЕСТЫ НЕ ПРОЙДЕНЫ")
        print("="*60)
else:
    print("\n" + "="*60)
    print("- НИ ОДИН AI КЛИЕНТ НЕ ДОСТУПЕН")
    print("="*60)
