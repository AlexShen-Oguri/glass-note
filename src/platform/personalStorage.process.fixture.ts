import {PERSONAL_KEYS,type RawPersonalData} from './personalStorage';

export function processStorageFixture():{before:RawPersonalData;after:RawPersonalData;disk:Record<string,string>}{
  const disk:Record<string,string>={};
  const before=Object.fromEntries(Object.entries(PERSONAL_KEYS).map(([name,key],index)=>{
    const value=index%2===0?JSON.stringify({section:name,amount:'1.2300',note:'青柠'}):null;
    if(value!==null)disk[key]=value;
    return[name,value];
  })) as RawPersonalData;
  const after=Object.fromEntries(Object.keys(PERSONAL_KEYS).map(name=>[name,JSON.stringify({section:name,state:'restored'})])) as RawPersonalData;
  return{before,after,disk};
}
