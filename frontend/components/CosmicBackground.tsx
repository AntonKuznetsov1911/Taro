import React, { useEffect, useState, useMemo } from 'react';

/**
 * Реалистичный космический фон
 * Естественное мерцание звезд, редкие падающие звезды в случайных направлениях
 */

const STAR_COUNT = 180;
const SHOOTING_STAR_COUNT = 3;

interface Star {
  id: string;
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinkleDuration: number;
  twinkleDelay: number;
  color: string;
  twinkleIntensity: number;
}

interface ShootingStar {
  id: string;
  startX: number;
  startY: number;
  angle: number;
  speed: number;
  delay: number;
  length: number;
}

interface Planet {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  glowColor: string;
  driftDuration: number;
}

const generateStars = (): Star[] => {
  const stars: Star[] = [];
  const starColors = [
    '#FFFFFF',    // Белый
    '#FFF8E7',    // Теплый белый
    '#E6F0FF',    // Холодный белый
    '#FFE4C4',    // Бледно-оранжевый
    '#B0C4DE',    // Светло-стальной
    '#FFFAF0',    // Цветочно-белый
  ];

  for (let i = 0; i < STAR_COUNT; i++) {
    const size = Math.random();
    const isBright = size > 0.85;

    stars.push({
      id: `star-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: isBright ? Math.random() * 2 + 1.5 : Math.random() * 1.5 + 0.3,
      baseOpacity: isBright ? Math.random() * 0.3 + 0.7 : Math.random() * 0.5 + 0.2,
      twinkleDuration: Math.random() * 4 + 2, // 2-6 секунд
      twinkleDelay: Math.random() * 8,
      color: starColors[Math.floor(Math.random() * starColors.length)],
      twinkleIntensity: isBright ? Math.random() * 0.4 + 0.3 : Math.random() * 0.3 + 0.1,
    });
  }

  return stars;
};

const generateShootingStars = (): ShootingStar[] => {
  const shootingStars: ShootingStar[] = [];

  for (let i = 0; i < SHOOTING_STAR_COUNT; i++) {
    // Случайная начальная позиция по краям экрана
    const side = Math.floor(Math.random() * 4);
    let startX: number, startY: number;
    let baseAngle: number;

    switch (side) {
      case 0: // Сверху
        startX = Math.random() * 100;
        startY = -5;
        baseAngle = Math.random() * 60 + 110; // 110-170 градусов (вниз)
        break;
      case 1: // Справа
        startX = 105;
        startY = Math.random() * 60;
        baseAngle = Math.random() * 60 + 170; // 170-230 градусов (влево-вниз)
        break;
      case 2: // Слева
        startX = -5;
        startY = Math.random() * 60;
        baseAngle = Math.random() * 60 + 290; // 290-350 или -10-50 (вправо-вниз)
        break;
      default: // Сверху справа
        startX = Math.random() * 40 + 60;
        startY = -5;
        baseAngle = Math.random() * 40 + 200; // 200-240 градусов (влево-вниз)
    }

    shootingStars.push({
      id: `shooting-${i}`,
      startX,
      startY,
      angle: baseAngle,
      speed: Math.random() * 1.5 + 0.8, // Скорость пролета
      delay: Math.random() * 25 + i * 12, // Большие интервалы между звездами
      length: Math.random() * 40 + 30,
    });
  }

  return shootingStars;
};

const generatePlanets = (): Planet[] => {
  return [
    {
      id: 'planet-1',
      x: 85,
      y: 15,
      size: 25,
      color: '#8B4513',
      glowColor: 'rgba(139, 69, 19, 0.2)',
      driftDuration: 120,
    },
    {
      id: 'planet-2',
      x: 12,
      y: 72,
      size: 18,
      color: '#CD853F',
      glowColor: 'rgba(205, 133, 63, 0.15)',
      driftDuration: 150,
    },
  ];
};

export const CosmicBackground: React.FC = () => {
  const stars = useMemo(() => generateStars(), []);
  const shootingStars = useMemo(() => generateShootingStars(), []);
  const planets = useMemo(() => generatePlanets(), []);

  useEffect(() => {
    const styleId = 'cosmic-background-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes realisticTwinkle {
          0%, 100% {
            opacity: var(--base-opacity);
            transform: scale(1);
          }
          25% {
            opacity: calc(var(--base-opacity) - var(--twinkle-intensity) * 0.5);
            transform: scale(0.95);
          }
          50% {
            opacity: calc(var(--base-opacity) + var(--twinkle-intensity));
            transform: scale(1.1);
          }
          75% {
            opacity: calc(var(--base-opacity) - var(--twinkle-intensity) * 0.3);
            transform: scale(0.98);
          }
        }

        @keyframes subtleTwinkle {
          0%, 100% { opacity: var(--base-opacity); }
          30% { opacity: calc(var(--base-opacity) * 0.7); }
          60% { opacity: calc(var(--base-opacity) * 1.2); }
          80% { opacity: calc(var(--base-opacity) * 0.85); }
        }

        @keyframes shootingStarFly {
          0% {
            transform: translate(0, 0) rotate(var(--angle));
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          85% {
            opacity: 0.8;
          }
          100% {
            transform: translate(var(--travel-x), var(--travel-y)) rotate(var(--angle));
            opacity: 0;
          }
        }

        @keyframes planetDrift {
          0%, 100% {
            transform: translate(0, 0);
          }
          25% {
            transform: translate(3px, -2px);
          }
          50% {
            transform: translate(-1px, 4px);
          }
          75% {
            transform: translate(-2px, -1px);
          }
        }

        @keyframes nebulaBreath {
          0%, 100% {
            opacity: 0.06;
            transform: scale(1);
          }
          50% {
            opacity: 0.12;
            transform: scale(1.05);
          }
        }

        .realistic-star {
          animation: realisticTwinkle ease-in-out infinite;
        }

        .subtle-star {
          animation: subtleTwinkle ease-in-out infinite;
        }

        .shooting-star-element {
          animation: shootingStarFly linear infinite;
        }

        .shooting-star-element::before {
          content: '';
          position: absolute;
          width: var(--tail-length);
          height: 1px;
          background: linear-gradient(90deg, rgba(255,255,255,0.8), rgba(255,255,255,0.3), transparent);
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          border-radius: 50%;
        }

        .planet-element {
          animation: planetDrift ease-in-out infinite;
        }

        .nebula-element {
          animation: nebulaBreath ease-in-out infinite;
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
        background: 'linear-gradient(to bottom, #000005 0%, #0a0a15 30%, #0d0d1a 60%, #12101f 100%)',
      }}
    >
      {/* Тонкие туманности */}
      <div
        className="nebula-element"
        style={{
          position: 'absolute',
          left: '5%',
          top: '10%',
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(100, 50, 120, 0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animationDuration: '35s',
        }}
      />
      <div
        className="nebula-element"
        style={{
          position: 'absolute',
          right: '10%',
          bottom: '25%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(40, 60, 100, 0.06) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animationDuration: '45s',
          animationDelay: '10s',
        }}
      />
      <div
        className="nebula-element"
        style={{
          position: 'absolute',
          left: '40%',
          top: '50%',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(80, 40, 80, 0.05) 0%, transparent 70%)',
          filter: 'blur(35px)',
          animationDuration: '55s',
          animationDelay: '20s',
        }}
      />

      {/* Далекие планеты */}
      {planets.map((planet) => (
        <div
          key={planet.id}
          className="planet-element"
          style={{
            position: 'absolute',
            left: `${planet.x}%`,
            top: `${planet.y}%`,
            width: planet.size,
            height: planet.size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${planet.color}90 0%, ${planet.color}60 50%, ${planet.color}30 100%)`,
            boxShadow: `0 0 ${planet.size / 2}px ${planet.glowColor}`,
            animationDuration: `${planet.driftDuration}s`,
            opacity: 0.6,
          }}
        />
      ))}

      {/* Звезды с реалистичным мерцанием */}
      {stars.map((star) => {
        const isBright = star.size > 1.5;
        return (
          <div
            key={star.id}
            className={isBright ? 'realistic-star' : 'subtle-star'}
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              borderRadius: '50%',
              backgroundColor: star.color,
              boxShadow: isBright
                ? `0 0 ${star.size * 2}px ${star.color}80, 0 0 ${star.size}px ${star.color}`
                : `0 0 ${star.size}px ${star.color}60`,
              animationDuration: `${star.twinkleDuration}s`,
              animationDelay: `${star.twinkleDelay}s`,
              '--base-opacity': star.baseOpacity,
              '--twinkle-intensity': star.twinkleIntensity,
              pointerEvents: 'none',
            } as React.CSSProperties}
          />
        );
      })}

      {/* Падающие звезды - редкие и в разных направлениях */}
      {shootingStars.map((star) => {
        const radians = (star.angle * Math.PI) / 180;
        const travelDistance = 150;
        const travelX = Math.cos(radians) * travelDistance;
        const travelY = Math.sin(radians) * travelDistance;
        const duration = travelDistance / (star.speed * 50);

        return (
          <div
            key={star.id}
            className="shooting-star-element"
            style={{
              position: 'absolute',
              left: `${star.startX}%`,
              top: `${star.startY}%`,
              width: 2,
              height: 2,
              borderRadius: '50%',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 0 4px #FFFFFF, 0 0 8px rgba(255,255,255,0.5)',
              animationDuration: `${duration + 20}s`,
              animationDelay: `${star.delay}s`,
              '--angle': `${star.angle - 180}deg`,
              '--travel-x': `${travelX}vw`,
              '--travel-y': `${travelY}vh`,
              '--tail-length': `${star.length}px`,
              pointerEvents: 'none',
              zIndex: 2,
            } as React.CSSProperties}
          />
        );
      })}

      {/* Очень далекие мелкие звезды - статичные */}
      {[...Array(50)].map((_, i) => (
        <div
          key={`distant-${i}`}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: 0.5,
            height: 0.5,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            opacity: Math.random() * 0.3 + 0.1,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
};
