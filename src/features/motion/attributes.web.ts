import type {ViewProps} from 'react-native';

/** React Native Web supports dataSet; React Native's types omit web-only props. */
export function motionData(values: Record<string, string>): ViewProps {
  return {dataSet: values} as ViewProps;
}
