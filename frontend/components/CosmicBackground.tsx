import React, { useEffect, useState } from 'react';

/**
 * ЭПИЧНЫЙ КОСМИЧЕСКИЙ ФОН
 * С планетами, галактиками, туманностями, спутниками и падающими звездами
 */

const STAR_COUNT = 200;
const SHOOTING_STAR_COUNT = 8;
const COMET_COUNT = 4;
const PLANET_COUNT = 3;
const SATELLITE_COUNT = 2;

interface Star {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDuration: number;
  animationDelay: number;
  type: 'static' | 'shooting' | 'comet';
  color: string;
}

interface Planet {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  ringColor?: string;
  hasRing: boolean;
  animationDuration: number;
}

interface Satellite {
  id: string;
  x: number;
  y: number;
  animationDuration: number;
}

const generateStars = (): Star[] => {
  const stars: Star[] = [];
  const starColors = ['#FFFFFF', '#FFE4B5', '#87CEEB', '#FFB6C1', '#E6E6FA'];

  // Обычные мерцающие звезды
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      id: `star-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      animationDuration: Math.random() * 3 + 2,
      animationDelay: Math.random() * 5,
      type: 'static',
      color: starColors[Math.floor(Math.random() * starColors.length)],
    });
  }

  // Падающие звезды (метеоры)
  for (let i = 0; i < SHOOTING_STAR_COUNT; i++) {
    stars.push({
      id: `shooting-${i}`,
      x: Math.random() * 80 + 10,
      y: -10,
      size: 2,
      opacity: 1,
      animationDuration: Math.random() * 2 + 1,
      animationDelay: Math.random() * 10 + i * 2,
      type: 'shooting',
      color: '#FFD700',
    });
  }

  // Кометы (большие, яркие, с хвостом)
  for (let i = 0; i < COMET_COUNT; i++) {
    stars.push({
      id: `comet-${i}`,
      x: Math.random() * 100,
      y: -20,
      size: 3.5,
      opacity: 1,
      animationDuration: Math.random() * 5 + 4,
      animationDelay: Math.random() * 15 + i * 5,
      type: 'comet',
      color: '#87CEEB',
    });
  }

  return stars;
};

const generatePlanets = (): Planet[] => {
  const planets: Planet[] = [];
  const planetConfigs = [
    { color: '#FF6B6B', size: 80, hasRing: false }, // Красная планета (Марс-like)
    { color: '#4ECDC4', size: 100, hasRing: true, ringColor: '#FFD700' }, // Газовый гигант (Сатурн-like)
    { color: '#95E1D3', size: 60, hasRing: false }, // Ледяная планета (Нептун-like)
  ];

  for (let i = 0; i < PLANET_COUNT; i++) {
    const config = planetConfigs[i];
    planets.push({
      id: `planet-${i}`,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      size: config.size,
      color: config.color,
      hasRing: config.hasRing,
      ringColor: config.ringColor,
      animationDuration: Math.random() * 100 + 80, // Медленное движение
    });
  }

  return planets;
};

const generateSatellites = (): Satellite[] => {
  const satellites: Satellite[] = [];

  for (let i = 0; i < SATELLITE_COUNT; i++) {
    satellites.push({
      id: `satellite-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      animationDuration: Math.random() * 20 + 15,
    });
  }

  return satellites;
};

