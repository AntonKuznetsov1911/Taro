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
    suit: Optional[str] = None  # For Minor Arcana: wands/cups/swords/pentacles, for Major: major
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

# Astro-Psychology Models
class AstroAnswer(BaseModel):
    question_id: str
    option_id: str
    keywords: List[str]
    arcana: Optional[str] = None

class AstroPersonalityRequest(BaseModel):
    answers: List[AstroAnswer]
    name: Optional[str] = None

class AstroPersonalityResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    personality_analysis: str
    dominant_arcana: List[str]
    character_traits: List[str]
    life_path: str
    current_phase: str
    advice: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Global flag to disable OpenAI when quota exceeded
OPENAI_QUOTA_EXCEEDED = False

async def check_openai_quota():
    """Check if OpenAI quota is exceeded and set global flag"""
    global OPENAI_QUOTA_EXCEEDED
    try:
        # Try a minimal request to check quota
        response = await openai.chat.completions.create(
            model="gpt-3.5-turbo", 
            messages=[{"role": "user", "content": "test"}],
            max_tokens=1
        )
        OPENAI_QUOTA_EXCEEDED = False
        return True
    except Exception as e:
        if "insufficient_quota" in str(e) or "429" in str(e):
            OPENAI_QUOTA_EXCEEDED = True
            logging.warning("OpenAI quota exceeded - switching to fallback mode")
        return False

async def generate_compatibility_analysis(name1: str, name2: str) -> tuple[int, str]:
    """Generate compatibility analysis using AI"""
    
    # Check if OpenAI quota is exceeded
    global OPENAI_QUOTA_EXCEEDED
    if OPENAI_QUOTA_EXCEEDED:
        logging.info("OpenAI quota exceeded - using fallback compatibility analysis")
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
        base_score = abs(9 - abs(num1 - num2)) * 10 + random.randint(5, 25)
        compatibility_score = min(99, max(15, base_score))
        analysis = generate_fallback_compatibility_analysis(name1, name2, compatibility_score)
        return compatibility_score, analysis
    
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
        # Set quota flag if quota error detected  
        if "insufficient_quota" in str(e) or "429" in str(e):
            OPENAI_QUOTA_EXCEEDED = True
            logging.warning("OpenAI quota exceeded - switching to fallback mode for future requests")
        else:
            logging.error(f"OpenAI API error: {e}")
        analysis = generate_fallback_compatibility_analysis(name1, name2, compatibility_score)
    
    return compatibility_score, analysis

