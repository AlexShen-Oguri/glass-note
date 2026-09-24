export const MAX_PHOTO_CHARACTERS=200_000;
export function validateRecipePhoto(value:unknown):string{
  if(typeof value!=='string'||value.length>MAX_PHOTO_CHARACTERS||!/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(value))throw Error('invalid-recipe-photo');
  return value;
}
