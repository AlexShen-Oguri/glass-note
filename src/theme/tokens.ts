export const colors = {
  background: '#101714', panel: '#19231e', raised: '#223028', border: '#344238',
  text: '#f3f0e8', secondary: '#b3bdb2', muted: '#8b9b90', accent: '#b5c6a9',
  accentDark: '#233923', amber: '#d4ad73', danger: '#e7b6a2',
};
// Editorial surfaces use quiet corners; circles are reserved for real controls.
export const radii = {small: 2, medium: 4, large: 8, pill: 999};
export const typography = {
  display: Platform.select({
    web: '"Songti SC", "STSong", "Noto Serif CJK SC", "SimSun", Georgia, Cambria, serif',
    ios: 'Songti SC',
    default: 'serif',
  }),
};
import {Platform} from 'react-native';