async def generate_palmistry_analysis(image_base64: str, question: str) -> tuple[List[PalmLine], str]:
    """Generate palmistry analysis using AI Vision to analyze the palm photo"""

    # Default palm lines for visualization
    palm_lines = [
        PalmLine(
            name="Линия жизни",
            description="Показывает жизненную энергию, здоровье и долголетие",
            color="#FF6B9D",
            points=[[120, 180], [140, 200], [160, 240], [180, 280], [200, 320], [220, 360]]
        ),
        PalmLine(
            name="Линия сердца",
            description="Отражает эмоциональность, любовь и отношения",
            color="#4ECDC4",
            points=[[80, 120], [120, 130], [160, 135], [200, 140], [240, 145], [280, 150]]
        ),
        PalmLine(
            name="Линия ума (головы)",
            description="Показывает интеллект, мышление и обучение",
            color="#45B7D1",
            points=[[90, 160], [130, 170], [170, 175], [210, 180], [250, 185], [290, 190]]
        ),
        PalmLine(
            name="Линия судьбы",
            description="Указывает на карьеру и жизненный путь",
            color="#9B59B6",
            points=[[180, 300], [185, 260], [190, 220], [195, 180], [200, 140], [205, 100]]
        ),
        PalmLine(
            name="Линия Солнца (Аполлона)",
            description="Говорит о творчестве, таланте и успехе",
            color="#F39C12",
            points=[[220, 280], [225, 240], [230, 200], [235, 160], [240, 120]]
        ),
        PalmLine(
            name="Линия Меркурия (здоровья)",
            description="Отвечает за здоровье и коммуникации",
            color="#E74C3C",
            points=[[260, 290], [265, 250], [270, 210], [275, 170]]
        ),
        PalmLine(
            name="Браслеты запястья",
            description="Символизируют долголетие и благополучие",
            color="#2ECC71",
            points=[[80, 380], [120, 385], [160, 390], [200, 395], [240, 400], [280, 405]]
        )
    ]

    # Try to use Vision API for real palm analysis
    global OPENAI_QUOTA_EXCEEDED
    if not OPENAI_QUOTA_EXCEEDED:
        try:
            # Use GPT-4 Vision to analyze the palm photo
            vision_prompt = f"""Ты опытный хиромант с 40-летним стажем. Проанализируй фотографию ладони и определи:

1. ОСНОВНЫЕ ЛИНИИ (опиши детально что видишь):
   - Линия Жизни (форма, длина, глубина, разрывы, ветвления)
   - Линия Сердца (начало, конец, кривизна, глубина)
   - Линия Головы/Ума (направление, длина, пересечения)
   - Линия Судьбы (если есть - глубина, прямота)
   - Линия Солнца/Аполлона (если есть)
   - Линия Меркурия (если есть)
   - Линии брака и детей (на ребре ладони)

2. ХОЛМЫ ЛАДОНИ:
   - Холм Венеры (у основания большого пальца)
   - Холм Юпитера (под указательным)
   - Холм Сатурна (под средним)
   - Холм Аполлона (под безымянным)
   - Холм Меркурия (под мизинцем)
   - Холм Луны (нижняя часть ладони)

3. ФОРМА РУКИ:
   - Тип руки (земля, воздух, вода, огонь)
   - Форма пальцев
   - Гибкость и текстура кожи

4. ОСОБЫЕ ЗНАКИ:
   - Звёзды, кресты, треугольники, квадраты
   - Острова на линиях
   - Решётки

Опиши ВСЁ что видишь максимально детально - это основа для точного предсказания."""

            vision_response = openai_client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": vision_prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"{image_base64}" if image_base64.startswith("data:image") else f"data:image/jpeg;base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=1000
            )

            palm_description = vision_response.choices[0].message.content.strip()

        except Exception as e:
            logging.error(f"Vision API error: {e}")
            if "insufficient_quota" in str(e) or "429" in str(e):
                OPENAI_QUOTA_EXCEEDED = True
            palm_description = "По фотографии вижу основные линии ладони."
    else:
        palm_description = "По фотографии вижу основные линии ладони."

    # Generate detailed interpretation based on vision analysis
    interpretation_prompt = f"""Ты мудрая цыганская гадалка Мария с 40-летним опытом хиромантии. Твои предсказания по ладони всегда точные, детальные и помогают людям. Говори мистично, проникновенно, с душой.

ВОПРОС ЧЕЛОВЕКА: "{question}"

АНАЛИЗ ЛАДОНИ ПО ФОТО:
{palm_description}

СОЗДАЙ ПОЛНОЕ ТОЛКОВАНИЕ ПО ХИРОМАНТИИ:

1. СТИЛЬ:
   - Обращайся "Вы", используй: "Дорогая моя", "Милая душа", "Дитя моё"
   - Начни мистично: "Вижу на Вашей ладони...", "Рука раскрывает передо мной..."
   - Мистические элементы: "судьба начертана", "энергии ладони", "древние знаки"

2. ПОДРОБНЫЙ АНАЛИЗ КАЖДОЙ ЛИНИИ:

   **Линия Жизни** (дуга вокруг большого пальца):
   - Что показывает о здоровье и жизненной энергии
   - Долголетие и важные периоды жизни
   - Изменения и переломные моменты

   **Линия Сердца** (верхняя горизонтальная):
   - Эмоциональная натура
   - Способность любить и быть любимым
   - Прошлые и будущие отношения
   - Глубина чувств

   **Линия Головы/Ума** (средняя горизонтальная):
   - Тип мышления (практик/мечтатель)
   - Интеллектуальные способности
   - Творческий потенциал
   - Способность к обучению

   **Линия Судьбы** (вертикальная к среднему пальцу):
   - Карьерный путь и предназначение
   - Финансовое благополучие
   - Профессиональная самореализация

   **Линия Солнца** (к безымянному пальцу):
   - Творческие таланты
   - Успех и признание
   - Харизма и популярность

   **Холмы ладони**:
   - Венера (страсть, любовь)
   - Юпитер (амбиции, лидерство)
   - Сатурн (мудрость, ответственность)
   - Аполлон (творчество, артистизм)
   - Меркурий (коммуникация, бизнес)
   - Луна (интуиция, воображение)

3. ФОРМА РУКИ И ПАЛЬЦЕВ:
   - Тип руки (земля/воздух/вода/огонь)
   - Что это говорит о характере
   - Сильные и слабые стороны личности

4. ОСОБЫЕ ЗНАКИ:
   - Звёзды (успех, событие)
   - Кресты (препятствия)
   - Треугольники (талант)
   - Квадраты (защита)
   - Острова (трудности)

5. ВРЕМЕННЫЕ РАМКИ:
   - События прошлого (что уже произошло)
   - Настоящее (текущая ситуация)
   - Ближайшее будущее (1-6 месяцев)
   - Долгосрочные тенденции (1-3 года)

6. КОНКРЕТНЫЕ ПРЕДСКАЗАНИЯ:
   - **Любовь**: встречи, отношения, брак
   - **Карьера**: успех, изменения, возможности
   - **Здоровье**: на что обратить внимание
   - **Финансы**: денежные потоки, благополучие
   - **Духовность**: рост, развитие, предназначение

7. ПРАКТИЧЕСКИЕ СОВЕТЫ:
   - Что развивать в себе
   - Какие возможности использовать
   - Чего остерегаться
   - Когда действовать, когда подождать

8. ОБЪЁМ: 800-1200 слов детального анализа

Создай МАКСИМАЛЬНО ПОДРОБНОЕ толкование, которое действительно поможет человеку понять свою судьбу и принять правильные решения!"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": interpretation_prompt}],
            max_tokens=1800,
            temperature=0.8
        )
        interpretation = response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"OpenAI interpretation error: {e}")
        if "insufficient_quota" in str(e) or "429" in str(e):
            OPENAI_QUOTA_EXCEEDED = True
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
    
    return interpretation

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
    
    # Check if OpenAI quota is exceeded
    global OPENAI_QUOTA_EXCEEDED
    if OPENAI_QUOTA_EXCEEDED:
        logging.info("OpenAI quota exceeded - using fallback horoscope")
        # Generate lucky numbers and color
        import random
        lucky_numbers = random.sample(range(1, 50), 6)
        colors = ["золотой", "серебряный", "красный", "синий", "зеленый", "фиолетовый", "белый", "черный"]
        lucky_color = random.choice(colors)
        mood_rating = random.randint(6, 9)
        
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
        # Set quota flag if quota error detected
        if "insufficient_quota" in str(e) or "429" in str(e):
            OPENAI_QUOTA_EXCEEDED = True
            logging.warning("OpenAI quota exceeded - switching to fallback mode for future requests")
        else:
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

    # Check if OpenAI quota is exceeded
    global OPENAI_QUOTA_EXCEEDED
    if OPENAI_QUOTA_EXCEEDED:
        logging.info("OpenAI quota exceeded - using fallback interpretation")
        return generate_enhanced_fallback_interpretation(cards, positions, question, category)

    # Prepare cards info for AI with enhanced details
    cards_info = []
    for i, card in enumerate(cards):
        meaning = card.reversed_meaning if card.is_reversed else card.upright_meaning
        position = positions[i] if i < len(positions) else f"Карта {i+1}"
        keywords_text = ", ".join(card.keywords)
        card_number = card.id if hasattr(card, 'id') else i + 1
        cards_info.append(f"""Позиция '{position}': {card.name} {'(перевернутая)' if card.is_reversed else '(прямая)'}
