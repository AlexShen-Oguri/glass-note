import type {Cocktail, Locale, Localized} from "../../domain/contracts";
import {editorialCocktailNames} from './cocktail-editorial';
import {westernCocktailNames} from './cocktail-western-editorial';
import {batchMNames} from '../expansion/batch-m';

/**
 * Evidence labels used by the round-ten name audit.
 *
 * `name-source` means that a producer, IBA, or other first-party source uses
 * the displayed form. `editorial-consistent` means that the form follows a
 * documented regional bar/glossary convention while the source title remains
 * preserved. `user-term` is reserved for an explicit user preference; it can
 * still have an independent source URL attached in the audit.
 */
export type NameEvidenceLevel =
  | "name-source"
  | "editorial-consistent"
  | "user-term";

export type NameDecision = "keep" | "correct" | "original-name";
export type NameKind = "local-usual" | "source-proper";

export interface CocktailNameOverride {
  names: Partial<Localized>;
  /** New aliases and legacy display values that must remain searchable. */
  aliases?: string[];
  /** The title used by the recipe/source before a local usual name is chosen. */
  sourceProperName?: string;
  evidenceUrl?: string;
  evidenceUrlByLocale?: Partial<Record<Locale, string>>;
  evidenceLevel?: NameEvidenceLevel;
  evidenceLevelByLocale?: Partial<Record<Locale, NameEvidenceLevel>>;
  basis?: string;
  note?: string;
  nameKind?: Partial<Record<Locale, NameKind>>;
}

/**
 * Reviewed display-name corrections.  The catalogue remains the source of
 * the unchanged values; this table is deliberately an overlay so recipe IDs,
 * versions, descriptions, and source metadata remain untouched.
 */
