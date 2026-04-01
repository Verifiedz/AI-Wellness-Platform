import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useHaptic } from '../hooks/useHaptic';

let ImagePicker = null;
try {
  ImagePicker = require('expo-image-picker');
} catch {
  // expo-image-picker not available — component will be hidden
}

/**
 * Single thumbnail with a loading indicator overlay while the image decodes.
 *
 * React Native's Image component re-decodes local file URIs on each render cycle
 * when there is no prior warm cache entry. Showing an ActivityIndicator via
 * onLoadStart/onLoadEnd gives users visual feedback and prevents layout shift.
 */
function PhotoThumb({ uri, index, disabled, borderColor, errorColor, onRemove }) {
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.thumbWrapper}>
      <Image
        source={{ uri }}
        style={[styles.thumb, { borderColor }]}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
      />
      {loading && (
        <View style={styles.thumbLoader}>
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
      {!disabled && (
        <TouchableOpacity
          style={[styles.removeBtn, { backgroundColor: errorColor }]}
          onPress={() => onRemove(index)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Remove photo"
        >
          <Ionicons name="close" size={14} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

/**
 * Photo picker and preview component for journal entries.
 *
 * Supports picking from camera or library with permission handling,
 * thumbnail previews in a horizontal scroll, and remove buttons.
 *
 * @param {{
 *   photos: string[],
 *   onPhotosChange: (photos: string[]) => void,
 *   maxPhotos?: number,
 *   disabled?: boolean,
 * }} props
 */
export function PhotoAttachment({ photos = [], onPhotosChange, maxPhotos = 3, disabled = false }) {
  const { colors, fonts } = useTheme();
  const haptic = useHaptic();

  if (!ImagePicker) return null;

  const requestPermission = useCallback(async (type) => {
    const requester =
      type === 'camera'
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await requester();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        `Sakina needs ${type === 'camera' ? 'camera' : 'photo library'} access to attach photos. Please enable it in Settings.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') Linking.openURL('app-settings:');
              else Linking.openSettings();
            },
          },
        ]
      );
      return false;
    }
    return true;
  }, []);

  const pickFromCamera = useCallback(async () => {
    const granted = await requestPermission('camera');
    if (!granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      haptic.triggerSelection();
      onPhotosChange([...photos, result.assets[0].uri]);
    }
  }, [photos, onPhotosChange, requestPermission]);

  const pickFromLibrary = useCallback(async () => {
    const granted = await requestPermission('library');
    if (!granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: maxPhotos - photos.length,
    });

    if (!result.canceled && result.assets?.length > 0) {
      haptic.triggerSelection();
      const newUris = result.assets.map((a) => a.uri);
      onPhotosChange([...photos, ...newUris].slice(0, maxPhotos));
    }
  }, [photos, onPhotosChange, maxPhotos, requestPermission]);

  const handleAddPhoto = useCallback(() => {
    if (photos.length >= maxPhotos) {
      Alert.alert('Limit Reached', `You can attach up to ${maxPhotos} photos per entry.`);
      return;
    }

    Alert.alert('Add Photo', 'Choose a source', [
      { text: 'Take Photo', onPress: pickFromCamera },
      { text: 'Choose from Library', onPress: pickFromLibrary },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [photos.length, maxPhotos, pickFromCamera, pickFromLibrary]);

  const removePhoto = useCallback(
    (index) => {
      const next = photos.filter((_, i) => i !== index);
      onPhotosChange(next);
    },
    [photos, onPhotosChange]
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={[
            styles.addBtn,
            { borderColor: colors.border, backgroundColor: colors.background },
          ]}
          onPress={handleAddPhoto}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Ionicons
            name="camera-outline"
            size={20}
            color={disabled ? colors.textLight : colors.primary}
          />
          <Text
            style={[
              fonts.bodySmall,
              { color: disabled ? colors.textLight : colors.primary, fontWeight: '500' },
            ]}
          >
            Add Photo{photos.length > 0 ? ` (${photos.length}/${maxPhotos})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {photos.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbRow}
        >
          {photos.map((uri, index) => (
            <PhotoThumb
              key={`${uri}-${index}`}
              uri={uri}
              index={index}
              disabled={disabled}
              borderColor={colors.border}
              errorColor={colors.error}
              onRemove={removePhoto}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  thumbRow: { gap: 10, marginTop: 10, paddingRight: 4 },
  thumbWrapper: { position: 'relative' },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
  },
  thumbLoader: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