Номер карты: {card_number}
Тип: {card.type}
Значение: {meaning}
Ключевые слова: {keywords_text}""")

    cards_text = "\n\n".join(cards_info)

    # Prepare detailed prompts based on category
    category_prompts = {
        "love": """сфокусируйся на любовных отношениях с МАКСИМАЛЬНОЙ ДЕТАЛИЗАЦИЕЙ:
        - Глубинное эмоциональное состояние обоих партнеров (если применимо)
        - Динамика отношений: текущий этап, тенденции развития, критические точки
        - Совместимость на всех уровнях: эмоциональном, интеллектуальном, физическом, духовном
        - Скрытые препятствия, внешние и внутренние блоки
        - Конкретные практические шаги для укрепления/привлечения любви
        - Временные периоды важных событий (ближайшие 1-3 месяца, 3-6 месяцев)
        - Что делать и чего избегать""",
        "career": """сфокусируйся на карьере с МАКСИМАЛЬНОЙ ДЕТАЛИЗАЦИЕЙ:
        - Детальный анализ текущего профессионального положения
        - Скрытые возможности и препятствия на пути к успеху
        - Отношения с ключевыми фигурами (руководство, коллеги, клиенты)
        - Новые направления, проекты, перспективные области
        - Истинное призвание и пути самореализации
        - Финансовый потенциал карьерных решений
        - Конкретные шаги и действия на ближайшие 1-6 месяцев
        - Навыки для развития, обучение""",
        "finance": """сфокусируйся на финансах с МАКСИМАЛЬНОЙ ДЕТАЛИЗАЦИЕЙ:
        - Всесторонний анализ текущего материального положения
        - Источники дохода: текущие, потенциальные, скрытые возможности
        - Финансовые риски и как их минимизировать
        - Инвестиции: благоприятные направления, сроки, риски
        - Крупные покупки: оптимальное время, целесообразность
        - Психология денег: установки, блоки, модели поведения
        - Конкретный план улучшения финансового положения
        - Временные периоды финансовых возможностей""",
        "general": """дай МАКСИМАЛЬНО ВСЕСТОРОННЮЮ интерпретацию:
        - Глобальное жизненное направление и предназначение
        - Детальный анализ всех сфер: любовь, работа, здоровье, духовность, отношения
        - Внутренние процессы: трансформация, рост, вызовы сознания
        - Внешние обстоятельства и их влияние
        - Баланс энергий: что в избытке, чего не хватает
        - Уроки души в текущий период
        - Конкретные практические шаги в каждой сфере
        - Временные циклы и важные периоды"""
    }

    spread_guidance = {
        "one_card": """Дай ИСЧЕРПЫВАЮЩУЮ интерпретацию одной карты:
        - Все уровни значения: буквальный, метафорический, духовный, психологический
        - Как карта отвечает на конкретный вопрос в разных аспектах
        - Энергетическое влияние карты на ситуацию
        - Нумерологическое значение и его влияние
        - Что делать и чего избегать
        - Временные рамки проявления энергии карты""",
        "three_cards": """Создай ГЛУБОКУЮ связанную историю через время:
        - Детальный анализ прошлого: какие события/решения привели к текущему моменту
        - Настоящее: точная характеристика ситуации, скрытые факторы
        - Будущее: несколько вариантов развития в зависимости от действий
        - Взаимосвязи между картами: как прошлое влияет, как настоящее формирует будущее
        - Нумерологический анализ последовательности
        - Конкретные действия для желаемого будущего""",
        "celtic_cross": """Дай ПОДРОБНЕЙШИЙ анализ расклада Кельтский Крест:
        - Детальная интерпретация каждой позиции с учетом ее места в раскладе
        - Взаимодействие между картами: какие усиливают, какие ослабляют друг друга
        - Центральный конфликт и пути его разрешения
        - Скрытые влияния и подсознательные факторы
        - Внешние обстоятельства и люди
        - Надежды, страхи и их реалистичность
        - Итоговый прогноз с конкретными сроками и действиями
        - Альтернативные сценарии развития событий"""
    }

    prompt = f"""Ты Мария - легендарная цыганская гадалка с 40-летним опытом, известная своими невероятно ДЕТАЛЬНЫМИ и ТОЧНЫМИ толкованиями. Твои предсказания всегда содержат конкретные детали, временные рамки и практические советы. Клиенты возвращаются к тебе, потому что твои толкования действительно РАБОТАЮТ.

ВОПРОС КЛИЕНТА: "{question}"
КАТЕГОРИЯ: {category}
ТИП РАСКЛАДА: {SPREADS[spread_type]['name']}

ВЫПАВШИЕ КАРТЫ:
{cards_text}

ИНСТРУКЦИИ ДЛЯ СОЗДАНИЯ МАКСИМАЛЬНО ДЕТАЛЬНОГО ТОЛКОВАНИЯ:

1. СТИЛЬ И ТОН (важно!):
   - Обращение на "Вы", используй: "Дорогая моя", "Милая душа", "Дитя мое", "Золотце"
   - Начни мистично: "Ах, дитя мое, вижу я в картах...", "Духи предков открывают мне тайны..."
   - Используй яркие метафоры и образные выражения
   - Говори уверенно и конкретно, как настоящий профессионал

2. СТРУКТУРА ОТВЕТА:
   {spread_guidance.get(spread_type, "Дай общую интерпретацию")}

3. КАТЕГОРИАЛЬНЫЙ ФОКУС:
   {category_prompts.get(category, 'дай общую интерпретацию')}

4. ОБЯЗАТЕЛЬНЫЕ ЭЛЕМЕНТЫ ДЛЯ КАЖДОЙ КАРТЫ:
   - Подробный символизм карты и ее энергетика
   - Нумерологическое значение (если это числовая карта)
   - Взаимодействие карты с позицией в раскладе
   - Как карта отвечает на конкретный вопрос
   - Практические советы: ЧТО делать, КАК делать, КОГДА делать
   - Чего ИЗБЕГАТЬ
   - Эмоциональные и психологические аспекты
   - Духовные уроки

5. АНАЛИЗ ВЗАИМОСВЯЗЕЙ (КРИТИЧЕСКИ ВАЖНО):
   - Как карты влияют друг на друга в раскладе
   - Какие карты усиливают, какие ослабляют влияние
   - Общий энергетический паттерн расклада
   - Противоречия между картами и их разрешение
   - Повторяющиеся темы и символы

6. ВРЕМЕННЫЕ РАМКИ (обязательно указать):
   - Ближайшее будущее (1-4 недели)
   - Среднесрочная перспектива (1-3 месяца)
   - Долгосрочные тенденции (3-6 месяцев)
   - Благоприятные периоды для действий
   - Периоды, когда лучше подождать

7. ПРАКТИЧЕСКИЕ ДЕЙСТВИЯ (конкретика!):
   - Пошаговый план действий
   - Что начать делать СЕГОДНЯ
   - Что планировать на ближайший месяц
   - Какие привычки развивать
   - С кем общаться, кого избегать
   - Какие решения принимать, какие отложить

8. МИСТИЧЕСКИЙ ЭЛЕМЕНТ:
   - "Энергии Вселенной", "космические вибрации", "астральные силы"
   - "Карты никогда не лгут", "духи предков направляют"
   - Интуиция, внутренняя мудрость, знаки судьбы
   - Луна, планеты, стихии и их влияние

9. ОБЪЕМ И КАЧЕСТВО (строго соблюдать):
   - Минимум 1200-1800 слов для полного толкования
   - Каждой карте посвяти 3-4 содержательных абзаца
   - Анализ взаимосвязей - отдельный раздел
   - Заключение с конкретным планом действий
   - Использу й разметку Markdown: **жирный**, *курсив*, разделы

10. КОНКРЕТНОСТЬ И ПОЛЕЗНОСТЬ:
   - Избегай общих фраз типа "всё будет хорошо"
   - Давай КОНКРЕТНЫЕ советы и прогнозы
   - Объясняй КАК и ПОЧЕМУ, не только ЧТО
   - Предоставь несколько вариантов развития событий
   - Укажи на возможности И на риски

Создай ИСЧЕРПЫВАЮЩЕЕ, ДЕТАЛЬНОЕ толкование, которое станет настоящим путеводителем для человека! Пусть каждое слово несёт ценность и помогает принимать правильные решения!"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=3000,  # Значительно увеличил лимит для детальных ответов
            temperature=0.85   # Повысил креативность для более живого языка
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        # Set quota flag if quota error detected
        if "insufficient_quota" in str(e) or "429" in str(e):
            OPENAI_QUOTA_EXCEEDED = True
            logging.warning("OpenAI quota exceeded - switching to fallback mode for future requests")
        else:
            logging.error(f"OpenAI API error: {e}")
        return generate_enhanced_fallback_interpretation(cards, positions, question, category)

