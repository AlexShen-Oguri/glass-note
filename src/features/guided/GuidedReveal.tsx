import type React from 'react';
import type {Animated, View} from 'react-native';
import type {Cocktail, Locale, MediaAsset} from '../../domain/contracts';
export interface GuidedRevealCandidate extends Pick<Cocktail, 'id' | 'name' | 'accent'> {asset?: MediaAsset;}
export interface GuidedRevealProps {
  revealing: boolean;
  motionAllowed: boolean;
  activeWindow: boolean;
  locale: Locale;
  candidates: GuidedRevealCandidate[];
  resultPhotoRefs: React.MutableRefObject<Map<string, View>>;
  onFinish: () => void;
  departure?: React.ReactNode;
  choosing?: boolean;
  children: (resultPhotoOpacity?: Animated.Value,skipAction?:React.ReactNode) => React.ReactNode;
}

export * from './GuidedReveal.web';
