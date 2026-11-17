/** Map initial bottle records to exact ingredient types. Stable product IDs are retained. */
export const ingredientIdentityCorrections: Readonly<Record<string, string[]>> = {
  'glenfiddich-12': ['single-malt-scotch-whisky'],
  'jack-daniels-old-no7': ['tennessee-whiskey'],
  'yamazaki-12': ['japanese-whisky'],
  'lairds-straight-applejack': ['applejack'],
  'bacardi-superior-carta-blanca': ['neutral-white-rum'],
  'crown-royal-deluxe': ['food-generic-whisky'],
  'haymans-sloe-gin': ['sloe-gin'],
};