export const reviewedNameOverrides: Record<string, CocktailNameOverride> = {
  americano: {
    names: {zh: "美国佬鸡尾酒"},
    aliases: ["美式鸡尾酒", "Americano"],
    sourceProperName: "Americano",
    evidenceUrl: "https://www.campari.com/zh-cn/our-cocktails/other-campari-cocktails/",
    evidenceLevel: "name-source",
    note: "Campari China uses this local name; 美式鸡尾酒 remains a valid searchable alternative. Recipe and source identities are unchanged. Reviewed 2026-09-15 in the P02 name audit.",
    nameKind: {zh: "local-usual"},
  },
  spritz: {
    names: {zh: "阿佩罗橙光"},
    aliases: ["斯普利兹", "Aperol Spritz"],
    sourceProperName: "Spritz",
    evidenceUrl: "https://www.aperol.com/zh-cn/aperol-spritz-cocktail/",
    evidenceLevel: "user-term",
    basis: "user-term",
    note: "User-approved Chinese usual name; the official Aperol China page independently uses 阿佩罗橙光 for the Aperol Spritz recipe. IBA keeps the source title Spritz in metadata.",
    nameKind: {zh: "local-usual"},
  },
  aviation: {
    names: {zh: "飞行"},
    aliases: ["航空", "航空鸡尾酒"],
    evidenceUrl: "https://dissolvedsolids.co/zh/cheatsheets/100-classics/",
    evidenceLevel: "editorial-consistent",
    note: "Established Chinese cocktail-list rendering; the old literal form remains an alias.",
    nameKind: {zh: "local-usual"},
  },
  boulevardier: {
    names: {zh: "花花公子"},
    aliases: ["Boulevardier"],
    evidenceUrl: "https://www.campari.com/zh-cn/our-cocktails/other-campari-cocktails/",
    evidenceLevel: "name-source",
    note: "Campari’s Chinese cocktail page uses 花花公子 for Boulevardier; the English source proper name remains searchable.",
    nameKind: {zh: "local-usual"},
  },
  "brandy-crusta": {
    names: {zh: "白兰地库斯塔"},
    aliases: ["白兰地糖边酒"],
    evidenceUrl: "https://www.hennessy.com/en-us/cocktails/brandy-crusta-cocktail",
    evidenceLevel: "editorial-consistent",
    note: "库斯塔 is the established Chinese transliteration for the proper cocktail name; the previous ingredient-style gloss is retained as an alias.",
    nameKind: {zh: "local-usual"},
  },
  "chartreuse-swizzle": {
    names: {zh: "查特酒斯威兹尔"},
    aliases: ["查特酒旋搅"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/chartreuse-swizzle/",
    evidenceLevel: "editorial-consistent",
    note: "Keeps Chartreuse as the regional brand rendering and transliterates the proper drink title; the technique gloss remains searchable.",
    nameKind: {zh: "local-usual"},
  },
  "dons-special-daiquiri": {
    names: {zh: "唐氏特调代基里"},
    aliases: ["唐的特别代基里"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/dons-special-daiquiri/",
    evidenceLevel: "editorial-consistent",
    note: "Uses a natural Chinese possessive and cocktail term while retaining the previous literal wording.",
    nameKind: {zh: "local-usual"},
  },
  "espresso-martini": {
    names: {zh: "浓缩咖啡马提尼"},
    aliases: ["浓缩咖啡马天尼", "咖啡马天尼"],
    evidenceUrl: "https://www.thebar.com/en-us/brands/the-cocktail-collection",
    evidenceLevel: "editorial-consistent",
    note: "Uses the current simplified-Chinese bar spelling 马提尼; the existing 马天尼 form remains searchable as a regional alias.",
    nameKind: {zh: "local-usual"},
  },
  "french-75": {
    names: {zh: "法兰西75"},
    aliases: ["法国 75", "法兰西 75", "法式75"],
    evidenceUrl: "https://www.courvoisier.com/zh-cn/cognac-cocktails/classics/french-75/",
    evidenceLevel: "name-source",
    note: "Courvoisier’s Chinese cocktail page uses 法兰西 75; spaces and the prior 法式 rendering remain searchable.",
    nameKind: {zh: "local-usual"},
  },
  "gin-basil-smash": {
    names: {zh: "金酒罗勒碎饮"},
    aliases: ["金酒罗勒撞击", "金酒罗勒斯马什"],
    evidenceUrl: "https://bartools.life/cocktails",
    evidenceLevel: "editorial-consistent",
    note: "Uses the Chinese bartending term 碎饮 for the Smash format rather than translating Smash as a physical impact; old spellings remain aliases.",
    nameKind: {zh: "local-usual"},
  },
  "gin-buck": {
    names: {zh: "金巴克"},
    aliases: ["金酒巴克"],
    evidenceUrl: "https://www.diffordsguide.com/cocktails/recipe/330/the-buck-gin-buck",
    evidenceLevel: "editorial-consistent",
    note: "Uses the established Chinese Buck-family name; the prior descriptive form remains searchable.",
    nameKind: {zh: "local-usual"},
  },
  "gin-fizz": {
    names: {zh: "金菲士"},
    aliases: ["金酒菲士", "金菲兹"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/gin-fizz/",
    evidenceLevel: "editorial-consistent",
    note: "Uses the established Chinese Gin Fizz bar name and keeps both the longer and 兹 spellings as aliases.",
    nameKind: {zh: "local-usual"},
  },
  "gin-rickey": {
    names: {zh: "金酒瑞基"},
    aliases: ["金酒里奇", "金瑞奇", "金酒里基"],
    evidenceUrl: "https://www.washington.org/zh-CN/node/324867",
    evidenceLevel: "name-source",
    note: "The official Washington, DC tourism page uses 金酒瑞基 for Gin Rickey; common 瑞奇 and 里基 spellings remain aliases.",
    nameKind: {zh: "local-usual"},
  },
  "gin-sour": {
    names: {zh: "金酒酸酒"},
    aliases: ["金酒酸"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/gin-sour/",
    evidenceLevel: "editorial-consistent",
    note: "Makes the Sour family term explicit in Chinese while preserving the shorter legacy display value.",
    nameKind: {zh: "local-usual"},
  },
  "hanky-panky": {
    names: {zh: "汉基潘基"},
    aliases: ["汉基班基", "翻云覆雨"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/hanky-panky/",
    evidenceLevel: "editorial-consistent",
    note: "Corrects the final syllable to the usual Chinese transliteration and retains the established semantic regional alias.",
    nameKind: {zh: "local-usual"},
  },
  "hotel-nacional": {
    names: {zh: "国家酒店"},
    aliases: ["国家饭店鸡尾酒"],
    evidenceUrl: "https://www.liquor.com/recipes/hotel-nacional/",
    evidenceLevel: "editorial-consistent",
    note: "Uses the natural Chinese rendering of the Havana hotel proper name and keeps the previous descriptive title searchable.",
    nameKind: {zh: "local-usual"},
  },
  "last-word": {
    names: {
      zh: "最后一句",
      fr: "Last Word",
      de: "Last Word",
      es: "Last Word",
      it: "Last Word",
    },
    aliases: ["最后的话", "Dernier Mot", "Letztes Wort", "Última Palabra", "Ultima Parola", "遗言", "临别一语"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/last-word/",
    evidenceUrlByLocale: {zh: "https://dissolvedsolids.co/zh/cheatsheets/100-classics/"},
    evidenceLevel: "editorial-consistent",
    evidenceLevelByLocale: {fr: "name-source", de: "name-source", es: "name-source", it: "name-source"},
    note: "Uses the established Chinese usual name 最后一句. French, German, Spanish, and Italian retain the English source proper title instead of presenting an unverified word-for-word translation; all former renderings remain aliases.",
    nameKind: {zh: "local-usual", fr: "source-proper", de: "source-proper", es: "source-proper", it: "source-proper"},
  },
  "lemon-drop-martini": {
    names: {zh: "柠檬滴马提尼"},
    aliases: ["柠檬滴马天尼"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/lemon-drop-martini/",
    evidenceLevel: "editorial-consistent",
    note: "Uses the current simplified-Chinese spelling 马提尼 and retains the older 马天尼 form.",
    nameKind: {zh: "local-usual"},
  },
  "mary-pickford": {
    names: {zh: "玛丽·皮克福德"},
    aliases: ["玛丽·碧克馥"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/mary-pickford/",
    evidenceLevel: "editorial-consistent",
    note: "Uses the simplified-Chinese transliteration common in mainland references; the traditional regional transliteration remains an alias.",
    nameKind: {zh: "local-usual"},
  },
  "naked-and-famous": {
    names: {zh: "一脱成名"},
    aliases: ["赤裸与名望", "Naked & Famous"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/naked-and-famous/",
    evidenceLevel: "editorial-consistent",
    note: "Uses the established Chinese bar rendering 一脱成名 for the wordplay; the literal rendering and source title remain searchable.",
    nameKind: {zh: "local-usual"},
  },
  "new-york-sour": {
    names: {zh: "纽约酸酒"},
    aliases: ["纽约酸"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/new-york-sour/",
    evidenceLevel: "editorial-consistent",
    note: "Makes the Sour family term explicit in Chinese; the concise legacy form remains searchable.",
    nameKind: {zh: "local-usual"},
  },
  "pimms-cup": {
    names: {zh: "皮姆之杯"},
    aliases: ["皮姆杯"],
    evidenceUrl: "https://www.diffordsguide.com/cocktails/recipe/1523/pimms-cup-or-classic-pimms",
    evidenceLevel: "editorial-consistent",
    note: "Uses the established Chinese rendering of Pimm’s Cup and keeps the shorter menu form.",
    nameKind: {zh: "local-usual"},
  },
  "pisco-punch": {
    names: {zh: "皮斯科潘趣"},
    aliases: ["皮斯科宾治"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/pisco-punch/",
    evidenceLevel: "editorial-consistent",
    note: "Uses 潘趣, the established Chinese Punch-family term; 宾治 remains a regional alias.",
    nameKind: {zh: "local-usual"},
  },
  "pisco-sour": {
    names: {zh: "皮斯科酸酒"},
    aliases: ["皮斯科酸"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/pisco-sour/",
    evidenceLevel: "editorial-consistent",
    note: "Makes the Sour family term explicit in Chinese; the concise legacy form remains searchable.",
    nameKind: {zh: "local-usual"},
  },
  "planters-punch": {
    names: {zh: "种植园潘趣"},
    aliases: ["种植园宾治"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/planters-punch/",
    evidenceLevel: "editorial-consistent",
    note: "Uses 潘趣, the established Chinese Punch-family term; 宾治 remains a regional alias.",
    nameKind: {zh: "local-usual"},
  },
  "porn-star-martini": {
    names: {zh: "艳星马天尼"},
    aliases: ["色情明星马天尼", "Pornstar Martini", "Porn Star Martini"],
    evidenceUrl: "https://www.1shot.tw/26279/%E8%AA%BF%E9%85%92%E7%9F%A5%E8%AD%98-Pornstar-Martini-%E8%B1%94%E6%98%9F%E9%A6%AC%E4%B8%81%E5%B0%BC-%E5%90%8D%E5%AD%97%E7%85%BD%E6%83%85%E7%9A%84%E7%95%B6%E4%BB%A3%E7%B6%93%E5%85%B8",
    evidenceLevel: "editorial-consistent",
    note: "Uses the established shorter Chinese bar rendering 艳星马天尼; the literal and English forms remain searchable.",
    nameKind: {zh: "local-usual"},
  },
  "porto-flip": {
    names: {zh: "波特弗利普"},
    aliases: ["波特翻转"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/porto-flip/",
    evidenceLevel: "editorial-consistent",
    note: "Transliterates Flip as a cocktail-form name rather than describing the action; the prior literal form remains an alias.",
    nameKind: {zh: "local-usual"},
  },
  "russian-spring-punch": {
    names: {zh: "俄罗斯春日潘趣"},
    aliases: ["俄罗斯春日宾治"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/russian-spring-punch/",
    evidenceLevel: "editorial-consistent",
    note: "Uses 潘趣, the established Chinese Punch-family term; 宾治 remains a regional alias.",
    nameKind: {zh: "local-usual"},
  },
  "sherry-cobbler": {
    names: {zh: "雪莉科布勒"},
    aliases: ["雪莉考伯乐"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/sherry-cobbler/",
    evidenceLevel: "editorial-consistent",
    note: "Uses the established Chinese transliteration for the cocktail format; the older phonetic form remains searchable.",
    nameKind: {zh: "local-usual"},
  },
  "suffering-bastard": {
    names: {zh: "痛苦混蛋"},
    aliases: ["受难者"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/suffering-bastard/",
    evidenceLevel: "editorial-consistent",
    note: "Preserves both parts of the intentionally irreverent source title; the earlier softened translation remains an alias.",
    nameKind: {zh: "local-usual"},
  },
  "three-dots-and-a-dash": {
    names: {zh: "三点一划"},
    aliases: ["三点一线"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/three-dots-and-a-dash/",
    evidenceLevel: "editorial-consistent",
    note: "Corrects dash to 划 in the Chinese rendering; the prior idiomatic line alias remains searchable.",
    nameKind: {zh: "local-usual"},
  },
  "ti-punch": {
    names: {zh: "小潘趣"},
    aliases: ["小宾治", "Petit Punch"],
    evidenceUrl: "https://iba-world.com/iba-cocktail/ti-punch/",
    evidenceLevel: "editorial-consistent",
    note: "Uses 潘趣 for the Punch family and retains the Cantonese-influenced 宾治 form plus the French alias.",
    nameKind: {zh: "local-usual"},
  },
  tuxedo: {
    names: {zh: "燕尾服"},
    aliases: ["礼服"],
    evidenceUrl: "https://dissolvedsolids.co/zh/cheatsheets/100-classics/",
    evidenceLevel: "editorial-consistent",
    note: "Uses the established Chinese cocktail-list rendering for the garment name; 礼服 remains searchable.",
    nameKind: {zh: "local-usual"},
  },
  vesper: {
    names: {zh: "维斯珀"},
    aliases: ["维斯帕", "维斯珀马天尼"],
    evidenceUrl: "https://www.absolutdrinks.com/en/learn/classic-cocktails/",
    evidenceLevel: "editorial-consistent",
    note: "Uses the common simplified-Chinese transliteration 珀 and retains the alternate 帕 spelling.",
    nameKind: {zh: "local-usual"},
  },
  "white-negroni": {
    names: {zh: "白内格罗尼"},
    aliases: ["白色内格罗尼"],
    evidenceUrl: "https://dissolvedsolids.co/zh/cheatsheets/100-classics/",
    evidenceLevel: "editorial-consistent",
    note: "Uses the established concise Chinese bar rendering; the literal form remains searchable.",
    nameKind: {zh: "local-usual"},
  },
  "whiskey-smash": {
    names: {zh: "威士忌碎饮"},
    aliases: ["威士忌捣饮"],
    evidenceUrl: "https://tipsy-app.com/zh-hans/cocktails/spirit/whiskey",
    evidenceLevel: "editorial-consistent",
    note: "Uses the Chinese bartending term 碎饮 for Smash; the older literal form remains searchable.",
    nameKind: {zh: "local-usual"},
  },
  "roku-momiji-fizz": {
    names: {zh: "ROKU 红叶菲士"},
    aliases: ["六金酒红叶菲士", "ROKU Momiji Fizz", "红叶菲士"],
    evidenceUrl: "https://house.suntory.com/cocktails/roku-momiji-fizz",
    evidenceLevel: "editorial-consistent",
    note: "Keeps the ROKU brand name and localizes only the Japanese seasonal word and Fizz family term; the previous brand gloss remains an alias.",
    nameKind: {zh: "local-usual"},
  },
  "roku-orchard-martinez": {
    names: {zh: "ROKU 果园马丁内兹"},
    aliases: ["六金酒果园马丁内兹", "ROKU Orchard Martinez"],
    evidenceUrl: "https://house.suntory.com/cocktails/roku-orchard-martinez",
    evidenceLevel: "editorial-consistent",
    note: "Retains ROKU as the source brand and uses the established Chinese rendering of Orchard and Martinez.",
    nameKind: {zh: "local-usual"},
  },
  "roku-sakura-aperitif": {
    names: {zh: "ROKU 樱花开胃酒"},
    aliases: ["六樱花开胃酒", "ROKU Sakura Aperitif"],
    evidenceUrl: "https://house.suntory.com/cocktails/roku-sakura-aperitif",
    evidenceLevel: "editorial-consistent",
    note: "Retains ROKU as the source brand and translates only Sakura and the aperitif category; the old brand gloss remains an alias.",
    nameKind: {zh: "local-usual"},
  },
  "roku-hanami-fizz": {
    names: {zh: "ROKU 花见菲士"},
    aliases: ["六金酒花见菲士", "ROKU Hanami Fizz", "花见菲士"],
    evidenceUrl: "https://house.suntory.com/cocktails/roku-hanami-fizz-long",
    evidenceLevel: "editorial-consistent",
    note: "Retains ROKU as the source brand and preserves 花见 as the established Japanese cultural term.",
    nameKind: {zh: "local-usual"},
  },
  "kasane-aviator": {
    names: {zh: "Kasane Aviator"},
    aliases: ["重彩飞行家", "Roku Kasane Aviator"],
    evidenceUrl: "https://house.suntory.com/cocktails/kasane-aviator",
    evidenceLevel: "name-source",
    note: "Kasane is a proper product name; preserving the source title avoids inventing an unverified Chinese brand translation. The prior gloss remains searchable.",
    nameKind: {zh: "source-proper"},
  },
  "noryo-nori-collins": {
    names: {zh: "ROKU 纳凉海苔柯林斯"},
    aliases: ["纳凉海苔柯林斯", "ROKU Noryo Nori Collins", "纳涼海苔コリンズ"],
    evidenceUrl: "https://house.suntory.com/cocktails/noryo-nori-collins",
    evidenceLevel: "editorial-consistent",
    note: "Retains ROKU and the Japanese seasonal and ingredient names while localizing Collins; the old form remains an alias.",
    nameKind: {zh: "local-usual"},
  },
  "negroni-sbagliato": {
    names: {ja: "ネグローニ ズバリアート"},
    aliases: ["ネグローニ・スバリアート", "ネグローニ・ズバリアート", "Negroni Sbagliato"],
    sourceProperName: "Negroni Sbagliato",
    evidenceUrl: "https://www.campari.com/ja-jp/our-cocktails/other-campari-cocktails/",
    evidenceLevel: "name-source",
    note: "Uses the title visible on Campari Japan's current cocktail list, checked 2026-09-15. Both previous middle-dot spellings remain searchable; the Difford's source version is unchanged.",
    nameKind: {ja: "local-usual"},
  },
};

const stableUnique = (values: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.normalize("NFKC").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
};

/**
 * Prefer reviewed local names, then explicit editorial translations, without
 * mutating source records or the pre-editorial personal-snapshot titles.
 */
export const applyCocktailNames = (cocktails: Cocktail[]): Cocktail[] =>
  cocktails.map((cocktail) => {
    const override = reviewedNameOverrides[cocktail.id];
    const editorial = {...westernCocktailNames[cocktail.id], ...editorialCocktailNames[cocktail.id], ...batchMNames[cocktail.id]};
    const name = {...cocktail.name, ...override?.names};
    const snapshotName = cocktail.snapshotName ?? {...name};
    const editorialNameLocales: Locale[] = [];
    if (editorial) for (const locale of Object.keys(editorial) as Locale[]) {
      // Source-proper fallbacks are no longer the display policy. Keep actual
      // reviewed local names; editorial renderings carry no official claim.
      if (override?.nameKind?.[locale] === 'local-usual') continue;
      name[locale] = editorial[locale]!;
      editorialNameLocales.push(locale);
    }
    return {
      ...cocktail,
      originalName: cocktail.originalName ?? override?.sourceProperName ?? cocktail.name.en,
      name,
      snapshotName,
      editorialNameLocales,
      aliases: stableUnique([
        ...cocktail.aliases,
        ...Object.values(cocktail.name),
        ...Object.values(override?.names ?? {}),
        ...Object.values(name),
        ...(override?.aliases ?? []),
      ]),
    };
  });
