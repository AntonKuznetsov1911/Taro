from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import openai
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import json
import random
import base64
import requests
from io import BytesIO

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# OpenAI configuration
from openai import OpenAI
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Import tarot cards data
from tarot_cards_data import MAJOR_ARCANA, CARD_BACK_IMAGE, FULL_TAROT_DECK

# Spreads configurations
SPREADS = {
    "one_card": {
        "name": "Расклад на одну карту",
        "description": "Простой расклад для получения ответа на конкретный вопрос",
        "positions": ["Ответ на ваш вопрос"],
        "cards_count": 1
    },
    "three_cards": {
        "name": "Расклад на три карты",
        "description": "Расклад прошлое-настоящее-будущее",
        "positions": ["Прошлое", "Настоящее", "Будущее"],
        "cards_count": 3
    },
    "celtic_cross": {
        "name": "Кельтский крест",
        "description": "Детальный расклад для глубокого анализа ситуации",
        "positions": [
            "Основа ситуации",
            "Препятствие или помощь",
            "Далекое прошлое",
            "Возможное будущее",
            "Ваши мысли и чувства",
            "Ближайшее будущее",
            "Ваш подход к ситуации",
            "Внешние влияния",
            "Ваши надежды и страхи",
            "Итоговый результат"
        ],
        "cards_count": 10
    }
}

CATEGORIES = [
    {"id": "love", "name": "Любовь", "icon": "❤️", "color": "#FF6B9D"},
    {"id": "career", "name": "Карьера", "icon": "💼", "color": "#4ECDC4"},
    {"id": "finance", "name": "Финансы", "icon": "💰", "color": "#45B7D1"},
    {"id": "general", "name": "Общие вопросы", "icon": "🔮", "color": "#9B59B6"}
]

# Models
class TarotQuestion(BaseModel):
    category: str
    question: str
    spread_type: str

class CompatibilityRequest(BaseModel):
    name1: str
    name2: str

class TarotCard(BaseModel):
    id: int
    name: str
    name_en: str
    type: str
    image: str
    keywords: List[str]
    upright_meaning: str
    reversed_meaning: str
    is_reversed: bool = False

