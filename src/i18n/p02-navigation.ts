import {LOCALES,type Locale} from '../domain/contracts';

const text={
  storageIssue:['These records could not be read or saved.','这些记录未能读取或保存。','Ces données n’ont pas pu être lues ou enregistrées.','Diese Einträge konnten nicht gelesen oder gespeichert werden.','No se pudieron leer o guardar estos registros.','이 기록을 읽거나 저장하지 못했습니다.','この記録を読み込むか保存することができませんでした。','Non è stato possibile leggere o salvare questi dati.'],
  reviewIssue:['Open and check','打开查看','Ouvrir et vérifier','Öffnen und prüfen','Abrir y revisar','열어서 확인','開いて確認','Apri e controlla'],
  privateHint:['Originals and your own adaptations.','原创和你改编的配方。','Vos créations et adaptations.','Eigene Kreationen und Abwandlungen.','Tus creaciones y adaptaciones.','직접 만든 레시피와 변형 레시피.','オリジナルと自分でアレンジしたレシピ。','Le tue creazioni e varianti.'],
  favoriteHint:['Saved recipes and private drink lists.','收藏的配方和私人酒单。','Recettes favorites et listes privées de cocktails.','Gespeicherte Rezepte und private Cocktail-Listen.','Recetas guardadas y listas privadas de cócteles.','저장한 레시피와 개인 칵테일 목록.','保存したレシピとプライベートリスト。','Ricette salvate e liste private di cocktail.'],
  languageHint:['Change language using the language button at the top.','语言可通过页顶的语言按钮更改。','Changez de langue avec le bouton en haut de la page.','Die Sprache änderst du über die Schaltfläche oben.','Cambia de idioma con el botón de la parte superior.','상단의 언어 버튼으로 언어를 바꿀 수 있습니다.','言語はページ上部の言語ボタンで変更できます。','Cambia lingua con il pulsante in cima alla pagina.'],
} satisfies Record<string,readonly[string,string,string,string,string,string,string,string]>;
export function p02NavigationText(locale:Locale,key:keyof typeof text){return text[key][LOCALES.indexOf(locale)]??text[key][0];}
