import {ImageManipulator,SaveFormat} from 'expo-image-manipulator';
import {MAX_PHOTO_CHARACTERS,validateRecipePhoto} from '../domain/private-recipes/photo';

export async function chooseRecipePhoto():Promise<string|null>{
  const result=await chooseWebPhoto();
  if(result.canceled)return null;
  const asset=result.assets[0];if(!asset||asset.width<=0||asset.height<=0||asset.width*asset.height>60_000_000||(asset.fileSize??0)>25_000_000)throw Error('photo-too-large');
  const context=ImageManipulator.manipulate(asset.uri);
  const scale=Math.min(1,960/Math.max(asset.width,asset.height));
  context.resize({width:Math.max(1,Math.round(asset.width*scale)),height:Math.max(1,Math.round(asset.height*scale))});
  try{
    const rendered=await context.renderAsync();
    try{
      for(const compress of [0.7,0.45,0.25]){
        const saved=await rendered.saveAsync({format:SaveFormat.JPEG,compress,base64:true});
        const data=`data:image/jpeg;base64,${saved.base64??''}`;if(data.length<=MAX_PHOTO_CHARACTERS)return validateRecipePhoto(data);
      }
      throw Error('photo-too-large');
    }finally{rendered.release();}
  }finally{context.release();URL.revokeObjectURL(asset.uri);}
}

// Same browser file-input pattern as labFiles.web; a real click preserves user activation.
type WebPhotoResult={canceled:true;assets:null}|{canceled:false;assets:{uri:string;width:number;height:number;fileSize:number}[]};
function chooseWebPhoto():Promise<WebPhotoResult>{
  return new Promise((resolve,reject)=>{
    const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png,image/webp';
    let settled=false,reading=false,timer:ReturnType<typeof setTimeout>|undefined;
    const clean=()=>{settled=true;input.remove();window.removeEventListener('focus',focus);if(timer)clearTimeout(timer);};
    const cancel=()=>{if(!settled&&!reading){clean();resolve({canceled:true,assets:null});}};
    const focus=()=>{timer=setTimeout(()=>{if(!input.files?.length)cancel();},1000);};
    input.oncancel=cancel;
    input.onchange=()=>{
      const file=input.files?.[0];if(!file){cancel();return;}reading=true;
      if(file.size>25_000_000||!['image/jpeg','image/png','image/webp'].includes(file.type)){clean();reject(Error('invalid-photo'));return;}
      const uri=URL.createObjectURL(file),image=new Image();
      image.onload=()=>{clean();if(image.naturalWidth<=0||image.naturalHeight<=0||image.naturalWidth*image.naturalHeight>60_000_000){URL.revokeObjectURL(uri);reject(Error('photo-too-large'));return;}resolve({canceled:false,assets:[{uri,width:image.naturalWidth,height:image.naturalHeight,fileSize:file.size}]});};
      image.onerror=()=>{clean();URL.revokeObjectURL(uri);reject(Error('invalid-photo'));};image.src=uri;
    };
    window.addEventListener('focus',focus);input.style.display='none';document.body.appendChild(input);input.click();
  });
}
