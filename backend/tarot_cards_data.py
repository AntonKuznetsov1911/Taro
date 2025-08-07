# Tarot Cards Data with aesthetic images from curated collection
import base64
import requests
import logging
from PIL import Image
import io

def url_to_base64(url: str, max_size_kb: int = 100) -> str:
    """Convert image URL to compressed base64"""
    try:
        response = requests.get(url, timeout=15)
        if response.status_code == 200:
            # Check original size - skip if too large to process safely
            if len(response.content) > 50 * 1024 * 1024:  # Skip if larger than 50MB
                logging.warning(f"Image too large to process safely: {len(response.content)} bytes")
                return ""
                
            # Load image with PIL for compression
            original_image = Image.open(io.BytesIO(response.content))
            
            # Limit max image size for security
            Image.MAX_IMAGE_PIXELS = 200000000  # Increase limit but keep it reasonable
            
            # Convert to RGB if necessary
            if original_image.mode in ('RGBA', 'P'):
                original_image = original_image.convert('RGB')
            
            # Resize to reasonable dimensions while maintaining aspect ratio
            max_dimension = 400  # Max width or height
            original_image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
            
            # Compress to target size
            quality = 85
            while quality > 20:
                buffer = io.BytesIO()
                original_image.save(buffer, format='JPEG', quality=quality, optimize=True)
                compressed_data = buffer.getvalue()
                
                # Check if size is acceptable (target: under max_size_kb KB)
                if len(compressed_data) <= max_size_kb * 1024:
                    break
                    
                quality -= 10
            
            # Encode to base64
            base64_data = base64.b64encode(compressed_data).decode('utf-8')
            logging.info(f"Image compressed: {len(response.content)} bytes -> {len(compressed_data)} bytes (quality: {quality})")
            
            return f"data:image/jpeg;base64,{base64_data}"
        return ""
    except Exception as e:
        logging.error(f"Error converting URL to base64: {e}")
        return ""

# Beautiful tarot card images from curated collection
BEAUTIFUL_TAROT_IMAGES = [
    "https://images.unsplash.com/photo-1600430073932-e915854d9d4d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NDU1ODg0NXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1600429991827-5224817554f8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NDU1ODg0NXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1623230951203-1f8fa5298426?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NDU1ODg0NXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1637757935037-a7837f36807d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHw0fHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NDU1ODg0NXww&ixlib=rb-4.1.0&q=85",
    "https://images.pexels.com/photos/3088369/pexels-photo-3088369.jpeg",
    "https://images.pexels.com/photos/3363695/pexels-photo-3363695.jpeg",
    "https://images.unsplash.com/photo-1607773709367-06b7a91f7e4a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxteXN0aWNhbCUyMHRhcm90fGVufDB8fHx8MTc1NDU1ODg1MHww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1615829332206-22479388eecc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwyfHxteXN0aWNhbCUyMHRhcm90fGVufDB8fHx8MTc1NDU1ODg1MHww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1671013033034-5ea58e9c5008?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwzfHxteXN0aWNhbCUyMHRhcm90fGVufDB8fHx8MTc1NDU1ODg1MHww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1671013033219-c5f37fc92a71?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHw0fHxteXN0aWNhbCUyMHRhcm90fGVufDB8fHx8MTc1NDU1ODg1MHww&ixlib=rb-4.1.0&q=85",
    "https://images.pexels.com/photos/33331331/pexels-photo-33331331.jpeg",
    "https://images.pexels.com/photos/6806443/pexels-photo-6806443.jpeg",
]