def analyze_card_combinations(cards: List[TarotCard]) -> str:
    """Analyze combinations and patterns in the card spread"""
    analysis = []

    # Check for card types patterns
    major_count = sum(1 for card in cards if card.type == "major")
    minor_count = len(cards) - major_count

    if major_count > len(cards) / 2:
        analysis.append("🌟 **Особая энергия**: В Вашем раскладе преобладают Старшие Арканы - это указывает на судьбоносные события, кармические уроки и важные жизненные повороты, которые находятся вне Вашего прямого контроля. Высшие силы направляют Ваш путь.")
    elif major_count == 0:
        analysis.append("⚡ **Практический аспект**: Все карты - Младшие Арканы, что говорит о повседневных событиях и ситуациях, которые Вы можете контролировать своими действиями и решениями.")

    # Check for reversed cards
    reversed_count = sum(1 for card in cards if card.is_reversed)
    if reversed_count > len(cards) / 2:
        analysis.append(f"🔄 **Внутренняя работа**: {reversed_count} из {len(cards)} карт перевернуты - это призыв заглянуть внутрь себя. Сейчас важно работать с внутренними блоками, скрытыми страхами и подсознательными паттернами.")
    elif reversed_count == 0:
        analysis.append("✨ **Прямой путь**: Все карты в прямом положении - энергии проявляются открыто и явно, ситуация прозрачна и понятна.")

    # Check for number patterns (numerology)
    if len(cards) >= 3:
        numbers = []
        for card in cards:
            if hasattr(card, 'id'):
                card_num = card.id % 22 if card.type == "major" else card.id % 14
                if card_num > 0:
                    numbers.append(card_num)

        if numbers:
            avg_energy = sum(numbers) / len(numbers)
            if avg_energy < 5:
                analysis.append("🌱 **Энергия начал**: Нумерологическая вибрация расклада указывает на новые начинания, инициативу, свежий старт. Время сеять семена будущего.")
            elif avg_energy < 10:
                analysis.append("🔥 **Активная фаза**: Числовая энергия карт говорит о периоде активных действий, развития, движения вперед. Используйте этот импульс!")
            else:
                analysis.append("🎯 **Завершение циклов**: Высокие числа в раскладе указывают на завершение важных этапов, подведение итогов, мастерство и зрелость.")

    return "\n\n".join(analysis) if analysis else ""

def get_detailed_card_meaning(card: TarotCard, position: str, category: str) -> str:
    """Generate detailed meaning for a card based on context"""
    meaning = card.reversed_meaning if card.is_reversed else card.upright_meaning
    keywords = ", ".join(card.keywords[:5])

    # Add category-specific interpretations
    category_aspects = {
        "love": ["эмоциональное состояние", "динамику отношений", "чувства партнера", "будущее союза"],
        "career": ["профессиональные возможности", "отношения на работе", "карьерный рост", "финансовый аспект работы"],
        "finance": ["денежные потоки", "инвестиционный потенциал", "материальную стабильность", "источники дохода"],
        "general": ["жизненное направление", "духовный рост", "внутреннее состояние", "внешние обстоятельства"]
    }

    aspects = category_aspects.get(category, category_aspects["general"])

    detailed = f"Эта карта раскрывает {aspects[0]}, показывая что {meaning.lower()}\n\n"
    detailed += f"**Ключевые энергии**: {keywords}\n\n"

    # Add practical advice based on card orientation
    if card.is_reversed:
        detailed += "**Что делать**: Обратите внимание на внутренние процессы, проработайте страхи и сомнения, не спешите с внешними действиями. Время для самоанализа и переоценки подходов.\n\n"
        detailed += "**Чего избегать**: Не игнорируйте внутренние сигналы, не пытайтесь форсировать события, избегайте поверхностных решений."
    else:
        detailed += "**Что делать**: Действуйте уверенно в выбранном направлении, используйте благоприятные энергии, будьте активны и открыты возможностям.\n\n"
        detailed += "**Чего избегать**: Не упускайте момент, не откладывайте важные решения, избегайте пассивности и сомнений."

    return detailed