export const CosmicBackground: React.FC = () => {
  const [stars] = useState<Star[]>(generateStars());
  const [planets] = useState<Planet[]>(generatePlanets());
  const [satellites] = useState<Satellite[]>(generateSatellites());

  useEffect(() => {
    const styleId = 'cosmic-background-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }

        @keyframes shootingStar {
          0% {
            transform: translateY(0) translateX(0) rotate(45deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(100vw) rotate(45deg);
            opacity: 0;
          }
        }

        @keyframes comet {
          0% {
            transform: translateY(0) translateX(0) rotate(35deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(120vh) translateX(80vw) rotate(35deg);
            opacity: 0;
          }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 1; }
        }

        @keyframes floatPlanet {
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) translateX(10px) rotate(5deg);
          }
        }

        @keyframes rotateSatellite {
          0% {
            transform: translateX(0) translateY(0);
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(-100vw) translateY(50px);
            opacity: 0.6;
          }
        }

        @keyframes nebula {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.1);
          }
        }

        .star-static {
          animation: twinkle linear infinite;
        }

        .star-shooting {
          animation: shootingStar linear infinite;
        }

        .star-comet {
          animation: comet linear infinite;
        }

        .planet {
          animation: floatPlanet ease-in-out infinite;
          filter: drop-shadow(0 0 20px currentColor);
        }

        .satellite {
          animation: rotateSatellite linear infinite;
        }

        .nebula {
          animation: nebula ease-in-out infinite;
        }

        /* Хвосты комет */
        .star-comet::before {
          content: '';
          position: absolute;
          width: 150px;
          height: 3px;
          background: linear-gradient(90deg, currentColor, transparent);
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          box-shadow: 0 0 15px currentColor;
          pointer-events: none;
          opacity: 0.8;
        }

        /* Хвосты метеоров */
        .star-shooting::before {
          content: '';
          position: absolute;
          width: 60px;
          height: 1.5px;
          background: linear-gradient(90deg, currentColor, transparent);
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          opacity: 0.9;
        }

        /* Кольца планет */
        .planet-ring {
          position: absolute;
          border: 3px solid;
          border-radius: 50%;
          opacity: 0.4;
          transform: rotateX(75deg);
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
        background: 'radial-gradient(ellipse at center, #1a0033 0%, #000000 100%)',
      }}
    >
      {/* Туманности (Nebulae) */}
      <div
        className="nebula"
        style={{
          position: 'absolute',
          left: '10%',
          top: '15%',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 107, 157, 0.15) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animationDuration: '20s',
        }}
      />
      <div
        className="nebula"
        style={{
          position: 'absolute',
          right: '15%',
          bottom: '20%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(78, 205, 196, 0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animationDuration: '25s',
          animationDelay: '5s',
        }}
      />
      <div
        className="nebula"
        style={{
          position: 'absolute',
          left: '50%',
          top: '40%',
          width: '350px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(155, 89, 182, 0.1) 0%, transparent 70%)',
          filter: 'blur(55px)',
          animationDuration: '30s',
          animationDelay: '10s',
        }}
      />

      {/* Планеты */}
      {planets.map((planet) => (
        <div
          key={planet.id}
          className="planet"
          style={{
            position: 'absolute',
            left: `${planet.x}%`,
            top: `${planet.y}%`,
            width: planet.size,
            height: planet.size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 30% 30%, ${planet.color}, ${planet.color}dd)`,
            animationDuration: `${planet.animationDuration}s`,
            color: planet.color,
            boxShadow: `inset -10px -10px 20px rgba(0, 0, 0, 0.5), 0 0 30px ${planet.color}66`,
          }}
        >
          {planet.hasRing && (
            <>
              <div
                className="planet-ring"
                style={{
                  width: planet.size * 1.8,
                  height: planet.size * 1.8,
                  borderColor: planet.ringColor,
                  left: `${-planet.size * 0.4}px`,
                  top: `${-planet.size * 0.4}px`,
                }}
              />
              <div
                className="planet-ring"
                style={{
                  width: planet.size * 2.2,
                  height: planet.size * 2.2,
                  borderColor: planet.ringColor,
                  left: `${-planet.size * 0.6}px`,
                  top: `${-planet.size * 0.6}px`,
                  borderWidth: '2px',
                }}
              />
            </>
          )}
        </div>
      ))}

      {/* Спутники */}
      {satellites.map((satellite) => (
        <div
          key={satellite.id}
          className="satellite"
          style={{
            position: 'absolute',
            left: `${satellite.x}%`,
            top: `${satellite.y}%`,
            width: 8,
            height: 8,
            animationDuration: `${satellite.animationDuration}s`,
          }}
        >
          {/* Корпус спутника */}
          <div
            style={{
              width: 8,
              height: 8,
              background: '#C0C0C0',
              borderRadius: '2px',
              boxShadow: '0 0 5px rgba(255, 255, 255, 0.8)',
            }}
          />
          {/* Солнечные панели */}
          <div
            style={{
              position: 'absolute',
              width: 3,
              height: 12,
              background: 'linear-gradient(to bottom, #4169E1, #1E90FF)',
              left: -5,
              top: -2,
              opacity: 0.7,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 3,
              height: 12,
              background: 'linear-gradient(to bottom, #4169E1, #1E90FF)',
              right: -5,
              top: -2,
              opacity: 0.7,
            }}
          />
          {/* Мигающий огонек */}
          <div
            style={{
              position: 'absolute',
              width: 2,
              height: 2,
              background: '#FF0000',
              borderRadius: '50%',
              top: 3,
              left: 3,
              animation: 'pulse 1s ease-in-out infinite',
              boxShadow: '0 0 4px #FF0000',
            }}
          />
        </div>
      ))}

      {/* Звезды, метеоры и кометы */}
      {stars.map((star) => (
        <div
          key={star.id}
          className={`star-${star.type}`}
          style={{
            position: 'absolute',
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            backgroundColor: star.color,
            color: star.color,
            boxShadow:
              star.type === 'comet'
                ? `0 0 10px ${star.color}, 0 0 20px ${star.color}99`
                : star.type === 'shooting'
                ? `0 0 8px ${star.color}`
                : `0 0 4px ${star.color}dd`,
            animationDuration: `${star.animationDuration}s`,
            animationDelay: `${star.animationDelay}s`,
            opacity: star.type === 'static' ? star.opacity : undefined,
            pointerEvents: 'none',
            zIndex: star.type === 'comet' ? 3 : star.type === 'shooting' ? 2 : 1,
          }}
        />
      ))}

      {/* Дополнительные мерцающие частицы */}
      {[...Array(30)].map((_, i) => (
        <div
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: 1,
            height: 1,
            borderRadius: '50%',
            backgroundColor: '#FFF',
            animation: `pulse ${Math.random() * 2 + 1}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
            pointerEvents: 'none',
            boxShadow: '0 0 2px #FFF',
          }}
        />
      ))}
    </div>
  );
};
