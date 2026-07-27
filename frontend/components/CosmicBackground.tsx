import React, { useEffect, useMemo } from 'react';

/**
 * Реалистичный космический фон в стиле Млечного Пути
 * Живое мерцание звёзд, редкие падающие звёзды
 */

const STAR_LAYERS = {
  tiny: 400,      // Мелкие далёкие звёзды
  small: 150,     // Небольшие звёзды
  medium: 50,     // Средние звёзды
  bright: 20,     // Яркие крупные звёзды
};

const SHOOTING_STAR_COUNT = 3;

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
}

const starColors = {
  blue: ['#a8d4ff', '#7ec8e3', '#5dade2', '#85c1e9'],
  white: ['#ffffff', '#f8f9fa', '#ecf0f1', '#fdfefe'],
  yellow: ['#fff3cd', '#ffeaa7', '#f9e79f', '#fcf3cf'],
  orange: ['#ffcc80', '#ffb74d', '#ffa726', '#fb8c00'],
};

const getRandomColor = (layer: string): string => {
  const rand = Math.random();
  if (layer === 'bright') {
    if (rand < 0.4) return starColors.blue[Math.floor(Math.random() * starColors.blue.length)];
    if (rand < 0.7) return starColors.white[Math.floor(Math.random() * starColors.white.length)];
    if (rand < 0.9) return starColors.yellow[Math.floor(Math.random() * starColors.yellow.length)];
    return starColors.orange[Math.floor(Math.random() * starColors.orange.length)];
  }
  if (rand < 0.6) return starColors.white[Math.floor(Math.random() * starColors.white.length)];
  if (rand < 0.85) return starColors.blue[Math.floor(Math.random() * starColors.blue.length)];
  return starColors.yellow[Math.floor(Math.random() * starColors.yellow.length)];
};

