/** Refine pilot material identities now that the expanded library supplies the exact types. Stable product IDs are retained. */
export const pilotIngredientCorrections: Readonly<Record<string, string[]>> = {
  'glenfiddich-12': ['single-malt-scotch-whisky'],
  'jack-daniels-old-no7': ['tennessee-whiskey'],
  'yamazaki-12': ['japanese-whisky'],
  'lairds-straight-applejack': ['applejack'],
  'bacardi-superior-carta-blanca': ['neutral-white-rum'],
  'crown-royal-deluxe': ['food-generic-whisky'],
  'haymans-sloe-gin': ['sloe-gin'],
};
