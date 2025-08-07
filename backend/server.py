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
from tarot_cards_data import MAJOR_ARCANA, CARD_BACK_IMAGE

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
7. Давай советы как мудрая женщина: "Послушайте мудрую гадалку...", "Совет мой Вам..."
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
    
    interpretation += "🌟 **Совет мудрой гадалки:**\n"
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

@api_router.get("/card-back")
async def get_card_back():
    """Get card back image"""
    return {"card_back": CARD_BACK_IMAGE}

@api_router.get("/readings", response_model=List[TarotReading])
async def get_reading_history(limit: int = 10):
    """Get reading history"""
    readings = await db.tarot_readings.find().sort("created_at", -1).limit(limit).to_list(limit)
    return [TarotReading(**reading) for reading in readings]

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