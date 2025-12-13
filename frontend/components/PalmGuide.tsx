import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface GuideSection {
  id: string;
  title: string;
  icon: string;
  content: GuideItem[];
}

interface GuideItem {
  name: string;
  nameRu: string;
  description: string;
  details?: string[];
}

const PALM_GUIDE_DATA: GuideSection[] = [
  {
    id: 'lines',
    title: 'Основные линии',
    icon: 'hand-left-outline',
    content: [
      {
        name: 'Heart Line',
        nameRu: 'Линия Сердца',
        description: 'Отражает эмоции, любовь и отношения',
        details: [
          'Расположена в верхней части ладони',
          'Идет от края под мизинцем к указательному пальцу',
          'Глубокая линия - глубокие эмоции и страстная натура',
          'Прямая линия - практичный подход к отношениям',
          'Изогнутая - романтичность и эмоциональность',
        ],
      },
      {
        name: 'Head Line',
        nameRu: 'Линия Ума',
        description: 'Отражает интеллект, мышление и принятие решений',
        details: [
          'Идет горизонтально через центр ладони',
          'Длинная линия - аналитический склад ума',
          'Короткая - практичное мышление',
          'Прямая - логичность и рациональность',
          'Изогнутая - творческий подход',
        ],
      },
      {
        name: 'Life Line',
        nameRu: 'Линия Жизни',
        description: 'Отражает жизненную энергию и общее здоровье',
        details: [
          'Огибает холм Венеры у основания большого пальца',
          'Длинная глубокая линия - крепкое здоровье',
          'Не показывает продолжительность жизни!',
          'Отражает качество жизни и жизненную силу',
          'Разрывы могут указывать на важные перемены',
        ],
      },
      {
        name: 'Fate Line',
        nameRu: 'Линия Судьбы',
        description: 'Отражает жизненный путь и карьеру',
        details: [
          'Идет вертикально от запястья к среднему пальцу',
          'Есть не у всех людей',
          'Четкая линия - ясное направление в жизни',
          'Прерывистая - изменения в карьере',
          'Отсутствие не означает отсутствие судьбы',
        ],
      },
      {
        name: 'Sun Line',
        nameRu: 'Линия Солнца',
        description: 'Отражает успех, славу и счастье',
        details: [
          'Параллельна линии Судьбы',
          'Идет к безымянному пальцу',
          'Признак таланта и творческих способностей',
          'Указывает на публичное признание',
        ],
      },
    ],
  },
  {
    id: 'mounts',
    title: 'Холмы ладони',
    icon: 'mountain-outline',
    content: [
      {
        name: 'Mount of Venus',
        nameRu: 'Холм Венеры',
        description: 'Любовь, страсть, чувственность',
        details: [
          'Находится у основания большого пальца',
          'Высокий холм - страстность, витальность',
          'Плоский - сдержанность в чувствах',
          'Отражает способность любить и получать любовь',
        ],
      },
      {
        name: 'Mount of Jupiter',
        nameRu: 'Холм Юпитера',
        description: 'Амбиции, лидерство, уверенность',
        details: [
          'Расположен под указательным пальцем',
          'Развитый холм - лидерские качества',
          'Указывает на амбиции и стремление к власти',
          'Связан с самооценкой и авторитетом',
        ],
      },
      {
        name: 'Mount of Saturn',
        nameRu: 'Холм Сатурна',
        description: 'Мудрость, дисциплина, ответственность',
        details: [
          'Находится под средним пальцем',
          'Развитый холм - серьезность, ответственность',
          'Связан с кармой и жизненными уроками',
          'Указывает на склонность к одиночеству и размышлениям',
        ],
      },
      {
        name: 'Mount of Apollo',
        nameRu: 'Холм Аполлона',
        description: 'Творчество, искусство, красота',
        details: [
          'Расположен под безымянным пальцем',
          'Развитый холм - творческие способности',
          'Связан с артистизмом и эстетическим чувством',
          'Указывает на стремление к гармонии',
        ],
      },
      {
        name: 'Mount of Mercury',
        nameRu: 'Холм Меркурия',
        description: 'Коммуникация, бизнес, интеллект',
        details: [
          'Находится под мизинцем',
          'Развитый холм - красноречие, деловая хватка',
          'Связан с общением и торговлей',
          'Указывает на способность к языкам и науке',
        ],
      },
      {
        name: 'Mount of Moon',
        nameRu: 'Холм Луны',
        description: 'Воображение, интуиция, мечты',
        details: [
          'Расположен на внешней стороне ладони напротив большого пальца',
          'Развитый холм - богатое воображение',
          'Связан с подсознанием и интуицией',
          'Указывает на творческое мышление и мечтательность',
        ],
      },
    ],
  },
  {
    id: 'shapes',
    title: 'Формы руки',
    icon: 'hand-right-outline',
    content: [
      {
        name: 'Earth Hand',
        nameRu: 'Земная рука',
        description: 'Практичность, надежность, стабильность',
        details: [
          'Квадратная ладонь, короткие пальцы',
          'Практичные, приземленные люди',
          'Ценят материальные блага и стабильность',
          'Надежные, трудолюбивые, консервативные',
        ],
      },
      {
        name: 'Air Hand',
        nameRu: 'Воздушная рука',
        description: 'Интеллект, общение, любознательность',
        details: [
          'Квадратная ладонь, длинные пальцы',
          'Интеллектуалы, мыслители',
          'Общительные, социально активные',
          'Любознательные, аналитические',
        ],
      },
      {
        name: 'Water Hand',
        nameRu: 'Водная рука',
        description: 'Эмоциональность, интуиция, чувствительность',
        details: [
          'Длинная ладонь, длинные пальцы',
          'Эмоциональные, чувствительные',
          'Интуитивные, эмпатичные',
          'Творческие, мечтательные',
        ],
      },
      {
        name: 'Fire Hand',
        nameRu: 'Огненная рука',
        description: 'Энергичность, страстность, лидерство',
        details: [
          'Длинная ладонь, короткие пальцы',
          'Энергичные, активные',
          'Страстные, импульсивные',
          'Лидеры, предприниматели',
        ],
      },
    ],
  },
  {
    id: 'signs',
    title: 'Особые знаки',
    icon: 'star-outline',
    content: [
      {
        name: 'Star',
        nameRu: 'Звезда',
        description: 'Успех, внезапные события, удача',
        details: [
          'Пересечение трех или более линий',
          'На холмах - усиление качеств холма',
          'На линиях - важное событие',
          'Обычно позитивный знак',
        ],
      },
      {
        name: 'Triangle',
        nameRu: 'Треугольник',
        description: 'Талант, способности, защита',
        details: [
          'Три линии образуют треугольник',
          'Указывает на особые таланты',
          'Знак умственных способностей',
          'Защита от негатива',
        ],
      },
      {
        name: 'Cross',
        nameRu: 'Крест',
        description: 'Испытания, важные решения',
        details: [
          'Две пересекающиеся линии',
          'Может указывать на препятствия',
          'Требует внимания к деталям',
          'Важные жизненные перекрестки',
        ],
      },
      {
        name: 'Square',
        nameRu: 'Квадрат',
        description: 'Защита, исцеление, сохранение',
        details: [
          'Четыре линии образуют квадрат',
          'Знак защиты и ограждения',
          'На разрывах линий - исцеление',
          'Сохранение от опасности',
        ],
      },
      {
        name: 'Island',
        nameRu: 'Остров',
        description: 'Период трудностей или раздвоения',
        details: [
          'Овальная петля на линии',
          'Указывает на период сложностей',
          'Может означать раздвоение энергии',
          'Временное состояние, проходит',
        ],
      },
    ],
  },
];

