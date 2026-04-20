/**
 * Maps a group's legacy Ionicons name to a Phosphor component.
 * Falls back to UsersThree for any unknown icon.
 */

import {
  UsersThree,
  Heart,
  Brain,
  Wind,
  Sun,
  Moon,
  Sparkle,
  Flower,
  HandsPraying,
  ChatsCircle,
  Smiley,
  Lightning,
} from 'phosphor-react-native';

const MAP = {
  'people-outline': UsersThree,
  people: UsersThree,
  'heart-outline': Heart,
  heart: Heart,
  'medkit-outline': Heart,
  brain: Brain,
  bulb: Sparkle,
  'bulb-outline': Sparkle,
  'leaf-outline': Flower,
  leaf: Flower,
  'sunny-outline': Sun,
  'moon-outline': Moon,
  'cloudy-outline': Wind,
  'wind-outline': Wind,
  'flash-outline': Lightning,
  'pray-outline': HandsPraying,
  'happy-outline': Smiley,
  'chatbubbles-outline': ChatsCircle,
};

/**
 * @param {string|undefined} name
 * @returns {React.ComponentType<any>}
 */
export function getGroupIcon(name) {
  if (!name) return UsersThree;
  return MAP[name] || UsersThree;
}
