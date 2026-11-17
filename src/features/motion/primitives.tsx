import type {Animated, ModalProps, ViewProps} from 'react-native';
export type EntranceProps = ViewProps & {active?: boolean};
export type FadeProps = ViewProps & {visible: boolean; disabled?: boolean};
export type FloatProps = ViewProps & {index: number; paused: boolean; reduceMotion: boolean};
export type MotionModalProps = ModalProps & {motionDisabled?: boolean};
export type PhotoProps = ViewProps & {opacity?: Animated.Value};

export * from './primitives.web';