def get_time_prediction(card: TarotCard, position: str) -> str:
    """Generate time-based prediction for the card"""
    # Major arcana = longer timescales, Minor arcana = shorter
    if card.type == "major":
        periods = {
            "прошлое": "2-6 месяцев назад закладывались основы",
            "настоящее": "в течение ближайших 1-2 месяцев проявится",
            "будущее": "через 3-6 месяцев достигнет кульминации"
        }
    else:
        periods = {
            "прошлое": "в последние 2-4 недели формировалось",
            "настоящее": "проявляется прямо сейчас или в ближайшие 2 недели",
            "будущее": "реализуется в течение 1-2 месяцев"
        }

    for key in periods:
        if key in position.lower():
            return periods[key]

    # Default timing
    if card.type == "major":
        return "в течение 2-4 месяцев увидите результаты"
    return "в ближайшие 3-6 недель проявится влияние"

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

    # Add card combination analysis
    combo_analysis = analyze_card_combinations(cards)
    if combo_analysis:
        interpretation += "## 🔮 Общая энергетика расклада\n\n"
        interpretation += combo_analysis + "\n\n"
        interpretation += "---\n\n"
    
    interpretation += "## 📖 Детальное толкование карт\n\n"

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

    # Detailed interpretation for each card
    for i, card in enumerate(cards):
        position = positions[i] if i < len(positions) else f"Карта {i+1}"
        mystical_intro = mystical_phrases[i % len(mystical_phrases)]

        # Add connectors between cards
        if i > 0:
            interpretation += f"\n{card_connectors[(i-1) % len(card_connectors)]}\n\n"

        interpretation += f"### ✨ **{position}** - *{card.name}*"
        if card.is_reversed:
            interpretation += " *(перевернутая - энергия трансформации и внутренних изменений)*"
        interpretation += "\n\n"

        # Add mystical intro
        interpretation += f"{mystical_intro}...\n\n"

        # Add detailed meaning using helper function
        detailed_meaning = get_detailed_card_meaning(card, position, category)
        interpretation += detailed_meaning + "\n\n"

        # Add time prediction
        time_pred = get_time_prediction(card, position)
        interpretation += f"⏰ **Временные рамки**: {time_pred}\n\n"

        # Add category-specific insights
        if category == "love":
            if card.is_reversed:
                interpretation += "💔 *Для любви*: Возможны внутренние барьеры или непонимание. Важно прояснить чувства и намерения, как свои, так и партнёра. Не спешите с выводами.\n\n"
            else:
                interpretation += "💕 *Для любви*: Благоприятные энергии для развития отношений. Будьте открыты и честны в проявлении чувств. Сейчас время действовать.\n\n"
        elif category == "career":
            if card.is_reversed:
                interpretation += "💼 *Для карьеры*: Переоцените свои цели и методы. Возможно, нужно изменить подход или развить новые навыки. Терпение принесёт плоды.\n\n"
            else:
                interpretation += "💼 *Для карьеры*: Отличный период для профессионального роста. Проявите инициативу, покажите свои способности. Возможности рядом.\n\n"
        elif category == "finance":
            if card.is_reversed:
                interpretation += "💰 *Для финансов*: Будьте осторожны с тратами и инвестициями. Проработайте свои убеждения о деньгах. Планирование важнее спешки.\n\n"
            else:
                interpretation += "💰 *Для финансов*: Благоприятное время для финансовых действий. Будьте разумны, но не упускайте возможности. Изобилие доступно.\n\n"

        interpretation += "---\n\n"

    # Add cards interactions analysis if multiple cards
    if len(cards) > 1:
        interpretation += "## 🔗 Взаимодействие карт в раскладе\n\n"

        # Check for conflicting energies
        reversed_count = sum(1 for c in cards if c.is_reversed)
        if reversed_count > 0 and reversed_count < len(cards):
            interpretation += f"Вижу интересное сочетание: {reversed_count} {'карта' if reversed_count == 1 else 'карты'} в перевёрнутом положении создают динамическое напряжение с остальными. Это говорит о том, что внутренние и внешние процессы идут разными темпами. "
            interpretation += "Не форсируйте события - дайте времени внутренним изменениям проявиться во внешнем мире.\n\n"

        # Three cards spread specific
        if len(cards) == 3:
            interpretation += "В раскладе трёх карт вижу чёткую временную линию:\n"
            interpretation += f"- **Прошлое** ({cards[0].name}) создало фундамент\n"
            interpretation += f"- **Настоящее** ({cards[1].name}) показывает текущий момент выбора\n"
            interpretation += f"- **Будущее** ({cards[2].name}) раскрывает потенциальный результат\n\n"

            if cards[1].is_reversed:
                interpretation += "Обратите особое внимание на настоящее - карта перевёрнута, значит сейчас критический момент для внутренней работы, которая определит будущее.\n\n"

        interpretation += "Все карты в раскладе работают вместе, создавая единую историю Вашей судьбы. Каждая дополняет и углубляет понимание других.\n\n"
        interpretation += "---\n\n"
    
    # Add detailed category-specific advice with action plan
    interpretation += "## 💫 Практические рекомендации и план действий\n\n"

    category_advice = {
        "love": """### 💕 Советы мудрой гадалки для дел сердечных

**Понимание ситуации:**
Милая моя, любовь - это танец двух душ, где каждый шаг имеет значение. Карты раскрыли Вам энергии, окружающие Ваше сердце. Теперь важно правильно их использовать.

**Что делать прямо сейчас:**
1. **Эмоциональная честность**: Прислушайтесь к своим истинным чувствам. Что говорит Ваше сердце? Запишите свои переживания, это поможет прояснить ситуацию.
2. **Общение**: Если в отношениях - откройте диалог. Честный разговор о чувствах и ожиданиях важен как никогда.
3. **Работа над собой**: Независимо от статуса отношений, работайте над собственной целостностью. Полнота счастья приходит изнутри.

**В ближайший месяц:**
- Создайте пространство для любви в своей жизни (буквально и метафорически)
- Избавьтесь от старых обид и разочарований - они блокируют новые отношения
- Будьте открыты знакам Вселенной - любовь может прийти неожиданным путём

**Долгосрочная стратегия (3-6 месяцев):**
- Развивайте качества, которые Вы хотите видеть в партнёре
- Излучайте ту любовь, которую хотите получить
- Доверьтесь процессу - каждый опыт приближает к истинной любви

**Чего избегать:**
- Не спешите с серьёзными решениями под влиянием эмоций
- Избегайте манипуляций и игр - они разрушают истинную близость
- Не жертвуйте собой ради отношений - баланс жизненно важен""",

        "career": """### 🎯 Мудрые наставления для профессионального пути

**Анализ текущей ситуации:**
Дитя мое, Ваш профессиональный путь - это больше, чем работа. Это самореализация и вклад в мир. Карты показали направление, теперь давайте составим план.

**Немедленные действия (эта неделя):**
1. **Аудит навыков**: Оцените свои сильные стороны и зоны роста. Что Вы делаете лучше всех?
2. **Сетевое взаимодействие**: Свяжитесь с 3-5 людьми из Вашей профессиональной сферы. Отношения открывают двери.
3. **Видимость**: Покажите результаты своей работы. Не прячьте таланты - время проявить себя.

**Ближайший месяц:**
- Изучите новый навык или углубите существующий
- Выразите интерес к новым проектам или ответственности
- Обновите резюме и профессиональные профили (даже если не ищете работу)
- Найдите ментора или станьте ментором

**Среднесрочный план (3-6 месяцев):**
- Определите желаемое направление развития карьеры
- Начните строить репутацию эксперта (статьи, выступления, проекты)
- Инвестируйте в профессиональное образование
- Рассмотрите смежные области для расширения возможностей

**Избегайте:**
- Не сидите в ожидании - проявляйте инициативу
- Избегайте токсичных рабочих отношений - они истощают энергию
- Не недооценивайте себя - просите то, что заслуживаете""",

        "finance": """### 💎 Древняя мудрость о материальном благополучии

**Понимание денежных энергий:**
Золото приходит к тем, кто готов его принять и разумно использовать. Карты показали Ваши финансовые энергии - теперь активируем их.

**Срочные финансовые шаги (на этой неделе):**
1. **Финансовая ясность**: Подсчитайте все доходы и расходы. Знание - сила в денежных вопросах.
2. **Приоритеты**: Определите 3 главные финансовые цели на год.
3. **Экстренный фонд**: Начните откладывать хотя бы 10% дохода (если ещё не делаете).

**План на месяц:**
- Оптимизируйте ежемесячные расходы - найдите минимум 3 возможности сэкономить
- Изучите дополнительные источники дохода
- Проработайте свои убеждения о деньгах - они создают Вашу реальность
- Рассмотрите инвестиции (после создания подушки безопасности)

**Долгосрочная финансовая стратегия:**
- Создайте резерв на 3-6 месяцев жизни
- Разработайте инвестиционный план (акции, недвижимость, образование)
- Развивайте навыки, которые увеличат Ваш доход
- Практикуйте благодарность и щедрость - деньги любят циркулировать

**Чего остерегаться:**
- Не принимайте импульсивных финансовых решений
- Избегайте необдуманных кредитов и долгов
- Не гонитесь за быстрым обогащением - стабильность важнее
- Не скупитесь на образование и здоровье - это лучшие инвестиции""",

        "general": """### 🌟 Общие наставления мудрой гадалки

**Целостное понимание жизненного пути:**
Жизнь - это путешествие души через многогранный опыт. Карты осветили различные аспекты Вашего пути, теперь давайте интегрируем это знание.

**Ежедневные практики (начните сегодня):**
1. **Утренняя настройка**: 5-10 минут медитации или размышлений о дне
2. **Благодарность**: Записывайте 3 вещи, за которые благодарны
3. **Осознанность**: Проверяйте свое состояние 3 раза в день - как чувствуете себя физически, эмоционально, ментально?

**Еженедельный ритуал:**
- Воскресенье: подведение итогов недели, планирование следующей
- Время для хобби и творчества - питает душу
- Качественное время с близкими
- Забота о теле (спорт, здоровое питание, отдых)

**Ежемесячная практика:**
- Проверка целей и корректировка курса
- Освобождение от ненужного (вещей, привычек, отношений)
- Изучение чего-то нового
- Время наедине с собой для глубокой рефлексии

**Сферы жизни для баланса:**
1. **Здоровье**: тело - храм души, заботьтесь о нём
2. **Отношения**: качественные связи с людьми
3. **Работа**: смысл и самореализация
4. **Финансы**: материальная стабильность и свобода
5. **Духовность**: связь с высшим, поиск смысла
6. **Личностный рост**: постоянное развитие и обучение

**Избегайте:**
- Не игнорируйте ни одну сферу жизни - дисбаланс приводит к кризисам
- Не живите на автопилоте - осознанность ключевая
- Не сравнивайте себя с другими - у каждого свой путь"""
    }

    interpretation += category_advice.get(category, category_advice["general"]) + "\n\n"
    interpretation += "---\n\n"

    # Add powerful conclusion with summary
    interpretation += """## 🌙 Заключительное пророчество

Милая душа, карты открыли передо мной панораму Вашей судьбы. Но помните - **карты показывают возможности, а не неизбежности**. Вы обладаете величайшей силой - силой выбора.

### ✨ Ключевые послания этого расклада:

"""

    # Add summary points based on spread
    if len(cards) == 1:
        interpretation += f"1. Главная энергия сейчас - **{cards[0].name}** - это Ваш фокус и урок\n"
        interpretation += "2. Прислушивайтесь к интуиции - она ведёт Вас верным путём\n"
        interpretation += "3. Действуйте осознанно, но не бойтесь рисковать\n"
    elif len(cards) == 3:
        interpretation += f"1. **Прошлое** ({cards[0].name}) дало Вам ценные уроки - используйте их мудрость\n"
        interpretation += f"2. **Настоящее** ({cards[1].name}) - это точка силы, где принимаются ключевые решения\n"
        interpretation += f"3. **Будущее** ({cards[2].name}) показывает потенциал, который Вы можете реализовать\n"
    else:
        interpretation += f"1. Расклад из {len(cards)} карт показывает сложную, многогранную ситуацию\n"
        interpretation += "2. Каждый элемент важен - рассмотрите ситуацию целостно\n"
        interpretation += "3. Терпение и мудрость приведут к лучшему результату\n"

    interpretation += """
### 🎯 Ваш персональный план на ближайшее время:

**Сегодня:**
- Обдумайте полученное толкование
- Выберите ОДНО конкретное действие из рекомендаций и выполните его
- Запишите свои мысли и чувства о гадании

**Эта неделя:**
- Внедрите минимум 3 практических совета из толкования
- Наблюдайте за знаками и синхроничностями
- Будьте открыты новым возможностям

**Этот месяц:**
- Действуйте согласно временным рамкам, указанным в толковании
- Регулярно перечитывайте это предсказание - с каждым разом открываются новые слои
- Доверяйте процессу, даже если не всё ясно сразу

### 💫 Благословение

Дорогая моя, Вы стоите на пороге важного периода в жизни. Судьба - это река, которая течёт и изменяется, но **Вы - капитан своего корабля**.

Доверяйте своей интуиции - это голос Вашей души.
Будьте смелы в действиях, но мудры в решениях.
Любите себя и других искренне и глубоко.
И помните: даже в самую тёмную ночь звёзды продолжают светить над Вами, указывая путь.

*Карты никогда не лгут, дитя моё. Слушайте их мудрость, но творите свою судьбу сами.*

**Пусть Вселенная благословит Ваш путь!** ⭐✨🔮

---

*Если что-то из толкования особенно резонирует с Вами - это знак, что Вы на верном пути. Доверяйте этому чувству.*"""

    return interpretation

