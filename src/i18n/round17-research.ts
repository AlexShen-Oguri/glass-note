import type {Locale} from '../domain/contracts';
import type {Round17Dimension, Round17EditorialNote, Round17Note, Round17Status} from '../content/round17-research';

const locales: Locale[] = ['en', 'zh', 'fr', 'de', 'es', 'ko', 'ja', 'it'];
type Eight = readonly [string, string, string, string, string, string, string, string];

const copy = {
  identityScope: ['Confirms the winner’s identity only; does not verify the recipe.', '仅确认获奖者身份，不核实配方内容。', 'Confirme uniquement l’identité du lauréat, pas la recette.', 'Bestätigt nur die Identität des Gewinners, nicht das Rezept.', 'Confirma solo la identidad del ganador, no la receta.', '수상자 신원만 확인하며 레시피 내용은 검증하지 않습니다.', '受賞者の情報のみを確認する出典で、レシピの検証ではありません。', 'Conferma solo l’identità del vincitore, non la ricetta.'],
  topicSelector: ['Competition and year', '赛事与年份', 'Concours et année', 'Wettbewerb und Jahr', 'Concurso y año', '대회와 연도', '大会と年', 'Concorso e anno'],
  changeTopic: ['Choose another topic', '选择其他专题', 'Choisir un autre sujet', 'Anderes Thema wählen', 'Elegir otro tema', '다른 주제 선택', '別の特集を選ぶ', 'Scegli un altro argomento'],
  closeTopics: ['Close topic list', '收起专题列表', 'Fermer la liste', 'Themenliste schließen', 'Cerrar la lista', '주제 목록 닫기', '特集一覧を閉じる', 'Chiudi l’elenco'],
  topicSearch: ['Search competition, year, or region', '搜索赛事、年份或赛区', 'Rechercher concours, année ou région', 'Wettbewerb, Jahr oder Region suchen', 'Buscar concurso, año o región', '대회, 연도 또는 지역 검색', '大会・年・地域を検索', 'Cerca concorso, anno o regione'],
  noTopicResults: ['No topics match that search.', '没有符合搜索的专题。', 'Aucun sujet ne correspond.', 'Keine passenden Themen.', 'Ningún tema coincide.', '일치하는 주제가 없습니다.', '該当する特集がありません。', 'Nessun argomento corrisponde.'],
  collectedEntries: ['{count} collected entries', '已收录 {count} 条', '{count} entrées recueillies', '{count} erfasste Einträge', '{count} entradas recopiladas', '{count}개 자료 수록', '{count}件収録', '{count} voci raccolte'],
  officialKnown: ['Official field: {count}', '官方范围：{count}', 'Champ officiel : {count}', 'Offizielles Feld: {count}', 'Grupo oficial: {count}', '공식 명단: {count}', '公式枠：{count}', 'Elenco ufficiale: {count}'],
  officialUnknown: ['Official field size not stated', '官方总数未说明', 'Taille du groupe officiel non indiquée', 'Größe des offiziellen Feldes nicht angegeben', 'No se indica el total oficial', '공식 전체 수 미공개', '公式総数は未記載', 'Totale ufficiale non indicato'],
  selectedSubset: ['Selected coverage; not a complete annual directory.', '部分选录，不是全年完整目录。', 'Sélection partielle, pas un annuaire annuel complet.', 'Ausgewählte Abdeckung, kein vollständiges Jahresverzeichnis.', 'Selección parcial, no un directorio anual completo.', '일부 선별 자료이며 연간 전체 목록이 아닙니다.', '一部選録で、年間の完全な一覧ではありません。', 'Selezione parziale, non un elenco annuale completo.'],
  reviewTitle: ['Disclosure review', '资料完整度审查', 'Examen des informations publiées', 'Prüfung der veröffentlichten Angaben', 'Revisión de datos publicados', '공개 범위 검토', '公開範囲の確認', 'Verifica delle informazioni pubblicate'],
  completeness: ['Published detail', '公开程度', 'Niveau publié', 'Veröffentlichungsgrad', 'Detalle publicado', '공개 정도', '公開状況', 'Dettaglio pubblicato'],
  sources: ['Source status', '来源状态', 'État des sources', 'Quellenstatus', 'Estado de las fuentes', '출처 상태', '出典状況', 'Stato delle fonti'],
  sourceAvailable: ['Available at this check', '本次检查可访问', 'Disponible lors de ce contrôle', 'Bei dieser Prüfung verfügbar', 'Disponible en esta revisión', '이번 확인에서 접근 가능', '今回の確認で閲覧可能', 'Disponibile a questo controllo'],
  sourceUnavailable: ['Original page unavailable at this check', '本次检查原页面不可访问', 'Page d’origine indisponible lors de ce contrôle', 'Originalseite bei dieser Prüfung nicht verfügbar', 'Página original no disponible en esta revisión', '이번 확인에서 원문 페이지 접근 불가', '今回の確認で元ページにアクセス不可', 'Pagina originale non disponibile a questo controllo'],
  sourceRecordNotice: ['The original recipe page is currently unavailable; the details below come from the existing record.', '原配方页面当前不可访问；以下内容来自既有记录。', 'La page de la recette d’origine est actuellement indisponible ; les détails ci-dessous proviennent du relevé existant.', 'Die ursprüngliche Rezeptseite ist derzeit nicht verfügbar; die folgenden Angaben stammen aus der bestehenden Aufzeichnung.', 'La página de la receta original no está disponible actualmente; los datos siguientes proceden del registro existente.', '원래 레시피 페이지에 현재 접근할 수 없어 아래 내용은 기존 기록을 바탕으로 표시합니다.', '元のレシピページは現在閲覧できないため、以下は既存の記録を表示しています。', 'La pagina della ricetta originale non è al momento disponibile; i dettagli seguenti provengono dalla registrazione esistente.'],
  checkedOn: ['Checked {date}', '检查于 {date}', 'Vérifié le {date}', 'Geprüft am {date}', 'Revisado el {date}', '{date} 확인', '{date}確認', 'Verificato il {date}'],
  lastPriorCheck: ['Existing transcription was checked {date}', '现有转录核对于 {date}', 'Transcription existante vérifiée le {date}', 'Bestehende Transkription geprüft am {date}', 'Transcripción existente revisada el {date}', '기존 전사는 {date}에 확인', '既存の転記は{date}に確認', 'Trascrizione esistente verificata il {date}'],
  status410: ['The original URL returned HTTP 410; no new recipe facts were added.', '原始网址返回 HTTP 410；本次未新增配方事实。', 'L’URL d’origine a renvoyé HTTP 410 ; aucun nouveau fait de recette ajouté.', 'Die Original-URL gab HTTP 410 zurück; keine neuen Rezeptfakten ergänzt.', 'La URL original devolvió HTTP 410; no se añadieron datos nuevos de receta.', '원문 URL이 HTTP 410을 반환해 새 레시피 사실을 추가하지 않았습니다.', '元URLはHTTP 410を返したため、新しいレシピ事実は追加していません。', 'L’URL originale ha restituito HTTP 410; non sono stati aggiunti nuovi dati della ricetta.'],
  factLayer: ['Source disclosure', '来源披露事实', 'Informations de la source', 'Angaben der Quelle', 'Datos de la fuente', '출처 공개 사실', '出典の公開事実', 'Dati della fonte'],
  editorialLayer: ['Editorial research note', '编辑研究建议', 'Note de recherche éditoriale', 'Redaktionelle Forschungsnotiz', 'Nota editorial de estudio', '편집 연구 메모', '編集リサーチメモ', 'Nota editoriale di ricerca'],
  researchOnly: ['Research record only. It is not a makeable public recipe or a catalog entry.', '仅为研究资料，不是可调制公共配方，也不进入酒库。', 'Dossier de recherche uniquement, ni recette publique réalisable ni entrée du catalogue.', 'Nur Forschungsdatensatz, kein nachmixbares öffentliches Rezept und kein Katalogeintrag.', 'Solo ficha de estudio; no es una receta pública preparable ni una entrada del catálogo.', '연구 자료일 뿐이며 조주 가능한 공개 레시피나 카탈로그 항목이 아닙니다.', '研究資料のみで、作成可能な公開レシピでもカタログ項目でもありません。', 'Solo scheda di ricerca; non è una ricetta pubblica eseguibile né una voce del catalogo.'],
  translationReview: ['Eight-language reading copy is editorially reviewed; native-language final review is still pending.', '八语阅读文案已做编辑审读，仍未完成各语言母语终审。', 'Le texte en huit langues a été relu éditorialement ; la validation finale par des locuteurs natifs reste à faire.', 'Die Lesefassung in acht Sprachen ist redaktionell geprüft; die abschließende muttersprachliche Prüfung steht aus.', 'El texto en ocho idiomas tiene revisión editorial; falta la revisión final por hablantes nativos.', '8개 언어 문안은 편집 검토를 거쳤으며 원어민 최종 검토는 남아 있습니다.', '8言語の文面は編集確認済みですが、各言語の母語話者による最終確認は未完了です。', 'Il testo in otto lingue è stato rivisto editorialmente; resta la revisione finale di madrelingua.'],
  originalUrl: ['Original URL', '原始网址', 'URL d’origine', 'Original-URL', 'URL original', '원문 URL', '元URL', 'URL originale'],
} satisfies Record<string, Eight>;