export const PalmGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('lines');
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const activeData = PALM_GUIDE_DATA.find((s) => s.id === activeSection);

  return (
    <View style={styles.container}>
      {/* Section Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {PALM_GUIDE_DATA.map((section) => (
          <TouchableOpacity
            key={section.id}
            style={[
              styles.tab,
              activeSection === section.id && styles.tabActive,
            ]}
            onPress={() => {
              setActiveSection(section.id);
              setExpandedItem(null);
            }}
          >
            <Ionicons
              name={section.icon as any}
              size={20}
              color={activeSection === section.id ? '#9B59B6' : '#E8E8E8'}
            />
            <Text
              style={[
                styles.tabText,
                activeSection === section.id && styles.tabTextActive,
              ]}
            >
              {section.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeData?.content.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.itemContainer}
            onPress={() => setExpandedItem(expandedItem === index ? null : index)}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={
                expandedItem === index
                  ? ['rgba(155, 89, 182, 0.25)', 'rgba(142, 68, 173, 0.25)']
                  : ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.2)']
              }
              style={styles.itemGradient}
            >
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleContainer}>
                  <Text style={styles.itemNameRu}>{item.nameRu}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <Ionicons
                  name={expandedItem === index ? 'chevron-up' : 'chevron-down'}
                  size={24}
                  color="#9B59B6"
                />
              </View>

              <Text style={styles.itemDescription}>{item.description}</Text>

              {expandedItem === index && item.details && (
                <View style={styles.detailsContainer}>
                  <View style={styles.detailsDivider} />
                  {item.details.map((detail, detailIndex) => (
                    <View key={detailIndex} style={styles.detailItem}>
                      <View style={styles.detailBullet} />
                      <Text style={styles.detailText}>{detail}</Text>
                    </View>
                  ))}
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ))}

        {/* Info footer */}
        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={18} color="#9B59B6" />
          <Text style={styles.footerText}>
            Нажмите на элемент, чтобы узнать больше деталей
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(155, 89, 182, 0.3)',
  },
  tabsContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 10,
  },
  tabActive: {
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    borderColor: 'rgba(155, 89, 182, 0.5)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E8E8E8',
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#9B59B6',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  itemContainer: {
    marginBottom: 12,
    borderRadius: 15,
    overflow: 'hidden',
  },
  itemGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.3)',
    borderRadius: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitleContainer: {
    flex: 1,
  },
  itemNameRu: {
    fontSize: 17,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 2,
  },
  itemName: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  itemDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  detailsContainer: {
    marginTop: 12,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: 'rgba(155, 89, 182, 0.3)',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9B59B6',
    marginTop: 6,
    marginRight: 10,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 8,
    textAlign: 'center',
  },
});