# Optimized SVG images for all tarot cards
def create_card_svg(card_name: str, card_id: int, is_major: bool = True) -> str:
    """Create beautiful SVG card image"""
    # Color schemes for different card types
    colors = [
        ["#8E44AD", "#6C3483"],  # Purple
        ["#9B59B6", "#8E44AD"],  # Light Purple 
        ["#3498DB", "#2980B9"],  # Blue
        ["#E74C3C", "#C0392B"],  # Red
        ["#F39C12", "#E67E22"],  # Orange
        ["#27AE60", "#229954"],  # Green
        ["#34495E", "#2C3E50"],  # Dark
    ]
    
    color_scheme = colors[card_id % len(colors)]
    
    svg_content = f'''
    <svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad{card_id}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:{color_scheme[0]};stop-opacity:1" />
                <stop offset="100%" style="stop-color:{color_scheme[1]};stop-opacity:1" />
            </linearGradient>
            <pattern id="pattern{card_id}" patternUnits="userSpaceOnUse" width="20" height="20">
                <circle cx="10" cy="10" r="2" fill="rgba(255,255,255,0.1)"/>
            </pattern>
        </defs>
        
        <!-- Card background -->
        <rect width="200" height="300" fill="url(#grad{card_id})" rx="15"/>
        <rect width="200" height="300" fill="url(#pattern{card_id})" rx="15"/>
        
        <!-- Decorative border -->
        <rect x="10" y="10" width="180" height="280" fill="none" 
              stroke="rgba(255,255,255,0.3)" stroke-width="2" rx="10"/>
              
        <!-- Card name -->
        <text x="100" y="50" font-family="serif" font-size="16" font-weight="bold" 
              fill="white" text-anchor="middle">{card_name}</text>
              
        <!-- Card type -->
        <text x="100" y="70" font-family="serif" font-size="10" 
              fill="rgba(255,255,255,0.8)" text-anchor="middle">
              {"Старший Аркан" if is_major else "Младший Аркан"}
        </text>
        
        <!-- Central symbol -->
        <circle cx="100" cy="150" r="40" fill="none" 
                stroke="rgba(255,255,255,0.6)" stroke-width="2"/>
        <circle cx="100" cy="150" r="25" fill="rgba(255,255,255,0.1)"/>
        
        <!-- Mystical symbols -->
        <text x="100" y="160" font-family="serif" font-size="24" 
              fill="white" text-anchor="middle">✨</text>
              
        <!-- Bottom decoration -->
        <text x="100" y="270" font-family="serif" font-size="12" 
              fill="rgba(255,255,255,0.7)" text-anchor="middle">TARO</text>
    </svg>
    '''
    
    # Convert SVG to base64
    svg_bytes = svg_content.encode('utf-8')
    svg_base64 = base64.b64encode(svg_bytes).decode('utf-8')
    return f"data:image/svg+xml;base64,{svg_base64}"

# Optimized card back image
CARD_BACK_SVG = '''
<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="backGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#2C3E50;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#34495E;stop-opacity:1" />
        </linearGradient>
        <pattern id="stars" patternUnits="userSpaceOnUse" width="40" height="40">
            <circle cx="20" cy="20" r="1" fill="gold" opacity="0.6"/>
            <circle cx="10" cy="10" r="0.5" fill="gold" opacity="0.4"/>
            <circle cx="30" cy="10" r="0.5" fill="gold" opacity="0.4"/>
        </pattern>
    </defs>
    
    <!-- Background -->
    <rect width="200" height="300" fill="url(#backGrad)" rx="15"/>
    <rect width="200" height="300" fill="url(#stars)" rx="15"/>
    
    <!-- Decorative border -->
    <rect x="8" y="8" width="184" height="284" fill="none" 
          stroke="gold" stroke-width="1" rx="12" opacity="0.6"/>
    <rect x="15" y="15" width="170" height="270" fill="none" 
          stroke="gold" stroke-width="1" rx="8" opacity="0.3"/>
    
    <!-- Central mystical symbol -->
    <circle cx="100" cy="150" r="50" fill="none" stroke="gold" stroke-width="2" opacity="0.8"/>
    <circle cx="100" cy="150" r="35" fill="none" stroke="gold" stroke-width="1" opacity="0.6"/>
    <circle cx="100" cy="150" r="20" fill="none" stroke="gold" stroke-width="1" opacity="0.4"/>
    
    <!-- Moon symbol -->
    <text x="100" y="160" font-family="serif" font-size="32" fill="gold" text-anchor="middle">🌙</text>
    
    <!-- Corner decorations -->
    <text x="25" y="35" font-family="serif" font-size="16" fill="gold" opacity="0.7">✨</text>
    <text x="175" y="35" font-family="serif" font-size="16" fill="gold" opacity="0.7">✨</text>
    <text x="25" y="275" font-family="serif" font-size="16" fill="gold" opacity="0.7">✨</text>
    <text x="175" y="275" font-family="serif" font-size="16" fill="gold" opacity="0.7">✨</text>
    
    <!-- TARO text -->
    <text x="100" y="280" font-family="serif" font-size="14" font-weight="bold"
          fill="gold" text-anchor="middle" opacity="0.8">TARO</text>
</svg>
'''

CARD_BACK_IMAGE = f"data:image/svg+xml;base64,{base64.b64encode(CARD_BACK_SVG.encode('utf-8')).decode('utf-8')}"

def get_aesthetic_image(card_id: int) -> str:
    """Get aesthetic image for card - using optimized SVG for stability"""
    # Always use SVG to ensure documents stay under MongoDB 16MB limit
    return create_card_svg(f"Card {card_id}", card_id)

