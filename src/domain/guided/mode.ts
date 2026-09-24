export type PantryAccess = 'loading' | 'error' | 'empty' | 'ready';
export function pantryAccess(pantry:{hydrated:boolean;error?:unknown},bottles:{hydrated:boolean;error?:unknown},ownedIngredientCount:number):PantryAccess {
  if (pantry.error||bottles.error) return 'error';
  if (!pantry.hydrated||!bottles.hydrated) return 'loading';
  return ownedIngredientCount>0?'ready':'empty';
}
export function needsPantryPrompt(access:PantryAccess,consented:boolean) {
  return access!=='ready'&&!(access==='empty'&&consented);
}
