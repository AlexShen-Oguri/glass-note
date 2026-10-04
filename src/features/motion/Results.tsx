import React from 'react';
import {View,type ViewProps} from 'react-native';
export function MotionResults({changeKey:_key,replayKey:_replay,...props}:ViewProps&{changeKey:string;replayKey?:number}){return <View {...props}/>;}
