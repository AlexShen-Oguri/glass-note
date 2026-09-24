import {desktopRuntime} from './desktopRuntime';
import {DESKTOP_COMMANDS} from './desktop-contract';
import {utf8ByteLength} from '../domain/lab';
export {readLabFile as readBackupFile} from './labFiles';
export async function saveBackupFile(content:string):Promise<boolean>{
  if(utf8ByteLength(content)>5_000_000)throw Error('file-too-large');
  if(desktopRuntime.isDesktop())return desktopRuntime.invoke<boolean>(DESKTOP_COMMANDS.export,{content,extension:'json',kind:'backup'});
  const url=URL.createObjectURL(new Blob([content],{type:'application/json;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=`glass-notes-backup-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);return true;
}
