import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface TarotCard {
  name: string;
  is_reversed: boolean;
}

interface TarotReading {
  id: string;
  question: string;
  category: string;
  spread_type: string;
  cards: TarotCard[];
  interpretation: string;
  created_at: string;
}

interface EnhancedHistoryCardProps {
  reading: TarotReading;
  isFavorite: boolean;
  notes: string;
  tags: string[];
  onToggleFavorite: (id: string) => void;
  onSaveNotes: (id: string, notes: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  onViewDetails: (reading: TarotReading) => void;
  categoryInfo: { name: string; icon: string; color: string };
  spreadName: string;
}

export const EnhancedHistoryCard: React.FC<EnhancedHistoryCardProps> = ({
  reading,
  isFavorite,
  notes,
  tags,
  onToggleFavorite,
  onSaveNotes,
  onAddTag,
  onRemoveTag,
  onViewDetails,
  categoryInfo,
  spreadName,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(notes);
  const [showTagModal, setShowTagModal] = useState(false);
  const [newTag, setNewTag] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Сегодня, ' + new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } else if (diffDays === 1) {
      return 'Вчера, ' + new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } else if (diffDays < 7) {
      return `${diffDays} дн. назад`;
    } else {
      return new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'short',
      }).format(date);
    }
  };

  const handleSaveNotes = () => {
    onSaveNotes(reading.id, editedNotes);
    setIsEditingNotes(false);
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(reading.id, newTag.trim());
      setNewTag('');
      setShowTagModal(false);
    }
  };

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['rgba(30, 30, 30, 0.9)', 'rgba(40, 40, 40, 0.8)']}
        style={styles.cardGradient}
      >
        {/* Header */}
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color + '33' }]}>
              <Text style={styles.categoryIcon}>{categoryInfo.icon}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.cardDate}>{formatDate(reading.created_at)}</Text>
              <Text style={styles.spreadType}>{spreadName}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => onToggleFavorite(reading.id)}
              style={styles.favoriteButton}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? '#FF6B9D' : '#666'}
              />
            </TouchableOpacity>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#9B59B6"
            />
          </View>
        </TouchableOpacity>

        {/* Question */}
        <Text style={styles.question} numberOfLines={isExpanded ? undefined : 2}>
          "{reading.question}"
        </Text>

        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tag}
                onLongPress={() => {
                  Alert.alert('Удалить тег?', `Удалить тег "${tag}"?`, [
                    { text: 'Отмена', style: 'cancel' },
                    { text: 'Удалить', onPress: () => onRemoveTag(reading.id, tag) },
                  ]);
                }}
              >
                <Ionicons name="pricetag" size={12} color="#9B59B6" />
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addTagButton} onPress={() => setShowTagModal(true)}>
              <Ionicons name="add-circle-outline" size={16} color="#9B59B6" />
            </TouchableOpacity>
          </View>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <View style={styles.expandedContent}>
            {/* Cards */}
            <View style={styles.cardsPreview}>
              <Text style={styles.sectionLabel}>Карты:</Text>
              {reading.cards.map((card, index) => (
                <Text key={index} style={styles.cardName}>
                  • {card.name} {card.is_reversed ? '(перевёрнутая)' : ''}
                </Text>
              ))}
            </View>

            {/* Notes */}
            <View style={styles.notesSection}>
              <View style={styles.notesSectionHeader}>
                <Text style={styles.sectionLabel}>Заметки:</Text>
                <TouchableOpacity
                  onPress={() => setIsEditingNotes(!isEditingNotes)}
                  style={styles.editButton}
                >
                  <Ionicons
                    name={isEditingNotes ? 'close' : 'create-outline'}
                    size={18}
                    color="#9B59B6"
                  />
                </TouchableOpacity>
              </View>
              {isEditingNotes ? (
                <View>
                  <TextInput
                    style={styles.notesInput}
                    value={editedNotes}
                    onChangeText={setEditedNotes}
                    placeholder="Добавьте свои мысли о гадании..."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={4}
                  />
                  <TouchableOpacity style={styles.saveNotesButton} onPress={handleSaveNotes}>
                    <Text style={styles.saveNotesButtonText}>Сохранить</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.notesText}>
                  {notes || 'Нет заметок. Нажмите ✏️, чтобы добавить.'}
                </Text>
              )}
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => onViewDetails(reading)}
            >
              <LinearGradient
                colors={['#9B59B6', '#8E44AD']}
                style={styles.viewButtonGradient}
              >
                <Ionicons name="eye-outline" size={18} color="#FFF" />
                <Text style={styles.viewButtonText}>Просмотреть полное толкование</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick action when collapsed */}
        {!isExpanded && (
          <TouchableOpacity
            style={styles.quickViewButton}
            onPress={() => onViewDetails(reading)}
          >
            <Text style={styles.quickViewButtonText}>Подробнее</Text>
            <Ionicons name="arrow-forward" size={16} color="#9B59B6" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Tag Modal */}
      <Modal visible={showTagModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Добавить тег</Text>
            <TextInput
              style={styles.modalInput}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Введите тег..."
              placeholderTextColor="#666"
              autoFocus
              maxLength={20}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setNewTag('');
                  setShowTagModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleAddTag}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  Добавить
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 20,
  },
  headerInfo: {
    flex: 1,
  },
  cardDate: {
    fontSize: 13,
    color: '#9B59B6',
    fontWeight: '600',
  },
  spreadType: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  question: {
    fontSize: 15,
    color: '#E8E8E8',
    lineHeight: 22,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(155, 89, 182, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 11,
    color: '#D0D0D0',
    fontWeight: '500',
  },
  addTagButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  expandedContent: {
    marginTop: 8,
  },
  cardsPreview: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#9B59B6',
    fontWeight: '600',
    marginBottom: 8,
  },
  cardName: {
    fontSize: 13,
    color: '#D0D0D0',
    lineHeight: 20,
    marginLeft: 8,
  },
  notesSection: {
    marginBottom: 16,
  },
  notesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editButton: {
    padding: 4,
  },
  notesInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#E8E8E8',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#444',
  },
  saveNotesButton: {
    backgroundColor: '#9B59B6',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  saveNotesButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  notesText: {
    fontSize: 13,
    color: '#B8B8B8',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  viewButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  viewButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  viewButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  quickViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 8,
  },
  quickViewButtonText: {
    fontSize: 13,
    color: '#9B59B6',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E8E8E8',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#E8E8E8',
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
  modalButtonPrimary: {
    backgroundColor: '#9B59B6',
  },
  modalButtonText: {
    fontSize: 15,
    color: '#E8E8E8',
    fontWeight: '600',
  },
  modalButtonTextPrimary: {
    color: '#FFF',
  },
});