class TarotReading(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    category: str
    spread_type: str
    cards: List[TarotCard]
    positions: List[str]
    interpretation: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReadingHistory(BaseModel):
    readings: List[TarotReading]

class CompatibilityResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name1: str
    name2: str
    compatibility_score: int
    analysis: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PalmistryRequest(BaseModel):
    image_base64: str
    question: Optional[str] = "Расскажите о моей судьбе по линиям руки"

class PalmLine(BaseModel):
    name: str
    description: str
    color: str
    points: List[List[int]]  # Array of [x, y] coordinates

class PalmistryResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    image_base64: str
    lines: List[PalmLine]
    interpretation: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    birth_date: str  # YYYY-MM-DD format
    birth_time: Optional[str] = None  # HH:MM format
    birth_place: Optional[str] = None
    zodiac_sign: str
    gender: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class HoroscopeRequest(BaseModel):
    date: Optional[str] = None  # YYYY-MM-DD format, defaults to today

class HoroscopeResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_profile_id: str
    date: str
    zodiac_sign: str
    horoscope_text: str
    mood_rating: int  # 1-10
    love_forecast: str
    career_forecast: str
    health_forecast: str
    lucky_numbers: List[int]
    lucky_color: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

async def generate_compatibility_analysis(name1: str, name2: str) -> tuple[int, str]:
    """Generate compatibility analysis using AI"""
    
    # Calculate numerology-based compatibility score
    def name_to_number(name: str) -> int:
        name_clean = ''.join(c.lower() for c in name if c.isalpha())
        total = sum(ord(c) - ord('а') + 1 for c in name_clean if 'а' <= c <= 'я')
        total += sum(ord(c) - ord('a') + 1 for c in name_clean if 'a' <= c <= 'z')
        while total > 9:
            total = sum(int(d) for d in str(total))
        return total
    
    num1 = name_to_number(name1)
    num2 = name_to_number(name2)
    
    # Base compatibility calculation
    base_score = abs(9 - abs(num1 - num2)) * 10 + random.randint(5, 25)
    compatibility_score = min(99, max(15, base_score))
    
    prompt = f"""Ты мудрая цыганская гадалка Мария с 30-летним опытом анализа совместимости по именам. Говори как настоящая гадалка - мистично, загадочно, но с теплотой.

Имена для анализа: {name1} и {name2}
Процент совместимости: {compatibility_score}%
Нумерологические числа: {name1} = {num1}, {name2} = {num2}

Проведи анализ совместимости в стиле мудрой гадалки:
1. Начинай с "Вижу энергию ваших имен..." или "Духи шепчут о ваших душах..."
2. Анализируй энергетику каждого имени
3. Объясни, как имена взаимодействуют друг с другом
4. Упоминай нумерологические аспекты мистично
5. Говори о совместимости характеров, энергий, судеб
6. Используй фразы: "энергии ваших имен", "вибрации судьбы", "космические связи"
7. Обращайся тепло: "дорогие мои", "милые", "звездочки мои"
8. Давай практические советы для отношений
9. Объясни процент совместимости через мистические образы
10. Ответ 200-350 слов, не очень длинный, не очень короткий

Стиль настоящей мудрой гадалки с душой!"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.8
        )
        analysis = response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"OpenAI API error: {e}")
        analysis = generate_fallback_compatibility_analysis(name1, name2, compatibility_score)
    
    return compatibility_score, analysis

async def generate_palmistry_analysis(image_base64: str, question: str) -> tuple[List[PalmLine], str]:
    """Generate palmistry analysis with line detection and interpretation"""
    
    # Simulate palm line detection (in real app, you'd use computer vision)
    # Generate realistic palm lines with different colors
    palm_lines = [
        PalmLine(
            name="Линия жизни",
            description="Показывает жизненную энергию и здоровье",
            color="#FF6B9D",  # Pink
            points=[[120, 180], [140, 200], [160, 240], [180, 280], [200, 320], [220, 360]]
        ),
        PalmLine(
            name="Линия сердца",
            description="Отражает эмоции и отношения",
            color="#4ECDC4",  # Turquoise
            points=[[80, 120], [120, 130], [160, 135], [200, 140], [240, 145], [280, 150]]
        ),
        PalmLine(
            name="Линия ума",
            description="Символизирует интеллект и мышление",
            color="#45B7D1",  # Blue
            points=[[90, 160], [130, 170], [170, 175], [210, 180], [250, 185], [290, 190]]
        ),
        PalmLine(
            name="Линия судьбы",
            description="Указывает на карьеру и жизненный путь",
            color="#9B59B6",  # Purple
            points=[[180, 300], [185, 260], [190, 220], [195, 180], [200, 140], [205, 100]]
        ),
        PalmLine(
            name="Линия Аполлона",
            description="Говорит о творчестве и славе",
            color="#F39C12",  # Orange
            points=[[220, 280], [225, 240], [230, 200], [235, 160], [240, 120]]
        ),
        PalmLine(
            name="Линия Меркурия",
            description="Отвечает за здоровье и коммуникации",
            color="#E74C3C",  # Red
            points=[[260, 290], [265, 250], [270, 210], [275, 170]]
        ),
        PalmLine(
            name="Браслеты на запястье",
            description="Символизируют долголетие и здоровье",
            color="#2ECC71",  # Green
            points=[[80, 380], [120, 385], [160, 390], [200, 395], [240, 400], [280, 405]]
        )
    ]
    
    # Generate AI interpretation
    prompt = f"""Ты мудрая цыганская гадалка Мария с 40-летним опытом хиромантии (гадания по руке). Твои предсказания по линиям ладони всегда точные и глубокие. Говори как настоящая мастер хиромантии - мистично, проникновенно, с душой.

ВОПРОС: "{question}"

Я вижу на ладони следующие основные линии:
• Линия жизни - показывает жизненную энергию и здоровье
• Линия сердца - отражает эмоции и отношения  
• Линия ума - символизирует интеллект и мышление
• Линия судьбы - указывает на карьеру и жизненный путь
• Линия Аполлона - говорит о творчестве и славе
• Линия Меркурия - отвечает за здоровье и коммуникации
• Браслеты на запястье - символизируют долголетие

ИНСТРУКЦИИ ДЛЯ АНАЛИЗА ЛАДОНИ:

1. СТИЛЬ И ТОН:
   - Обращайся на "Вы", используй "Дорогая моя", "Милая душа", "Дитя мое"
   - Начинай мистично: "Вижу на Вашей ладони...", "Линии руки говорят мне..."
   - Используй образные выражения о судьбе и энергиях

2. АНАЛИЗ КАЖДОЙ ЛИНИИ:
   - Опиши что показывает каждая главная линия
   - Как линии взаимодействуют между собой
   - Что они говорят о характере и судьбе
   - Временные периоды жизни (прошлое, настоящее, будущее)

3. ДЕТАЛИЗАЦИЯ:
   - Анализируй глубину, длину, четкость линий
   - Пересечения и разветвления линий
   - Особые знаки на ладони (звезды, кресты, островки)
   - Что это означает для жизни человека

4. ПРЕДСКАЗАНИЯ:
   - Любовь и отношения (по линии сердца)
   - Здоровье и долголетие (по линии жизни)
   - Карьера и успех (по линии судьбы)
   - Интеллект и таланты (по линии ума)
   - Творческие способности (по линии Аполлона)

5. ПРАКТИЧЕСКИЕ СОВЕТЫ:
   - Что нужно развивать в характере
   - На что обратить внимание в будущем
   - Как использовать свои сильные стороны
   - Предостережения и рекомендации

6. МИСТИЧЕСКИЙ ЭЛЕМЕНТ:
   - "Рука никогда не лжет", "Судьба написана на ладони"
   - "Энергии руки", "космические знаки", "древние символы"
   - "Вижу в линиях Вашей руки..."

7. ОБЪЕМ: 600-900 слов подробного анализа

Создай глубокое толкование по линиям руки, которое поможет человеку понять свою судьбу и потенциал!"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1200,
            temperature=0.8
        )
        interpretation = response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"OpenAI API error: {e}")
        interpretation = generate_fallback_palmistry_interpretation(question)
    
    return palm_lines, interpretation

