import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Modal, type ModalProps, type ViewProps} from 'react-native';
import {useMotionEnabled} from './useMotionEnabled';

export type EntranceProps = ViewProps & {active?: boolean};
export type FadeProps = ViewProps & {visible: boolean; disabled?: boolean};
export type FloatProps = ViewProps & {index: number; paused: boolean; reduceMotion: boolean};
export type MotionModalProps = ModalProps & {motionDisabled?: boolean};
export type PhotoProps = ViewProps & {opacity?: Animated.Value};

export function MotionPhoto({opacity, ...props}: PhotoProps) {
  return <Animated.View {...props} style={[props.style, opacity ? {opacity} : undefined]} />;
}

export function MotionEntrance({active = true, ...props}: EntranceProps) {
  const enabled = useMotionEnabled();
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!enabled || !active) {progress.setValue(1); return;}
    progress.setValue(0);
    const animation = Animated.timing(progress, {toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true});
    animation.start();
    return () => animation.stop();
  }, [active, enabled, progress]);
  return <Animated.View {...props} style={[props.style, {opacity: progress, transform: [{translateY: progress.interpolate({inputRange: [0, 1], outputRange: [14, 0]})}]}]} />;
}

export function MotionFade({visible, disabled = false, ...props}: FadeProps) {
  const enabled = useMotionEnabled() && !disabled;
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  useEffect(() => {
    if (!enabled) {opacity.setValue(visible ? 1 : 0); return;}
    const animation = Animated.timing(opacity, {toValue: visible ? 1 : 0, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true});
    animation.start();
    return () => animation.stop();
  }, [enabled, opacity, visible]);
  return <Animated.View {...props} style={[props.style, {opacity}]} />;
}

export function MotionFloat({index, paused, reduceMotion, ...props}: FloatProps) {
  const offset = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (paused || reduceMotion) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(offset, {toValue: index % 2 ? 18 : -18, duration: 10000 + index * 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
      Animated.timing(offset, {toValue: 0, duration: 10000 + index * 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
    ]));
    animation.start();
    return () => animation.stop();
  }, [index, offset, paused, reduceMotion]);
  return <Animated.View {...props} style={[props.style, {transform: [{translateY: offset}]}]} />;
}

export function MotionModal({motionDisabled, ...props}: MotionModalProps) {
  const enabled = useMotionEnabled() && !motionDisabled;
  return <Modal {...props} animationType={enabled ? props.animationType ?? 'fade' : 'none'} />;
}
