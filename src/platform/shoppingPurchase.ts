import type {Catalogue} from '../domain/contracts';
import {utf8ByteLength} from '../domain/lab';
import {parseShoppingState,planShoppingPurchase,validateShoppingState} from '../domain/shopping';
import {BACKUP_SECTION_LIMIT} from '../domain/backup/types';
import {fullBackupFromRaw} from './backupAdapter';
import type {RawPersonalData,RecoveryNotice} from './personalStorage';
export interface ShoppingRecovery {
 prepare:()=>Promise<RawPersonalData>;
 restore:(before:RawPersonalData,after:Partial<RawPersonalData>,notice?:RecoveryNotice)=>Promise<void>;
}
/** Reads after participant flush, validates both after-images, and journals the two values together. */
export async function purchaseShoppingItem(recovery:ShoppingRecovery,itemId:string,catalogue:Catalogue):Promise<boolean>{
 const before=await recovery.prepare(),saved=fullBackupFromRaw(before,'en');
 const shopping=parseShoppingState(before.shopping),{ingredientIds,brandsByIngredient}=saved.sections.pantry;
 const plan=planShoppingPurchase(shopping,{ingredientIds,brandsByIngredient},itemId,catalogue);
 if(plan.alreadyBought)return true;
 const after={pantry:JSON.stringify(plan.pantry),shopping:JSON.stringify(validateShoppingState(plan.shopping))};
 for(const value of Object.values(after))if(utf8ByteLength(value)>BACKUP_SECTION_LIMIT)throw Error('shopping-purchase-too-large');
 fullBackupFromRaw({...before,...after},'en');parseShoppingState(after.shopping);
 await recovery.restore(before,after,'purchased');return true;
}
