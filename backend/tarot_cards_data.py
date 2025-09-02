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

# Full 78-card tarot deck images - Major + Minor Arcana
FULL_TAROT_DECK_IMAGES = {
    # MAJOR ARCANA (0-21) - 22 cards
    0: "https://images.unsplash.com/photo-1600429753199-5376c2738737?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGRlY2t8ZW58MHx8fHwxNzU2ODE1Mzg0fDA&ixlib=rb-4.1.0&q=85",
    1: "https://images.pexels.com/photos/3088369/pexels-photo-3088369.jpeg",
    2: "https://images.pexels.com/photos/4790590/pexels-photo-4790590.jpeg",
    3: "https://images.unsplash.com/photo-1600429991827-5224817554f8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NjgxNTM2NHww&ixlib=rb-4.1.0&q=85",
    4: "https://images.pexels.com/photos/6014324/pexels-photo-6014324.jpeg",
    5: "https://images.pexels.com/photos/2843275/pexels-photo-2843275.jpeg",
    6: "https://images.unsplash.com/photo-1565492206137-0797f1ca6dc6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwyfHx0YXJvdCUyMGRlY2t8ZW58MHx8fHwxNzU2ODE1Mzg0fDA&ixlib=rb-4.1.0&q=85",
    7: "https://images.pexels.com/photos/8391594/pexels-photo-8391594.jpeg",
    8: "https://images.pexels.com/photos/6512277/pexels-photo-6512277.jpeg",
    9: "https://images.pexels.com/photos/4790557/pexels-photo-4790557.jpeg",
    10: "https://images.unsplash.com/photo-1600430086946-2d9fc61bbefc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwzfHx0YXJvdCUyMGRlY2t8ZW58MHx8fHwxNzU2ODE1Mzg0fDA&ixlib=rb-4.1.0&q=85",
    11: "https://images.unsplash.com/photo-1657210228958-91c7c1896c65?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxvY2N1bHQlMjBzeW1ib2xzfGVufDB8fHx8MTc1NjgxNTM5N3ww&ixlib=rb-4.1.0&q=85",
    12: "https://images.pexels.com/photos/2843273/pexels-photo-2843273.jpeg",
    13: "https://images.pexels.com/photos/6944923/pexels-photo-6944923.jpeg",
    14: "https://images.pexels.com/photos/4790559/pexels-photo-4790559.jpeg",
    15: "https://images.unsplash.com/photo-1654663477425-acf704a970d7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHw0fHxvY2N1bHQlMjBzeW1ib2xzfGVufDB8fHx8MTc1NjgxNTM5N3ww&ixlib=rb-4.1.0&q=85",
    16: "https://images.pexels.com/photos/3363695/pexels-photo-3363695.jpeg",
    17: "https://images.unsplash.com/photo-1600430073932-e915854d9d4d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NjgxNTM2NHww&ixlib=rb-4.1.0&q=85",
    18: "https://images.unsplash.com/photo-1696359050478-2e5a778d4c93?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxteXN0aWNhbCUyMG1vb258ZW58MHx8fHwxNzU2ODE1MzkwfDA&ixlib=rb-4.1.0&q=85",
    19: "https://images.unsplash.com/photo-1619472097193-987b3789c836?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxteXN0aWNhbCUyMG1vb258ZW58MHx8fHwxNzU2ODE1MzkwfDA&ixlib=rb-4.1.0&q=85",
    20: "https://images.pexels.com/photos/33682765/pexels-photo-33682765.jpeg",
    21: "https://images.pexels.com/photos/33331331/pexels-photo-33331331.jpeg",
    
    # MINOR ARCANA - WANDS (22-35) - 14 cards
    22: "https://images.unsplash.com/photo-1728241189719-ea4327c16eee?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzN8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMHdhbmRzfGVufDB8fHx8MTc1NjgxNTQ1M3ww&ixlib=rb-4.1.0&q=85", # Ace of Wands
    23: "https://images.unsplash.com/photo-1728241189721-6a46979906fb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzN8MHwxfHNlYXJjaHwyfHx0YXJvdCUyMHdhbmRzfGVufDB8fHx8MTc1NjgxNTQ1M3ww&ixlib=rb-4.1.0&q=85", # Two of Wands
    24: "https://images.pexels.com/photos/13081193/pexels-photo-13081193.jpeg", # Three of Wands
    25: "https://images.unsplash.com/photo-1600429991827-5224817554f8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NjgxNTM2NHww&ixlib=rb-4.1.0&q=85", # Four of Wands 
    26: "https://images.pexels.com/photos/3088369/pexels-photo-3088369.jpeg", # Five of Wands
    27: "https://images.unsplash.com/photo-1600430073932-e915854d9d4d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NjgxNTM2NHww&ixlib=rb-4.1.0&q=85", # Six of Wands
    28: "https://images.pexels.com/photos/6512281/pexels-photo-6512281.jpeg", # Seven of Wands
    29: "https://images.unsplash.com/photo-1600430086946-2d9fc61bbefc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwzfHx0YXJvdCUyMGRlY2t8ZW58MHx8fHwxNzU2ODE1Mzg0fDA&ixlib=rb-4.1.0&q=85", # Eight of Wands
    30: "https://images.pexels.com/photos/7181711/pexels-photo-7181711.jpeg", # Nine of Wands
    31: "https://images.unsplash.com/photo-1565492206137-0797f1ca6dc6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwyfHx0YXJvdCUyMGRlY2t8ZW58MHx8fHwxNzU2ODE1Mzg0fDA&ixlib=rb-4.1.0&q=85", # Ten of Wands
    32: "https://images.pexels.com/photos/13081193/pexels-photo-13081193.jpeg", # Page of Wands
    33: "https://images.unsplash.com/photo-1728241189719-ea4327c16eee?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzN8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMHdhbmRzfGVufDB8fHx8MTc1NjgxNTQ1M3ww&ixlib=rb-4.1.0&q=85", # Knight of Wands
    34: "https://images.unsplash.com/photo-1728241189721-6a46979906fb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzN8MHwxfHNlYXJjaHwyfHx0YXJvdCUyMHdhbmRzfGVufDB8fHx8MTc1NjgxNTQ1M3ww&ixlib=rb-4.1.0&q=85", # Queen of Wands
    35: "https://images.pexels.com/photos/6512281/pexels-photo-6512281.jpeg", # King of Wands
    
    # MINOR ARCANA - CUPS (36-49) - 14 cards
    36: "https://images.unsplash.com/photo-1692011662740-29d58251a213?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGN1cHN8ZW58MHx8fHwxNzU2ODE1NDg2fDA&ixlib=rb-4.1.0&q=85", # Ace of Cups
    37: "https://images.unsplash.com/photo-1600429770067-380e847a6c86?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHx0YXJvdCUyMGN1cHN8ZW58MHx8fHwxNzU2ODE1NDg2fDA&ixlib=rb-4.1.0&q=85", # Two of Cups
    38: "https://images.pexels.com/photos/32820642/pexels-photo-32820642.jpeg", # Three of Cups
    39: "https://images.unsplash.com/photo-1692011662740-29d58251a213?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGN1cHN8ZW58MHx8fHwxNzU2ODE1NDg2fDA&ixlib=rb-4.1.0&q=85", # Four of Cups
    40: "https://images.pexels.com/photos/3088369/pexels-photo-3088369.jpeg", # Five of Cups
    41: "https://images.unsplash.com/photo-1600429770067-380e847a6c86?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHx0YXJvdCUyMGN1cHN8ZW58MHx8fHwxNzU2ODE1NDg2fDA&ixlib=rb-4.1.0&q=85", # Six of Cups
    42: "https://images.pexels.com/photos/32820642/pexels-photo-32820642.jpeg", # Seven of Cups
    43: "https://images.pexels.com/photos/7181711/pexels-photo-7181711.jpeg", # Eight of Cups
    44: "https://images.pexels.com/photos/6512281/pexels-photo-6512281.jpeg", # Nine of Cups
    45: "https://images.unsplash.com/photo-1692011662740-29d58251a213?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGN1cHN8ZW58MHx8fHwxNzU2ODE1NDg2fDA&ixlib=rb-4.1.0&q=85", # Ten of Cups
    46: "https://images.pexels.com/photos/32820642/pexels-photo-32820642.jpeg", # Page of Cups
    47: "https://images.unsplash.com/photo-1600429770067-380e847a6c86?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHx0YXJvdCUyMGN1cHN8ZW58MHx8fHwxNzU2ODE1NDg2fDA&ixlib=rb-4.1.0&q=85", # Knight of Cups
    48: "https://images.pexels.com/photos/7181711/pexels-photo-7181711.jpeg", # Queen of Cups
    49: "https://images.unsplash.com/photo-1692011662740-29d58251a213?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGN1cHN8ZW58MHx8fHwxNzU2ODE1NDg2fDA&ixlib=rb-4.1.0&q=85", # King of Cups
    
    # MINOR ARCANA - SWORDS (50-63) - 14 cards  
    50: "https://images.unsplash.com/photo-1572900145365-78a95d897e80?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMHN3b3Jkc3xlbnwwfHx8fDE3NTY4MTU1MDR8MA&ixlib=rb-4.1.0&q=85", # Ace of Swords
    51: "https://images.unsplash.com/photo-1677017168376-fb24bef87c43?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwyfHx0YXJvdCUyMHN3b3Jkc3xlbnwwfHx8fDE3NTY4MTU1MDR8MA&ixlib=rb-4.1.0&q=85", # Two of Swords
    52: "https://images.pexels.com/photos/13081193/pexels-photo-13081193.jpeg", # Three of Swords
    53: "https://images.unsplash.com/photo-1572900145365-78a95d897e80?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMHN3b3Jkc3xlbnwwfHx8fDE3NTY4MTU1MDR8MA&ixlib=rb-4.1.0&q=85", # Four of Swords
    54: "https://images.pexels.com/photos/3088369/pexels-photo-3088369.jpeg", # Five of Swords
    55: "https://images.unsplash.com/photo-1677017168376-fb24bef87c43?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwyfHx0YXJvdCUyMHN3b3Jkc3xlbnwwfHx8fDE3NTY4MTU1MDR8MA&ixlib=rb-4.1.0&q=85", # Six of Swords
    56: "https://images.pexels.com/photos/13081193/pexels-photo-13081193.jpeg", # Seven of Swords
    57: "https://images.pexels.com/photos/6512281/pexels-photo-6512281.jpeg", # Eight of Swords
    58: "https://images.pexels.com/photos/7181711/pexels-photo-7181711.jpeg", # Nine of Swords
    59: "https://images.unsplash.com/photo-1572900145365-78a95d897e80?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMHN3b3Jkc3xlbnwwfHx8fDE3NTY4MTU1MDR8MA&ixlib=rb-4.1.0&q=85", # Ten of Swords
    60: "https://images.unsplash.com/photo-1677017168376-fb24bef87c43?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwyfHx0YXJvdCUyMHN3b3Jkc3xlbnwwfHx8fDE3NTY4MTU1MDR8MA&ixlib=rb-4.1.0&q=85", # Page of Swords
    61: "https://images.pexels.com/photos/13081193/pexels-photo-13081193.jpeg", # Knight of Swords
    62: "https://images.pexels.com/photos/7181711/pexels-photo-7181711.jpeg", # Queen of Swords
    63: "https://images.unsplash.com/photo-1572900145365-78a95d897e80?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMHN3b3Jkc3xlbnwwfHx8fDE3NTY4MTU1MDR8MA&ixlib=rb-4.1.0&q=85", # King of Swords
    
    # MINOR ARCANA - PENTACLES (64-77) - 14 cards
    64: "https://images.unsplash.com/photo-1600429991827-5224817554f8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NjgxNTM2NHww&ixlib=rb-4.1.0&q=85", # Ace of Pentacles
    65: "https://images.unsplash.com/photo-1723211660247-4bce448aa862?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMHBlbnRhY2xlc3xlbnwwfHx8fDE3NTY4MTU1MjR8MA&ixlib=rb-4.1.0&q=85", # Two of Pentacles
    66: "https://images.pexels.com/photos/7181711/pexels-photo-7181711.jpeg", # Three of Pentacles
    67: "https://images.unsplash.com/photo-1600429991827-5224817554f8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NjgxNTM2NHww&ixlib=rb-4.1.0&q=85", # Four of Pentacles
    68: "https://images.pexels.com/photos/3088369/pexels-photo-3088369.jpeg", # Five of Pentacles
    69: "https://images.unsplash.com/photo-1723211660247-4bce448aa862?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMHBlbnRhY2xlc3xlbnwwfHx8fDE3NTY4MTU1MjR8MA&ixlib=rb-4.1.0&q=85", # Six of Pentacles
    70: "https://images.pexels.com/photos/7181711/pexels-photo-7181711.jpeg", # Seven of Pentacles
    71: "https://images.pexels.com/photos/6512281/pexels-photo-6512281.jpeg", # Eight of Pentacles
    72: "https://images.unsplash.com/photo-1600429991827-5224817554f8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NjgxNTM2NHww&ixlib=rb-4.1.0&q=85", # Nine of Pentacles
    73: "https://images.unsplash.com/photo-1723211660247-4bce448aa862?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMHBlbnRhY2xlc3xlbnwwfHx8fDE3NTY4MTU1MjR8MA&ixlib=rb-4.1.0&q=85", # Ten of Pentacles
    74: "https://images.pexels.com/photos/7181711/pexels-photo-7181711.jpeg", # Page of Pentacles
    75: "https://images.pexels.com/photos/6512281/pexels-photo-6512281.jpeg", # Knight of Pentacles
    76: "https://images.unsplash.com/photo-1600429991827-5224817554f8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NjgxNTM2NHww&ixlib=rb-4.1.0&q=85", # Queen of Pentacles
    77: "https://images.unsplash.com/photo-1723211660247-4bce448aa862?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMHBlbnRhY2xlc3xlbnwwfHx8fDE3NTY4MTU1MjR8MA&ixlib=rb-4.1.0&q=85", # King of Pentacles
}

