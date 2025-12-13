import os
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
from dotenv import load_dotenv
from pathlib import Path
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from openai import OpenAI
import random
from datetime import datetime

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# OpenAI
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'tatoai_database')]

# Import tarot data
from tarot_cards_data import FULL_TAROT_DECK

# Categories
CATEGORIES = {
    "love": {"name": "❤️ Любовь", "icon": "❤️"},
    "career": {"name": "💼 Карьера", "icon": "💼"},
    "finance": {"name": "💰 Финансы", "icon": "💰"},
    "general": {"name": "🔮 Общие вопросы", "icon": "🔮"}
}

# Spreads
SPREADS = {
    "one_card": {
        "name": "Расклад на одну карту",
        "positions": ["Ответ на ваш вопрос"],
        "cards_count": 1
    },
    "three_cards": {
        "name": "Расклад на три карты",
        "positions": ["Прошлое", "Настоящее", "Будущее"],
        "cards_count": 3
    },
    "celtic_cross": {
        "name": "Кельтский крест",
        "positions": [
            "Основа ситуации", "Препятствие или помощь", "Далекое прошлое",
            "Возможное будущее", "Ваши мысли и чувства", "Ближайшее будущее",
            "Ваш подход к ситуации", "Внешние влияния", "Ваши надежды и страхи",
            "Итоговый результат"
        ],
        "cards_count": 10
    }
}