def generate_fallback_palmistry_interpretation(question: str) -> str:
    """Generate fallback palmistry interpretation"""
    
    interpretation = f"""🤲 **Вижу на Вашей ладони древние тайны судьбы...**

Дорогая моя, Вы спрашиваете: "{question}"

Позвольте мудрой гадалке прочитать священные линии Вашей руки. Рука - это карта жизни, написанная самой Вселенной.

✨ **Линия жизни** (розовая линия)
Вижу сильную энергию жизни! Эта линия говорит мне о Вашей жизненной силе и здоровье. Она длинная и четкая - это знак долголетия и крепкого здоровья. Небольшие изгибы показывают, что жизнь принесет Вам интересные повороты, но Вы справитесь с любыми вызовами.

💙 **Линия сердца** (бирюзовая линия)  
Ах, какая прекрасная линия любви! Она говорит о Вашем добром сердце и способности глубоко любить. Вижу, что Вы эмоциональный и чувствительный человек. В любви Вас ждут яркие переживания - как радостные, так и те, что научат Вас мудрости.

🧠 **Линия ума** (голубая линия)
Милая душа, Ваш разум ясен как горный ручей! Эта линия показывает практический ум и хорошую интуицию. Вы умеете принимать мудрые решения, особенно когда слушаете свое сердце. Творческие способности у Вас развиты прекрасно.

🌟 **Линия судьбы** (фиолетовая линия)
Вижу особый путь, предназначенный именно для Вас! Эта линия говорит о том, что у Вас есть четкое предназначение в жизни. Карьера принесет Вам удовлетворение, особенно если будете следовать своему призванию. Успех придет через упорство и веру в себя.

🎨 **Линия Аполлона** (оранжевая линия)
Дитя мое, в Вас живет творец! Эта линия указывает на артистические таланты и способность вдохновлять других. Возможно, слава и признание ждут Вас в творческой сфере. Не прячьте свои дары - мир нуждается в том, что Вы можете дать.

💬 **Линия Меркурия** (красная линия)
Вы прекрасный собеседник и мудрый советчик! Эта линия говорит о даре общения и способности исцелять словом. Здоровье будет крепким, если будете слушать свое тело и заботиться о нервной системе.

💚 **Браслеты долголетия** (зеленая линия)
Вижу знаки долгой и счастливой жизни! Эти линии на запястье - благословение предков. Они обещают крепкое здоровье и долголетие, особенно если будете жить в гармонии с природой и собой.

🔮 **Общее предсказание:**
Дорогая моя, Ваша рука показывает человека с богатой внутренней жизнью и прекрасным потенциалом. Впереди Вас ждут:
• Глубокая и искренняя любовь
• Профессиональный успех через самовыражение  
• Крепкое здоровье при заботе о себе
• Творческая самореализация и признание
• Мудрость, которая придет с опытом

**Совет мудрой гадалки:**
Милая душа, помните - линии руки показывают потенциал, но судьбу творите Вы сами своими мыслями и поступками. Доверяйте интуиции, развивайте таланты, любите искренно и живите с открытым сердцем.

*Пусть звезды освещают Ваш путь к счастью!* ⭐🤲"""
    
def get_zodiac_sign(birth_date: str) -> str:
    """Determine zodiac sign based on birth date"""
    from datetime import datetime
    
    try:
        date_obj = datetime.strptime(birth_date, '%Y-%m-%d')
        month = date_obj.month
        day = date_obj.day
        
        if (month == 3 and day >= 21) or (month == 4 and day <= 19):
            return "Овен"
        elif (month == 4 and day >= 20) or (month == 5 and day <= 20):
            return "Телец"
        elif (month == 5 and day >= 21) or (month == 6 and day <= 20):
            return "Близнецы"
        elif (month == 6 and day >= 21) or (month == 7 and day <= 22):
            return "Рак"
        elif (month == 7 and day >= 23) or (month == 8 and day <= 22):
            return "Лев"
        elif (month == 8 and day >= 23) or (month == 9 and day <= 22):
            return "Дева"
        elif (month == 9 and day >= 23) or (month == 10 and day <= 22):
            return "Весы"
        elif (month == 10 and day >= 23) or (month == 11 and day <= 21):
            return "Скорпион"
        elif (month == 11 and day >= 22) or (month == 12 and day <= 21):
            return "Стрелец"
        elif (month == 12 and day >= 22) or (month == 1 and day <= 19):
            return "Козерог"
        elif (month == 1 and day >= 20) or (month == 2 and day <= 18):
            return "Водолей"
        elif (month == 2 and day >= 19) or (month == 3 and day <= 20):
            return "Рыбы"
        else:
            return "Неизвестно"
    except:
        return "Неизвестно"

