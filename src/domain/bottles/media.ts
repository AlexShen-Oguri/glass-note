import type {ImageSourcePropType} from 'react-native';

export interface BottleMedia {
  bottleId: string;
  image: ImageSourcePropType;
  /** Display-only bounds: align the product inside the frame without editing the source pixels. */
  framing: {imageWidth: number; imageHeight: number; x: number; y: number; width: number; height: number};
  sourcePageUrl: string;
  imageUrl: string;
  sourceTitle: string;
  sourceKind: 'producer' | 'retailer' | 'distributor';
  checkedAt: string;
  /** Source product image, presented without redrawing the label. */
  method: 'original-photo' | 'producer-render' | 'source-packshot';
  packagingNote: string;
}