# User state
user_sessions = {}


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Start command"""
    user_id = update.effective_user.id
    user_sessions[user_id] = {}

    keyboard = [
        [InlineKeyboardButton("🔮 Расклад Таро", callback_data="action_tarot")],
        [InlineKeyboardButton("🤝 Совместимость", callback_data="action_compatibility")],
        [InlineKeyboardButton("📖 О боте", callback_data="action_about")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "🔮 *Добро пожаловать в Мистический Таро!*\n\n"
        "Я помогу вам узнать будущее с помощью карт Таро.\n\n"
        "Выберите действие:",
        parse_mode='Markdown',
        reply_markup=reply_markup
    )


async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks"""
    query = update.callback_query
    await query.answer()

    user_id = update.effective_user.id
    data = query.data

    if data == "action_tarot":
        await show_categories(query, user_id)
    elif data == "action_compatibility":
        await query.edit_message_text(
            "🤝 *Совместимость по именам*\n\n"
            "Отправьте два имени через запятую, например:\n"
            "`Анна, Иван`",
            parse_mode='Markdown'
        )
        user_sessions[user_id] = {"mode": "compatibility"}
    elif data == "action_about":
        await query.edit_message_text(
            "📖 *О боте*\n\n"
            "Мистический Таро - это AI-помощник для гаданий.\n\n"
            "🔮 Гадания на картах Таро (78 карт)\n"
            "🤝 Анализ совместимости\n"
            "🧠 AI-интерпретация от OpenAI\n\n"
            "Создано с помощью Claude Code",
            parse_mode='Markdown'
        )
    elif data.startswith("cat_"):
        category = data.replace("cat_", "")
        await show_spreads(query, user_id, category)
    elif data.startswith("spread_"):
        spread = data.replace("spread_", "")
        user_id_str = str(user_id)
        if user_id not in user_sessions:
            user_sessions[user_id] = {}
        user_sessions[user_id]["spread"] = spread
        await query.edit_message_text(
            f"🔮 *{SPREADS[spread]['name']}*\n\n"
            f"Карт в раскладе: {SPREADS[spread]['cards_count']}\n\n"
            "Теперь напишите ваш вопрос:",
            parse_mode='Markdown'
        )
    elif data == "back_to_start":
        keyboard = [
            [InlineKeyboardButton("🔮 Расклад Таро", callback_data="action_tarot")],
            [InlineKeyboardButton("🤝 Совместимость", callback_data="action_compatibility")],
            [InlineKeyboardButton("📖 О боте", callback_data="action_about")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(
            "🔮 *Главное меню*\n\nВыберите действие:",
            parse_mode='Markdown',
            reply_markup=reply_markup
        )


async def show_categories(query, user_id):
    """Show tarot categories"""
    keyboard = []
    for cat_id, cat_data in CATEGORIES.items():
        keyboard.append([InlineKeyboardButton(
            cat_data['name'],
            callback_data=f"cat_{cat_id}"
        )])
    keyboard.append([InlineKeyboardButton("← Назад", callback_data="back_to_start")])

    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text(
        "🔮 *Выберите категорию вопроса:*",
        parse_mode='Markdown',
        reply_markup=reply_markup
    )


async def show_spreads(query, user_id, category):
    """Show spread types"""
    user_sessions[user_id] = {"category": category}

    keyboard = []
    for spread_id, spread_data in SPREADS.items():
        keyboard.append([InlineKeyboardButton(
            f"{spread_data['name']} ({spread_data['cards_count']} карт)",
            callback_data=f"spread_{spread_id}"
        )])
    keyboard.append([InlineKeyboardButton("← Назад", callback_data="action_tarot")])

    reply_markup = InlineKeyboardMarkup(keyboard)
    category_name = CATEGORIES[category]['name']
    await query.edit_message_text(
        f"🔮 *Категория: {category_name}*\n\n"
        "Выберите тип расклада:",
        parse_mode='Markdown',
        reply_markup=reply_markup
    )


async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle text messages"""
    user_id = update.effective_user.id
    text = update.message.text

    if user_id not in user_sessions:
        await update.message.reply_text(
            "Нажмите /start для начала работы"
        )
        return

    session = user_sessions[user_id]

    # Compatibility mode
    if session.get("mode") == "compatibility":
        names = [n.strip() for n in text.split(",")]
        if len(names) != 2:
            await update.message.reply_text(
                "Пожалуйста, отправьте два имени через запятую, например:\n"
                "`Анна, Иван`",
                parse_mode='Markdown'
            )
            return

        await update.message.reply_text("🔮 Анализирую совместимость...")
        reading = await generate_compatibility(names[0], names[1])
        await update.message.reply_text(reading, parse_mode='Markdown')
        user_sessions[user_id] = {}
        return

    # Tarot reading mode
    if "spread" in session:
        spread_type = session["spread"]
        category = session.get("category", "general")
        question = text

        await update.message.reply_text("🔮 Тасую карты и делаю расклад...")

        reading = await generate_tarot_reading(category, question, spread_type)

        # Send reading
        await update.message.reply_text(reading, parse_mode='Markdown')

        user_sessions[user_id] = {}


async def generate_tarot_reading(category: str, question: str, spread_type: str):
    """Generate tarot reading"""
    spread = SPREADS[spread_type]
    cards_count = spread['cards_count']

    # Select random cards
    selected_cards = random.sample(FULL_TAROT_DECK, cards_count)

    # Randomize reversed
    for card in selected_cards:
        card['is_reversed'] = random.choice([True, False])

    # Build cards description
    cards_desc = []
    for i, card in enumerate(selected_cards):
        position = spread['positions'][i]
        orientation = "Перевернутая" if card['is_reversed'] else "Прямая"
        meaning = card['reversed_meaning'] if card['is_reversed'] else card['upright_meaning']

        cards_desc.append(
            f"*{position}*: {card['name']} ({orientation})\n"
            f"_{meaning}_"
        )

    cards_text = "\n\n".join(cards_desc)

    # Generate AI interpretation
    prompt = f"""Ты - опытный таролог. Проанализируй расклад Таро.

Категория: {CATEGORIES[category]['name']}
Вопрос: {question}
Расклад: {spread['name']}

Карты:
{chr(10).join([f"{spread['positions'][i]}: {card['name']} ({'Перевернутая' if card['is_reversed'] else 'Прямая'})" for i, card in enumerate(selected_cards)])}

Дай подробное толкование расклада, учитывая вопрос и позиции карт. Используй мистический стиль."""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Ты опытный таролог с глубокими знаниями карт Таро."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.8
        )
        interpretation = response.choices[0].message.content
    except Exception as e:
        logger.error(f"OpenAI error: {e}")
        interpretation = "Не удалось получить AI-толкование. Карты говорят сами за себя."

    # Save to DB
    try:
        await db.readings.insert_one({
            "user_id": "telegram_user",
            "category": category,
            "question": question,
            "spread_type": spread_type,
            "cards": [{"name": c['name'], "is_reversed": c['is_reversed']} for c in selected_cards],
            "interpretation": interpretation,
            "created_at": datetime.utcnow()
        })
    except Exception as e:
        logger.error(f"DB error: {e}")

    result = f"🔮 *{spread['name']}*\n\n"
    result += f"*Вопрос:* {question}\n\n"
    result += f"*Карты:*\n{cards_text}\n\n"
    result += f"*Толкование:*\n{interpretation}"

    return result


async def generate_compatibility(name1: str, name2: str):
    """Generate compatibility reading"""
    # Draw 3 cards for compatibility
    cards = random.sample(FULL_TAROT_DECK, 3)

    for card in cards:
        card['is_reversed'] = random.choice([True, False])

    prompt = f"""Ты - опытный таролог. Проанализируй совместимость между {name1} и {name2}.

Карты совместимости:
1. {cards[0]['name']} ({'Перевернутая' if cards[0]['is_reversed'] else 'Прямая'})
2. {cards[1]['name']} ({'Перевернутая' if cards[1]['is_reversed'] else 'Прямая'})
3. {cards[2]['name']} ({'Перевернутая' if cards[2]['is_reversed'] else 'Прямая'})

Дай анализ совместимости в мистическом стиле."""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Ты опытный таролог."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.8
        )
        interpretation = response.choices[0].message.content
    except Exception as e:
        logger.error(f"OpenAI error: {e}")
        interpretation = "Не удалось получить толкование."

    result = f"🤝 *Совместимость: {name1} и {name2}*\n\n"
    result += f"*Карты:*\n"
    result += f"1. {cards[0]['name']}\n"
    result += f"2. {cards[1]['name']}\n"
    result += f"3. {cards[2]['name']}\n\n"
    result += f"*Анализ:*\n{interpretation}"

    return result


def main():
    """Start the bot"""
    token = os.getenv("TELEGRAM_BOT_TOKEN")

    if not token:
        logger.error("TELEGRAM_BOT_TOKEN not found in environment")
        return

    # Create application
    application = Application.builder().token(token).build()

    # Add handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CallbackQueryHandler(button_handler))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, message_handler))

    # Start
    logger.info("Starting Taro Telegram Bot...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    import asyncio
    import sys

    # Fix for Python 3.10+ on Windows
    if sys.version_info >= (3, 10) and sys.platform.startswith('win'):
        try:
            # Try to get event loop, if none create one
            loop = asyncio.get_event_loop()
        except RuntimeError:
            # Create and set a new event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

    main()