# Expanded comprehensive tarot card images collection - multiple options for each card
TAROT_CARD_IMAGES_BY_ID = {
    # Дурак (0) - новые начинания, путешествие
    0: "https://images.unsplash.com/photo-1600429753199-5376c2738737?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGRlY2t8ZW58MHx8fHwxNzU2ODE1Mzg0fDA&ixlib=rb-4.1.0&q=85",
    
    # Маг (1) - сила воли, мастерство  
    1: "https://images.pexels.com/photos/3088369/pexels-photo-3088369.jpeg",
    
    # Верховная Жрица (2) - интуиция, тайны
    2: "https://images.pexels.com/photos/4790590/pexels-photo-4790590.jpeg",
    
    # Императрица (3) - плодородие, природа
    3: "https://images.unsplash.com/photo-1600429991827-5224817554f8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NjgxNTM2NHww&ixlib=rb-4.1.0&q=85",
    
    # Император (4) - власть, стабильность
    4: "https://images.pexels.com/photos/6014324/pexels-photo-6014324.jpeg",
    
    # Иерофант (5) - традиции, духовность
    5: "https://images.pexels.com/photos/2843275/pexels-photo-2843275.jpeg",
    
    # Влюбленные (6) - любовь, выбор
    6: "https://images.unsplash.com/photo-1565492206137-0797f1ca6dc6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwyfHx0YXJvdCUyMGRlY2t8ZW58MHx8fHwxNzU2ODE1Mzg0fDA&ixlib=rb-4.1.0&q=85",
    
    # Колесница (7) - победа, контроль
    7: "https://images.pexels.com/photos/8391594/pexels-photo-8391594.jpeg",
    
    # Сила (8) - внутренняя сила
    8: "https://images.pexels.com/photos/6512277/pexels-photo-6512277.jpeg",
    
    # Отшельник (9) - одиночество, поиск
    9: "https://images.pexels.com/photos/4790557/pexels-photo-4790557.jpeg",
    
    # Колесо Фортуны (10) - судьба, циклы
    10: "https://images.unsplash.com/photo-1600430086946-2d9fc61bbefc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwzfHx0YXJvdCUyMGRlY2t8ZW58MHx8fHwxNzU2ODE1Mzg0fDA&ixlib=rb-4.1.0&q=85",
    
    # Справедливость (11) - справедливость, весы
    11: "https://images.unsplash.com/photo-1657210228958-91c7c1896c65?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxvY2N1bHQlMjBzeW1ib2xzfGVufDB8fHx8MTc1NjgxNTM5N3ww&ixlib=rb-4.1.0&q=85",
    
    # Повешенный (12) - жертва, новый взгляд
    12: "https://images.pexels.com/photos/2843273/pexels-photo-2843273.jpeg",
    
    # Смерть (13) - трансформация
    13: "https://images.pexels.com/photos/6944923/pexels-photo-6944923.jpeg",
    
    # Умеренность (14) - баланс
    14: "https://images.pexels.com/photos/4790559/pexels-photo-4790559.jpeg",
    
    # Дьявол (15) - искушение
    15: "https://images.unsplash.com/photo-1654663477425-acf704a970d7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHw0fHxvY2N1bHQlMjBzeW1ib2xzfGVufDB8fHx8MTc1NjgxNTM5N3ww&ixlib=rb-4.1.0&q=85",
    
    # Башня (16) - разрушение, внезапные изменения
    16: "https://images.pexels.com/photos/3363695/pexels-photo-3363695.jpeg",
    
    # Звезда (17) - надежда
    17: "https://images.unsplash.com/photo-1600430073932-e915854d9d4d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NjgxNTM2NHww&ixlib=rb-4.1.0&q=85",
    
    # Луна (18) - иллюзия, подсознание
    18: "https://images.unsplash.com/photo-1696359050478-2e5a778d4c93?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxteXN0aWNhbCUyMG1vb258ZW58MHx8fHwxNzU2ODE1MzkwfDA&ixlib=rb-4.1.0&q=85",
    
    # Солнце (19) - радость, успех
    19: "https://images.unsplash.com/photo-1619472097193-987b3789c836?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxteXN0aWNhbCUyMG1vb258ZW58MHx8fHwxNzU2ODE1MzkwfDA&ixlib=rb-4.1.0&q=85",
    
    # Суд (20) - возрождение
    20: "https://images.pexels.com/photos/33682765/pexels-photo-33682765.jpeg",
    
    # Мир (21) - завершение, целостность
    21: "https://images.pexels.com/photos/33331331/pexels-photo-33331331.jpeg",
}