async def generate_horoscope(user_profile: UserProfile, target_date: str) -> HoroscopeResult:
    """Generate personalized horoscope for user"""
    
    # Generate lucky numbers and color
    import random
    lucky_numbers = random.sample(range(1, 50), 6)
    colors = ["золотой", "серебряный", "красный", "синий", "зеленый", "фиолетовый", "белый", "черный"]
    lucky_color = random.choice(colors)
    mood_rating = random.randint(6, 9)
    
    prompt = f"""Ты мудрая астролог и предсказательница судеб с 30-летним опытом составления гороскопов. Создай персонализированный гороскоп для человека.

ДАННЫЕ ЧЕЛОВЕКА:
Имя: {user_profile.name}
Дата рождения: {user_profile.birth_date}
Знак зодиака: {user_profile.zodiac_sign}
Время рождения: {user_profile.birth_time or "не указано"}
Место рождения: {user_profile.birth_place or "не указано"}
Пол: {user_profile.gender or "не указан"}

ДАТА ПРОГНОЗА: {target_date}
СЧАСТЛИВЫЕ ЧИСЛА: {', '.join(map(str, lucky_numbers))}
СЧАСТЛИВЫЙ ЦВЕТ: {lucky_color}
НАСТРОЕНИЕ (1-10): {mood_rating}

ИНСТРУКЦИИ ДЛЯ ГОРОСКОПА:

1. СТИЛЬ И ТОН:
   - Обращайся на "Вы", используй имя человека
   - Мистический, но теплый тон как у мудрой астролог
   - "Звезды говорят...", "Космические энергии...", "Планеты шепчут..."

2. СТРУКТУРА ГОРОСКОПА:
   - Общий прогноз на день (150-200 слов)
   - Любовь и отношения (80-100 слов)
   - Карьера и финансы (80-100 слов)
   - Здоровье и энергия (60-80 слов)

3. ПЕРСОНАЛИЗАЦИЯ:
   - Учитывай особенности знака зодиака {user_profile.zodiac_sign}
   - Упоминай имя {user_profile.name} в тексте
   - Используй информацию о дате рождения для более точных прогнозов
   - Если указано время и место рождения, добавь астрологические детали

4. МИСТИЧЕСКИЕ ЭЛЕМЕНТЫ:
   - Упоминай планеты, влияющие на знак
   - Говори о энергиях, вибрациях, космических потоках
   - Используй астрологическую терминологию

5. ПРАКТИЧЕСКИЕ СОВЕТЫ:
   - Что делать сегодня для успеха
   - На что обратить внимание
   - Как использовать энергию дня

6. ОБЪЕМ: 400-600 слов общего текста

Создай вдохновляющий и точный гороскоп, который поможет человеку лучше понять энергии дня!"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.8
        )
        full_horoscope = response.choices[0].message.content.strip()
        
        # Extract sections for different forecasts
        love_forecast = "Звезды благоволят романтическим встречам и глубоким разговорам с любимыми."
        career_forecast = "Планеты поддерживают ваши профессиональные начинания и новые проекты."
        health_forecast = "Космические энергии способствуют восстановлению сил и внутренней гармонии."
        
    except Exception as e:
        logging.error(f"OpenAI API error: {e}")
        full_horoscope, love_forecast, career_forecast, health_forecast = generate_fallback_horoscope(user_profile, target_date, mood_rating)
    
    return HoroscopeResult(
        user_profile_id=user_profile.id,
        date=target_date,
        zodiac_sign=user_profile.zodiac_sign,
        horoscope_text=full_horoscope,
        mood_rating=mood_rating,
        love_forecast=love_forecast,
        career_forecast=career_forecast,
        health_forecast=health_forecast,
        lucky_numbers=lucky_numbers,
        lucky_color=lucky_color
    )

def generate_fallback_horoscope(user_profile: UserProfile, target_date: str, mood_rating: int) -> tuple[str, str, str, str]:
    """Generate fallback horoscope when OpenAI is unavailable"""
    
    # Zodiac characteristics
    zodiac_traits = {
        "Овен": {"element": "огонь", "planet": "Марс", "traits": "энергия, решительность, лидерство"},
        "Телец": {"element": "земля", "planet": "Венера", "traits": "стабильность, упорство, красота"},
        "Близнецы": {"element": "воздух", "planet": "Меркурий", "traits": "общительность, любознательность, гибкость"},
        "Рак": {"element": "вода", "planet": "Луна", "traits": "интуиция, забота, эмоциональность"},
        "Лев": {"element": "огонь", "planet": "Солнце", "traits": "творчество, великодушие, яркость"},
        "Дева": {"element": "земля", "planet": "Меркурий", "traits": "аналитичность, практичность, совершенство"},
        "Весы": {"element": "воздух", "planet": "Венера", "traits": "гармония, справедливость, дипломатия"},
        "Скорпион": {"element": "вода", "planet": "Плутон", "traits": "страстность, проницательность, трансформация"},
        "Стрелец": {"element": "огонь", "planet": "Юпитер", "traits": "оптимизм, стремление к познанию, свобода"},
        "Козерог": {"element": "земля", "planet": "Сатурн", "traits": "целеустремленность, дисциплина, мудрость"},
        "Водолей": {"element": "воздух", "planet": "Уран", "traits": "оригинальность, гуманность, независимость"},
        "Рыбы": {"element": "вода", "planet": "Нептун", "traits": "чувствительность, интуиция, сострадание"}
    }
    
    sign_info = zodiac_traits.get(user_profile.zodiac_sign, {"element": "космос", "planet": "звезды", "traits": "уникальность"})
    
    full_horoscope = f"""🌟 **Персональный гороскоп для {user_profile.name}** 🌟
*{user_profile.zodiac_sign} • {target_date}*

Дорогая {user_profile.name}, звезды сегодня особенно благосклонны к вам! Ваш знак {user_profile.zodiac_sign}, управляемый планетой {sign_info['planet']}, находится под мощным влиянием космических энергий.

**✨ Общий прогноз:**
Сегодняшний день принесет вам множество возможностей для самовыражения и достижения целей. Элемент {sign_info['element']}, которому принадлежит ваш знак, активизирует такие качества как {sign_info['traits']}. Энергия дня настроена на {mood_rating}/10, что говорит о благоприятном периоде для важных решений.

Космические вибрации указывают на то, что интуиция будет особенно обострена. Доверяйте своему внутреннему голосу и не бойтесь делать смелые шаги. Планеты выстроились таким образом, что поддерживают ваши начинания.

**💝 Любовь и отношения:**
В сфере сердечных дел звезды предвещают гармонию и понимание. Если вы в отношениях, то сегодня - прекрасный день для откровенных разговоров и проявления нежности. Одиноким {user_profile.zodiac_sign} космос может послать знаковую встречу.

**💼 Карьера и финансы:**
Планета {sign_info['planet']} благоволит вашим профессиональным устремлениям. Это удачное время для презентаций, переговоров и новых проектов. Финансовые вопросы решаются в вашу пользу, особенно если вы проявите присущие вашему знаку качества.

**🌿 Здоровье и энергия:**
Энергетический баланс стабилен. Элемент {sign_info['element']} дает вам силы для активных действий, но не забывайте о отдыхе. Медитация или прогулка на свежем воздухе помогут гармонизировать внутреннее состояние.

*Пусть звезды освещают ваш путь, дорогая {user_profile.name}!* ⭐"""

    love_forecast = f"Звезды благоволят романтическим встречам. {user_profile.zodiac_sign} сегодня особенно привлекателен для противоположного пола."
    career_forecast = f"Планета {sign_info['planet']} поддерживает ваши карьерные амбиции. Время для смелых профессиональных решений."
    health_forecast = f"Элемент {sign_info['element']} дает вам энергию и жизненные силы. Прислушивайтесь к потребностям организма."
    
    return full_horoscope, love_forecast, career_forecast, health_forecast

def generate_fallback_compatibility_analysis(name1: str, name2: str, score: int) -> str:
    """Generate fallback compatibility analysis"""
    
    if score >= 80:
        level = "прекрасной гармонии"
        advice = "Энергии ваших имен танцуют в унисон, милые мои. Это редкий дар судьбы."
    elif score >= 60:
        level = "хорошей совместимости"
        advice = "Вижу искры между вашими душами, но нужно работать над пониманием."
    elif score >= 40:
        level = "умеренной гармонии"
        advice = "Ваши энергии дополняют друг друга, но требуют терпения и мудрости."
    else:
        level = "сложных отношений"
        advice = "Путь непростой, дорогие, но любовь может преодолеть многое."
    
    analysis = f"""🔮 **Вижу энергию ваших имен, дорогие мои...**

