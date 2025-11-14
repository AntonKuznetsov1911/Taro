import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Конфигурация звезд
const STAR_COUNT = 150;
const SHOOTING_STAR_COUNT = 5;
const COMET_COUNT = 3;

interface Star {
  id: string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  animationDuration: number;
  animationDelay: number;
  type: 'static' | 'shooting' | 'comet';
}

const generateStars = (): Star[] => {
  const stars: Star[] = [];

  // Обычные мерцающие звезды
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      id: `star-${i}`,
      x: Math.random() * 100, // процент
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2,
      animationDuration: Math.random() * 3 + 2, // 2-5 секунд
      animationDelay: Math.random() * 5,
      type: 'static',
    });
  }

  // Падающие звезды
  for (let i = 0; i < SHOOTING_STAR_COUNT; i++) {
    stars.push({
      id: `shooting-${i}`,
      x: Math.random() * 80 + 10,
      y: -10,
      size: 2,
      opacity: 0.9,
      animationDuration: Math.random() * 2 + 1, // 1-3 секунды
      animationDelay: Math.random() * 10,
      type: 'shooting',
    });
  }

  // Кометы (большие, яркие)
  for (let i = 0; i < COMET_COUNT; i++) {
    stars.push({
      id: `comet-${i}`,
      x: Math.random() * 100,
      y: -20,
      size: 3,
      opacity: 1,
      animationDuration: Math.random() * 4 + 3, // 3-7 секунд
      animationDelay: Math.random() * 15,
      type: 'comet',
    });
  }

  return stars;
};

export const StarryBackground: React.FC = () => {
  const [stars] = useState<Star[]>(generateStars());

  useEffect(() => {
    // Добавляем CSS стили в head программно
    const styleId = 'starry-background-styles';
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

        .star-static {
          animation: twinkle linear infinite;
        }

        .star-shooting {
          animation: shootingStar linear infinite;
        }

        .star-comet {
          animation: comet linear infinite;
        }

        .star-comet::before {
          content: '';
          position: absolute;
          width: 100px;
          height: 2px;
          background: linear-gradient(90deg, rgba(135, 206, 235, 0.8), transparent);
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          box-shadow: 0 0 10px rgba(135, 206, 235, 0.8);
          pointer-events: none;
        }

        .star-shooting::before {
          content: '';
          position: absolute;
          width: 50px;
          height: 1px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.8), transparent);
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
      <View style={styles.container}>
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
              backgroundColor:
                star.type === 'comet'
                  ? '#87CEEB'
                  : star.type === 'shooting'
                  ? '#FFD700'
                  : '#FFFFFF',
              boxShadow:
                star.type === 'comet'
                  ? '0 0 10px rgba(135, 206, 235, 1), 0 0 20px rgba(135, 206, 235, 0.5)'
                  : star.type === 'shooting'
                  ? '0 0 8px rgba(255, 215, 0, 1)'
                  : '0 0 4px rgba(255, 255, 255, 0.8)',
              animationDuration: `${star.animationDuration}s`,
              animationDelay: `${star.animationDelay}s`,
              opacity: star.type === 'static' ? star.opacity : undefined,
              pointerEvents: 'none',
              zIndex: star.type === 'comet' ? 2 : star.type === 'shooting' ? 1 : 0,
            }}
          />
        ))}

        {/* Дополнительные эффекты - мерцающие частицы */}
        {[...Array(20)].map((_, i) => (
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
            }}
          />
        ))}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    zIndex: 0,
    pointerEvents: 'none',
  },
});
