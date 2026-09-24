import type {Locale} from '../domain/contracts';

const order:Locale[]=['en','zh','fr','de','es','ko','ja','it'];

const copy={
  searchPlaceholder:['Name, brand, or alias','名称、品牌或别名','Nom, marque ou autre appellation','Name, Marke oder alternativer Name','Nombre, marca o alias','이름, 브랜드 또는 별칭','名前、ブランド、別名','Nome, marca o alias'],
  compareIntro:['Select 2 or 3 bottles from the same category.','选择 2 至 3 瓶同类酒。','Sélectionnez 2 ou 3 bouteilles de la même catégorie.','Wähle 2 oder 3 Flaschen derselben Kategorie.','Elige 2 o 3 botellas de la misma categoría.','같은 분류의 보틀을 2~3개 선택하세요.','同じカテゴリーから2〜3本選んでください。','Seleziona 2 o 3 bottiglie della stessa categoria.'],
  selectedBottles:['Selected bottles','已选瓶款','Bouteilles sélectionnées','Ausgewählte Flaschen','Botellas seleccionadas','선택한 보틀','選択したボトル','Bottiglie selezionate'],
  selectedCount:['{count} of 3 selected','已选择 {count}/3','{count} sur 3 sélectionnée(s)','{count} von 3 ausgewählt','{count} de 3 seleccionadas','3개 중 {count}개 선택','3本中{count}本を選択','{count} di 3 selezionate'],
  continueSelecting:['Select one more bottle.','再选择一瓶。','Sélectionnez encore une bouteille.','Wähle noch eine Flasche.','Selecciona una botella más.','보틀을 하나 더 선택하세요.','もう1本選んでください。','Seleziona un’altra bottiglia.'],
  openComparison:['Open comparison','查看对比','Ouvrir la comparaison','Vergleich öffnen','Abrir comparación','비교 보기','比較を開く','Apri il confronto'],
  backToSelection:['Back to bottle list','返回瓶款列表','Retour à la liste','Zurück zur Flaschenliste','Volver a la lista','보틀 목록으로 돌아가기','ボトル一覧に戻る','Torna all’elenco'],
  closeComparison:['Close comparison','关闭对比','Fermer la comparaison','Vergleich schließen','Cerrar comparación','비교 닫기','比較を閉じる','Chiudi il confronto'],
  cancelComparison:['Cancel comparison','取消对比','Annuler la comparaison','Vergleich abbrechen','Cancelar comparación','비교 취소','比較をキャンセル','Annulla il confronto'],
  clearSelection:['Clear selection','清空选择','Effacer la sélection','Auswahl löschen','Borrar selección','선택 지우기','選択を解除','Cancella selezione'],
  addToComparison:['Select for comparison','选择对比','Sélectionner pour comparer','Zum Vergleich auswählen','Seleccionar para comparar','비교 대상으로 선택','比較対象に選択','Seleziona per il confronto'],
  removeFromComparison:['Remove from comparison','移出对比','Retirer de la comparaison','Aus Vergleich entfernen','Quitar de la comparación','비교에서 제외','比較から外す','Rimuovi dal confronto'],
  openDetails:['Open details for {name}','查看 {name} 详情','Afficher les détails de {name}','Details zu {name} öffnen','Abrir detalles de {name}','{name} 상세 정보 열기','{name}の詳細を開く','Apri i dettagli di {name}'],
  closeDetails:['Close details for {name}','收起 {name} 详情','Fermer les détails de {name}','Details zu {name} schließen','Cerrar detalles de {name}','{name} 상세 정보 닫기','{name}の詳細を閉じる','Chiudi i dettagli di {name}'],
  originalName:['Original name','原名','Nom original','Originalname','Nombre original','원래 이름','原名','Nome originale'],
  nameBasis:['Name record','名称记录','Fiche du nom','Namensnachweis','Registro del nombre','이름 기록','名称記録','Scheda del nome'],
  producerName:['Name published by the producer','生产商发布的名称','Nom publié par le producteur','Vom Hersteller veröffentlichter Name','Nombre publicado por el productor','생산자가 공개한 이름','生産者が公開した名称','Nome pubblicato dal produttore'],
  editorialName:['Reviewed editorial name','经核对的编辑名称','Nom éditorial vérifié','Geprüfter redaktioneller Name','Nombre editorial verificado','검토된 편집 이름','確認済みの編集名称','Nome editoriale verificato'],
  nameSources:['Name sources','名称来源','Sources du nom','Namensquellen','Fuentes del nombre','이름 출처','名称の出典','Fonti del nome'],
} as const;

export type P02BottleKey=keyof typeof copy;

export function p02BottleText(locale:Locale,key:P02BottleKey,values:Record<string,string|number>={}):string{
  const index=order.indexOf(locale);
  const value=copy[key][index<0?0:index]??copy[key][0];
  return value.replace(/\{(\w+)\}/g,(_,name:string)=>String(values[name]??`{${name}}`));
}
