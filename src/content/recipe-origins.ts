import type {RecipeVersion, Source} from '../domain/contracts';

/** Classify this published version, not the bartender's employer or drink name. */
export function applyRecipeOrigins(versions: RecipeVersion[], sources: Source[]): RecipeVersion[] {
  const sourcesById = new Map(sources.map(source => [source.id, source]));
  return versions.map(version => {
    if (version.origin) return version;
    const url = sourcesById.get(version.sourceId)?.url;
    const award = url?.match(/^https:\/\/www\.suntory\.co\.jp\/wnb\/event\/award\/result_(2023|2024|2025)\.html$/);
    if (!award) return version;
    const year = Number(award[1]);
    return {...version, origin: {
      kind: 'competition', topicId: `suntory-${year}`, countryCodes: ['JP'], year,
      event: year === 2025 ? 'Suntory The Bartender Award' : 'Suntory The Cocktail Award',
    }};
  });
}
