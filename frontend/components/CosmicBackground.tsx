import React, { useEffect, useMemo } from 'react';

/**
 * Реалистичный космический фон в стиле Млечного Пути
 * Мелкие мерцающие звёзды, падающие звёзды с хвостами
 */

const STAR_LAYERS = {
  tiny: 500,      // Очень мелкие далёкие звёзды
  small: 200,     // Небольшие звёзды
  medium: 40,     // Средние звёзды
  bright: 12,     // Яркие крупные звёзды
};

const SHOOTING_STAR_COUNT = 0;

interface Star {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  twinkleSpeed: number;
  twinkleDelay: number;
  layer: 'tiny' | 'small' | 'medium' | 'bright';
}

interface ShootingStar {
  id: string;
  startX: number;
  startY: number;
  angle: number;
  delay: number;
  duration: number;
  tailLength: number;
  hasTail: boolean;
}

const starColors = {
  blue: ['#c8e4ff', '#a8d4ff', '#7ec8e3'],
  white: ['#ffffff', '#f8f9fa', '#ecf0f1'],
  yellow: ['#fff8e7', '#fff3cd', '#ffeaa7'],
  orange: ['#ffe4c4', '#ffd9b3'],
};

const getRandomColor = (layer: string): string => {
  const rand = Math.random();
  if (layer === 'bright') {
    if (rand < 0.4) return starColors.blue[Math.floor(Math.random() * starColors.blue.length)];
    if (rand < 0.75) return starColors.white[Math.floor(Math.random() * starColors.white.length)];
    return starColors.yellow[Math.floor(Math.random() * starColors.yellow.length)];
  }
  if (rand < 0.7) return starColors.white[Math.floor(Math.random() * starColors.white.length)];
  return starColors.blue[Math.floor(Math.random() * starColors.blue.length)];
};

const generateStars = (): Star[] => {
  const stars: Star[] = [];

  const createStarsForLayer = (count: number, layer: 'tiny' | 'small' | 'medium' | 'bright') => {
    // Уменьшенные размеры звёзд
    const sizeRanges = {
      tiny: [0.2, 0.5],
      small: [0.5, 1.0],
      medium: [1.0, 1.8],
      bright: [1.8, 2.8],
    };
    const opacityRanges = {
      tiny: [0.15, 0.4],
      small: [0.3, 0.6],
      medium: [0.5, 0.85],
      bright: [0.75, 1],
    };

    for (let i = 0; i < count; i++) {
      const [minSize, maxSize] = sizeRanges[layer];
      const [minOpacity, maxOpacity] = opacityRanges[layer];

      // Концентрация звёзд к центру (Млечный Путь)
      let y = Math.random() * 100;
      const milkyWayBias = Math.random();
      if (milkyWayBias < 0.35) {
        y = 35 + Math.random() * 30;
      }

      stars.push({
        id: `${layer}-${i}`,
        x: Math.random() * 100,
        y,
        size: Math.random() * (maxSize - minSize) + minSize,
        color: getRandomColor(layer),
        opacity: Math.random() * (maxOpacity - minOpacity) + minOpacity,
        twinkleSpeed: Math.random() * 3 + 2,
        twinkleDelay: Math.random() * 6,
        layer,
      });
    }
  };

  createStarsForLayer(STAR_LAYERS.tiny, 'tiny');
  createStarsForLayer(STAR_LAYERS.small, 'small');
  createStarsForLayer(STAR_LAYERS.medium, 'medium');
  createStarsForLayer(STAR_LAYERS.bright, 'bright');

  return stars;
};

const generateShootingStars = (): ShootingStar[] => {
  const shootingStars: ShootingStar[] = [];

  for (let i = 0; i < SHOOTING_STAR_COUNT; i++) {
    // Падающие звёзды всегда начинаются сверху и падают вниз
    const startX = Math.random() * 90 + 5; // 5-95% по горизонтали
    const startY = Math.random() * 20 - 5; // -5 до 15% (начинают сверху)

    // Угол падения: 60-120 градусов (вниз с небольшим отклонением)
    // 90 = строго вниз, 60-90 = вправо-вниз, 90-120 = влево-вниз
    const angle = Math.random() * 60 + 60;

    // У некоторых звёзд есть хвост
    const hasTail = Math.random() < 0.7; // 70% с хвостом
    const tailLength = hasTail ? Math.random() * 30 + 20 : 0; // 20-50px хвост

    shootingStars.push({
      id: `shooting-${i}`,
      startX,
      startY,
      angle,
      delay: Math.random() * 15 + i * 12, // Разные интервалы
      duration: Math.random() * 0.8 + 0.6, // 0.6-1.4 секунды (быстрее)
      tailLength,
      hasTail,
    });
  }

  return shootingStars;
};

