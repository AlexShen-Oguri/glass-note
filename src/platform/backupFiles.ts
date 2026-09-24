import {File,Paths} from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {utf8ByteLength} from '../domain/lab';
export {readLabFile as readBackupFile} from './labFiles';
export async function saveBackupFile(content:string):Promise<boolean>{
  if(utf8ByteLength(content)>5_000_000)throw Error('file-too-large');
  if(!await Sharing.isAvailableAsync())throw Error('sharing-unavailable');
  const file=new File(Paths.cache,`glass-notes-backup-${Date.now()}.json`);
  try{file.create();file.write(content);await Sharing.shareAsync(file.uri,{mimeType:'application/json',UTI:'public.json'});return true;}
  finally{if(file.exists)file.delete();}
}
