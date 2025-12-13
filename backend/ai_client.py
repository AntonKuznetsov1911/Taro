"""
AI Client для работы с Claude (Anthropic) и XAI (Grok)
Использует Claude 3.5 Haiku как основную модель (быстро и дешево)
XAI Grok как запасной вариант
"""

import os
import logging
from typing import Optional, List, Dict, Any
from anthropic import Anthropic
from openai import OpenAI

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIClient:
    """Умный AI клиент с автоматическим переключением между Claude и XAI"""

    def __init__(self):
        # Инициализация Claude (Anthropic)
        self.claude_key = os.getenv("ANTHROPIC_API_KEY")
        self.claude_client = None
        self.claude_available = False

        if self.claude_key:
            try:
                self.claude_client = Anthropic(api_key=self.claude_key)
                self.claude_available = True
                logger.info("✅ Claude API инициализирован")
            except Exception as e:
                logger.error(f"❌ Ошибка инициализации Claude: {e}")

        # Инициализация XAI (Grok) через OpenAI-совместимый API
        self.xai_key = os.getenv("XAI_API_KEY")
        self.xai_client = None
        self.xai_available = False

        if self.xai_key:
            try:
                self.xai_client = OpenAI(
                    api_key=self.xai_key,
                    base_url="https://api.x.ai/v1"
                )
                self.xai_available = True
                logger.info("✅ XAI (Grok) API инициализирован")
            except Exception as e:
                logger.error(f"❌ Ошибка инициализации XAI: {e}")

        # Флаги квот
        self.claude_quota_exceeded = False
        self.xai_quota_exceeded = False

        # Модели для использования
        self.claude_model = "claude-3-5-haiku-20241022"  # Самая быстрая и дешевая
        self.xai_model = "grok-beta"  # Основная модель XAI

    def generate_text(
        self,
        prompt: str,
        max_tokens: int = 2000,
        temperature: float = 0.8,
        system_prompt: Optional[str] = None
    ) -> str:
        """
        Генерация текста с автоматическим переключением между AI

        Args:
            prompt: Пользовательский промпт
            max_tokens: Максимум токенов в ответе
            temperature: Креативность (0-1)
            system_prompt: Системный промпт (опционально)

        Returns:
            Сгенерированный текст
        """

        # Пробуем Claude (приоритет)
        if self.claude_available and not self.claude_quota_exceeded:
            try:
                return self._generate_with_claude(prompt, max_tokens, temperature, system_prompt)
            except Exception as e:
                logger.warning(f"⚠️ Claude API ошибка: {e}")
                # Проверяем на превышение квоты
                if "overloaded" in str(e).lower() or "rate_limit" in str(e).lower():
                    self.claude_quota_exceeded = True
                    logger.warning("🔴 Claude квота превышена, переключаемся на XAI")

        # Пробуем XAI (запасной)
        if self.xai_available and not self.xai_quota_exceeded:
            try:
                return self._generate_with_xai(prompt, max_tokens, temperature, system_prompt)
            except Exception as e:
                logger.warning(f"⚠️ XAI API ошибка: {e}")
                if "rate_limit" in str(e).lower() or "quota" in str(e).lower():
                    self.xai_quota_exceeded = True
                    logger.warning("🔴 XAI квота превышена")

        # Если оба API недоступны
        logger.error("❌ Все AI API недоступны, используем fallback")
        raise Exception("AI APIs unavailable")

    def _generate_with_claude(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float,
        system_prompt: Optional[str]
    ) -> str:
        """Генерация через Claude API"""

        logger.info(f"🤖 Используем Claude ({self.claude_model})")

        # Формируем системный промпт
        if not system_prompt:
            system_prompt = "Вы - мудрая и опытная гадалка с глубоким пониманием мистики и эзотерики."

        # Вызываем Claude API
        response = self.claude_client.messages.create(
            model=self.claude_model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        return response.content[0].text.strip()

    def _generate_with_xai(
        self,
        prompt: str,
        max_tokens: int,
        temperature: float,
        system_prompt: Optional[str]
    ) -> str:
        """Генерация через XAI (Grok) API"""

        logger.info(f"🤖 Используем XAI Grok ({self.xai_model})")

        # Формируем системный промпт
        if not system_prompt:
            system_prompt = "Вы - мудрая и опытная гадалка с глубоким пониманием мистики и эзотерики."

        # Формируем сообщения
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]

        # Вызываем XAI API (OpenAI-совместимый)
        response = self.xai_client.chat.completions.create(
            model=self.xai_model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )

        return response.choices[0].message.content.strip()

    def generate_with_vision(
        self,
        prompt: str,
        image_base64: str,
        max_tokens: int = 2000,
        temperature: float = 0.8
    ) -> str:
        """
        Генерация с анализом изображения (только Claude 3.5 Sonnet поддерживает vision)

        Args:
            prompt: Текстовый промпт
            image_base64: Изображение в base64
            max_tokens: Максимум токенов
            temperature: Креативность

        Returns:
            Анализ изображения
        """

        if not self.claude_available or self.claude_quota_exceeded:
            raise Exception("Claude API необходим для анализа изображений")

        logger.info("👁️ Анализируем изображение с Claude 3.5 Sonnet")

        # Для vision используем Sonnet (Haiku не поддерживает vision)
        response = self.claude_client.messages.create(
            model="claude-3-5-sonnet-20241022",  # Sonnet для vision
            max_tokens=max_tokens,
            temperature=temperature,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": image_base64,
                            },
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ],
                }
            ],
        )

        return response.content[0].text.strip()

    def is_available(self) -> bool:
        """Проверка доступности хотя бы одного AI API"""
        return (self.claude_available and not self.claude_quota_exceeded) or \
               (self.xai_available and not self.xai_quota_exceeded)

    def get_status(self) -> Dict[str, Any]:
        """Получить статус всех AI API"""
        return {
            "claude": {
                "available": self.claude_available,
                "quota_exceeded": self.claude_quota_exceeded,
                "model": self.claude_model if self.claude_available else None
            },
            "xai": {
                "available": self.xai_available,
                "quota_exceeded": self.xai_quota_exceeded,
                "model": self.xai_model if self.xai_available else None
            }
        }

# Глобальный экземпляр AI клиента
ai_client = AIClient()