# Secondary fallback collection with additional high-quality images
SECONDARY_TAROT_IMAGES = [
    "https://images.unsplash.com/photo-1600429991827-5224817554f8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NjgxNTM2NHww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1600430073932-e915854d9d4d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NjZ8MHwxfHNlYXJjaHwzfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NjgxNTM2NHww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1600429753199-5376c2738737?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGRlY2t8ZW58MHx8fHwxNzU2ODE1Mzg0fDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1565492206137-0797f1ca6dc6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwyfHx0YXJvdCUyMGRlY2t8ZW58MHx8fHwxNzU2ODE1Mzg0fDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1600430086946-2d9fc61bbefc?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwzfHx0YXJvdCUyMGRlY2t8ZW58MHx8fHwxNzU2ODE1Mzg0fDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1696359050478-2e5a778d4c93?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxteXN0aWNhbCUyMG1vb258ZW58MHx8fHwxNzU2ODE1MzkwfDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1619472097193-987b3789c836?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxteXN0aWNhbCUyMG1vb258ZW58MHx8fHwxNzU2ODE1MzkwfDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1657210228958-91c7c1896c65?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxvY2N1bHQlMjBzeW1ib2xzfGVufDB8fHx8MTc1NjgxNTM5N3ww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1654663477425-acf704a970d7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHw0fHxvY2N1bHQlMjBzeW1ib2xzfGVufDB8fHx8MTc1NjgxNTM5N3ww&ixlib=rb-4.1.0&q=85",
    "https://images.pexels.com/photos/3088369/pexels-photo-3088369.jpeg",
    "https://images.pexels.com/photos/3363695/pexels-photo-3363695.jpeg",
    "https://images.pexels.com/photos/33682765/pexels-photo-33682765.jpeg",
    "https://images.pexels.com/photos/33331331/pexels-photo-33331331.jpeg",
    "https://images.pexels.com/photos/2843275/pexels-photo-2843275.jpeg",
    "https://images.pexels.com/photos/2843273/pexels-photo-2843273.jpeg",
    "https://images.pexels.com/photos/4790590/pexels-photo-4790590.jpeg",
    "https://images.pexels.com/photos/4790559/pexels-photo-4790559.jpeg",
    "https://images.pexels.com/photos/4790557/pexels-photo-4790557.jpeg",
    "https://images.pexels.com/photos/6014324/pexels-photo-6014324.jpeg",
    "https://images.pexels.com/photos/8391594/pexels-photo-8391594.jpeg",
    "https://images.pexels.com/photos/6512277/pexels-photo-6512277.jpeg",
    "https://images.pexels.com/photos/6944923/pexels-photo-6944923.jpeg",
]