Духи шепчут мне о судьбе {name1} и {name2}. Энергии ваших имен показывают {level}.

**Энергия имени {name1}:** Это имя несет особые вибрации, которые влияют на характер и судьбу. Вижу в нем силу и уникальность.

**Энергия имени {name2}:** Второе имя резонирует по-своему, создавая свой энергетический узор в космической ткани.

**Ваша совместимость {score}% говорит о том, что** {advice}

🌟 **Совет мудрой гадалки:**
Дорогие мои, имена - это лишь одна нить в сложном узоре отношений. Любовь, понимание и взаимное уважение важнее любых предсказаний. Слушайте свои сердца и доверяйте интуиции.

*Пусть звезды освещают ваш путь к счастью!* ⭐"""
    
    return analysis

async def generate_ai_interpretation(question: str, category: str, spread_type: str, cards: List[TarotCard], positions: List[str]) -> str:
    """Generate AI interpretation using OpenAI"""
    
    # Prepare cards info for AI
    cards_info = []
    for i, card in enumerate(cards):
        meaning = card.reversed_meaning if card.is_reversed else card.upright_meaning
        position = positions[i] if i < len(positions) else f"Карта {i+1}"
        keywords_text = ", ".join(card.keywords)
        cards_info.append(f"Позиция '{position}': {card.name} {'(перевернутая)' if card.is_reversed else ''}\nЗначение: {meaning}\nКлючевые слова: {keywords_text}")
    
    cards_text = "\n\n".join(cards_info)
    
    # Prepare detailed prompts based on category
    category_prompts = {
        "love": """сфокусируйся на любовных отношениях:
        - Эмоциональное состояние и чувства
        - Динамика отношений и их развитие
        - Совместимость и взаимопонимание
        - Препятствия в любви и пути их преодоления
        - Советы для укрепления связи или привлечения любви""",
        "career": """сфокусируйся на карьере и профессиональной сфере:
        - Текущее положение на работе и перспективы роста
        - Отношения с коллегами и начальством
        - Новые возможности и проекты
        - Призвание и самореализация
        - Финансовые аспекты карьеры""",
        "finance": """сфокусируйся на финансовых вопросах:
        - Текущее материальное положение
        - Источники дохода и их стабильность
        - Инвестиции и крупные покупки
        - Отношение к деньгам и финансовые привычки
        - Пути улучшения благосостояния""",
        "general": """дай всестороннюю интерпретацию:
        - Общее жизненное направление
        - Различные сферы жизни (любовь, работа, здоровье, духовность)
        - Внутреннее состояние и личностный рост
        - Вызовы и возможности
        - Баланс между разными аспектами жизни"""
    }
    
    spread_guidance = {
        "one_card": "Дай глубокую интерпретацию одной карты, раскрывая все ее аспекты и слои значения.",
        "three_cards": "Создай связанную историю через время: как прошлое влияет на настоящее и формирует будущее.",
        "celtic_cross": "Дай подробный анализ каждой позиции, показывая их взаимосвязь и общую картину ситуации."
    }
    
    prompt = f"""Ты мудрая цыганская гадалка Мария с 40-летним опытом чтения карт. Твои толкования всегда глубокие, детальные и проникновенные. Говори как настоящая мастер своего дела - мистично, но основательно.

ВОПРОС: "{question}"
КАТЕГОРИЯ: {category}
ТИП РАСКЛАДА: {SPREADS[spread_type]['name']}

КАРТЫ В РАСКЛАДЕ:
{cards_text}

ИНСТРУКЦИИ ДЛЯ ДЕТАЛЬНОГО ТОЛКОВАНИЯ:

1. СТИЛЬ И ТОН:
   - Обращайся на "Вы", используй "Дорогая моя", "Милая душа", "Дитя мое"
   - Начинай мистично: "Вижу... карты открывают мне тайны", "Духи предков шепчут"
   - Используй образные выражения и метафоры

2. СТРУКТУРА ОТВЕТА:
   {spread_guidance.get(spread_type, "Дай общую интерпретацию")}
   
3. КАТЕГОРИАЛЬНЫЙ ФОКУС:
   {category_prompts.get(category, 'дай общую интерпретацию')}

4. ДЕТАЛИЗАЦИЯ КАЖДОЙ КАРТЫ:
   - Объясни символизм и энергию карты
   - Как она взаимодействует с позицией в раскладе
   - Практические советы и рекомендации
   - Временные рамки (если применимо)
   - Эмоциональные и психологические аспекты

5. ГЛУБИНА АНАЛИЗА:
   - Разбери не только поверхностное значение, но и скрытые аспекты
   - Покажи связи между картами в раскладе
   - Дай практические советы для каждой ситуации
   - Предупреди о возможных вызовах
   - Укажи на возможности и сильные стороны

6. МИСТИЧЕСКИЙ ЭЛЕМЕНТ:
   - Используй "энергии", "вибрации", "космические силы"
   - "Карты никогда не лгут", "Вселенная посылает знаки"
   - Ссылайся на интуицию и внутреннюю мудрость

7. ОБЪЕМ И ДЕТАЛЬНОСТЬ:
   - Минимум 800-1200 слов для развернутого толкования
   - Каждой карте посвяти 2-3 абзаца
   - Завершай мудрым советом и напутствием

Создай глубокое, проникновенное толкование, которое действительно поможет человеку понять ситуацию и найти путь вперед!"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,  # Увеличил лимит токенов
            temperature=0.8   # Повысил креативность
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"OpenAI API error: {e}")
        return generate_enhanced_fallback_interpretation(cards, positions, question, category)