export const CosmicBackground: React.FC = () => {
  const stars = useMemo(() => generateStars(), []);
  const shootingStars = useMemo(() => generateShootingStars(), []);

  useEffect(() => {
    const styleId = 'cosmic-milkyway-styles-v2';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes twinkleTiny {
          0%, 100% { opacity: var(--base-opacity); }
          50% { opacity: calc(var(--base-opacity) * 0.3); }
        }

        @keyframes twinkleSmall {
          0%, 100% { opacity: var(--base-opacity); }
          30% { opacity: calc(var(--base-opacity) * 0.4); }
          60% { opacity: calc(var(--base-opacity) * 1.1); }
          80% { opacity: calc(var(--base-opacity) * 0.6); }
        }

        @keyframes twinkleBright {
          0%, 100% {
            opacity: var(--base-opacity);
            transform: scale(1);
          }
          30% {
            opacity: calc(var(--base-opacity) * 0.6);
            transform: scale(0.95);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
          70% {
            opacity: calc(var(--base-opacity) * 0.75);
            transform: scale(1);
          }
        }

        @keyframes fallingStarWithTail {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          3% {
            opacity: 1;
          }
          85% {
            opacity: 0.9;
          }
          100% {
            transform: translate(var(--travel-x), var(--travel-y));
            opacity: 0;
          }
        }

        @keyframes nebulaGlow {
          0%, 100% { opacity: 0.12; }
          50% { opacity: 0.2; }
        }

        .star-tiny { animation: twinkleTiny ease-in-out infinite; }
        .star-small { animation: twinkleSmall ease-in-out infinite; }
        .star-medium { animation: twinkleBright ease-in-out infinite; }
        .star-bright { animation: twinkleBright ease-in-out infinite; }

        .falling-star {
          animation: fallingStarWithTail linear infinite;
        }

        /* Хвост падающей звезды */
        .falling-star::after {
          content: '';
          position: absolute;
          width: var(--tail-length);
          height: 1px;
          background: linear-gradient(to left,
            rgba(255,255,255,0.9) 0%,
            rgba(255,255,255,0.5) 20%,
            rgba(255,255,255,0.2) 50%,
            transparent 100%
          );
          right: 100%;
          top: 50%;
          transform: translateY(-50%) rotate(calc(var(--angle) - 180deg));
          transform-origin: right center;
          border-radius: 1px;
        }

        .nebula-cloud {
          animation: nebulaGlow 20s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none',
        background: 'linear-gradient(to bottom, #000000 0%, #030308 30%, #050510 50%, #030308 70%, #000000 100%)',
      }}
    >
      {/* Млечный Путь - центральная полоса */}
      <div
        style={{
          position: 'absolute',
          left: '-10%',
          top: '32%',
          width: '120%',
          height: '36%',
          background: `
            radial-gradient(ellipse 100% 100% at 30% 50%, rgba(255, 220, 180, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 100% 100% at 70% 50%, rgba(200, 180, 160, 0.04) 0%, transparent 50%),
            radial-gradient(ellipse 120% 80% at 50% 50%, rgba(180, 160, 140, 0.03) 0%, transparent 60%)
          `,
          filter: 'blur(40px)',
          transform: 'rotate(-5deg)',
        }}
      />

      {/* Тёмные пылевые полосы */}
      <div
        style={{
          position: 'absolute',
          left: '0%',
          top: '44%',
          width: '100%',
          height: '12%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 80%, transparent 100%)',
          filter: 'blur(20px)',
          transform: 'rotate(-3deg)',
        }}
      />

      {/* Цветные туманности */}
      <div
        className="nebula-cloud"
        style={{
          position: 'absolute',
          left: '5%',
          top: '38%',
          width: '180px',
          height: '120px',
          background: 'radial-gradient(ellipse, rgba(160, 80, 60, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(30px)',
        }}
      />
      <div
        className="nebula-cloud"
        style={{
          position: 'absolute',
          right: '10%',
          top: '42%',
          width: '200px',
          height: '140px',
          background: 'radial-gradient(ellipse, rgba(180, 130, 80, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(35px)',
          animationDelay: '7s',
        }}
      />

      {/* Звёзды по слоям */}
      {stars.map((star) => {
        const glowSize = star.layer === 'bright' ? star.size * 3 :
                        star.layer === 'medium' ? star.size * 1.5 : 0;

        return (
          <div
            key={star.id}
            className={`star-${star.layer}`}
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              borderRadius: '50%',
              backgroundColor: star.color,
              boxShadow: glowSize > 0 ? `0 0 ${glowSize}px ${star.color}` : 'none',
              animationDuration: `${star.twinkleSpeed}s`,
              animationDelay: `${star.twinkleDelay}s`,
              '--base-opacity': star.opacity,
              pointerEvents: 'none',
            } as React.CSSProperties}
          />
        );
      })}

      {/* Падающие звёзды */}
      {shootingStars.map((star) => {
        const radians = (star.angle * Math.PI) / 180;
        const travelDistance = 80 + Math.random() * 40; // 80-120vh
        const travelX = Math.cos(radians) * travelDistance;
        const travelY = Math.sin(radians) * travelDistance;

        return (
          <div
            key={star.id}
            className="falling-star"
            style={{
              position: 'absolute',
              left: `${star.startX}%`,
              top: `${star.startY}%`,
              width: 2,
              height: 2,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 0 4px #ffffff',
              animationDuration: `${star.duration + 20}s`,
              animationDelay: `${star.delay}s`,
              '--travel-x': `${travelX}vh`,
              '--travel-y': `${travelY}vh`,
              '--tail-length': `${star.tailLength}px`,
              '--angle': `${star.angle}deg`,
              pointerEvents: 'none',
              zIndex: 5,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};
