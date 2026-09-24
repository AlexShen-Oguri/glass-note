import type {Locale} from '../contracts';
import {normalizeSearchText, scoreTextSearch} from '../search';
import type {ResearchTopic} from '../../content/topics';

export type DirectoryKind = 'competition' | 'bar';
export type DirectoryKindFilter = 'all' | DirectoryKind;

export interface DirectoryCatalogue {
  versions: readonly {id: string; cocktailId: string}[];
  cocktails: readonly {id: string; name: Record<Locale, string>; aliases: readonly string[]}[];
}

export interface TopicDirectoryEntry {
  topic: ResearchTopic;
  kind: DirectoryKind;
  countries: readonly string[];
  workKeys: readonly string[];
  workCount: number;
  searchFields: readonly string[];
}

export interface TopicDirectoryQuery {
  text?: string;
  kind?: DirectoryKindFilter;
  country?: string | null;
}

const REGION_COUNTRIES: ReadonlyArray<[RegExp, string]> = [
  [/\b(japan|japanese)\b/, 'JP'],
  [/\b(united states|usa|us|america)\b/, 'US'],
  [/\b(united kingdom|uk|great britain|britain)\b/, 'GB'],
  [/\bfrance\b/, 'FR'],
  [/\bgermany\b/, 'DE'],
  [/\bspain\b/, 'ES'],
  [/\bitaly\b/, 'IT'],
  [/\bbelgium\b/, 'BE'],
  [/\bnetherlands\b/, 'NL'],
  [/\bthailand\b/, 'TH'],
  [/\bmexico\b/, 'MX'],
  [/\bsingapore\b/, 'SG'],
  [/\bargentina\b/, 'AR'],
  [/\baustralia\b/, 'AU'],
  [/\b(south korea|korea)\b/, 'KR'],
  [/\bsouth africa\b/, 'ZA'],
  [/\b(united arab emirates|uae|dubai)\b/, 'AE'],
  [/\bhong kong\b/, 'HK'],
];

export function topicKind(topic: ResearchTopic): DirectoryKind {
  return topic.kind === 'bar' ? 'bar' : 'competition';
}

export function topicCountries(topic: ResearchTopic): string[] {
  const explicit = (topic.countries ?? [])
    .map((country) => country.trim().toUpperCase())
    .filter((country) => /^[A-Z]{2}$/.test(country));
  const location = normalizeSearchText([
    topic.venue?.country,
    topic.region,
    ...(topic.research ?? []).map((work) => work.region),
  ].filter(Boolean).join(' '));
  const inferred = REGION_COUNTRIES
    .filter(([pattern]) => pattern.test(location))
    .map(([, country]) => country);
  return [...new Set([...explicit, ...inferred])].sort();
}

function topicWorkKeys(topic: ResearchTopic, catalogue: DirectoryCatalogue): string[] {
  const versionToCocktail = new Map(catalogue.versions.map((version) => [version.id, version.cocktailId]));
  const keys = new Set<string>();
  for (const versionId of topic.versionIds) {
    const cocktailId = versionToCocktail.get(versionId);
    keys.add(cocktailId ? `cocktail:${cocktailId}` : `version:${versionId}`);
  }
  for (const work of topic.research ?? []) {
    const cocktailId=work.catalogueVersionId?versionToCocktail.get(work.catalogueVersionId):undefined;
    keys.add(cocktailId?`cocktail:${cocktailId}`:`research:${work.id}`);
  }
  return [...keys];
}

export function buildTopicDirectory(topics: readonly ResearchTopic[], catalogue: DirectoryCatalogue, locale: Locale): TopicDirectoryEntry[] {
  const cocktails = new Map(catalogue.cocktails.map((cocktail) => [cocktail.id, cocktail]));
  const versions = new Map(catalogue.versions.map((version) => [version.id, version]));
  return topics.map((topic) => {
    const workKeys = topicWorkKeys(topic, catalogue);
    const versionWorkNames = topic.versionIds.flatMap((versionId) => {
      const cocktail = cocktails.get(versions.get(versionId)?.cocktailId ?? '');
      return cocktail ? [cocktail.name[locale], ...cocktail.aliases] : [];
    });
    const researchWorkNames = (topic.research ?? []).flatMap((work) => [work.title, work.author, work.bar ?? '', work.region ?? '']);
    return {
      topic,
      kind: topicKind(topic),
      countries: topicCountries(topic),
      workKeys,
      workCount: workKeys.length,
      searchFields: [
        topic.competition,
        topic.organization ?? '',
        topic.region,
        topic.year > 0 ? String(topic.year) : '',
        topic.venue?.name ?? '',
        topic.venue?.city ?? '',
        topic.venue?.country ?? '',
        ...versionWorkNames,
        ...researchWorkNames,
      ],
    };
  });
}

export function filterTopicDirectory(entries: readonly TopicDirectoryEntry[], query: TopicDirectoryQuery): TopicDirectoryEntry[] {
  const kind = query.kind ?? 'all';
  const country = query.country?.trim().toUpperCase() || null;
  const text = query.text?.trim() ?? '';
  return entries.filter((entry) =>
    (kind === 'all' || entry.kind === kind)
    && (!country || entry.countries.includes(country))
    && (!text || scoreTextSearch(text, entry.searchFields) > 0),
  );
}

export function uniqueWorkCount(entries: readonly TopicDirectoryEntry[]): number {
  return new Set(entries.flatMap((entry) => entry.workKeys)).size;
}

export function directoryCountries(entries: readonly TopicDirectoryEntry[]): string[] {
  return [...new Set(entries.flatMap((entry) => entry.countries))].sort();
}

export function directoryPage(entries: readonly TopicDirectoryEntry[], limit: number): {items: TopicDirectoryEntry[]; hasMore: boolean} {
  const bounded = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;
  return {items: entries.slice(0, bounded), hasMore: entries.length > bounded};
}