const dimensions: Record<Round17Dimension, Eight> = {
  'finished-recipe': ['Finished recipe', '成品顶层配方', 'Recette finale', 'Fertiges Rezept', 'Receta terminada', '완성 레시피', '完成レシピ', 'Ricetta finita'],
  preparations: ['Preparations', '预制材料', 'Préparations', 'Vorbereitungen', 'Preparaciones', '사전 준비', '仕込み', 'Preparazioni'],
  quantities: ['Quantities', '用量', 'Quantités', 'Mengen', 'Cantidades', '분량', '分量', 'Quantità'],
  technique: ['Technique', '手法', 'Technique', 'Technik', 'Técnica', '기법', '手法', 'Tecnica'],
  dilution: ['Dilution', '稀释', 'Dilution', 'Verdünnung', 'Dilución', '희석', '希釈', 'Diluizione'],
  'finished-abv': ['Finished ABV', '成品 ABV', 'Degré final', 'Fertiger Alkoholgehalt', 'ABV final', '완성 ABV', '完成時ABV', 'ABV finale'],
};

const statuses: Record<Round17Status, Eight> = {
  published: ['Published', '已公开', 'Publié', 'Veröffentlicht', 'Publicado', '공개됨', '公開済み', 'Pubblicato'],
  partial: ['Partial', '部分公开', 'Partiel', 'Teilweise', 'Parcial', '일부 공개', '一部公開', 'Parziale'],
  unknown: ['Unknown', '未知', 'Inconnu', 'Unbekannt', 'Desconocido', '알 수 없음', '不明', 'Sconosciuto'],
};