def select_random_cards(count: int) -> List[TarotCard]:
    """Select random cards from full 78-card tarot deck"""
    selected_cards = random.sample(FULL_TAROT_DECK, count)
    tarot_cards = []
    
    for card_data in selected_cards:
        # Ensure the card has an image field
        if 'image' not in card_data:
            from tarot_cards_data import get_aesthetic_image
            card_data = card_data.copy()  # Don't modify the original
            card_data['image'] = get_aesthetic_image(card_data['id'])
        
        card = TarotCard(**card_data)
        # 30% chance of being reversed
        card.is_reversed = random.random() < 0.3
        tarot_cards.append(card)
    
    return tarot_cards

# API Routes

# --------- Deck helper functions and models ---------
class CardInterpretationRequest(BaseModel):
    card_id: int
    reversed: Optional[bool] = False


def _ensure_card_image(card: dict) -> dict:
    if "image" not in card or not card.get("image"):
        from tarot_cards_data import get_aesthetic_image
        tmp = card.copy()
        tmp["image"] = get_aesthetic_image(tmp["id"])  # type: ignore
        return tmp
    return card


def _get_card_by_id(card_id: int) -> Optional[dict]:
    for c in FULL_TAROT_DECK:
        if int(c.get("id")) == int(card_id):
            return _ensure_card_image(c)
    return None


def _serialize_card_minimal(card: dict) -> dict:
    c = _ensure_card_image(card)
    return {
        "id": c["id"],
        "name": c["name"],
        "name_en": c.get("name_en", ""),
        "type": c.get("type", "minor"),
        "suit": c.get("suit"),
        "image": c.get("image"),
        "keywords": c.get("keywords", []),
    }


def _single_card_fallback_interpretation(card: dict, is_reversed: bool) -> str:
    name = card.get("name", "Карта")
    meaning = card.get("reversed_meaning") if is_reversed else card.get("upright_meaning")
    keywords = ", ".join(card.get("keywords", [])[:6])
    posture = "перевернутая" if is_reversed else "прямая"
    return (
        f"🔮 Карта {name} ({posture}).\n\n"
        f"Энергии этой карты проявляются так: {meaning}. \n\n"
        f"Ключевые указатели: {keywords if keywords else 'интуиция, символизм'}\n\n"
        "Совет мудрой гадалки: прислушайтесь к внутреннему голосу, уважайте знаки, которые посылает Вселенная, и действуйте мягко, но уверенно."
    )

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

