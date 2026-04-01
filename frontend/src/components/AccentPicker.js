import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ACCENT_PRESETS } from '../theme/accents';

/**
 * Horizontal row of circular color swatches for accent selection.
 *
 * @param {{ selectedId: string, onSelect: (id: string) => void }} props
 */
export function AccentPicker({ selectedId, onSelect }) {
  const { fonts, colors } = useTheme();

  const renderItem = ({ item }) => {
    const isSelected = item.id === selectedId;

    return (
      <TouchableOpacity style={styles.item} onPress={() => onSelect(item.id)} activeOpacity={0.7}>
        <View
          style={[
            styles.swatch,
            { backgroundColor: item.swatch },
            isSelected && styles.selectedSwatch,
            isSelected && { borderColor: item.swatch },
          ]}
        >
          {isSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
        </View>
        <Text
          style={[
            fonts.caption,
            { color: isSelected ? colors.text : colors.textSecondary, marginTop: 4 },
          ]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      horizontal
      data={ACCENT_PRESETS}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: 16, paddingVertical: 8, paddingHorizontal: 4 },
  item: { alignItems: 'center', width: 62 },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedSwatch: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
