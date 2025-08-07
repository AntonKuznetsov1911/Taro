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

# Tarot Cards Data
MAJOR_ARCANA = [
    {
        "id": 0,
        "name": "Дурак",
        "name_en": "The Fool",
        "type": "major",
        "image": "fool.jpg",
        "keywords": ["новые начинания", "невинность", "спонтанность", "свобода"],
        "upright_meaning": "Новые возможности, начало пути, невинность, спонтанность, свобода духа",
        "reversed_meaning": "Безрассудство, необдуманные поступки, наивность, отсутствие направления"
    },
    {
        "id": 1,
        "name": "Маг",
        "name_en": "The Magician",
        "type": "major",
        "image": "magician.jpg",
        "keywords": ["воля", "мастерство", "концентрация", "сила"],
        "upright_meaning": "Сила воли, мастерство, концентрация, способность к действию",
        "reversed_meaning": "Манипуляции, злоупотребление силой, недостаток концентрации"
    },
    {
        "id": 2,
        "name": "Верховная Жрица",
        "name_en": "The High Priestess",
        "type": "major",
        "image": "high_priestess.jpg",
        "keywords": ["интуиция", "тайны", "подсознание", "мудрость"],
        "upright_meaning": "Интуиция, внутренняя мудрость, тайные знания, мистические силы",
        "reversed_meaning": "Скрытность, недостаток внутреннего видения, поверхностность"
    },
    {
        "id": 3,
        "name": "Императрица",
        "name_en": "The Empress",
        "type": "major",
        "image": "empress.jpg",
        "keywords": ["плодородие", "материнство", "изобилие", "природа"],
        "upright_meaning": "Плодородие, материнство, изобилие, творческая энергия",
        "reversed_meaning": "Бесплодие, чрезмерная опека, творческий блок"
    },
    {
        "id": 4,
        "name": "Император",
        "name_en": "The Emperor",
        "type": "major",
        "image": "emperor.jpg",
        "keywords": ["власть", "стабильность", "контроль", "лидерство"],
        "upright_meaning": "Власть, авторитет, стабильность, контроль, лидерство",
        "reversed_meaning": "Тирания, потеря контроля, слабость, безответственность"
    },
    {
        "id": 5,
        "name": "Иерофант",
        "name_en": "The Hierophant",
        "type": "major",
        "image": "hierophant.jpg",
        "keywords": ["традиции", "духовность", "учение", "конформизм"],
        "upright_meaning": "Традиции, духовное учение, конформизм, поиск смысла",
        "reversed_meaning": "Нетрадиционность, бунт против норм, духовный кризис"
    },
    {
        "id": 6,
        "name": "Влюблённые",
        "name_en": "The Lovers",
        "type": "major",
        "image": "lovers.jpg",
        "keywords": ["любовь", "выбор", "гармония", "отношения"],
        "upright_meaning": "Любовь, гармоничные отношения, важный выбор, единство",
        "reversed_meaning": "Дисгармония в отношениях, неправильный выбор, разлука"
    },
    {
        "id": 7,
        "name": "Колесница",
        "name_en": "The Chariot",
        "type": "major",
        "image": "chariot.jpg",
        "keywords": ["победа", "контроль", "решительность", "движение"],
        "upright_meaning": "Победа, триумф, самоконтроль, решительность",
        "reversed_meaning": "Поражение, потеря контроля, отсутствие направления"
    },
    {
        "id": 8,
        "name": "Сила",
        "name_en": "Strength",
        "type": "major",
        "image": "strength.jpg",
        "keywords": ["сила", "мужество", "терпение", "сострадание"],
        "upright_meaning": "Внутренняя сила, мужество, терпение, сострадание",
        "reversed_meaning": "Слабость, трусость, недостаток самообладания"
    },
    {
        "id": 9,
        "name": "Отшельник",
        "name_en": "The Hermit",
        "type": "major",
        "image": "hermit.jpg",
        "keywords": ["поиск", "одиночество", "мудрость", "самопознание"],
        "upright_meaning": "Поиск истины, самопознание, внутренняя мудрость, одиночество",
        "reversed_meaning": "Изоляция, отказ от помощи, потеря направления"
    },
    {
        "id": 10,
        "name": "Колесо Фортуны",
        "name_en": "Wheel of Fortune",
        "type": "major",
        "image": "wheel_fortune.jpg",
        "keywords": ["удача", "цикличность", "судьба", "перемены"],
        "upright_meaning": "Удача, положительные перемены, цикличность жизни",
        "reversed_meaning": "Неудача, негативные перемены, сопротивление переменам"
    },
    {
        "id": 11,
        "name": "Справедливость",
        "name_en": "Justice",
        "type": "major",
        "image": "justice.jpg",
        "keywords": ["справедливость", "баланс", "истина", "ответственность"],
        "upright_meaning": "Справедливость, баланс, истина, ответственность за поступки",
        "reversed_meaning": "Несправедливость, предвзятость, отсутствие ответственности"
    },
    {
        "id": 12,
        "name": "Повешенный",
        "name_en": "The Hanged Man",
        "type": "major",
        "image": "hanged_man.jpg",
        "keywords": ["жертва", "ожидание", "новый взгляд", "смирение"],
        "upright_meaning": "Жертвоприношение, ожидание, новый взгляд на ситуацию",
        "reversed_meaning": "Ненужная жертва, сопротивление, отсутствие прогресса"
    },
    {
        "id": 13,
        "name": "Смерть",
        "name_en": "Death",
        "type": "major",
        "image": "death.jpg",
        "keywords": ["трансформация", "завершение", "возрождение", "перемены"],
        "upright_meaning": "Трансформация, конец одного этапа и начало нового, возрождение",
        "reversed_meaning": "Сопротивление переменам, застой, страх перед новым"
    },
    {
        "id": 14,
        "name": "Умеренность",
        "name_en": "Temperance",
        "type": "major",
        "image": "temperance.jpg",
        "keywords": ["баланс", "гармония", "умеренность", "терпение"],
        "upright_meaning": "Умеренность, баланс, гармония, терпение, исцеление",
        "reversed_meaning": "Дисбаланс, излишества, нетерпение, конфликт"
    },
    {
        "id": 15,
        "name": "Дьявол",
        "name_en": "The Devil",
        "type": "major",
        "image": "devil.jpg",
        "keywords": ["искушение", "зависимость", "материализм", "иллюзии"],
        "upright_meaning": "Искушение, зависимость, материализм, иллюзии, страсть",
        "reversed_meaning": "Освобождение от зависимости, преодоление искушений"
    },
    {
        "id": 16,
        "name": "Башня",
        "name_en": "The Tower",
        "type": "major",
        "image": "tower.jpg",
        "keywords": ["разрушение", "откровение", "освобождение", "перемены"],
        "upright_meaning": "Внезапные перемены, разрушение иллюзий, освобождение",
        "reversed_meaning": "Сопротивление переменам, избежание разрушения"
    },
    {
        "id": 17,
        "name": "Звезда",
        "name_en": "The Star",
        "type": "major",
        "image": "star.jpg",
        "keywords": ["надежда", "вдохновение", "духовность", "исцеление"],
        "upright_meaning": "Надежда, вдохновение, духовное руководство, исцеление",
        "reversed_meaning": "Отчаяние, потеря веры, духовная дисгармония"
    },
    {
        "id": 18,
        "name": "Луна",
        "name_en": "The Moon",
        "type": "major",
        "image": "moon.jpg",
        "keywords": ["иллюзии", "страхи", "подсознание", "интуиция"],
        "upright_meaning": "Иллюзии, страхи, подсознательные влияния, интуиция",
        "reversed_meaning": "Рассеивание иллюзий, преодоление страхов, ясность"
    },
    {
        "id": 19,
        "name": "Солнце",
        "name_en": "The Sun",
        "type": "major",
        "image": "sun.jpg",
        "keywords": ["радость", "успех", "энергия", "позитив"],
        "upright_meaning": "Радость, успех, энергия, позитивность, достижение целей",
        "reversed_meaning": "Временные неудачи, недостаток энергии, пессимизм"
    },
    {
        "id": 20,
        "name": "Суд",
        "name_en": "Judgement",
        "type": "major",
        "image": "judgement.jpg",
        "keywords": ["возрождение", "прощение", "второй шанс", "пробуждение"],
        "upright_meaning": "Возрождение, прощение, второй шанс, духовное пробуждение",
        "reversed_meaning": "Самокритика, отсутствие прощения, упущенные возможности"
    },
    {
        "id": 21,
        "name": "Мир",
        "name_en": "The World",
        "type": "major",
        "image": "world.jpg",
        "keywords": ["завершение", "достижение", "гармония", "успех"],
        "upright_meaning": "Завершение, достижение цели, гармония, успех, выполнение",
        "reversed_meaning": "Незавершенность, недостижение целей, задержки"
    }
]

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