# Fallback images from the previous collection for redundancy
BEAUTIFUL_TAROT_IMAGES = [
    # Primary Tarot Card Images (Traditional Rider-Waite and Classic Decks)
    "https://images.unsplash.com/photo-1600429991827-5224817554f8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1Njc5OTkwOHww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1600430073932-e915854d9d4d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1Njc5OTkwOHww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1600429753199-5376c2738737?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHw0fHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1Njc5OTkwOXww&ixlib=rb-4.1.0&q=85",
    
    # Atmospheric Tarot Reading Images
    "https://images.unsplash.com/photo-1627764574958-fb54cd7d7448?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwxfHxmb3J0dW5lJTIwdGVsbGVyfGVufDB8fHx8MTc1Njc5OTkyMXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1747710977538-17b75f76f6f7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxmb3J0dW5lJTIwdGVsbGVyfGVufDB8fHx8MTc1Njc5OTkyMXww&ixlib=rb-4.1.0&q=85",
    
    # Mystical Atmospheric Images
    "https://images.unsplash.com/photo-1603669388517-e61210964af4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwzfHxteXN0aWNhbCUyMGVzb3RlcmljfGVufDB8fHx8MTc1Njc5OTkxNXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1642791994760-ae038c886889?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHw0fHxteXN0aWNhbCUyMGVzb3RlcmljfGVufDB8fHx8MTc1Njc5OTkxNXww&ixlib=rb-4.1.0&q=85",
    
    # Magical/Occult Themed Images
    "https://images.unsplash.com/photo-1551029506-0807df4e2031?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwyfHxtYWdpYyUyMG9jY3VsdHxlbnwwfHx8fDE3NTY3OTk5MzB8MA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1578634383009-bc0448eb3ca7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHxtYWdpYyUyMG9jY3VsdHxlbnwwfHx8fDE3NTY3OTk5MzB8MA&ixlib=rb-4.1.0&q=85",
    
    # Pexels High-Quality Images
    "https://images.pexels.com/photos/33715981/pexels-photo-33715981.jpeg",
    "https://images.pexels.com/photos/33715978/pexels-photo-33715978.jpeg", 
    "https://images.pexels.com/photos/3088369/pexels-photo-3088369.jpeg",
    "https://images.pexels.com/photos/3363695/pexels-photo-3363695.jpeg",
    "https://images.pexels.com/photos/5435267/pexels-photo-5435267.jpeg",
    "https://images.pexels.com/photos/10877395/pexels-photo-10877395.jpeg",
    
    # Additional classic images
    "https://images.unsplash.com/photo-1623230951203-1f8fa5298426?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHwzfHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NDU1ODg0NXww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1637757935037-a7837f36807d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODB8MHwxfHNlYXJjaHw0fHx0YXJvdCUyMGNhcmRzfGVufDB8fHx8MTc1NDU1ODg0NXww&ixlib=rb-4.1.0&q=85",
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

def create_enhanced_card_svg(card_name: str, card_id: int, is_major: bool = True) -> str:
    """Create enhanced SVG card image with full-card background and unique design for each card"""
    
    # Unique card designs for Major Arcana
    card_designs = {
        0: {"symbol": "🃏", "colors": ["#FF6B9D", "#FF8E9B"], "element": "Воздух", "mood": "свобода"},  # Дурак
        1: {"symbol": "🔮", "colors": ["#9B59B6", "#BB6BD9"], "element": "Огонь", "mood": "воля"},    # Маг
        2: {"symbol": "🌙", "colors": ["#3498DB", "#5DADE2"], "element": "Вода", "mood": "тайна"},    # Верховная Жрица
        3: {"symbol": "🌺", "colors": ["#27AE60", "#58D68D"], "element": "Земля", "mood": "плодородие"}, # Императрица
        4: {"symbol": "👑", "colors": ["#E74C3C", "#F1948A"], "element": "Огонь", "mood": "власть"},  # Император
        5: {"symbol": "⛪", "colors": ["#F39C12", "#F8C471"], "element": "Земля", "mood": "духовность"}, # Иерофант
        6: {"symbol": "💕", "colors": ["#FF69B4", "#FFB6C1"], "element": "Воздух", "mood": "любовь"}, # Влюбленные
        7: {"symbol": "🏆", "colors": ["#FFD700", "#FFF68F"], "element": "Огонь", "mood": "победа"},  # Колесница
        8: {"symbol": "💪", "colors": ["#32CD32", "#90EE90"], "element": "Огонь", "mood": "сила"},    # Сила
        9: {"symbol": "🕯️", "colors": ["#8E44AD", "#D7DBDD"], "element": "Земля", "mood": "мудрость"}, # Отшельник
        10: {"symbol": "☸️", "colors": ["#1ABC9C", "#76D7C4"], "element": "Огонь", "mood": "судьба"}, # Колесо Фортуны
        11: {"symbol": "⚖️", "colors": ["#3498DB", "#85C1E9"], "element": "Воздух", "mood": "справедливость"}, # Справедливость
        12: {"symbol": "🙃", "colors": ["#95A5A6", "#D5DBDB"], "element": "Вода", "mood": "жертва"},  # Повешенный
        13: {"symbol": "💀", "colors": ["#2C3E50", "#566573"], "element": "Вода", "mood": "трансформация"}, # Смерть
        14: {"symbol": "🍷", "colors": ["#E67E22", "#F8C471"], "element": "Огонь", "mood": "умеренность"}, # Умеренность
        15: {"symbol": "😈", "colors": ["#8B0000", "#CD5C5C"], "element": "Земля", "mood": "искушение"}, # Дьявол
        16: {"symbol": "⚡", "colors": ["#FF4500", "#FFA07A"], "element": "Огонь", "mood": "разрушение"}, # Башня
        17: {"symbol": "⭐", "colors": ["#4169E1", "#87CEEB"], "element": "Воздух", "mood": "надежда"}, # Звезда
        18: {"symbol": "🌝", "colors": ["#483D8B", "#9370DB"], "element": "Вода", "mood": "иллюзия"}, # Луна
        19: {"symbol": "☀️", "colors": ["#FFD700", "#FFFF99"], "element": "Огонь", "mood": "радость"}, # Солнце
        20: {"symbol": "📯", "colors": ["#DC143C", "#F08080"], "element": "Огонь", "mood": "возрождение"}, # Суд
        21: {"symbol": "🌍", "colors": ["#228B22", "#98FB98"], "element": "Земля", "mood": "завершение"}, # Мир
    }
    
    # Get design for this card
    design = card_designs.get(card_id, {
        "symbol": "✨", 
        "colors": ["#9B59B6", "#BB6BD9"], 
        "element": "Эфир", 
        "mood": "магия"
    })
    
    svg_content = f'''
    <svg width="200" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300">
        <defs>
            <!-- Full card background gradient -->
            <linearGradient id="fullCardGrad{card_id}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:{design['colors'][0]};stop-opacity:1" />
                <stop offset="30%" style="stop-color:{design['colors'][1]};stop-opacity:0.9" />
                <stop offset="70%" style="stop-color:{design['colors'][0]};stop-opacity:0.8" />
                <stop offset="100%" style="stop-color:{design['colors'][1]};stop-opacity:1" />
            </linearGradient>
            
            <!-- Mystical overlay pattern -->
            <radialGradient id="mysticalOverlay{card_id}" cx="50%" cy="50%" r="70%">
                <stop offset="0%" style="stop-color:white;stop-opacity:0.2" />
                <stop offset="50%" style="stop-color:white;stop-opacity:0.1" />
                <stop offset="100%" style="stop-color:transparent;stop-opacity:0" />
            </radialGradient>
            
            <!-- Detailed mystical pattern -->
            <pattern id="fullCardPattern{card_id}" patternUnits="userSpaceOnUse" width="40" height="40">
                <circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.15)"/>
                <circle cx="10" cy="10" r="1" fill="rgba(255,255,255,0.1)"/>
                <circle cx="30" cy="30" r="1" fill="rgba(255,255,255,0.1)"/>
                <circle cx="10" cy="30" r="0.5" fill="rgba(255,255,255,0.08)"/>
                <circle cx="30" cy="10" r="0.5" fill="rgba(255,255,255,0.08)"/>
            </pattern>
            
            <!-- Border glow effect -->
            <filter id="borderGlow{card_id}">
                <feGaussianBlur stdDeviation="2"/>
                <feColorMatrix values="1 0 1 0 0  0 1 1 0 0  1 0 1 0 0  0 0 0 1 0"/>
            </filter>
        </defs>
        
        <!-- Full card background - fills entire card -->
        <rect width="200" height="300" fill="url(#fullCardGrad{card_id})" rx="15"/>
        
        <!-- Mystical pattern overlay -->
        <rect width="200" height="300" fill="url(#fullCardPattern{card_id})" rx="15"/>
        
        <!-- Radial mystical glow -->
        <rect width="200" height="300" fill="url(#mysticalOverlay{card_id})" rx="15"/>
        
        <!-- Elegant border with glow -->
        <rect x="3" y="3" width="194" height="294" fill="none" 
              stroke="rgba(255,255,255,0.6)" stroke-width="1.5" rx="12"
              filter="url(#borderGlow{card_id})"/>
        <rect x="8" y="8" width="184" height="284" fill="none" 
              stroke="rgba(255,255,255,0.4)" stroke-width="1" rx="10"/>
              
        <!-- Top section with card name -->
        <rect x="15" y="15" width="170" height="45" fill="rgba(0,0,0,0.2)" rx="8" 
              stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
        <text x="100" y="32" font-family="serif" font-size="14" font-weight="bold" 
              fill="white" text-anchor="middle" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
              {card_name}
        </text>
        <text x="100" y="48" font-family="serif" font-size="10" 
              fill="rgba(255,255,255,0.9)" text-anchor="middle">
              {design['element']} • {design['mood']}
        </text>
        
        <!-- Large central symbol area - dominates the card -->
        <circle cx="100" cy="170" r="70" fill="rgba(255,255,255,0.15)" 
                stroke="rgba(255,255,255,0.5)" stroke-width="2"/>
        <circle cx="100" cy="170" r="55" fill="none" 
                stroke="rgba(255,255,255,0.7)" stroke-width="1"/>
        <circle cx="100" cy="170" r="40" fill="rgba(255,255,255,0.1)"/>
        
        <!-- Huge main symbol - fills most of central area -->
        <text x="100" y="200" font-family="serif" font-size="64" 
              fill="white" text-anchor="middle" 
              style="text-shadow: 2px 2px 4px rgba(0,0,0,0.4);">
              {design['symbol']}
        </text>
              
        <!-- Corner decorative elements -->
        <text x="100" y="85" font-family="serif" font-size="20" 
              fill="rgba(255,255,255,0.8)" text-anchor="middle">✦</text>
        <text x="100" y="255" font-family="serif" font-size="20" 
              fill="rgba(255,255,255,0.8)" text-anchor="middle">✦</text>
              
        <!-- Side mystical symbols -->
        <text x="30" y="170" font-family="serif" font-size="16" 
              fill="rgba(255,255,255,0.6)" text-anchor="middle">✧</text>
        <text x="170" y="170" font-family="serif" font-size="16" 
              fill="rgba(255,255,255,0.6)" text-anchor="middle">✧</text>
        
        <!-- Bottom section -->
        <rect x="15" y="270" width="170" height="20" fill="rgba(0,0,0,0.2)" rx="5"
              stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
        <text x="100" y="282" font-family="serif" font-size="11" 
              fill="rgba(255,255,255,0.9)" text-anchor="middle" font-weight="bold">
              СТАРШИЙ АРКАН #{card_id}
        </text>
    </svg>
    '''
    
    # Convert SVG to base64
    svg_bytes = svg_content.encode('utf-8')
    svg_base64 = base64.b64encode(svg_bytes).decode('utf-8')
    return f"data:image/svg+xml;base64,{svg_base64}"

# Beautiful mystical card back image
CARD_BACK_SVG = '''
<svg width="200" height="300" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <radialGradient id="cosmicGrad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" style="stop-color:#1a0040;stop-opacity:1" />
            <stop offset="30%" style="stop-color:#2d1b69;stop-opacity:1" />
            <stop offset="70%" style="stop-color:#0f0f23;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#000011;stop-opacity:1" />
        </radialGradient>
        <pattern id="constellation" patternUnits="userSpaceOnUse" width="50" height="50">
            <circle cx="25" cy="25" r="1.5" fill="#FFD700" opacity="0.8"/>
            <circle cx="10" cy="15" r="0.8" fill="#E6E6FA" opacity="0.6"/>
            <circle cx="40" cy="10" r="1" fill="#87CEEB" opacity="0.7"/>
            <circle cx="15" cy="40" r="0.5" fill="#FFD700" opacity="0.5"/>
            <circle cx="35" cy="35" r="0.7" fill="#E6E6FA" opacity="0.6"/>
        </pattern>
        <linearGradient id="mysticBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#FFD700;stop-opacity:0.9" />
            <stop offset="50%" style="stop-color:#9B59B6;stop-opacity:0.8" />
            <stop offset="100%" style="stop-color:#FF6B9D;stop-opacity:0.9" />
        </linearGradient>
    </defs>
    
    <!-- Cosmic background -->
    <rect width="200" height="300" fill="url(#cosmicGrad)" rx="18"/>
    <rect width="200" height="300" fill="url(#constellation)" rx="18" opacity="0.7"/>
    
    <!-- Mystical outer border -->
    <rect x="4" y="4" width="192" height="292" fill="none" 
          stroke="url(#mysticBorder)" stroke-width="2" rx="15" opacity="0.8"/>
    <rect x="8" y="8" width="184" height="284" fill="none" 
          stroke="url(#mysticBorder)" stroke-width="1" rx="12" opacity="0.6"/>
    
    <!-- Central mystical mandala -->
    <g transform="translate(100,150)">
        <!-- Outer mystical circle -->
        <circle r="65" fill="none" stroke="#FFD700" stroke-width="2" opacity="0.3"/>
        <circle r="55" fill="none" stroke="#9B59B6" stroke-width="1" opacity="0.4"/>
        <circle r="45" fill="none" stroke="#FF6B9D" stroke-width="1" opacity="0.3"/>
        
        <!-- Inner sacred geometry -->
        <circle r="35" fill="rgba(155, 89, 182, 0.1)" stroke="#9B59B6" stroke-width="2"/>
        <circle r="25" fill="none" stroke="#FFD700" stroke-width="1" opacity="0.6"/>
        
        <!-- Sacred symbols -->
        <text x="0" y="10" font-family="serif" font-size="28" fill="#FFD700" text-anchor="middle">🔮</text>
        <text x="0" y="-45" font-family="serif" font-size="16" fill="#87CEEB" text-anchor="middle">✦</text>
        <text x="45" y="5" font-family="serif" font-size="14" fill="#E6E6FA" text-anchor="middle">⭐</text>
        <text x="-45" y="5" font-family="serif" font-size="14" fill="#E6E6FA" text-anchor="middle">✨</text>
        <text x="0" y="50" font-family="serif" font-size="16" fill="#FFD700" text-anchor="middle">🌙</text>
        
        <!-- Corner mystical elements -->
        <text x="30" y="-30" font-family="serif" font-size="12" fill="#9B59B6" text-anchor="middle">☆</text>
        <text x="-30" y="-30" font-family="serif" font-size="12" fill="#FF6B9D" text-anchor="middle">✧</text>
        <text x="30" y="35" font-family="serif" font-size="12" fill="#87CEEB" text-anchor="middle">✦</text>
        <text x="-30" y="35" font-family="serif" font-size="12" fill="#E6E6FA" text-anchor="middle">☆</text>
    </g>
    
    <!-- Mystical corner decorations -->
    <g opacity="0.7">
        <text x="30" y="45" font-family="serif" font-size="18" fill="#FFD700">💫</text>
        <text x="170" y="45" font-family="serif" font-size="18" fill="#9B59B6">✨</text>
        <text x="30" y="270" font-family="serif" font-size="18" fill="#FF6B9D">⭐</text>
        <text x="170" y="270" font-family="serif" font-size="18" fill="#87CEEB">🌟</text>
    </g>
    
    <!-- Elegant TARO branding -->
    <text x="100" y="35" font-family="serif" font-size="16" font-weight="bold"
          fill="#FFD700" text-anchor="middle" opacity="0.8">✧ T A R O ✧</text>
    <text x="100" y="280" font-family="serif" font-size="12"
          fill="#E6E6FA" text-anchor="middle" opacity="0.7">Древняя мудрость</text>
</svg>
'''

CARD_BACK_IMAGE = f"data:image/svg+xml;base64,{base64.b64encode(CARD_BACK_SVG.encode('utf-8')).decode('utf-8')}"

def get_aesthetic_image(card_id: int) -> str:
    """Get beautiful tarot card image - multi-level fallback system for maximum coverage"""
    
    # Level 1: Try specific card image
    if card_id in TAROT_CARD_IMAGES_BY_ID:
        specific_image = url_to_base64(TAROT_CARD_IMAGES_BY_ID[card_id])
        if specific_image:  # If specific image was successfully loaded
            return specific_image
    
    # Level 2: Try secondary collection by index
    if card_id < len(SECONDARY_TAROT_IMAGES):
        secondary_image = url_to_base64(SECONDARY_TAROT_IMAGES[card_id])
        if secondary_image:  # If secondary image was successfully loaded
            return secondary_image
    
    # Level 3: Try original fallback collection
    if card_id < len(BEAUTIFUL_TAROT_IMAGES):
        fallback_image = url_to_base64(BEAUTIFUL_TAROT_IMAGES[card_id])
        if fallback_image:  # If fallback image was successfully loaded
            return fallback_image
    
    # Level 4: Try any available image from secondary collection (rotation)
    if SECONDARY_TAROT_IMAGES:
        rotation_index = card_id % len(SECONDARY_TAROT_IMAGES)
        rotation_image = url_to_base64(SECONDARY_TAROT_IMAGES[rotation_index])
        if rotation_image:
            return rotation_image
    
    # Level 5: Final fallback to our enhanced SVG system
    card_names = [
        "Дурак", "Маг", "Верховная Жрица", "Императрица", "Император", 
        "Иерофант", "Влюблённые", "Колесница", "Сила", "Отшельник",
        "Колесо Фортуны", "Справедливость", "Повешенный", "Смерть", 
        "Умеренность", "Дьявол", "Башня", "Звезда", "Луна", "Солнце", "Суд", "Мир"
    ]
    
    card_name = card_names[card_id] if card_id < len(card_names) else f"Карта {card_id}"
    return create_enhanced_card_svg(card_name, card_id)

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