# All 22 Major Arcana cards with aesthetic images where possible
MAJOR_ARCANA = [
    {
        "id": 0,
        "name": "Дурак",
        "name_en": "The Fool",
        "type": "major",
        "image": get_aesthetic_image(0),
        "keywords": ["новые начинания", "невинность", "спонтанность", "свобода"],
        "upright_meaning": "Новые возможности, начало пути, невинность, спонтанность, свобода духа",
        "reversed_meaning": "Безрассудство, необдуманные поступки, наивность, отсутствие направления"
    },
    {
        "id": 1,
        "name": "Маг",
        "name_en": "The Magician",
        "type": "major",
        "image": get_aesthetic_image(1),
        "keywords": ["воля", "мастерство", "концентрация", "сила"],
        "upright_meaning": "Сила воли, мастерство, концентрация, способность к действию",
        "reversed_meaning": "Манипуляции, злоупотребление силой, недостаток концентрации"
    },
    {
        "id": 2,
        "name": "Верховная Жрица",
        "name_en": "The High Priestess",
        "type": "major",
        "image": get_aesthetic_image(2),
        "keywords": ["интуиция", "тайны", "подсознание", "мудрость"],
        "upright_meaning": "Интуиция, внутренняя мудрость, тайные знания, мистические силы",
        "reversed_meaning": "Скрытность, недостаток внутреннего видения, поверхностность"
    },
    {
        "id": 3,
        "name": "Императрица",
        "name_en": "The Empress",
        "type": "major",
        "image": get_aesthetic_image(3),
        "keywords": ["плодородие", "материнство", "изобилие", "природа"],
        "upright_meaning": "Плодородие, материнство, изобилие, творческая энергия",
        "reversed_meaning": "Бесплодие, чрезмерная опека, творческий блок"
    },
    {
        "id": 4,
        "name": "Император",
        "name_en": "The Emperor",
        "type": "major",
        "image": get_aesthetic_image(4),
        "keywords": ["власть", "стабильность", "контроль", "лидерство"],
        "upright_meaning": "Власть, авторитет, стабильность, контроль, лидерство",
        "reversed_meaning": "Тирания, потеря контроля, слабость, безответственность"
    },
    {
        "id": 5,
        "name": "Иерофант",
        "name_en": "The Hierophant",
        "type": "major",
        "image": get_aesthetic_image(5),
        "keywords": ["традиции", "духовность", "учение", "конформизм"],
        "upright_meaning": "Традиции, духовное учение, конформизм, поиск смысла",
        "reversed_meaning": "Нетрадиционность, бунт против норм, духовный кризис"
    },
    {
        "id": 6,
        "name": "Влюблённые",
        "name_en": "The Lovers",
        "type": "major",
        "image": get_aesthetic_image(6),
        "keywords": ["любовь", "выбор", "гармония", "отношения"],
        "upright_meaning": "Любовь, гармоничные отношения, важный выбор, единство",
        "reversed_meaning": "Дисгармония в отношениях, неправильный выбор, разлука"
    },
    {
        "id": 7,
        "name": "Колесница",
        "name_en": "The Chariot",
        "type": "major",
        "image": get_aesthetic_image(7),
        "keywords": ["победа", "контроль", "решительность", "движение"],
        "upright_meaning": "Победа, триумф, самоконтроль, решительность",
        "reversed_meaning": "Поражение, потеря контроля, отсутствие направления"
    },
    {
        "id": 8,
        "name": "Сила",
        "name_en": "Strength",
        "type": "major",
        "image": get_aesthetic_image(8),
        "keywords": ["сила", "мужество", "терпение", "сострадание"],
        "upright_meaning": "Внутренняя сила, мужество, терпение, сострадание",
        "reversed_meaning": "Слабость, трусость, недостаток самообладания"
    },
    {
        "id": 9,
        "name": "Отшельник",
        "name_en": "The Hermit",
        "type": "major",
        "image": get_aesthetic_image(9),
        "keywords": ["поиск", "одиночество", "мудрость", "самопознание"],
        "upright_meaning": "Поиск истины, самопознание, внутренняя мудрость, одиночество",
        "reversed_meaning": "Изоляция, отказ от помощи, потеря направления"
    },
    {
        "id": 10,
        "name": "Колесо Фортуны",
        "name_en": "Wheel of Fortune",
        "type": "major",
        "image": create_card_svg("Колесо Фортуны", 10),
        "keywords": ["удача", "цикличность", "судьба", "перемены"],
        "upright_meaning": "Удача, положительные перемены, цикличность жизни",
        "reversed_meaning": "Неудача, негативные перемены, сопротивление переменам"
    },
    {
        "id": 11,
        "name": "Справедливость",
        "name_en": "Justice",
        "type": "major",
        "image": create_card_svg("Справедливость", 11),
        "keywords": ["справедливость", "баланс", "истина", "ответственность"],
        "upright_meaning": "Справедливость, баланс, истина, ответственность за поступки",
        "reversed_meaning": "Несправедливость, предвзятость, отсутствие ответственности"
    },
    {
        "id": 12,
        "name": "Повешенный",
        "name_en": "The Hanged Man",
        "type": "major",
        "image": create_card_svg("Повешенный", 12),
        "keywords": ["жертва", "ожидание", "новый взгляд", "смирение"],
        "upright_meaning": "Жертвоприношение, ожидание, новый взгляд на ситуацию",
        "reversed_meaning": "Ненужная жертва, сопротивление, отсутствие прогресса"
    },
    {
        "id": 13,
        "name": "Смерть",
        "name_en": "Death",
        "type": "major",
        "image": create_card_svg("Смерть", 13),
        "keywords": ["трансформация", "завершение", "возрождение", "перемены"],
        "upright_meaning": "Трансформация, конец одного этапа и начало нового, возрождение",
        "reversed_meaning": "Сопротивление переменам, застой, страх перед новым"
    },
    {
        "id": 14,
        "name": "Умеренность",
        "name_en": "Temperance",
        "type": "major",
        "image": create_card_svg("Умеренность", 14),
        "keywords": ["баланс", "гармония", "умеренность", "терпение"],
        "upright_meaning": "Умеренность, баланс, гармония, терпение, исцеление",
        "reversed_meaning": "Дисбаланс, излишества, нетерпение, конфликт"
    },
    {
        "id": 15,
        "name": "Дьявол",
        "name_en": "The Devil",
        "type": "major",
        "image": create_card_svg("Дьявол", 15),
        "keywords": ["искушение", "зависимость", "материализм", "иллюзии"],
        "upright_meaning": "Искушение, зависимость, материализм, иллюзии, страсть",
        "reversed_meaning": "Освобождение от зависимости, преодоление искушений"
    },
    {
        "id": 16,
        "name": "Башня",
        "name_en": "The Tower",
        "type": "major",
        "image": create_card_svg("Башня", 16),
        "keywords": ["разрушение", "откровение", "освобождение", "перемены"],
        "upright_meaning": "Внезапные перемены, разрушение иллюзий, освобождение",
        "reversed_meaning": "Сопротивление переменам, избежание разрушения"
    },
    {
        "id": 17,
        "name": "Звезда",
        "name_en": "The Star",
        "type": "major",
        "image": create_card_svg("Звезда", 17),
        "keywords": ["надежда", "вдохновение", "духовность", "исцеление"],
        "upright_meaning": "Надежда, вдохновение, духовное руководство, исцеление",
        "reversed_meaning": "Отчаяние, потеря веры, духовная дисгармония"
    },
    {
        "id": 18,
        "name": "Луна",
        "name_en": "The Moon",
        "type": "major",
        "image": create_card_svg("Луна", 18),
        "keywords": ["иллюзии", "страхи", "подсознание", "интуиция"],
        "upright_meaning": "Иллюзии, страхи, подсознательные влияния, интуиция",
        "reversed_meaning": "Рассеивание иллюзий, преодоление страхов, ясность"
    },
    {
        "id": 19,
        "name": "Солнце",
        "name_en": "The Sun",
        "type": "major",
        "image": create_card_svg("Солнце", 19),
        "keywords": ["радость", "успех", "энергия", "позитив"],
        "upright_meaning": "Радость, успех, энергия, позитивность, достижение целей",
        "reversed_meaning": "Временные неудачи, недостаток энергии, пессимизм"
    },
    {
        "id": 20,
        "name": "Суд",
        "name_en": "Judgement",
        "type": "major",
        "image": create_card_svg("Суд", 20),
        "keywords": ["возрождение", "прощение", "второй шанс", "пробуждение"],
        "upright_meaning": "Возрождение, прощение, второй шанс, духовное пробуждение",
        "reversed_meaning": "Самокритика, отсутствие прощения, упущенные возможности"
    },
    {
        "id": 21,
        "name": "Мир",
        "name_en": "The World",
        "type": "major",
        "image": create_card_svg("Мир", 21),
        "keywords": ["завершение", "достижение", "гармония", "успех"],
        "upright_meaning": "Завершение, достижение цели, гармония, успех, выполнение",
        "reversed_meaning": "Незавершенность, недостижение целей, задержки"
    }
]