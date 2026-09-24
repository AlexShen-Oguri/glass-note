import {LOCALES,type Locale} from '../domain/contracts';

type PantryTextTuple = readonly [string,string,string,string,string,string,string,string];

const copy = {
  intro: ['Keep the ingredients you have here, then find a drink.','先记下已有材料，再看看能调什么','Gardez ici les ingrédients que vous avez, puis trouvez un cocktail.','Halte hier deine vorhandenen Zutaten fest und finde danach einen Drink.','Guarda aquí los ingredientes que tienes y descubre después qué preparar.','가지고 있는 재료를 기록하고 만들 수 있는 한 잔을 찾아보세요.','手持ちの材料をここに登録して、作れる一杯を探しましょう。','Tieni qui gli ingredienti che hai, poi trova un drink.'],
  inventoryTab: ['My ingredients','我的材料','Mes ingrédients','Meine Zutaten','Mis ingredientes','내 재료','手持ちの材料','I miei ingredienti'],
  drinksTab: ['What can I make?','能做什么','Que puis-je préparer ?','Was kann ich zubereiten?','¿Qué puedo preparar?','무엇을 만들 수 있나요?','何が作れる？','Cosa posso preparare?'],
  addIngredients: ['Add ingredients','添加材料','Ajouter des ingrédients','Zutaten hinzufügen','Añadir ingredientes','재료 추가','材料を追加','Aggiungi ingredienti'],
  addTitle: ['What do you have?','你手边有什么','Qu’avez-vous sous la main ?','Was hast du da?','¿Qué tienes a mano?','무엇이 있나요?','何がありますか？','Cosa hai a portata di mano?'],
  addHint: ['Choose the ingredients you have. Owned bottles also count toward readiness.','选择你实际拥有的材料；已有瓶款也会计入备齐状态。','Choisissez les ingrédients que vous avez. Les bouteilles possédées comptent aussi pour la préparation.','Wähle deine vorhandenen Zutaten. Eigene Flaschen zählen ebenfalls zur Bereitschaft.','Elige los ingredientes que tienes. Las botellas propias también cuentan para la preparación.','가지고 있는 재료를 선택하세요. 보유한 보틀도 준비 상태에 포함됩니다.','手持ちの材料を選びます。所有ボトルも準備状況に含まれます。','Scegli gli ingredienti che hai. Anche le bottiglie possedute contano per la preparazione.'],
  addSearch: ['Search all ingredients','搜索材料库','Rechercher tous les ingrédients','Alle Zutaten durchsuchen','Buscar todos los ingredientes','모든 재료 검색','すべての材料を検索','Cerca tutti gli ingredienti'],
  closeAdd: ['Done','完成添加','Terminé','Fertig','Listo','완료','完了','Fatto'],
  added: ['Added','已添加','Ajouté','Hinzugefügt','Añadido','추가됨','追加済み','Aggiunto'],
  add: ['Add','添加','Ajouter','Hinzufügen','Añadir','추가','追加','Aggiungi'],
  emptyTitle: ['Start with what you have','从手边的材料开始','Commencez par ce que vous avez','Beginne mit dem, was du hast','Empieza con lo que tienes','가진 것부터 시작하세요','手元にあるものから始める','Inizia da ciò che hai'],
  emptyHint: ['Add a spirit, mixer or garnish to build your cabinet.','添加基酒、配料或装饰，开始整理你的酒柜','Ajoutez un spiritueux, un ingrédient de mélange ou une garniture pour commencer votre bar.','Füge eine Spirituose, einen Mixer oder eine Garnitur hinzu, um deinen Schrank aufzubauen.','Añade un destilado, un mezclador o una guarnición para empezar tu mueble bar.','베이스 술, 믹서 또는 가니시를 추가해 술장을 시작하세요.','スピリッツ、ミキサー、またはガーニッシュを追加して、酒棚を整えましょう。','Aggiungi un distillato, un mixer o una guarnizione per iniziare a creare il tuo mobile bar.'],
  ownedIngredients: ['Ingredients · {count}','材料 · {count}','Ingrédients · {count}','Zutaten · {count}','Ingredientes · {count}','재료 · {count}개','材料 · {count}','Ingredienti · {count}'],
  ownedBottles: ['Bottles · {count}','瓶款 · {count}','Bouteilles · {count}','Flaschen · {count}','Botellas · {count}','보틀 · {count}개','ボトル · {count}','Bottiglie · {count}'],
  searchOwned: ['Search my ingredients','搜索我的材料','Rechercher dans mes ingrédients','Meine Zutaten durchsuchen','Buscar en mis ingredientes','내 재료 검색','手持ちの材料を検索','Cerca nei miei ingredienti'],
  noOwnedMatch: ['No matching ingredients in your cabinet.','酒柜中没有匹配的材料','Aucun ingrédient correspondant dans votre bar.','Keine passenden Zutaten in deinem Schrank.','No hay ingredientes coincidentes en tu mueble bar.','술장에 일치하는 재료가 없습니다.','酒棚に一致する材料はありません。','Nessun ingrediente corrispondente nel tuo mobile bar.'],
  fromBottle: ['From an owned bottle','来自已有瓶款','D’une bouteille possédée','Aus einer vorhandenen Flasche','De una botella que tienes','보유 중인 보틀에서','手持ちのボトルから','Da una bottiglia che possiedi'],
  removeMaterial: ['Remove from cabinet','从酒柜移除','Retirer du bar','Aus dem Schrank entfernen','Quitar del mueble bar','술장에서 제거','酒棚から削除','Rimuovi dal mobile bar'],
  removeMaterialOnly: ['Remove ingredient entry','移除单独添加的材料','Retirer l’entrée de l’ingrédient','Zutateneintrag entfernen','Quitar la entrada del ingrediente','재료 항목만 제거','材料の登録だけを削除','Rimuovi la voce dell’ingrediente'],
  retainedFromBottle: ['Your owned bottles also provide this ingredient.','你拥有的瓶款也提供这项材料','Vos bouteilles possédées fournissent aussi cet ingrédient.','Deine vorhandenen Flaschen liefern diese Zutat ebenfalls.','Tus botellas aportan también este ingrediente.','보유한 보틀에도 이 재료가 포함됩니다.','手持ちのボトルにもこの材料が含まれます。','Le bottiglie che possiedi forniscono anche questo ingrediente.'],
  materialDetails: ['Ingredient details','材料详情','Détails de l’ingrédient','Zutatendetails','Detalles del ingrediente','재료 상세','材料の詳細','Dettagli dell’ingrediente'],
  manageBottles: ['Manage bottles','管理瓶款','Gérer les bouteilles','Flaschen verwalten','Gestionar botellas','보틀 관리','ボトルを管理','Gestisci bottiglie'],
  goRecipes: ['Find drinks with these','用这些材料找酒','Trouver des cocktails avec ces ingrédients','Drinks mit diesen Zutaten finden','Buscar bebidas con estos ingredientes','이 재료로 만들 수 있는 음료 찾기','これらの材料で作れるドリンクを探す','Trova drink con questi ingredienti'],
  recipeEmptyTitle: ['Add what you have first','先添加你拥有的材料','Ajoutez d’abord ce que vous avez','Füge zuerst hinzu, was du hast','Añade primero lo que tienes','가진 재료를 먼저 추가하세요','まず手持ちの材料を追加','Aggiungi prima ciò che hai'],
  recipeEmptyHint: ['We’ll match complete recipes to your cabinet.','酒柜有了材料，就能查看匹配的完整配方','Nous comparerons les recettes complètes avec votre bar.','Wir gleichen vollständige Rezepte mit deinem Schrank ab.','Compararemos recetas completas con tu mueble bar.','술장과 완성된 레시피를 대조합니다.','手持ちの材料と完全なレシピを照合します。','Confronteremo le ricette complete con il tuo mobile bar.'],
  availableShelf: ['Ingredients covered','材料齐全','Ingrédients couverts','Zutaten abgedeckt','Ingredientes cubiertos','재료 충족','材料がそろう','Ingredienti coperti'],
  readyShelf: ['Ready to start','可开始','Prêt à commencer','Bereit zum Start','Listo para empezar','시작할 준비 완료','すぐ作れる','Pronto per iniziare'],
  checkShelf: ['Needs checking','待核对','À vérifier','Zu prüfen','Requiere revisión','확인 필요','要確認','Da verificare'],
  missingShelf: ['Missing ingredients','缺材料','Ingrédients manquants','Fehlende Zutaten','Ingredientes que faltan','부족한 재료','足りない材料','Ingredienti mancanti'],
  recipeResults: ['{count} drinks','{count} 杯','{count} cocktails','{count} Drinks','{count} bebidas','{count}잔','{count}杯','{count} drink'],
  restockTitle: ['What could I add next?','再补一项能做什么','Que pourrais-je ajouter ensuite ?','Was könnte ich als Nächstes ergänzen?','¿Qué podría añadir después?','다음에는 무엇을 더할까요?','次に何を足せばいい？','Cosa potrei aggiungere dopo?'],
  noRecipes: ['No recipes match this view yet.','当前分类还没有匹配配方','Aucune recette ne correspond encore à cette vue.','Für diese Ansicht gibt es noch keine passenden Rezepte.','Aún no hay recetas que coincidan con esta vista.','현재 보기와 맞는 레시피가 아직 없습니다.','この表示に一致するレシピはまだありません。','Nessuna ricetta corrisponde ancora a questa vista.'],
  goInventory: ['Back to my ingredients','返回我的材料','Retour à mes ingrédients','Zurück zu meinen Zutaten','Volver a mis ingredientes','내 재료로 돌아가기','手持ちの材料に戻る','Torna ai miei ingredienti'],
} satisfies Record<string, PantryTextTuple>;

export type P02PantryKey = keyof typeof copy;

export function p02PantryText(locale: Locale, key: P02PantryKey, values?: Record<string,string|number>): string {
  const template = copy[key][LOCALES.indexOf(locale)] ?? copy[key][0];
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? `{${name}}`));
}