async def generate_astro_personality_analysis(answers: List[AstroAnswer], name: Optional[str] = None) -> AstroPersonalityResult:
    """Generate deep astro-psychological personality analysis based on user answers"""

    # Collect all keywords and arcanas from answers
    all_keywords = []
    arcana_counts = {}

    for answer in answers:
        all_keywords.extend(answer.keywords)
        if answer.arcana:
            arcana_counts[answer.arcana] = arcana_counts.get(answer.arcana, 0) + 1

    # Find dominant arcanas (top 3)
    dominant_arcana = sorted(arcana_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    dominant_arcana_names = [arcana for arcana, _ in dominant_arcana]

    # Prepare analysis prompt
    keywords_text = ", ".join(set(all_keywords))
    arcanas_text = ", ".join(dominant_arcana_names)
    name_text = name if name else "друг мой"

    prompt = f"""Ты мудрая астропсихолог и духовный наставник. Создай глубокий персонализированный анализ личности в стиле шоу "Натальная карта".

ДАННЫЕ АНАЛИЗА:
- Имя: {name_text}
- Ключевые характеристики: {keywords_text}
- Доминирующие архетипы Таро: {arcanas_text}

ЗАДАЧА:
Создай уникальный астропсихологический портрет личности. Это НЕ предсказание, а глубокий разбор внутреннего мира человека.

СТРУКТУРА АНАЛИЗА:

1. ПРИВЕТСТВИЕ (30-50 слов):
   - Обратись к человеку тепло и лично
   - "Здравствуй, {name_text}! Вселенная уже давно хотела с тобой поговорить..."
   - Создай атмосферу откровения и доверия

2. ТВОЯ СУТЬ - Глубинная природа личности (150-200 слов):
   - Опиши внутреннюю природу на основе архетипов {arcanas_text}
   - Каков этот человек в глубине души?
   - Какая энергия его ведёт? (огонь/вода/воздух/земля)
   - Его уникальные дары и таланты
   - Используй метафоры природы, космоса, мифологии
   - Говори о "твоей душе", "твоей энергии", "твоём свете"

3. ТВОЙ ЖИЗНЕННЫЙ ПУТЬ - Тенденции и паттерны (150-200 слов):
   - Какие темы повторяются в жизни этого человека?
   - Какие уроки Вселенная ему преподносит?
   - К чему он стремится (осознанно и неосознанно)?
   - Что ему нужно принять в себе?
   - Какие страхи мешают раскрыться?
   - Используй символизм Таро и психологические инсайты

4. ЗДЕСЬ И СЕЙЧАС - Текущая фаза жизни (100-150 слов):
   - В какой фазе трансформации сейчас находится человек?
   - Что происходит с его энергией прямо сейчас?
   - Какие внутренние процессы идут?
   - Что ему важно осознать в данный момент?

5. ПОСЛАНИЕ ВСЕЛЕННОЙ - Совет и направление (150-200 слов):
   - Что нужно развивать, усиливать?
   - От чего стоит отпустить, освободиться?
   - Какие качества в себе культивировать?
   - Конкретные духовные практики или подходы
   - Как использовать свои сильные стороны?
   - Завершающее вдохновляющее послание

ТОН И СТИЛЬ:
- Дружелюбный, но мудрый - как разговор со старым другом-наставником
- Мистический, но не пугающий
- Используй "ты" и прямое обращение
- Смесь психологии, эзотерики и символизма Таро
- Эмоционально глубокий, проникновенный
- Мотивирующий и вдохновляющий
- Избегай банальностей и общих фраз
- Каждая фраза должна резонировать с душой

ВАЖНО:
- Это не гадание на будущее, а РАЗБОР ЛИЧНОСТИ
- Фокус на самопознании и внутреннем росте
- Человек должен почувствовать, что его ВИДЯТ и ПОНИМАЮТ
- Создай ощущение уникальности и персонализации
- Используй метафоры света, тени, энергии, космоса
- Говори о потенциале, а не ограничениях

ОБЪЁМ: 600-800 слов

Создай текст, который тронет душу и откроет новое понимание себя!"""

    try:
        if not OPENAI_QUOTA_EXCEEDED:
            response = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1200,
                temperature=0.85
            )
            personality_analysis = response.choices[0].message.content.strip()
        else:
            # Fallback analysis
            personality_analysis = generate_fallback_personality_analysis(keywords_text, arcanas_text, name_text)

    except Exception as e:
        global OPENAI_QUOTA_EXCEEDED
        if "insufficient_quota" in str(e) or "429" in str(e):
            OPENAI_QUOTA_EXCEEDED = True
            logging.warning("OpenAI quota exceeded - using fallback for personality analysis")
        else:
            logging.error(f"OpenAI API error: {e}")
        personality_analysis = generate_fallback_personality_analysis(keywords_text, arcanas_text, name_text)

    # Generate structured sections
    character_traits = list(set(all_keywords[:8]))  # Top 8 unique traits

    # Determine life path based on dominant arcana
    life_path = get_life_path_description(dominant_arcana_names[0] if dominant_arcana_names else "The Fool")

    # Determine current phase
    current_phase = get_current_phase_description(all_keywords)

    # Generate specific advice
    advice = get_personalized_advice(all_keywords, dominant_arcana_names)

    result = AstroPersonalityResult(
        personality_analysis=personality_analysis,
        dominant_arcana=dominant_arcana_names,
        character_traits=character_traits,
        life_path=life_path,
        current_phase=current_phase,
        advice=advice
    )

    return result

def generate_fallback_personality_analysis(keywords: str, arcanas: str, name: str) -> str:
    """Generate fallback personality analysis when AI is unavailable"""
    return f"""Здравствуй, {name}! Звёзды и карты указывают на уникальное сочетание энергий в твоей личности.

**Твоя суть:**
В тебе живёт сила архетипов {arcanas}, которые формируют твою глубинную природу. Твои ключевые качества - {keywords} - делают тебя особенным человеком с уникальной миссией. Ты несёшь в себе баланс разных энергий, и это твоя сила.

**Твой путь:**
Вселенная ведёт тебя по пути самопознания и трансформации. Каждый опыт, каждая встреча - это урок, который помогает тебе раскрыть свой потенциал. Твоя задача - принять все грани своей личности, и свет, и тень.

**Здесь и сейчас:**
Сейчас ты находишься в важной фазе внутренних перемен. Доверься процессу, прислушайся к своей интуиции. Энергия этого момента поддерживает твоё развитие.

**Послание:**
Помни - ты уникален и ценен именно таким, какой ты есть. Развивай свои таланты, не бойся быть собой, следуй зову своего сердца. Вселенная всегда на твоей стороне."""

