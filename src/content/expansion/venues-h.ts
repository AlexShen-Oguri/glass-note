import type {RecipeVersion} from '../../domain/contracts';

// Addresses checked 2026-09-07 against the linked venue / original interview.
// The original Japanese address is retained for use with a map or taxi.
const barTie = {name: 'BAR TIE', address: '香川県高松市古馬場町8-28 藤井ビル1階', url: 'https://bartie.jp/'};
export const japanVenues: Record<string, NonNullable<RecipeVersion['bar']>> = {
  'classic-rose': {name: 'BAR SLOPPY JOE', address: '兵庫県神戸市中央区下山手通2-16-2 サンビル2F-1', url: 'https://sloppyjoe-kobe.com/about'},
  tefutefu: {name: 'SAVOY hommage', address: '兵庫県神戸市中央区下山手通5-8-14 1F', url: 'https://www.pen-online.jp/article/017557.html'},
  yukishiro: {name: "Authent Hotel Otaru — Captain’s Bar", address: '北海道小樽市稲穂2丁目15番1号 2階', url: 'https://www.authent.co.jp/wp/wp-content/uploads/2025/02/2ceab2c5a825d2279d289b5f15add4bd.pdf'},
  'calla-lily': barTie,
  yuzuriha: barTie,
  hatsuzakura: barTie,
};
