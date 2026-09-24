import type {Ingredient, IngredientFamily} from '../contracts';
import type {IngredientGroup} from './types';

/** Illustration/navigation hints only. These never establish allergens or substitutions. */
export function ingredientFamily(item: Ingredient): IngredientFamily {
  if (item.guide) return item.guide.family;
  const preparedFamilies: Partial<Record<string, IngredientFamily>> = {
    'nonalcoholic-umeshu': 'juice', 'apple-drink': 'juice',
    'sweet-potato-shochu': 'spirit', 'umeshu-whisky-blend': 'liqueur',
    'shiso-leaf': 'herb', 'kinome-leaf': 'herb',
    'tencha-bergamot-cordial': 'syrup', 'sencha-syrup': 'syrup',
    'lemongrass-hydrosol': 'water', 'kyoto-bancha-foam': 'tea',
  };
  if (preparedFamilies[item.id]) return preparedFamilies[item.id]!;
  const text = `${item.id} ${item.name.en}`.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/-/g, ' ');
  if (item.base && item.base !== 'none') return 'spirit';
  if (/\bvinegar\b/.test(text)) return 'vinegar';
  if (/\bsugar apple\b/.test(text)) return 'tropical';
  if (/\bwatermelon\b/.test(text)) return 'melon';
  if (/\bwatercress\b/.test(text)) return 'leaf';
  if (/\bwater chestnut\b|\beggplant\b|\bbutternut squash\b/.test(text)) return 'vegetable';
  if (/\bbutterfly pea\b/.test(text)) return 'flower';
  if (/\bcream cheese\b/.test(text)) return 'cheese';
  if (/\bliqueur wine\b|\bmuscadet\b/.test(text)) return 'wine';
  if (/\badvocaat\b|\blimoncello\b/.test(text)) return 'liqueur';
  if (/\bacorn squash\b|\baubergine\b|\bcourgette\b|\bchayotte\b|\btomatillo\b/.test(text)) return 'vegetable';
  if (/\bacorn\b|\bpeanut butter\b/.test(text)) return 'nut';
  if (/\bbuttermilk\b|\bwhey\b|\bfilmjolk\b/.test(text)) return 'milk';
  if (/creme fraiche|\bskyr\b|\bsmetana\b/.test(text)) return 'cream';
  if (/\bmuscovado\b|\bdulce de leche\b/.test(text)) return 'sugar';
  if (/\bliquorice\b|\blicorice\b/.test(text)) return 'spice';
  if (/\bsencha\b|\btencha\b/.test(text)) return 'tea';
  if (/\bcoffea\b/.test(text)) return 'coffee';
  if (/\bmilk chocolate\b|\bcocoa paste\b/.test(text)) return 'cocoa';
  if (/\bhoneydew melon\b/.test(text)) return 'melon';
  if (/\bbanana pepper\b/.test(text)) return 'pepper';
  if (/\blemon pepper\b/.test(text)) return 'spice';
  if (/\bcola nut\b/.test(text)) return 'nut';
  if (/\bcorn salad\b|\bbeet greens\b/.test(text)) return 'leaf';
  if (/\bcauliflower\b/.test(text)) return 'vegetable';
  if (/\bbrewed oolong tea\b/.test(text)) return 'tea';
  const rules: [RegExp, IngredientFamily][] = [
    [/bitters/, 'bitters'], [/syrup|cordial|orgeat|donns mix|gardenia mix/, 'syrup'],
    [/\bhoney\b/, 'honey'], [/liqueur|cr[eè]me de|chartreuse|cura[cç]ao|triple sec|campari|aperol|amaro|cynar|fernet|amaretto|drambuie|b[eé]n[eé]dictine|grand marnier|frangelico|falernum|schnapps|dram|galliano|pimms|suze|amer picon/, 'liqueur'],
    [/vermouth|sherry|\bport\b|wine|champagne|prosecco|lillet|quinquina|cocchi|punt e mes/, 'wine'],
    [/absinthe|pernod|aguardiente|aquavit|genever|\brum\b|\bgin\b|vodka|whisk|brandy|tequila|mezcal|cacha[cç]a|grappa/, 'spirit'],
    [/\bjuice\b|\bnectar\b/, 'juice'], [/ginger beer|ginger ale|\bsoda\b|tonic|\bcola\b|lemonade|sour mix/, 'soda'], [/\bbeer\b|\bstout\b|\bale\b|\blager\b/, 'beer'],
    [/vinegar/, 'vinegar'], [/\boil\b|ghee/, 'oil'], [/sauce|mustard|ketchup|paste|miso/, 'sauce'],
    [/jam|jelly|marmalade|preserve/, 'preserve'], [/sugar|jaggery|molasses/, 'sugar'],
    [/\bwater\b/, 'water'], [/cheese|curd/, 'cheese'], [/\bcream\b|\bbutter\b|yogurt|yoghurt/, 'cream'], [/\bmilk\b|kefir/, 'milk'],
    [/\begg\b|\beggs\b|albumen/, 'egg'], [/coffee|espresso/, 'coffee'], [/\btea\b|matcha|rooibos|mate$/, 'tea'], [/cocoa|chocolate|cacao/, 'cocoa'],
    [/salt/, 'salt'], [/star anise/, 'star-anise'], [/cinnamon|cassia/, 'cinnamon'], [/vanilla/, 'vanilla'],
    [/lime|lemon|orange|grapefruit|tangerine|mandarin|kumquat|yuzu|bergamot|pomelo|citrus/, 'citrus'],
    [/cherr/, 'cherry'], [/berry|berries|currant|a[cç]ai/, 'berry'], [/pineapple/, 'pineapple'], [/coconut/, 'coconut'],
    [/banana|plantain/, 'banana'], [/melon|cantaloupe|casaba/, 'melon'], [/apple/, 'apple'], [/\bpears?\b/, 'pear'], [/grape|raisin|sultana/, 'grape'],
    [/peach|plum|apricot|nectarine|date|olive/, 'stone-fruit'],
    [/mango|papaya|guava|passion|lychee|litchi|kiwi|fig|pomegranate|fruit/, 'tropical'],
    [/\bflowers?\b|\broses?\b|hibiscus|lavender|elderflower|chamomile|blossom/, 'flower'],
    [/mint|basil|rosemary|thyme|sage|oregano|tarragon|parsley|cilantro|coriander leaf|dill|herb|lemongrass/, 'herb'],
    [/spinach|leaf|leaves|lettuce|kale|cabbage/, 'leaf'], [/mushroom|truffle|fungus/, 'mushroom'], [/kelp|seaweed|nori|alga/, 'seaweed'],
    [/ginger|turmeric|horseradish|radish|beet|carrot|root/, 'root'], [/pepper|chili|chilli|capsicum|jalape/, 'pepper'],
    [/nutmeg|clove|cardamom|cumin|saffron|allspice|spice|paprika|sumac/, 'spice'],
    [/almond|hazelnut|walnut|cashew|pistachio|pecan|peanut|\bnut\b|nuts/, 'nut'],
    [/seed|sesame|poppy|chia|flax/, 'seed'], [/bean|lentil|chickpea|\bpea\b|peas|legume/, 'legume'],
    [/\brice\b|\boats?\b|wheat|\brye\b|barley|\bcorn\b|maize|quinoa|millet|flour|grain|starch/, 'grain'],
    [/cucumber|tomato|celery|onion|garlic|vegetable|pumpkin|squash/, 'vegetable'],
  ];
  return rules.find(([pattern]) => pattern.test(text))?.[1] ?? 'pantry';
}

export function familyGroup(family: IngredientFamily): IngredientGroup {
  if (family === 'spirit') return 'spirits';
  if (family === 'liqueur') return 'liqueurs';
  if (family === 'wine') return 'wines';
  if (family === 'bitters') return 'bitters';
  if (['beer','juice','soda','water'].includes(family)) return 'mixers';
  if (['herb','flower'].includes(family)) return 'herbs';
  if (['cinnamon','star-anise','vanilla','spice','pepper'].includes(family)) return 'spices';
  if (['syrup','honey','sugar'].includes(family)) return 'sweeteners';
  if (['milk','cream','cheese','egg'].includes(family)) return 'dairy';
  if (['nut','seed','grain','legume'].includes(family)) return 'nuts-grains';
  if (['coffee','tea','cocoa'].includes(family)) return 'tea-coffee';
  if (['oil','vinegar','sauce','preserve','salt','pantry'].includes(family)) return 'cooking';
  return 'fresh';
}
