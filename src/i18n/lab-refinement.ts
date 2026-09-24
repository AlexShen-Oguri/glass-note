import type {Locale} from '../domain/contracts';

const copy = {
  editAmount: ['Edit amount','编辑用量','Modifier la quantité','Menge bearbeiten','Editar cantidad','분량 편집','分量を編集','Modifica quantità'],
  preferredUnitHint: ['Shown in your preferred unit. Nothing is saved until you apply an edit.','按你的偏好单位显示；点击保存修改前不会写入记录。','Affiché dans votre unité préférée. Rien n’est enregistré avant validation.','Anzeige in deiner bevorzugten Einheit. Erst beim Anwenden wird gespeichert.','Se muestra en tu unidad preferida. Nada se guarda hasta aplicar el cambio.','선호 단위로 표시됩니다. 변경 적용 전에는 저장되지 않습니다.','希望単位で表示中。変更を適用するまで保存されません。','Visualizzato nell’unità preferita. Nulla viene salvato prima di applicare la modifica.'],
  applyAmount: ['Apply amount edit','保存用量修改','Appliquer la modification','Mengenänderung anwenden','Aplicar cambio de cantidad','분량 변경 적용','分量の変更を適用','Applica modifica'],
  discardAmount: ['Discard edit','放弃修改','Annuler la modification','Änderung verwerfen','Descartar cambio','변경 취소','変更を破棄','Annulla modifica'],
  unitShortcutHint: ['The ml and fl oz buttons convert the quantity. Typing another unit keeps the amount you see.','ml 与 fl oz 按钮会换算用量；手动输入其他单位会保留当前显示的数值。','Les boutons ml et fl oz convertissent la quantité. Saisir une autre unité conserve la valeur affichée.','Die Tasten ml und fl oz rechnen die Menge um. Eine andere eingegebene Einheit behält den sichtbaren Wert.','Los botones ml y fl oz convierten la cantidad. Escribir otra unidad conserva el valor visible.','ml 및 fl oz 버튼은 분량을 환산합니다. 다른 단위를 직접 입력하면 보이는 수치는 유지됩니다.','ml と fl oz ボタンは分量を換算します。別の単位を入力すると表示中の数値を保ちます。','I pulsanti ml e fl oz convertono la quantità. Digitando un’altra unità, il valore visibile resta invariato.'],
  chooseVersions: ['Choose 2 or 3 versions','选择 2 或 3 个版本','Choisissez 2 ou 3 versions','2 oder 3 Versionen wählen','Elige 2 o 3 versiones','버전 2개 또는 3개 선택','2つまたは3つの版を選択','Scegli 2 o 3 versioni'],
  chooseVersionsHint: ['Selected versions stay in place as you edit the project.','编辑项目时会保留当前选择。','La sélection reste en place pendant vos modifications.','Die Auswahl bleibt beim Bearbeiten bestehen.','La selección se mantiene mientras editas el proyecto.','프로젝트를 편집해도 현재 선택이 유지됩니다.','プロジェクト編集中も選択は保持されます。','La selezione resta invariata durante le modifiche.'],
  comparisonSummary: ['Comparison summary','对比摘要','Résumé de la comparaison','Vergleichsübersicht','Resumen de comparación','비교 요약','比較サマリー','Riepilogo confronto'],
  shared: ['Shared','相同','Commun','Gleich','Igual','동일','共通','Uguale'],
  differs: ['Differs','不同','Différent','Unterschiedlich','Diferente','다름','相違あり','Diverso'],
} satisfies Record<string, [string,string,string,string,string,string,string,string]>;

export type LabRefinementKey = keyof typeof copy;
const locales: Locale[] = ['en','zh','fr','de','es','ko','ja','it'];
export const labRefinementText = (locale: Locale, key: LabRefinementKey) =>
  copy[key][locales.indexOf(locale)] ?? copy[key][0];
