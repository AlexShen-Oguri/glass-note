import type {FavoriteList} from '../favorites';
import {canonicalJson,semanticFingerprint} from './canonical';
import type {BackupConflict,FavoritesBackupSection} from './types';

export interface FavoriteRestoreResult {
  value:Extract<FavoritesBackupSection,{schemaVersion:2}>;
  same:number;
  added:number;
  removed:number;
  conflicts:BackupConflict[];
  legacyListsPreserved:boolean;
}

export function favoriteLists(section:FavoritesBackupSection):FavoriteList[]{
  return section.schemaVersion===2?section.lists:[];
}

export function favoriteSectionCount(section:FavoritesBackupSection):number{
  return section.versionIds.length+favoriteLists(section).reduce((sum,list)=>sum+1+list.items.length,0);
}

function listSemanticValue(list:FavoriteList):Omit<FavoriteList,'id'|'importedFromId'>{
  const {id:_id,importedFromId:_importedFromId,...value}=list;
  return value;
}

export function favoriteListSemanticKey(list:FavoriteList):string{
  return canonicalJson(listSemanticValue(list));
}

function listUnitCount(list:FavoriteList):number{return 1+list.items.length;}

function remappedList(list:FavoriteList,used:Set<string>):FavoriteList{
  const fingerprint=semanticFingerprint(listSemanticValue(list));
  const base=`import-list-${fingerprint.slice(0,16)}`;
  let id=base,suffix=2;
  while(used.has(id))id=`${base}-${suffix++}`;
  used.add(id);
  return {...list,id,importedFromId:list.importedFromId??list.id};
}

function sharedUnits(current:readonly FavoriteList[],incoming:readonly FavoriteList[]):number{
  const remaining=new Map<string,number>();
  for(const list of current){const key=favoriteListSemanticKey(list);remaining.set(key,(remaining.get(key)??0)+1);}
  let total=0;
  for(const list of incoming){const key=favoriteListSemanticKey(list),count=remaining.get(key)??0;if(count===0)continue;
    total+=listUnitCount(list);remaining.set(key,count-1);
  }
  return total;
}

function listTitle(list:FavoriteList):string{return list.name||list.id;}

export function restoreFavorites(current:FavoritesBackupSection,incoming:FavoritesBackupSection,mode:'merge'|'replace'):FavoriteRestoreResult{
  const currentLists=favoriteLists(current),incomingLists=favoriteLists(incoming);
  const currentIds=current.versionIds,incomingIds=incoming.versionIds;
  const versionIds=mode==='merge'?[...new Set([...currentIds,...incomingIds])]:[...incomingIds];
  const idSame=incomingIds.filter(id=>currentIds.includes(id)).length;
  const idAdded=versionIds.filter(id=>!currentIds.includes(id)).length;
  const idRemoved=mode==='replace'?currentIds.filter(id=>!incomingIds.includes(id)).length:0;

  if(incoming.schemaVersion===1){
    const value={schemaVersion:2 as const,versionIds,lists:[...currentLists]};
    return{value,same:idSame,added:idAdded,removed:idRemoved,conflicts:[],legacyListsPreserved:true};
  }

  if(mode==='replace'){
    const byId=new Map(currentLists.map(list=>[list.id,list]));
    const conflicts:BackupConflict[]=[];
    for(const list of incomingLists){const existing=byId.get(list.id);if(existing&&favoriteListSemanticKey(existing)!==favoriteListSemanticKey(list))conflicts.push({
      section:'favorites',id:list.id,currentTitle:listTitle(existing),incomingTitle:listTitle(list),action:'replace',
    });}
    const sameLists=sharedUnits(currentLists,incomingLists);
    const currentListUnits=currentLists.reduce((sum,list)=>sum+listUnitCount(list),0);
    const incomingListUnits=incomingLists.reduce((sum,list)=>sum+listUnitCount(list),0);
    return{
      value:{schemaVersion:2,versionIds,lists:[...incomingLists]},
      same:idSame+sameLists,
      added:incomingIds.filter(id=>!currentIds.includes(id)).length+Math.max(0,incomingListUnits-sameLists),
      removed:idRemoved+Math.max(0,currentListUnits-sameLists),
      conflicts,
      legacyListsPreserved:false,
    };
  }

  const lists=[...currentLists],bySemantic=new Map(currentLists.map(list=>[favoriteListSemanticKey(list),list]));
  const used=new Set(currentLists.map(list=>list.id)),byId=new Map(currentLists.map(list=>[list.id,list]));
  const conflicts:BackupConflict[]=[];let sameLists=0;
  for(const list of incomingLists){
    const semantic=favoriteListSemanticKey(list),matching=bySemantic.get(semantic);
    if(matching){sameLists+=listUnitCount(list);continue;}
    const collision=byId.get(list.id);const next=collision?remappedList(list,used):list;
    if(!collision)used.add(list.id);else conflicts.push({section:'favorites',id:list.id,currentTitle:listTitle(collision),incomingTitle:listTitle(list),action:'keep-both'});
    lists.push(next);bySemantic.set(semantic,next);byId.set(next.id,next);
  }
  const value={schemaVersion:2 as const,versionIds,lists};
  return{value,same:idSame+sameLists,added:favoriteSectionCount(value)-favoriteSectionCount(current),removed:0,conflicts,legacyListsPreserved:false};
}