const notes: Record<Round17Note, Eight> = {
  'finished-recipe-recorded': ['Top-level ingredients and serving method are present in the existing checked transcription.', '现有已核对转录包含顶层材料与上桌手法。', 'La transcription vérifiée existante contient les ingrédients principaux et le service.', 'Die bestehende geprüfte Transkription enthält Hauptzutaten und Serviermethode.', 'La transcripción revisada contiene ingredientes principales y servicio.', '기존 확인 전사에 상위 재료와 제공 방식이 있습니다.', '既存の確認済み転記に主要材料と提供手順があります。', 'La trascrizione verificata contiene ingredienti principali e servizio.'],
  'coconut-components-partial': ['Coconut cold brew is partly recorded; pineapple amaro and coffee-sugar dust formulas are not.', '椰子冷萃仅部分公开；菠萝 amaro 与咖啡糖尘配方未知。', 'Le cold brew coco est partiel ; les formules de l’amaro d’ananas et du sucre au café manquent.', 'Kokos-Cold-Brew ist teilweise erfasst; Formeln für Ananas-Amaro und Kaffeezucker fehlen.', 'El cold brew de coco es parcial; faltan las fórmulas de amaro de piña y azúcar de café.', '코코넛 콜드브루는 일부만 기록됐고 파인애플 아마로와 커피 설탕 가루 배합은 없습니다.', 'ココナッツコールドブリューは一部のみ記録され、パイナップルアマーロとコーヒーシュガーの配合は不明です。', 'Il cold brew al cocco è parziale; mancano le formule di amaro all’ananas e zucchero al caffè.'],
  'apple-components-partial': ['The apple-vodka infusion is recorded; cordial, clarification, bitters and custom ice formulas are not.', '苹果伏特加浸泡法已记录；cordial、澄清、苦精与定制冰块配方未知。', 'L’infusion pomme-vodka est enregistrée ; cordial, clarification, bitters et glace restent inconnus.', 'Der Apfel-Wodka-Auszug ist erfasst; Cordial, Klärung, Bitters und Eisformeln fehlen.', 'La infusión de manzana y vodka está registrada; faltan cordial, clarificación, bitters y hielo.', '사과 보드카 인퓨전은 기록됐지만 코디얼, 정제, 비터, 맞춤 얼음 배합은 없습니다.', 'リンゴウォッカの浸漬は記録済みですが、コーディアル、清澄、ビターズ、特製氷の配合は不明です。', 'L’infusione mela-vodka è registrata; mancano cordial, chiarifica, bitter e ghiaccio.'],
  'garnish-and-ratio-unclear': ['Main serve quantities are recorded; garnish quantity and the direction or basis of the 1:4 ratio are unclear.', '主要用量已记录；装饰用量及 1:4 比例的方向与计量基础不明。', 'Les quantités principales sont connues ; la garniture et le sens ou la base du ratio 1:4 restent flous.', 'Hauptmengen sind erfasst; Garniturmenge sowie Richtung und Basis von 1:4 sind unklar.', 'Las cantidades principales constan; la guarnición y el sentido o base de 1:4 no están claros.', '주요 분량은 기록됐지만 가니시 양과 1:4 비율의 방향·기준은 불명확합니다.', '主要分量は記録済みですが、飾りの量と1:4の向き・基準は不明です。', 'Le quantità principali sono registrate; guarnizione e direzione o base di 1:4 non sono chiare.'],
  'scraps-and-dusting-unclear': ['Main serve quantities are recorded; apple scraps and the dusting quantity are not measured.', '主要用量已记录；苹果余料与撒面用量没有明确计量。', 'Les quantités principales sont connues ; résidus de pomme et poudrage ne sont pas mesurés.', 'Hauptmengen sind erfasst; Apfelreste und Bestäubungsmenge sind nicht bemessen.', 'Las cantidades principales constan; restos de manzana y espolvoreado no están medidos.', '주요 분량은 기록됐지만 사과 부산물과 뿌리는 양은 계량되지 않았습니다.', '主要分量は記録済みですが、リンゴの端材と振りかける量は未計量です。', 'Le quantità principali sono registrate; scarti di mela e spolverata non sono misurati.'],
  'technique-recorded': ['The existing transcription records the published sequence in condensed form.', '现有转录以精简形式记录了公开步骤顺序。', 'La transcription existante résume la séquence publiée.', 'Die bestehende Transkription hält die veröffentlichte Reihenfolge gekürzt fest.', 'La transcripción resume la secuencia publicada.', '기존 전사에 공개 단계 순서가 요약돼 있습니다.', '既存の転記に公開手順の順序を要約して記録しています。', 'La trascrizione riassume la sequenza pubblicata.'],
  'dilution-not-published': ['Ice use is named, but melt, water contribution and final volume are not published.', '虽提到用冰，但融水量、加水贡献与成品体积未公开。', 'La glace est indiquée, mais fonte, apport d’eau et volume final ne le sont pas.', 'Eis wird genannt, Schmelzwasser, Wasseranteil und Endvolumen jedoch nicht.', 'Se menciona el hielo, pero no el deshielo, el agua aportada ni el volumen final.', '얼음 사용은 적혀 있지만 녹은 물, 수분 기여, 최종 부피는 공개되지 않았습니다.', '氷の使用は記載されていますが、融水量、水分寄与、最終容量は未公開です。', 'Il ghiaccio è indicato, ma non acqua di fusione, apporto d’acqua e volume finale.'],
  'abv-not-calculable': ['Finished ABV is not stated and cannot be calculated from the published inputs and unknown dilution.', '来源未给成品 ABV，且现有输入与未知稀释不足以计算。', 'Le degré final n’est pas indiqué et ne peut être calculé avec les données et la dilution inconnue.', 'Der fertige Alkoholgehalt ist nicht angegeben und wegen fehlender Eingaben und Verdünnung nicht berechenbar.', 'No se indica el ABV final y no puede calcularse con los datos y la dilución desconocida.', '완성 ABV가 공개되지 않았고 입력값과 희석 정보가 부족해 계산할 수 없습니다.', '完成時ABVは未記載で、入力値と希釈情報が不足しているため計算できません。', 'L’ABV finale non è indicato e non è calcolabile con i dati e la diluizione ignota.'],
};