const generateStars = (): Star[] => {
  const stars: Star[] = [];

  const createStarsForLayer = (count: number, layer: 'tiny' | 'small' | 'medium' | 'bright') => {
    const sizeRanges = {
      tiny: [0.3, 0.8],
      small: [0.8, 1.5],
      medium: [1.5, 2.5],
      bright: [2.5, 4],
    };
    const opacityRanges = {
      tiny: [0.2, 0.5],
      small: [0.4, 0.7],
      medium: [0.6, 0.9],
      bright: [0.8, 1],
    };

    for (let i = 0; i < count; i++) {
      const [minSize, maxSize] = sizeRanges[layer];
      const [minOpacity, maxOpacity] = opacityRanges[layer];

      // Концентрация звёзд к центру (Млечный Путь)
      let y = Math.random() * 100;
      const milkyWayBias = Math.random();
      if (milkyWayBias < 0.4) {
        // 40% звёзд ближе к центральной полосе
        y = 35 + Math.random() * 30;
      }

      stars.push({
        id: `${layer}-${i}`,
        x: Math.random() * 100,
        y,
        size: Math.random() * (maxSize - minSize) + minSize,
        color: getRandomColor(layer),
        opacity: Math.random() * (maxOpacity - minOpacity) + minOpacity,
        twinkleSpeed: Math.random() * 3 + 1.5,
        twinkleDelay: Math.random() * 5,
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
    const startFromTop = Math.random() < 0.7;

    shootingStars.push({
      id: `shooting-${i}`,
      startX: startFromTop ? Math.random() * 80 + 10 : (Math.random() < 0.5 ? -5 : 105),
      startY: startFromTop ? -5 : Math.random() * 40,
      angle: startFromTop ? Math.random() * 40 + 110 : (Math.random() < 0.5 ? Math.random() * 40 + 20 : Math.random() * 40 + 120),
      delay: Math.random() * 20 + i * 15,
      duration: Math.random() * 1.5 + 1,
    });
  }

  return shootingStars;
};

export const CosmicBackground: React.FC = () => {
  const stars = useMemo(() => generateStars(), []);
  const shootingStars = useMemo(() => generateShootingStars(), []);

  useEffect(() => {
    const styleId = 'cosmic-milkyway-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes twinkleTiny {
          0%, 100% { opacity: var(--base-opacity); }
          50% { opacity: calc(var(--base-opacity) * 0.3); }
        }

        @keyframes twinkleSmall {
          0%, 100% { opacity: var(--base-opacity); transform: scale(1); }
          25% { opacity: calc(var(--base-opacity) * 0.5); }
          50% { opacity: var(--base-opacity); transform: scale(1.1); }
          75% { opacity: calc(var(--base-opacity) * 0.6); }
        }

        @keyframes twinkleBright {
          0%, 100% {
            opacity: var(--base-opacity);
            transform: scale(1);
            box-shadow: 0 0 var(--glow-size) var(--star-color);
          }
          25% {
            opacity: calc(var(--base-opacity) * 0.7);
            transform: scale(0.9);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
            box-shadow: 0 0 calc(var(--glow-size) * 1.5) var(--star-color);
          }
          75% {
            opacity: calc(var(--base-opacity) * 0.8);
            transform: scale(1.05);
          }
        }

        @keyframes shootingStar {
          0% {
            transform: translate(0, 0) rotate(var(--angle));
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          80% {
            opacity: 0.8;
          }
          100% {
            transform: translate(var(--travel-x), var(--travel-y)) rotate(var(--angle));
            opacity: 0;
          }
        }

        @keyframes nebulaGlow {
          0%, 100% { opacity: 0.15; filter: blur(60px); }
          50% { opacity: 0.25; filter: blur(70px); }
        }

        .star-tiny {
          animation: twinkleTiny ease-in-out infinite;
        }

        .star-small {
          animation: twinkleSmall ease-in-out infinite;
        }

        .star-medium {
          animation: twinkleBright ease-in-out infinite;
        }

        .star-bright {
          animation: twinkleBright ease-in-out infinite;
        }

        .shooting-star {
          animation: shootingStar linear infinite;
        }

        .shooting-star::before {
          content: '';
          position: absolute;
          width: var(--tail-length);
          height: 1.5px;
          background: linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.4), transparent);
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-radius: 2px;
        }

        .nebula-cloud {
          animation: nebulaGlow 15s ease-in-out infinite;
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
        background: 'linear-gradient(to bottom, #000000 0%, #050510 30%, #0a0a18 50%, #050510 70%, #000000 100%)',
      }}
    >
      {/* Млечный Путь - центральная полоса */}
      <div
        style={{
          position: 'absolute',
          left: '-10%',
          top: '30%',
          width: '120%',
          height: '40%',
          background: `
            radial-gradient(ellipse 100% 100% at 30% 50%, rgba(255, 220, 180, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 100% 100% at 70% 50%, rgba(200, 180, 160, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 120% 80% at 50% 50%, rgba(180, 160, 140, 0.04) 0%, transparent 60%)
          `,
          filter: 'blur(30px)',
          transform: 'rotate(-5deg)',
        }}
      />

      {/* Тёмные пылевые полосы */}
      <div
        style={{
          position: 'absolute',
          left: '0%',
          top: '42%',
          width: '100%',
          height: '16%',
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.4) 20%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.4) 80%, transparent 100%)',
          filter: 'blur(15px)',
          transform: 'rotate(-3deg)',
        }}
      />

      {/* Цветные туманности */}
      <div
        className="nebula-cloud"
        style={{
          position: 'absolute',
          left: '5%',
          top: '35%',
          width: '200px',
          height: '150px',
          background: 'radial-gradient(ellipse, rgba(180, 100, 80, 0.2) 0%, transparent 70%)',
          borderRadius: '50%',
        }}
      />
      <div
        className="nebula-cloud"
        style={{
          position: 'absolute',
          right: '10%',
          top: '40%',
          width: '250px',
          height: '180px',
          background: 'radial-gradient(ellipse, rgba(200, 150, 100, 0.15) 0%, transparent 70%)',
          borderRadius: '50%',
          animationDelay: '5s',
        }}
      />
      <div
        className="nebula-cloud"
        style={{
          position: 'absolute',
          left: '30%',
          top: '45%',
          width: '180px',
          height: '120px',
          background: 'radial-gradient(ellipse, rgba(100, 80, 120, 0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          animationDelay: '10s',
        }}
      />

      {/* Звёзды по слоям */}
      {stars.map((star) => {
        const glowSize = star.layer === 'bright' ? star.size * 4 :
                        star.layer === 'medium' ? star.size * 2 : star.size;

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
              boxShadow: star.layer === 'bright' || star.layer === 'medium'
                ? `0 0 ${glowSize}px ${star.color}`
                : 'none',
              animationDuration: `${star.twinkleSpeed}s`,
              animationDelay: `${star.twinkleDelay}s`,
              '--base-opacity': star.opacity,
              '--star-color': star.color,
              '--glow-size': `${glowSize}px`,
              pointerEvents: 'none',
            } as React.CSSProperties}
          />
        );
      })}

      {/* Падающие звёзды */}
      {shootingStars.map((star) => {
        const radians = (star.angle * Math.PI) / 180;
        const travelDistance = 120;
        const travelX = Math.cos(radians) * travelDistance;
        const travelY = Math.sin(radians) * travelDistance;

        return (
          <div
            key={star.id}
            className="shooting-star"
            style={{
              position: 'absolute',
              left: `${star.startX}%`,
              top: `${star.startY}%`,
              width: 3,
              height: 3,
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 0 6px #ffffff, 0 0 12px rgba(255,255,255,0.5)',
              animationDuration: `${star.duration + 25}s`,
              animationDelay: `${star.delay}s`,
              '--angle': `${star.angle - 180}deg`,
              '--travel-x': `${travelX}vw`,
              '--travel-y': `${travelY}vh`,
              '--tail-length': '50px',
              pointerEvents: 'none',
              zIndex: 5,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};