def generate_enhanced_fallback_interpretation(cards: List[TarotCard], positions: List[str], question: str, category: str) -> str:
    """Generate enhanced fallback interpretation with more detail"""
    
    # Category-specific introductions
    category_intros = {
        "love": "🌹 **Ах, дитя мое, вопросы сердца...** Карты любви раскрывают передо мной тайны Вашего сердца и судьбы в любовных делах.",
        "career": "💼 **Вижу-вижу... рабочие энергии окружают Вас!** Карты профессиональной судьбы показывают мне Ваш путь к успеху и признанию.",
        "finance": "💰 **Золотые потоки энергии... деньги говорят со мной!** Карты материального благополучия открывают тайны Вашего финансового будущего.",
        "general": "🔮 **Мистические силы Вселенной собрались вокруг Вас!** Карты жизненного пути показывают мне общую панораму Вашей судьбы."
    }
    
    interpretation = category_intros.get(category, "🔮 **Вижу... карты говорят мне о Вашей судьбе!**") + "\n\n"
    interpretation += f"*Ваш вопрос: \"{question}\"*\n\n"
    interpretation += "Дорогая моя, духи предков шепчут мне через древние карты Таро. Энергии Вселенной сплетаются в мистический узор судьбы. Вот что открывают мне космические силы:\n\n"
    
    mystical_phrases = [
        "Энергия этой священной карты пульсирует и говорит мне",
        "Духи древности показывают через эту карту глубокие тайны",
        "Вижу в магическом свечении карты космические знаки",
        "Вселенские силы через эту карту раскрывают секреты",
        "Мудрость веков, заключенная в этой карте, шепчет мне",
        "Астральные вибрации этой карты несут важное послание",
        "Сакральная энергия карты открывает передо мной видения"
    ]
    
    card_connectors = [
        "И вот, следующая карта углубляет понимание...",
        "А теперь энергии переплетаются с новой картой...",
        "Мистическая нить ведет нас к следующему откровению...",
        "Карты ткут дальше полотно Вашей судьбы...",
        "Вселенная добавляет новый слой понимания...",
        "И духи открывают еще одну грань истины..."
    ]
    
    for i, card in enumerate(cards):
        position = positions[i] if i < len(positions) else f"Карта {i+1}"
        meaning = card.reversed_meaning if card.is_reversed else card.upright_meaning
        keywords = ", ".join(card.keywords)
        mystical_intro = mystical_phrases[i % len(mystical_phrases)]
        
        # Добавляем связующие фразы между картами
        if i > 0:
            interpretation += f"\n{card_connectors[(i-1) % len(card_connectors)]}\n\n"
        
        interpretation += f"✨ **{position}** - *{card.name}*"
        if card.is_reversed:
            interpretation += " *(перевернутая - энергия трансформации и внутренних изменений)*"
        interpretation += f"\n\n{mystical_intro}, что {meaning.lower()}"
        
        # Добавляем ключевые слова как дополнительную информацию
        interpretation += f"\n\nКлючевые энергии этой карты: *{keywords}*. "
        
        # Добавляем дополнительный мистический комментарий
        if card.is_reversed:
            interpretation += "Перевернутое положение говорит о необходимости заглянуть внутрь себя, о скрытых аспектах ситуации, которые требуют Вашего внимания."
        else:
            interpretation += "Прямое положение карты указывает на явные, активно проявляющиеся энергии в Вашей жизни."
        
        interpretation += "\n\n"
    
    # Добавляем категориальные советы
    category_advice = {
        "love": """💕 **Советы мудрой гадалки для дел сердечных:**
        Милая моя, любовь - это танец двух душ. Карты показывают энергии, но помните: истинная любовь требует терпения, понимания и работы над собой. Слушайте свое сердце, но не забывайте о разуме. Если одиноки - работайте над собой, излучайте любовь, и она вернется к Вам стократно. Если в отношениях - цените то, что имеете, и не бойтесь быть уязвимыми.""",
        
        "career": """🎯 **Мудрые наставления для профессионального пути:**
        Дитя мое, карьера - это не только деньги, но и самореализация. Карты указывают направление, но путь делаете Вы. Развивайте свои таланты, учитесь новому, стройте отношения с людьми. Помните: успех приходит к тем, кто сочетает упорство с мудростью. Не бойтесь перемен - они часто открывают новые возможности.""",
        
        "finance": """💎 **Древняя мудрость о материальном благополучии:**
        Золото приходит к тем, кто умеет его ценить и разумно распоряжаться. Карты показывают потоки изобилия, но помните: деньги - это энергия, которая должна двигаться. Будьте щедрыми, но не расточительными. Инвестируйте в себя и свое будущее. Доверяйте интуиции в финансовых решениях.""",
        
        "general": """🌟 **Общие наставления мудрой гадалки:**
        Жизнь - это путешествие души через различные опыты. Карты освещают дорогу, но идете по ней Вы. Принимайте каждый день как дар, учитесь на ошибках, радуйтесь успехам. Баланс - ключ к счастью. Любите, творите, развивайтесь духовно. Помните: Вы - творец своей судьбы."""
    }
    
    interpretation += category_advice.get(category, category_advice["general"]) + "\n\n"
    
    interpretation += """🌙 **Заключительное пророчество:**
    Милая душа, карты открыли передо мной лишь часть Вашего пути. Судьба - это река, которая течет и изменяется. Вы обладаете силой влиять на течение этой реки своими мыслями, действиями и выборами. 
    
    Доверяйте своей интуиции - это голос Вашей души. Будьте открыты переменам, но не забывайте о своих корнях. И помните: даже в самую темную ночь звезды продолжают светить над Вами.
    
    *Пусть Вселенная благословит Ваш путь, дорогая моя!* ⭐✨"""
    
    return interpretation

