import React from 'react';
import {Image, StyleSheet, Text, View} from 'react-native';
import type {ImageStyle, LayoutChangeEvent} from 'react-native';
import {bottleMedia} from '../../content/bottle-media';
import type {Locale} from '../../domain/contracts';
import type {BottleMedia} from '../../domain/bottles/media';
import type {Bottle, BottleFamily} from '../../domain/bottles/types';
import {bottleDisplayName} from '../../domain/bottles/format';
import {bottleMediaText} from '../../i18n/bottle-media';
import {colors, radii} from '../../theme/tokens';

type BottlePhotoSize = 'card' | 'compare' | 'chooser';

export function BottlePhoto({bottle, locale, size = 'card'}: {bottle: Bottle; locale: Locale; size?: BottlePhotoSize}) {
  const media = bottleMedia[bottle.id];
  const [failed, setFailed] = React.useState(false);
  const [innerSize, setInnerSize] = React.useState<{width: number; height: number} | null>(null);

  React.useEffect(() => setFailed(false), [bottle.id, media?.image]);

  const name = bottleDisplayName(bottle, locale);
  const showPhoto = Boolean(media?.image) && !failed;
  const framedStyle = media?.framing && innerSize ? fitFraming(media.framing, innerSize) : null;
  const measureInner = React.useCallback((event: LayoutChangeEvent) => {
    const {width, height} = event.nativeEvent.layout;
    setInnerSize(current => current?.width === width && current.height === height ? current : {width, height});
  }, []);

  return <View style={[styles.frame, sizeStyles[size]]}>
    <View onLayout={measureInner} style={styles.clip}>
      {showPhoto ? <Image
        accessibilityLabel={`${bottleMediaText(locale, 'image')}: ${name}`}
        accessibilityRole="image"
        onError={() => setFailed(true)}
        resizeMode="contain"
        source={media!.image}
        style={framedStyle ?? styles.image}
      /> : <View accessibilityLabel={`${bottleMediaText(locale, 'unavailable')}: ${name}`} style={styles.fallback}>
        <BottleGlyph family={bottle.family}/>
        <Text numberOfLines={2} style={[styles.fallbackName, size === 'chooser' && styles.fallbackNameSmall]}>{name}</Text>
      </View>}
    </View>
  </View>;
}

function fitFraming(framing: BottleMedia['framing'], inner: {width: number; height: number}): ImageStyle | null {
  const values = [framing.imageWidth, framing.imageHeight, framing.x, framing.y, framing.width, framing.height, inner.width, inner.height];
  if (!values.every(Number.isFinite) || framing.imageWidth <= 0 || framing.imageHeight <= 0 || framing.width <= 0 || framing.height <= 0 || inner.width <= 0 || inner.height <= 0) return null;
  const scale = Math.min(inner.width / framing.width, inner.height / framing.height);
  return {
    position: 'absolute',
    width: framing.imageWidth * scale,
    height: framing.imageHeight * scale,
    left: (inner.width - framing.width * scale) / 2 - framing.x * scale,
    top: (inner.height - framing.height * scale) / 2 - framing.y * scale,
  };
}

export function BottlePhotoSource({bottleId, locale}: {bottleId: string; locale: Locale}) {
  const media = bottleMedia[bottleId];
  if (!media) return <Text style={styles.note}>{bottleMediaText(locale, 'unavailable')}</Text>;

  return <View style={styles.source}>
    <Text style={styles.sourceLabel}>{bottleMediaText(locale, 'packaging')}</Text>
    <Text style={styles.note}>{bottleMediaText(locale, 'packagingMayVary')}</Text>
  </View>;
}

const sizeStyles = StyleSheet.create({
  card: {width: 102, height: 164},
  compare: {width: '100%', height: 190},
  chooser: {width: 52, height: 74},
});

const styles = StyleSheet.create({
  frame: {
    flexShrink: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#466052',
    borderRadius: radii.small,
    backgroundColor: '#ffffff',
    padding: 6,
  },
  clip: {flex: 1, overflow: 'hidden'},
  image: {width: '100%', height: '100%'},
  fallback: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 3},
  fallbackName: {color: '#31443a', fontSize: 10, lineHeight: 13, fontWeight: '700', textAlign: 'center'},
  fallbackNameSmall: {fontSize: 8, lineHeight: 10},
  source: {gap: 8},
  sourceLabel: {color: colors.secondary, fontSize: 12, lineHeight: 19, fontWeight: '600'},
  sourceLink: {alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center'},
  sourceLinkText: {color: colors.accent, fontSize: 13, lineHeight: 19, fontWeight: '600'},
  note: {color: colors.muted, fontSize: 12, lineHeight: 19},
  glyph: {width: 22, height: 38, alignItems: 'center', justifyContent: 'flex-end'},
  glyphNeck: {width: 7, height: 10, borderColor: '#466052', borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 2, borderTopRightRadius: 2},
  glyphBody: {width: 20, height: 27, borderWidth: 1, borderColor: '#466052', backgroundColor: 'rgba(255,255,255,0.38)', justifyContent: 'center', alignItems: 'center'},
  glyphLabel: {width: 13, height: 9, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#718277'},
});

function BottleGlyph({family}: {family: BottleFamily}) {
  return <View accessible={false} style={styles.glyph}>
    <View style={styles.glyphNeck}/>
    <View style={[styles.glyphBody, {borderRadius: family === 'gin' ? 5 : 3}]}><View style={styles.glyphLabel}/></View>
  </View>;
}
