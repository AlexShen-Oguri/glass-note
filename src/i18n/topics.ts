import type {Locale} from '../domain/contracts';

const copy={
  region:['Region','赛区','Région','Region','Región','지역','地域','Regione'],
  stage:['Award / stage','奖项／阶段','Prix / étape','Auszeichnung / Runde','Premio / fase','수상 / 단계','受賞・段階','Premio / fase'],
  organizer:['Organizer','主办组织','Organisateur','Veranstalter','Organizador','주최','主催','Organizzatore'],
  sourceFacts:['Published recipe facts','公开配方事实','Données de recette publiées','Veröffentlichte Rezeptdaten','Datos publicados de la receta','공개 레시피 정보','公開レシピ情報','Dati pubblicati della ricetta'],
  finishedServe:['Finished serve','成品配方','Service final','Fertiger Drink','Servicio final','완성 서브','完成品','Drink finito'],
  preparations:['Published preparations','公开预制材料','Préparations publiées','Veröffentlichte Vorbereitungen','Preparaciones publicadas','공개 사전 준비','公開された仕込み','Preparazioni pubblicate'],
  preparationIngredients:['Preparation ingredients','预制材料用量','Ingrédients de préparation','Zutaten der Vorbereitung','Ingredientes de preparación','사전 준비 재료','仕込み材料','Ingredienti della preparazione'],
  sourceGaps:['Details not published by the source','来源未公开的细节','Détails non publiés par la source','Von der Quelle nicht veröffentlichte Details','Detalles no publicados por la fuente','출처 미공개 세부사항','出典で未公開の詳細','Dettagli non pubblicati dalla fonte'],
  editorial:['Editorial note','编辑摘要','Note éditoriale','Redaktionelle Notiz','Nota editorial','편집 메모','編集メモ','Nota editoriale'],
  method:['Published method, condensed','公开手法（精简）','Méthode publiée, abrégée','Veröffentlichte Methode, gekürzt','Método publicado, resumido','공개 제조법 요약','公開手順（要約）','Metodo pubblicato, sintetizzato'],
  translationMode:['Translated view','译文视图','Vue traduite','Übersetzte Ansicht','Vista traducida','번역 보기','翻訳表示','Vista tradotta'],
  originalMode:['Original source','来源原文','Source originale','Originalquelle','Fuente original','원문 출처','原文出典','Fonte originale'],
  translationNote:['Localized editorial copy; names and source facts remain traceable.','本地化编辑文本；名称与来源事实仍可追溯。','Texte éditorial localisé ; noms et faits de source restent traçables.','Lokalisierter Redaktionstext; Namen und Quellenfakten bleiben nachvollziehbar.','Texto editorial localizado; los nombres y hechos de la fuente siguen siendo rastreables.','현지화된 편집 문안이며 이름과 출처 사실은 추적할 수 있습니다.','編集によるローカライズ文です。名称と出典事実は追跡できます。','Testo editoriale localizzato; nomi e fatti della fonte restano tracciabili.'],
  originalNote:['Source facts may be condensed or paraphrased; this view is not an exact quotation.','来源事实可能经过精简或释义；此视图不是逐字引文。','Les faits de la source peuvent être abrégés ou paraphrasés ; cette vue n’est pas une citation exacte.','Quellenangaben können gekürzt oder paraphrasiert sein; diese Ansicht ist kein wörtliches Zitat.','Los datos de la fuente pueden estar resumidos o parafraseados; esta vista no es una cita literal.','출처 사실은 요약 또는 바꿔 쓰기일 수 있으며, 이 보기는 정확한 인용문이 아닙니다.','出典の事実は要約または言い換えの場合があり、この表示は逐語引用ではありません。','I fatti della fonte possono essere sintetizzati o parafrasati; questa vista non è una citazione esatta.'],
  originalSourceFacts:['Canonical source facts','来源事实原文','Faits canoniques de la source','Kanonische Quellenangaben','Datos canónicos de la fuente','출처 원문 사실','出典の原文事実','Fatti canonici della fonte'],
  originalMaterialList:['Original Japanese material list','日文来源材料清单','Liste japonaise originale des ingrédients','Originale japanische Zutatenliste','Lista japonesa original de ingredientes','일본어 원문 재료 목록','原文の日本語材料リスト','Elenco originale giapponese degli ingredienti'],
  identityOnly:['Research record · the cited page confirms the work and competition stage; no recipe is claimed.','研究资料 · 引用页面确认作品及赛事阶段；此处不声称已取得配方。','Notice de recherche · la source confirme l’œuvre et l’étape, sans revendiquer de recette.','Rechercheeintrag · die Quelle bestätigt Werk und Runde; kein Rezept wird beansprucht.','Ficha de estudio · la fuente confirma obra y fase; no se afirma una receta.','연구 자료 · 출처가 작품과 단계를 확인하며 레시피는 주장하지 않습니다.','研究資料 · 出典が作品と段階を確認。レシピ収録とはみなしません。','Scheda di ricerca · la fonte conferma opera e fase; nessuna ricetta dichiarata.'],
  recipeResearch:['Research recipe · kept outside the cocktail catalogue and favorites.','研究配方 · 独立于酒库与收藏。','Recette de recherche · hors catalogue et favoris.','Forschungsrezept · außerhalb von Katalog und Favoriten.','Receta de estudio · fuera del catálogo y favoritos.','연구 레시피 · 칵테일 목록과 즐겨찾기에 포함되지 않습니다.','研究レシピ · 酒款カタログとお気に入りの対象外です。','Ricetta di ricerca · fuori da catalogo e preferiti.'],
  partialCoverage:['This is a selected subset of the official field.','这是官方名单的部分选录。','Sélection partielle du groupe officiel.','Auswahl aus dem offiziellen Feld.','Selección parcial del grupo oficial.','공식 명단 중 일부입니다.','公式一覧からの一部選録です。','Selezione parziale del gruppo ufficiale.'],
  officialSource:['Open official source','打开官方来源','Ouvrir la source officielle','Offizielle Quelle öffnen','Abrir fuente oficial','공식 출처 열기','公式出典を開く','Apri fonte ufficiale'],
} satisfies Record<string,[string,string,string,string,string,string,string,string]>;
const locales:Locale[]=['en','zh','fr','de','es','ko','ja','it'];
export type TopicKey=keyof typeof copy;
export const topicText=(locale:Locale,key:TopicKey)=>copy[key][locales.indexOf(locale)]??copy[key][0];