def generate_enhanced_fallback_interpretation(cards: List[TarotCard], positions: List[str], question: str, category: str) -> str:
    """Generate enhanced fallback interpretation with detailed analysis"""
    
    # Category-specific introductions
    category_intros = {
        "love": "Вижу... сердце Ваше трепещет, дорогая моя. Карты любви раскрывают передо мной тайны Вашего сердца...",
        "career": "Духи предков шепчут мне о Вашем пути в мире труда и призвания. Вижу энергии успеха и вызовов...",
        "finance": "Золотые потоки судьбы показывают мне Ваше материальное будущее. Монеты в картах звенят особой мелодией...",
        "general": "Космические силы открывают передо мной панораму Вашей жизни. Вижу переплетение судеб и энергий..."
    }
    
    interpretation = f"🔮 **{category_intros.get(category, 'Вижу... карты открывают мне тайны Вашей судьбы...')}**\n\n"
    interpretation += f"Дорогая душа, Вы спрашиваете: \"{question}\"\n\n"
    interpretation += "Древние карты отвечают мне через мистические символы. Позвольте мудрой гадалке раскрыть Вам их послание:\n\n"
    
    mystical_phrases = [
        "Первая карта светится особым светом и говорит мне",
        "Вторая карта пульсирует энергией и шепчет",
        "Третья карта излучает мощные вибрации, показывая",
        "Четвертая карта танцует в космических потоках, раскрывая",
        "Пятая карта звенит колокольчиками судьбы, предвещая",
        "Шестая карта окутана мистическим туманом, но я вижу",
        "Седьмая карта горит внутренним огнем, указывая на",
        "Восьмая карта отражает лунный свет, открывая",
        "Девятая карта дрожит от космической энергии, говоря о",
        "Десятая карта завершает священный круг, показывая"
    ]
    
    for i, card in enumerate(cards):
        position = positions[i] if i < len(positions) else f"Карта {i+1}"
        meaning = card.reversed_meaning if card.is_reversed else card.upright_meaning
        keywords_text = ", ".join(card.keywords[:3])  # First 3 keywords
        mystical_intro = mystical_phrases[i % len(mystical_phrases)]
        
        interpretation += f"✨ **{position}** - *{card.name}*"
        if card.is_reversed:
            interpretation += " *(перевернутая - энергия течет в обратном направлении)*"
        interpretation += f"\n\n{mystical_intro}, что {meaning.lower()}\n"
        interpretation += f"Ключевые энергии этой карты: *{keywords_text}*\n"
        interpretation += f"Вижу, как эта карта влияет на Вашу ситуацию - она несет важное послание для понимания пути.\n\n"
    
    # Category-specific advice
    category_advice = {
        "love": "💕 **Совет сердцу от мудрой гадалки:**\nДорогая моя, любовь - это река, которая течет по своим законам. Карты показывают, что Ваше сердце знает истину. Доверьтесь интуиции, откройтесь новым возможностям, но помните - истинная любовь требует терпения и мудрости.",
        "career": "💼 **Совет для карьеры от опытной гадалки:**\nМилая душа, путь профессионального роста извилист, но карты видят Ваш потенциал. Используйте свои таланты, не бойтесь новых вызовов. Время перемен приближается - будьте готовы к возможностям.",
        "finance": "💰 **Совет по финансам от мудрой провидицы:**\nДитя мое, деньги - это энергия, которая должна течь. Карты советуют быть осмотрительной, но не скупой. Инвестируйте в себя и свое будущее, но помните о балансе между тратами и накоплениями.",
        "general": "🌟 **Общий совет от мудрой гадалки:**\nДорогая моя, жизнь - это танец различных энергий. Карты показывают, что Вы на правильном пути, даже если иногда кажется иначе. Доверяйте процессу, слушайте свое сердце и помните - каждый вызов несет в себе возможность роста."
    }
    
    interpretation += category_advice.get(category, "🌟 **Совет мудрой гадалки:**\nМилая моя, карты не лгут - они лишь отражают энергии, что окружают Вас. Прислушайтесь к своему сердцу, доверьтесь интуиции.")
    
    interpretation += "\n\n🔮 **Заключительное слово:**\n"
    interpretation += "Помните, дорогая душа - карты показывают возможности, но судьба в Ваших руках. "
    interpretation += "Используйте эту мудрость как компас в жизненном путешествии. "
    interpretation += "Пусть звезды освещают Ваш путь, а интуиция ведет к счастью!\n\n"
    interpretation += "*Да благословят Вас высшие силы, дитя мое!* ⭐✨"
    
    return interpretation

def select_random_cards(count: int) -> List[TarotCard]:
    """Select random cards from Major Arcana"""
    selected_cards = random.sample(MAJOR_ARCANA, count)
    tarot_cards = []
    
    for card_data in selected_cards:
        card = TarotCard(**card_data)
        # 30% chance of being reversed
        card.is_reversed = random.random() < 0.3
        tarot_cards.append(card)
    
    return tarot_cards

# API Routes
@api_router.get("/categories")
async def get_categories():
    """Get available question categories"""
    return {"categories": CATEGORIES}

@api_router.get("/spreads")
async def get_spreads():
    """Get available spread types"""
    return {"spreads": SPREADS}

@api_router.post("/reading", response_model=TarotReading)
async def create_tarot_reading(question_data: TarotQuestion):
    """Create a new tarot reading"""
    
    if question_data.spread_type not in SPREADS:
        raise HTTPException(status_code=400, detail="Invalid spread type")
    
    spread_config = SPREADS[question_data.spread_type]
    
    # Select random cards
    cards = select_random_cards(spread_config["cards_count"])
    
    # Generate AI interpretation
    interpretation = await generate_ai_interpretation(
        question_data.question,
        question_data.category,
        question_data.spread_type,
        cards,
        spread_config["positions"]
    )
    
    # Create reading object
    reading = TarotReading(
        question=question_data.question,
        category=question_data.category,
        spread_type=question_data.spread_type,
        cards=cards,
        positions=spread_config["positions"],
        interpretation=interpretation
    )
    
    # Save to database
    await db.tarot_readings.insert_one(reading.dict())
    
    return reading

