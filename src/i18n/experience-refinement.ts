import {LOCALES,type Locale} from '../domain/contracts';
const copy={
  drank:['Tried it','喝过','Goûté','Getrunken','Lo probé','마셔 봤어요','飲んだ','Bevuto'],
  made:['Made it','调过','Préparé','Gemixt','Lo preparé','만들어 봤어요','作った','Preparato'],
  again:['Make another','再调一杯','En refaire un','Noch einen mixen','Preparar otro','한 잔 더 만들기','もう一杯作る','Preparane un altro'],
  photo:['Recipe photo','配方照片','Photo de la recette','Rezeptfoto','Foto de la receta','레시피 사진','レシピの写真','Foto della ricetta'],
  choosePhoto:['Choose photo','选择照片','Choisir une photo','Foto wählen','Elegir foto','사진 선택','写真を選ぶ','Scegli foto'],
  processingPhoto:['Preparing photo…','正在处理照片…','Préparation de la photo…','Foto wird vorbereitet…','Preparando foto…','사진 처리 중…','写真を処理中…','Preparazione della foto…'],
  removePhoto:['Remove photo','移除照片','Retirer la photo','Foto entfernen','Quitar foto','사진 제거','写真を削除','Rimuovi foto'],
  photoHint:['Compressed and saved locally with this recipe and its backups.','压缩后保存在本地，随配方备份导出。','Compressée et enregistrée localement avec la recette et ses sauvegardes.','Komprimiert und lokal mit Rezept und Sicherungen gespeichert.','Se comprime y guarda localmente con la receta y sus copias.','압축하여 레시피 및 백업과 함께 기기에 저장합니다.','圧縮して端末に保存し、レシピのバックアップにも含めます。','Compressa e salvata localmente con la ricetta e i backup.'],
  photoError:['Could not use this photo. Choose a smaller JPG or PNG.','无法使用这张照片，请选择较小的 JPG 或 PNG 图片。','Photo inutilisable. Choisissez un JPG ou PNG plus petit.','Foto nicht verwendbar. Bitte ein kleineres JPG oder PNG wählen.','No se pudo usar. Elige un JPG o PNG más pequeño.','이 사진을 사용할 수 없습니다. 더 작은 JPG 또는 PNG를 선택하세요.','この写真は使えません。小さいJPGまたはPNGを選んでください。','Foto non utilizzabile. Scegli un JPG o PNG più piccolo.'],
  backToList:['Back to drinks','返回酒单','Retour aux cocktails','Zur Getränkeliste','Volver a los cócteles','술 목록으로','酒の一覧へ','Torna ai cocktail'],
  tips:['Making tips','制作提示','Conseils de préparation','Zubereitungstipps','Consejos de preparación','만들기 팁','調製のヒント','Consigli di preparazione'],
  abv:['Estimated alcohol','酒精度估算','Alcool estimé','Geschätzter Alkoholgehalt','Alcohol estimado','예상 알코올 도수','推定アルコール度数','Alcol stimato'],
  beforeIce:['Before ice dilution','融冰前的配方酒液','Avant dilution par la glace','Vor Eisverdünnung','Antes de diluir con hielo','얼음 희석 전','氷による希釈前','Prima della diluizione con ghiaccio'],
  estimateNote:['Calculated from recipe measures and matching bottles in the catalogue. Optional ingredients are excluded. Bottles and melting ice change the result.','按配方用量与酒库中对应酒款的酒精度计算，不含可选材料；具体用酒和融冰会影响实际酒精度。','Calcul selon les quantités et les bouteilles correspondantes du catalogue, hors ingrédients facultatifs. La bouteille et la fonte de glace modifient le résultat.','Aus Rezeptmengen und passenden Katalogflaschen berechnet, ohne optionale Zutaten. Flaschenwahl und Schmelzwasser verändern das Ergebnis.','Calculado con las cantidades y botellas correspondientes del catálogo, sin ingredientes opcionales. La botella y el hielo derretido cambian el resultado.','레시피 양과 해당 술의 도수로 계산하며 선택 재료는 제외합니다. 사용하는 술과 얼음의 희석에 따라 달라집니다.','配合量と酒庫内の該当銘柄から計算。任意材料は含まず、使用銘柄や氷の溶け方で変わります。','Calcolato dalle dosi e dalle bottiglie corrispondenti, esclusi gli ingredienti facoltativi. La bottiglia e il ghiaccio sciolto cambiano il risultato.'],
  unknownAbv:['Not enough information for a reliable percentage.','现有资料不足，暂不显示百分比。','Données insuffisantes pour un pourcentage fiable.','Zu wenig Angaben für einen verlässlichen Prozentwert.','Faltan datos para un porcentaje fiable.','신뢰할 수 있는 도수를 계산할 정보가 부족합니다.','信頼できる度数を計算する情報が不足しています。','Dati insufficienti per una percentuale attendibile.'],
  sources:['Calculation sources','计算依据','Sources du calcul','Berechnungsquellen','Fuentes del cálculo','계산 출처','計算の出典','Fonti del calcolo'],
} as const;
export function refinementText(locale:Locale,key:keyof typeof copy){return copy[key][LOCALES.indexOf(locale)]!;}
