import type {Locale} from '../domain/contracts';

const copy={
  tableLabel:['Laboratory version comparison','实验室版本对照','Comparaison des versions du laboratoire','Vergleich der Laborversionen','Comparación de versiones del laboratorio','실험실 버전 비교','ラボ版の比較','Confronto versioni del laboratorio'],
  scrollHint:['Swipe sideways to compare every version.','左右滑动可查看全部版本。','Balayez horizontalement pour comparer toutes les versions.','Seitlich wischen, um alle Versionen zu vergleichen.','Desliza de lado para comparar todas las versiones.','좌우로 밀어 모든 버전을 비교하세요.','左右にスワイプして全バージョンを比較できます。','Scorri lateralmente per confrontare tutte le versioni.'],
  notInVersion:['Not in this version','此版本没有这项材料','Absent de cette version','In dieser Version nicht enthalten','No está en esta versión','이 버전에는 없음','この版にはありません','Non presente in questa versione'],
  amountNotSet:['Amount not set','用量未填写','Quantité non indiquée','Menge nicht angegeben','Cantidad sin indicar','분량 미입력','分量未入力','Quantità non indicata'],
  unitNotSet:['Unit not set','单位未填写','Unité non indiquée','Einheit nicht angegeben','Unidad sin indicar','단위 미입력','単位未入力','Unità non indicata'],
  unnamedIngredient:['Unnamed ingredient','未命名材料','Ingrédient sans nom','Unbenannte Zutat','Ingrediente sin nombre','이름 없는 재료','名称未入力の材料','Ingrediente senza nome'],
  notRecorded:['Not recorded','未记录','Non renseigné','Nicht erfasst','Sin registrar','기록 없음','記録なし','Non registrato'],
} satisfies Record<string,[string,string,string,string,string,string,string,string]>;

export type LabComparisonKey=keyof typeof copy;
const locales:Locale[]=['en','zh','fr','de','es','ko','ja','it'];
export const labComparisonText=(locale:Locale,key:LabComparisonKey)=>copy[key][locales.indexOf(locale)]??copy[key][0];
