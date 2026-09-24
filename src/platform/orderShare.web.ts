/** Invoke directly from the press handler to retain Safari user activation. */
export async function copyOrderText(text:string):Promise<'copied'|'unavailable'>{
  try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return 'copied';}}catch{/* Offer selectable card if clipboard permission is unavailable. */}
  return 'unavailable';
}
export async function shareOrderText(text:string):Promise<'shared'|'cancelled'|'unavailable'>{
  if(typeof navigator.share!=='function')return 'unavailable';
  try{await navigator.share({title:'Glass Notes',text});return 'shared';}
  catch(error){return error instanceof Error&&error.name==='AbortError'?'cancelled':'unavailable';}
}
