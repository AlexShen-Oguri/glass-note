import {File, Paths} from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import {utf8ByteLength} from '../domain/lab';

export async function saveLabFile(content: string, extension: 'json' | 'md'): Promise<boolean> {
  if (!await Sharing.isAvailableAsync()) throw new Error('sharing-unavailable');
  const file = new File(Paths.cache, `glass-notes-lab-${Date.now()}.${extension}`);
  try {
    file.create(); file.write(content);
    await Sharing.shareAsync(file.uri, {mimeType: extension === 'json' ? 'application/json' : 'text/markdown', UTI: extension === 'json' ? 'public.json' : 'public.plain-text'});
    return true;
  } finally {if (file.exists) file.delete();}
}
export async function readLabFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({type: ['application/json','text/plain'], copyToCacheDirectory: true, multiple: false});
  if (result.canceled) return null;
  const file = new File(result.assets[0]!.uri);
  try {
    if ((file.size ?? 0) > 5_000_000) throw new Error('file-too-large');
    const text=await file.text();
    if(utf8ByteLength(text)>5_000_000)throw new Error('file-too-large');
    return text;
  } finally {if(file.exists&&file.uri.startsWith(Paths.cache.uri))file.delete();}
}
