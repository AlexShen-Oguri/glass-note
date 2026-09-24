import type {Bottle} from "../../domain/bottles/types";

/**
 * Common Chinese brand names used as a search overlay.
 *
 * Matching is deliberately keyed by the bottle's own brand ID. Parent-company
 * names and generic spirit/category words must never broaden the match.
 */
const aliasesByBrandId: Readonly<Record<string, readonly string[]>> = {
  "brand-bacardi": ["百加得"],
  "brand-bombay-sapphire": ["孟买蓝宝石", "孟買藍寶石", "孟买蓝宝石金酒"],
  "brand-beefeater": ["必富达", "必富達"],
  "brand-tanqueray": ["添加利"],
  "brand-hendricks": ["亨利爵士"],
  "brand-absolut": ["绝对伏特加", "絕對伏特加"],
  "brand-smirnoff": ["斯米诺", "斯米諾"],
  "brand-hennessy": ["轩尼诗", "軒尼詩"],
  "brand-martell": ["马爹利", "馬爹利"],
  "brand-remy-martin": ["人头马", "人頭馬"],
  "brand-courvoisier": ["馥华诗", "馥華詩"],
  "brand-johnnie-walker": ["尊尼获加", "尊尼獲加"],
  "brand-macallan": ["麦卡伦", "麥卡倫"],
  "brand-jack-daniels": ["杰克丹尼"],
  "brand-jim-beam": ["金宾", "金賓"],
  "brand-jameson": ["尊美醇"],
  "brand-campari": ["金巴利"],
  "brand-aperol": ["阿佩罗", "阿佩羅"],
  "brand-cointreau": ["君度"],
  "brand-kahlua": ["甘露", "甘露咖啡利口酒"],
  "brand-baileys": ["百利", "百利甜"],
  "brand-giffard": ["吉发得", "吉發得"],
  "brand-bols": ["波士"],
  "brand-grand-marnier": ["柑曼怡", "金万利", "金萬利"],
  "brand-buffalo-trace": ["水牛足迹", "水牛足跡"],
  "brand-makers-mark": ["美格"],
  "brand-wild-turkey": ["威凤凰", "威鳳凰"],
  "brand-glenfiddich": ["格兰菲迪", "格蘭菲迪"],
  "brand-don-julio": ["唐胡里奥", "唐胡里奧", "唐·胡里奥", "唐·胡里奧"],
  "brand-patron": ["培恩"],
  "brand-lillet": ["利莱", "利萊"],
  "brand-chartreuse": ["沙特勒兹", "沙特勒茲", "查特酒"],
  "brand-luxardo": ["卢萨朵", "盧薩朵", "卢萨铎", "盧薩鐸"],
  "brand-roku": ["ROKU 六", "六金酒"],
  "brand-st-remy": ["圣雷米", "聖雷米"],
  "brand-jagermeister": ["野格"],
  "brand-malibu": ["马利宝", "馬利寶"],
};

const stableUnique = (values: readonly string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.normalize("NFKC").toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
};

/** Append reviewed Chinese brand aliases without mutating the source bottle. */
export const applyBottleAliases = (bottle: Bottle): Bottle => ({
  ...bottle,
  aliases: stableUnique([
    ...bottle.aliases,
    ...(aliasesByBrandId[bottle.brandId] ?? []),
  ]),
});
