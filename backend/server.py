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