const editorial: Record<Round17EditorialNote, Eight> = {
  'verify-custom-components': ['Treat every missing custom component and dilution input as a blocker before testing the drink.', '实际复现前，应先核实所有缺失的特制材料与稀释输入。', 'Avant tout essai, vérifier chaque composant maison manquant et les données de dilution.', 'Vor einem Test alle fehlenden Eigenkomponenten und Verdünnungswerte klären.', 'Antes de probarla, verificar cada componente casero faltante y los datos de dilución.', '실제 테스트 전 누락된 맞춤 재료와 희석 입력을 모두 확인해야 합니다.', '実作前に、不明な自家製素材と希釈条件をすべて確認する必要があります。', 'Prima della prova, verificare ogni componente artigianale mancante e i dati di diluizione.'],
};

export type Round17Key = keyof typeof copy;
const pick = (values: Eight, locale: Locale) => values[locales.indexOf(locale)] ?? values[0];
const format = (value: string, values?: Record<string, string | number>) => values
  ? value.replace(/\{([A-Za-z0-9_]+)\}/g, (match, key: string) => values[key] === undefined ? match : String(values[key]))
  : value;

export function round17Text(locale: Locale, key: Round17Key, values?: Record<string, string | number>): string {
  return format(pick(copy[key], locale), values);
}
export const round17DimensionText = (locale: Locale, value: Round17Dimension) => pick(dimensions[value], locale);
export const round17StatusText = (locale: Locale, value: Round17Status) => pick(statuses[value], locale);
export const round17NoteText = (locale: Locale, value: Round17Note) => pick(notes[value], locale);
export const round17EditorialText = (locale: Locale, value: Round17EditorialNote) => pick(editorial[value], locale);