# Helper functions
def url_to_base64(url: str) -> str:
    """Convert image URL to base64"""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            # Encode to base64
            base64_data = base64.b64encode(response.content).decode('utf-8')
            # Detect content type
            content_type = response.headers.get('content-type', 'image/jpeg')
            return f"data:{content_type};base64,{base64_data}"
        return ""
    except Exception as e:
        logging.error(f"Error converting URL to base64: {e}")
        return ""

# Tarot card back image
CARD_BACK_IMAGE = url_to_base64("https://images.unsplash.com/photo-1664252092739-8b4dadb0b7d1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwxfHxteXN0aWNhbCUyMHBhdHRlcm5zfGVufDB8fHx8MTc1NDU0NjA1M3ww&ixlib=rb-4.1.0&q=85")

async def generate_ai_interpretation(question: str, category: str, spread_type: str, cards: List[TarotCard], positions: List[str]) -> str:
    """Generate AI interpretation using OpenAI"""
    
    # Prepare cards info for AI
    cards_info = []
    for i, card in enumerate(cards):
        meaning = card.reversed_meaning if card.is_reversed else card.upright_meaning
        position = positions[i] if i < len(positions) else f"Карта {i+1}"
        cards_info.append(f"Позиция '{position}': {card.name} {'(перевернутая)' if card.is_reversed else ''} - {meaning}")
    
    cards_text = "\n".join(cards_info)
    
    # Prepare prompt based on category
    category_prompts = {
        "love": "сфокусируйся на любовных отношениях, эмоциях и романтических аспектах",
        "career": "сфокусируйся на карьере, профессиональном росте и рабочих отношениях",
        "finance": "сфокусируйся на финансовых вопросах, денежных потоках и материальном благополучии",
        "general": "дай общую интерпретацию, затрагивающую все аспекты жизни"
    }
    
    prompt = f"""Ты мудрая цыганская гадалка Мария с 30-летним опытом. Говори как настоящая гадалка - мистично, загадочно, но с теплотой. Обращайся к человеку на "Вы", используй характерные выражения гадалок.

Вопрос: "{question}"
Категория: {category}
Расклад: {SPREADS[spread_type]['name']}

Карты говорят:
{cards_text}

Говори как гадалка:
1. Начинай с "Вижу... Карты говорят..." или "Духи показывают мне..."
2. {category_prompts.get(category, 'дай общую интерпретацию')}
3. Используй фразы: "Вижу в картах", "Судьба говорит", "Энергия показывает", "Карты не врут"
4. Обращайся лично: "Дорогая моя", "Милая", "Дитя мое", "Вы", "Вам"
5. Упоминай мистические элементы: "энергии", "вибрации", "космические силы", "духи предков"
6. Каждую карту объясняй как гадалка: "Вот эта карта в позиции... она шепчет мне о..."
7. Давай советы как мудрая женщина: "Послушайте старую гадалку...", "Совет мой Вам..."
8. Используй эмоциональные обращения и междометия: "Ах!", "Вижу-вижу!", "Да что же это!"
9. Говори образно и метафорично
10. Ответ 400-600 слов

Стиль настоящей цыганской гадалки с душой и мистикой!"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"OpenAI API error: {e}")
        return generate_fallback_interpretation(cards, positions)

def generate_fallback_interpretation(cards: List[TarotCard], positions: List[str]) -> str:
    """Generate fallback interpretation in fortune teller style"""
    interpretation = "🔮 **Вижу... Карты говорят мне о Вашей судьбе!**\n\n"
    interpretation += "Дорогая моя, духи предков шепчут мне через древние карты. Вот что показывают мне силы Вселенной:\n\n"
    
    mystical_phrases = [
        "Энергия этой карты говорит мне",
        "Духи показывают через эту карту",
        "Вижу в магическом свечении карты",
        "Космические силы раскрывают",
        "Древняя мудрость карты шепчет"
    ]
    
    for i, card in enumerate(cards):
        position = positions[i] if i < len(positions) else f"Карта {i+1}"
        meaning = card.reversed_meaning if card.is_reversed else card.upright_meaning
        mystical_intro = mystical_phrases[i % len(mystical_phrases)]
        
        interpretation += f"✨ **{position}** - *{card.name}*"
        if card.is_reversed:
            interpretation += " *(перевернутая - энергия обращена вспять)*"
        interpretation += f"\n\n{mystical_intro}, что {meaning.lower()}\n\n"
    
    interpretation += "🌟 **Совет старой гадалки:**\n"
    interpretation += "Милая моя, карты не лгут - они лишь отражают энергии, что окружают Вас. "
    interpretation += "Прислушайтесь к своему сердцу, доверьтесь интуиции. Судьба в Ваших руках, "
    interpretation += "а карты лишь освещают путь во тьме неизвестности.\n\n"
    interpretation += "*Пусть звезды направляют Вас, дитя мое!* ⭐"
    
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

@api_router.get("/readings", response_model=List[TarotReading])
async def get_reading_history(limit: int = 10):
    """Get reading history"""
    readings = await db.tarot_readings.find().sort("created_at", -1).limit(limit).to_list(limit)
    return [TarotReading(**reading) for reading in readings]

@api_router.get("/")
async def root():
    return {"message": "TatoAi API - Таро гадание с ИИ"}

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