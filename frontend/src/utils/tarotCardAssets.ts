// Иллюстрации колоды Райдера — Уэйта — Смит (1909), общественное достояние.
// Сканы взяты из набора https://github.com/metabismuth/tarot-json (MIT),
// приведены к 350x600 и сохранены в WebP. Всё лежит в assets — сеть не нужна.
//
// Metro умеет разрешать только литеральные пути в require(), поэтому карта
// собирается статически: динамический require('../../assets/cards/' + id) не соберётся.

import type { ImageSourcePropType } from 'react-native';
import type { TarotCard } from '../data/tarotCards';

const CARD_IMAGES: Record<number, ImageSourcePropType> = {
  0: require('../../assets/cards/0.webp'),
  1: require('../../assets/cards/1.webp'),
  2: require('../../assets/cards/2.webp'),
  3: require('../../assets/cards/3.webp'),
  4: require('../../assets/cards/4.webp'),
  5: require('../../assets/cards/5.webp'),
  6: require('../../assets/cards/6.webp'),
  7: require('../../assets/cards/7.webp'),
  8: require('../../assets/cards/8.webp'),
  9: require('../../assets/cards/9.webp'),
  10: require('../../assets/cards/10.webp'),
  11: require('../../assets/cards/11.webp'),
  12: require('../../assets/cards/12.webp'),
  13: require('../../assets/cards/13.webp'),
  14: require('../../assets/cards/14.webp'),
  15: require('../../assets/cards/15.webp'),
  16: require('../../assets/cards/16.webp'),
  17: require('../../assets/cards/17.webp'),
  18: require('../../assets/cards/18.webp'),
  19: require('../../assets/cards/19.webp'),
  20: require('../../assets/cards/20.webp'),
  21: require('../../assets/cards/21.webp'),
  22: require('../../assets/cards/22.webp'),
  23: require('../../assets/cards/23.webp'),
  24: require('../../assets/cards/24.webp'),
  25: require('../../assets/cards/25.webp'),
  26: require('../../assets/cards/26.webp'),
  27: require('../../assets/cards/27.webp'),
  28: require('../../assets/cards/28.webp'),
  29: require('../../assets/cards/29.webp'),
  30: require('../../assets/cards/30.webp'),
  31: require('../../assets/cards/31.webp'),
  32: require('../../assets/cards/32.webp'),
  33: require('../../assets/cards/33.webp'),
  34: require('../../assets/cards/34.webp'),
  35: require('../../assets/cards/35.webp'),
  36: require('../../assets/cards/36.webp'),
  37: require('../../assets/cards/37.webp'),
  38: require('../../assets/cards/38.webp'),
  39: require('../../assets/cards/39.webp'),
  40: require('../../assets/cards/40.webp'),
  41: require('../../assets/cards/41.webp'),
  42: require('../../assets/cards/42.webp'),
  43: require('../../assets/cards/43.webp'),
  44: require('../../assets/cards/44.webp'),
  45: require('../../assets/cards/45.webp'),
  46: require('../../assets/cards/46.webp'),
  47: require('../../assets/cards/47.webp'),
  48: require('../../assets/cards/48.webp'),
  49: require('../../assets/cards/49.webp'),
  50: require('../../assets/cards/50.webp'),
  51: require('../../assets/cards/51.webp'),
  52: require('../../assets/cards/52.webp'),
  53: require('../../assets/cards/53.webp'),
  54: require('../../assets/cards/54.webp'),
  55: require('../../assets/cards/55.webp'),
  56: require('../../assets/cards/56.webp'),
  57: require('../../assets/cards/57.webp'),
  58: require('../../assets/cards/58.webp'),
  59: require('../../assets/cards/59.webp'),
  60: require('../../assets/cards/60.webp'),
  61: require('../../assets/cards/61.webp'),
  62: require('../../assets/cards/62.webp'),
  63: require('../../assets/cards/63.webp'),
  64: require('../../assets/cards/64.webp'),
  65: require('../../assets/cards/65.webp'),
  66: require('../../assets/cards/66.webp'),
  67: require('../../assets/cards/67.webp'),
  68: require('../../assets/cards/68.webp'),
  69: require('../../assets/cards/69.webp'),
  70: require('../../assets/cards/70.webp'),
  71: require('../../assets/cards/71.webp'),
  72: require('../../assets/cards/72.webp'),
  73: require('../../assets/cards/73.webp'),
  74: require('../../assets/cards/74.webp'),
  75: require('../../assets/cards/75.webp'),
  76: require('../../assets/cards/76.webp'),
  77: require('../../assets/cards/77.webp'),
};

/** Иллюстрация карты по её id (0-77). undefined — если id вне колоды. */
export function getTarotCardImageById(id: number): ImageSourcePropType | undefined {
  return CARD_IMAGES[id];
}

/**
 * Иллюстрация карты Таро.
 * Перевёрнутое положение НЕ меняет картинку: она одна и та же, а поворот
 * на 180° делается стилем на <Image> (см. REVERSED_IMAGE_STYLE).
 */
export function getTarotCardImage(card: Pick<TarotCard, 'id'>): ImageSourcePropType | undefined {
  return CARD_IMAGES[card.id];
}

/** Стиль для перевёрнутой карты — разворот картинки на 180°. */
export const REVERSED_IMAGE_STYLE = { transform: [{ rotate: '180deg' }] } as const;

export default CARD_IMAGES;