@api_router.get("/card-back")
async def get_card_back():
    """Get card back image"""
    return {"card_back": CARD_BACK_IMAGE}

@api_router.post("/compatibility", response_model=CompatibilityResult)
async def analyze_compatibility(request: CompatibilityRequest):
    """Analyze name compatibility"""
    
    # Generate compatibility analysis
    score, analysis = await generate_compatibility_analysis(request.name1, request.name2)
    
    # Create compatibility result
    result = CompatibilityResult(
        name1=request.name1,
        name2=request.name2,
        compatibility_score=score,
        analysis=analysis
    )
    
    # Save to database
    await db.compatibility_results.insert_one(result.dict())
    
    return result

@api_router.post("/palmistry", response_model=PalmistryResult)
async def analyze_palmistry(request: PalmistryRequest):
    """Analyze palmistry from palm image"""
    
    # Generate palmistry analysis
    lines, interpretation = await generate_palmistry_analysis(request.image_base64, request.question)
    
    # Create palmistry result
    result = PalmistryResult(
        question=request.question,
        image_base64=request.image_base64,
        lines=lines,
        interpretation=interpretation
    )
    
    # Save to database
    await db.palmistry_results.insert_one(result.dict())
    
    return result

@api_router.post("/profile", response_model=UserProfile)
async def create_or_update_profile(profile_data: dict):
    """Create or update user profile"""
    
    # Calculate zodiac sign from birth date
    zodiac_sign = get_zodiac_sign(profile_data["birth_date"])
    
    profile = UserProfile(
        name=profile_data["name"],
        birth_date=profile_data["birth_date"],
        birth_time=profile_data.get("birth_time"),
        birth_place=profile_data.get("birth_place"),
        zodiac_sign=zodiac_sign,
        gender=profile_data.get("gender"),
        updated_at=datetime.utcnow()
    )
    
    # Check if profile already exists
    existing_profile = await db.user_profiles.find_one({})
    if existing_profile:
        # Update existing profile
        await db.user_profiles.replace_one(
            {"_id": existing_profile["_id"]}, 
            profile.dict()
        )
    else:
        # Create new profile
        await db.user_profiles.insert_one(profile.dict())
    
    return profile

@api_router.get("/profile", response_model=UserProfile)
async def get_profile():
    """Get user profile"""
    
    profile_data = await db.user_profiles.find_one({})
    if not profile_data:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return UserProfile(**profile_data)

@api_router.get("/horoscope", response_model=HoroscopeResult)
async def get_horoscope(date: Optional[str] = None):
    """Get horoscope for user"""
    
    # Get user profile
    profile_data = await db.user_profiles.find_one({})
    if not profile_data:
        raise HTTPException(status_code=404, detail="Profile not found. Please create profile first.")
    
    user_profile = UserProfile(**profile_data)
    
    # Use today's date if not provided
    if not date:
        date = datetime.utcnow().strftime('%Y-%m-%d')
    
    # Check if horoscope for this date already exists
    existing_horoscope = await db.horoscopes.find_one({
        "user_profile_id": user_profile.id,
        "date": date
    })
    
    if existing_horoscope:
        return HoroscopeResult(**existing_horoscope)
    
    # Generate new horoscope
    horoscope = await generate_horoscope(user_profile, date)
    
    # Save to database
    await db.horoscopes.insert_one(horoscope.dict())
    
    return horoscope

@api_router.get("/horoscope/history", response_model=List[HoroscopeResult])
async def get_horoscope_history(limit: int = 10):
    """Get horoscope history"""
    
    horoscopes = await db.horoscopes.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    return [HoroscopeResult(**horoscope) for horoscope in horoscopes]
@api_router.get("/readings")
async def get_reading_history(limit: int = 10):
    """Get unified reading history including tarot, palmistry, and horoscopes"""
    
    # Get tarot readings (exclude _id field)
    tarot_readings = await db.tarot_readings.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Get palmistry readings (exclude _id field)
    palmistry_readings = await db.palmistry_results.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Get horoscopes (exclude _id field)
    horoscope_readings = await db.horoscopes.find({}, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Convert all to unified format
    unified_history = []
    
    # Add tarot readings
    for reading in tarot_readings:
        unified_history.append({
            **reading,
            "type": "tarot"
        })
    
    # Add palmistry readings 
    for palm_reading in palmistry_readings:
        unified_history.append({
            "id": palm_reading["id"],
            "question": palm_reading["question"],
            "category": "palmistry",
            "spread_type": "palm_analysis",
            "cards": [],  # Empty for palmistry
            "positions": ["Анализ ладони"],
            "interpretation": palm_reading["interpretation"],
            "created_at": palm_reading["created_at"],
            "type": "palmistry",
            "image_base64": palm_reading.get("image_base64", ""),
            "lines": palm_reading.get("lines", [])
        })
    
    # Add horoscopes
    for horoscope in horoscope_readings:
        unified_history.append({
            "id": horoscope["id"],
            "question": f"Гороскоп на {horoscope['date']}",
            "category": "horoscope",
            "spread_type": "daily_horoscope",
            "cards": [],  # Empty for horoscope
            "positions": [f"Прогноз для знака {horoscope['zodiac_sign']}"],
            "interpretation": horoscope["horoscope_text"],
            "created_at": horoscope["created_at"],
            "type": "horoscope",
            "zodiac_sign": horoscope["zodiac_sign"],
            "mood_rating": horoscope.get("mood_rating", 7),
            "lucky_color": horoscope.get("lucky_color", "золотой"),
            "lucky_numbers": horoscope.get("lucky_numbers", [])
        })
    
    # Sort all by date and limit
    unified_history.sort(key=lambda x: x["created_at"], reverse=True)
    return unified_history[:limit]

@api_router.get("/")
async def root():
    return {"message": "TARO API - Древняя мудрость в современном исполнении"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()