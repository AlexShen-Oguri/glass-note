import type {Locale} from '../domain/contracts';

const en = {
  title: 'Preparation notes',
  show: 'Show preparation notes',
  hide: 'Hide preparation notes',
  disclosed: 'Source disclosed',
  partial: 'Some details missing',
  inspiration: 'Inspiration only',
  preparedIngredient: 'Prepared ingredient',
  process: 'Process',
  inputs: 'Inputs',
  processInputs: 'Process inputs',
  method: 'Method',
  equipment: 'Equipment',
  timing: 'Timing',
  temperature: 'Temperature',
  yield: 'Yield',
  gaps: 'Still missing',
  source: 'Preparation source',
  sourceNote: 'Source disclosure records what was published; it is not a Glass Notes test result.',
  openCard: 'Show details',
  closeCard: 'Hide details',
};

const copy: Record<Locale, typeof en> = {
  en,
  zh: {title:'制作资料',show:'展开制作资料',hide:'收起制作资料',disclosed:'来源已披露',partial:'部分细节缺失',inspiration:'仅作灵感参考',preparedIngredient:'预制材料',process:'处理工艺',inputs:'材料',processInputs:'工艺投入材料',method:'制作步骤',equipment:'设备',timing:'时间',temperature:'温度',yield:'产量',gaps:'仍缺资料',source:'制作资料来源',sourceNote:'来源披露只记录公开内容，不代表 Glass Notes 已实际制作验证。',openCard:'展开细节',closeCard:'收起细节'},
  fr: {title:'Préparations',show:'Afficher les préparations',hide:'Masquer les préparations',disclosed:'Décrit par la source',partial:'Détails incomplets',inspiration:'Inspiration seulement',preparedIngredient:'Ingrédient préparé',process:'Procédé',inputs:'Ingrédients',processInputs:'Ingrédients du procédé',method:'Méthode',equipment:'Matériel',timing:'Durée',temperature:'Température',yield:'Rendement',gaps:'Informations manquantes',source:'Source de la préparation',sourceNote:'La source indique ce qui a été publié ; Glass Notes ne l’a pas testé.',openCard:'Afficher les détails',closeCard:'Masquer les détails'},
  de: {title:'Vorbereitungen',show:'Vorbereitungen anzeigen',hide:'Vorbereitungen ausblenden',disclosed:'Von der Quelle offengelegt',partial:'Einige Angaben fehlen',inspiration:'Nur als Inspiration',preparedIngredient:'Vorbereitete Zutat',process:'Verfahren',inputs:'Zutaten',processInputs:'Zutaten für das Verfahren',method:'Methode',equipment:'Geräte',timing:'Dauer',temperature:'Temperatur',yield:'Ausbeute',gaps:'Noch nicht angegeben',source:'Quelle der Vorbereitung',sourceNote:'Die Quellenangabe dokumentiert die Veröffentlichung; Glass Notes hat sie nicht getestet.',openCard:'Details anzeigen',closeCard:'Details ausblenden'},
  es: {title:'Preparaciones',show:'Mostrar preparaciones',hide:'Ocultar preparaciones',disclosed:'Publicado por la fuente',partial:'Faltan algunos detalles',inspiration:'Solo como inspiración',preparedIngredient:'Ingrediente preparado',process:'Proceso',inputs:'Ingredientes',processInputs:'Insumos del proceso',method:'Método',equipment:'Equipo',timing:'Tiempo',temperature:'Temperatura',yield:'Rendimiento',gaps:'Información pendiente',source:'Fuente de la preparación',sourceNote:'La fuente refleja lo publicado; no significa que Glass Notes lo haya probado.',openCard:'Mostrar detalles',closeCard:'Ocultar detalles'},
  ko: {title:'사전 준비',show:'사전 준비 보기',hide:'사전 준비 닫기',disclosed:'출처 공개',partial:'일부 정보 누락',inspiration:'영감 참고용',preparedIngredient:'사전 준비 재료',process:'처리 과정',inputs:'재료',processInputs:'처리 투입 재료',method:'방법',equipment:'도구',timing:'시간',temperature:'온도',yield:'분량',gaps:'아직 없는 정보',source:'준비법 출처',sourceNote:'출처 공개 여부는 게시된 내용을 뜻하며 Glass Notes의 실제 테스트 결과가 아닙니다.',openCard:'세부 정보 보기',closeCard:'세부 정보 닫기'},
  ja: {title:'仕込み資料',show:'仕込み資料を開く',hide:'仕込み資料を閉じる',disclosed:'出典に記載あり',partial:'一部詳細なし',inspiration:'着想のみ',preparedIngredient:'仕込み材料',process:'処理工程',inputs:'材料',processInputs:'工程に使う材料',method:'作り方',equipment:'器具',timing:'時間',temperature:'温度',yield:'出来上がり量',gaps:'未記載の情報',source:'仕込みの出典',sourceNote:'出典の記載は公開内容の記録であり、Glass Notesでの実作検証ではありません。',openCard:'詳細を開く',closeCard:'詳細を閉じる'},
  it: {title:'Preparazioni',show:'Mostra le preparazioni',hide:'Nascondi le preparazioni',disclosed:'Descritto dalla fonte',partial:'Mancano alcuni dettagli',inspiration:'Solo come ispirazione',preparedIngredient:'Ingrediente preparato',process:'Procedimento',inputs:'Ingredienti',processInputs:'Ingredienti del procedimento',method:'Metodo',equipment:'Attrezzatura',timing:'Tempo',temperature:'Temperatura',yield:'Resa',gaps:'Informazioni mancanti',source:'Fonte della preparazione',sourceNote:'La fonte registra quanto pubblicato; non è una prova eseguita da Glass Notes.',openCard:'Mostra dettagli',closeCard:'Nascondi dettagli'},
};

const undisclosed:Record<Locale,string>={en:'Not disclosed by source',zh:'来源未公开',fr:'Non divulgué par la source',de:'Von der Quelle nicht offengelegt',es:'No publicado por la fuente',ko:'출처 미공개',ja:'出典では未公開',it:'Non divulgato dalla fonte'};
export const preparationCopy = (locale: Locale) => ({...copy[locale],undisclosed:undisclosed[locale]});
