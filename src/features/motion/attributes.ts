import type {ViewProps} from 'react-native';

/** DOM animation markers have no native counterpart. */
export function motionData(_values: Record<string, string>): ViewProps {return {};}