def get_life_path_description(dominant_arcana: str) -> str:
    """Get life path description based on dominant Tarot arcana"""
    life_paths = {
        "The Fool": "Путь первооткрывателя и искателя приключений",
        "The Magician": "Путь творца и мастера своей реальности",
        "The High Priestess": "Путь интуиции и тайного знания",
        "The Empress": "Путь творения и изобилия",
        "The Emperor": "Путь лидера и строителя",
        "The Hierophant": "Путь мудрости и традиций",
        "The Lovers": "Путь любви и гармоничных отношений",
        "The Chariot": "Путь победителя и достижений",
        "Strength": "Путь внутренней силы и мужества",
        "The Hermit": "Путь мудреца и искателя истины",
        "The Hanged Man": "Путь трансформации через принятие",
        "Death": "Путь глубоких трансформаций",
        "Temperance": "Путь баланса и гармонии",
        "The Devil": "Путь освобождения от иллюзий",
        "The Tower": "Путь революционных перемен",
        "The Star": "Путь надежды и вдохновения",
        "The Moon": "Путь интуиции и подсознательного",
        "The Sun": "Путь радости и самовыражения",
        "Judgement": "Путь пробуждения и возрождения",
        "The World": "Путь целостности и завершения циклов",
        "Justice": "Путь справедливости и баланса",
        "Pentacles": "Путь материального благополучия",
    }
    return life_paths.get(dominant_arcana, "Путь уникального самопознания")

def get_current_phase_description(keywords: List[str]) -> str:
    """Determine current life phase based on keywords"""
    if any(k in keywords for k in ['anxious', 'worried', 'uncertain', 'confused']):
        return "Фаза внутреннего поиска и переосмысления"
    elif any(k in keywords for k in ['energetic', 'motivated', 'active', 'ambitious']):
        return "Фаза активного роста и движения вперёд"
    elif any(k in keywords for k in ['peaceful', 'balanced', 'calm', 'centered']):
        return "Фаза гармонии и внутреннего равновесия"
    elif any(k in keywords for k in ['transformative', 'evolving', 'growth']):
        return "Фаза глубокой трансформации и перерождения"
    else:
        return "Фаза открытий и новых возможностей"

def get_personalized_advice(keywords: List[str], arcanas: List[str]) -> str:
    """Generate personalized advice based on keywords and arcanas"""
    advice_parts = []

    # Advice based on energy type
    if any(k in keywords for k in ['passionate', 'energetic', 'active']):
        advice_parts.append("Направь свою огненную энергию на создание чего-то значимого")
    elif any(k in keywords for k in ['emotional', 'intuitive', 'deep']):
        advice_parts.append("Доверяй своей интуиции - она твой главный проводник")
    elif any(k in keywords for k in ['intellectual', 'analytical', 'logical']):
        advice_parts.append("Используй свой ум, но не забывай слушать сердце")
    elif any(k in keywords for k in ['practical', 'stable', 'grounded']):
        advice_parts.append("Твоя стабильность - фундамент для смелых экспериментов")

    # Advice based on arcana
    if "The Fool" in arcanas:
        advice_parts.append("Не бойся делать первый шаг в неизвестность")
    elif "The Hermit" in arcanas:
        advice_parts.append("Найди время для одиночества и размышлений")
    elif "The Lovers" in arcanas:
        advice_parts.append("Развивай глубокие, искренние отношения")
    elif "Strength" in arcanas:
        advice_parts.append("Твоя мягкая сила способна преодолеть любые препятствия")

    # General closing advice
    advice_parts.append("Будь собой - это твоя главная сверхспособность")

    return ". ".join(advice_parts) + "."

@api_router.post("/astro-personality", response_model=AstroPersonalityResult)
async def analyze_astro_personality(request: AstroPersonalityRequest):
    """Generate astro-psychological personality analysis based on questionnaire answers"""

    # Generate personality analysis
    result = await generate_astro_personality_analysis(request.answers, request.name)

    # Save to database
    await db.astro_personality_results.insert_one(result.dict())

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
    

# Deck endpoints
@api_router.get("/deck")
async def get_full_deck():
    """Return all 78 cards for catalog (lightweight)."""
    cards = [_serialize_card_minimal(c) for c in FULL_TAROT_DECK]
    return {"cards": cards}

@api_router.get("/card/{card_id}")
async def get_card(card_id: int):
    card = _get_card_by_id(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"card": card}

@api_router.post("/card-interpretation")
async def get_card_interpretation(req: CardInterpretationRequest):
    card = _get_card_by_id(req.card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    tarot_card = TarotCard(**{
        "id": card["id"],
        "name": card["name"],
        "name_en": card.get("name_en", ""),
        "type": card.get("type", "minor"),
        "suit": card.get("suit"),
        "image": card.get("image"),
        "keywords": card.get("keywords", []),
        "upright_meaning": card.get("upright_meaning", ""),
        "reversed_meaning": card.get("reversed_meaning", ""),
        "is_reversed": bool(req.reversed),
    })
    try:
        text = await generate_ai_interpretation(
            question=f"Толкование карты {card['name']}",
            category="general",
            spread_type="one_card",
            cards=[tarot_card],
            positions=["Значение карты"]
        )
        return {"interpretation": text}
    except Exception:
        return {"interpretation": _single_card_fallback_interpretation(card, bool(req.reversed))}

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


# Deck endpoints
@api_router.get("/deck")
async def get_full_deck():
    """Return all 78 cards for catalog (lightweight)."""
    cards = [_serialize_card_minimal(c if "image" in c else {**c, "image": __import__("tarot_cards_data").tarot_cards_data.get_aesthetic_image(c["id"])}) for c in FULL_TAROT_DECK]
    return {"cards": cards}

@api_router.get("/card/{card_id}")
async def get_card(card_id: int):
    card = _get_card_by_id(card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"card": card}

@api_router.post("/card-interpretation")
async def get_card_interpretation(req: CardInterpretationRequest):
    card = _get_card_by_id(req.card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    # Use enhanced fallback generator for a single card by reusing general function with 1 card
    tarot_card = TarotCard(**{
        "id": card["id"],
        "name": card["name"],
        "name_en": card.get("name_en", ""),
        "type": card.get("type", "minor"),
        "suit": card.get("suit"),
        "image": card.get("image"),
        "keywords": card.get("keywords", []),
        "upright_meaning": card.get("upright_meaning", ""),
        "reversed_meaning": card.get("reversed_meaning", ""),
        "is_reversed": bool(req.reversed),
    })
    try:
        # Try AI via existing generator with one-card spread
        text = await generate_ai_interpretation(
            question=f"Толкование карты {card['name']}",
            category="general",
            spread_type="one_card",
            cards=[tarot_card],
            positions=["Значение карты"]
        )
        return {"interpretation": text}
    except Exception:
        return {"interpretation": _single_card_fallback_interpretation(card, bool(req.reversed))}

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