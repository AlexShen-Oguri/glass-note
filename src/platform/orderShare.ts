import {Share} from 'react-native';
import * as Clipboard from 'expo-clipboard';

export async function copyOrderText(text:string):Promise<'copied'|'unavailable'>{
  try{return await Clipboard.setStringAsync(text)?'copied':'unavailable';}catch{return 'unavailable';}
}
export async function shareOrderText(text:string):Promise<'shared'|'cancelled'|'unavailable'>{
  try{const result=await Share.share({message:text});return result.action===Share.sharedAction?'shared':'cancelled';}
  catch{return 'unavailable';}
}
