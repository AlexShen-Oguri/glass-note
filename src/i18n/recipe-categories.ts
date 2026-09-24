import type {Locale,Localized} from '../domain/contracts';
const L=(en:string,zh:string,fr:string,de:string,es:string,ko:string,ja:string,it:string):Localized=>({en,zh,fr,de,es,ko,ja,it});
const copy={
 all:L('All recipes','全部酒单','Toutes les recettes','Alle Rezepte','Todas las recetas','전체 레시피','すべてのレシピ','Tutte le ricette'),
 classic:L('Classics','经典鸡尾酒','Classiques','Klassiker','Clásicos','클래식','クラシック','Classici'),
 competition:L('Competitions','竞赛作品','Concours','Wettbewerbe','Concursos','대회 작품','コンペティション','Concorsi'),
 bar:L('Bar recipes','知名酒吧配方','Recettes de bars','Bar-Rezepte','Recetas de bares','바 레시피','バーのレシピ','Ricette dei bar'),
 topics:L('Explore collections','专题研究','Explorer les collections','Sammlungen entdecken','Explorar colecciones','주제별 탐구','テーマ別リサーチ','Esplora le raccolte'),
 topicsHint:L('Competition entries and recipes from notable bars','按国家、赛事与酒吧探索公开配方','Recettes de concours et de bars renommés','Wettbewerbsbeiträge und Rezepte bekannter Bars','Recetas de concursos y bares destacados','국가·대회·바별 공개 레시피','国・大会・バーから公開レシピを探す','Ricette di concorsi e bar rinomati'),
};
export const recipeCategoryText=(locale:Locale,key:keyof typeof copy)=>copy[key][locale];
