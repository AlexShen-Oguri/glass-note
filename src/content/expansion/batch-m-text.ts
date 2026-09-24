import type {Localized, Locale} from '../../domain/contracts';
import {LOCALES} from '../../domain/contracts';
import {L} from './localized';

// Shared wording only: each recipe explicitly selects its source-backed steps.
export const mText = {
  cocktail:L('Strain into a chilled cocktail glass.','滤入冰镇鸡尾酒杯。','Filtrer dans un verre à cocktail froid.','In ein gekühltes Cocktailglas abseihen.','Cuela en una copa de cóctel fría.','차가운 칵테일 잔에 거릅니다.','冷やしたカクテルグラスにこし入れます。','Filtrare in un bicchiere da cocktail freddo.'),
  highball:L('Strain into a highball glass over fresh ice.','滤入装有新冰块的高球杯。','Filtrer dans un highball sur des glaçons frais.','In ein Highballglas auf frisches Eis abseihen.','Cuela en un vaso alto con hielo nuevo.','새 얼음을 넣은 하이볼 잔에 거릅니다.','新しい氷を入れたハイボールグラスにこし入れます。','Filtrare in un highball con ghiaccio nuovo.'),
  soda:L('Top with soda water and stir gently.','加入苏打水，轻轻搅拌。','Compléter avec du soda et remuer doucement.','Mit Soda auffüllen und vorsichtig rühren.','Completa con soda y remueve suavemente.','탄산수를 채우고 부드럽게 젓습니다.','ソーダを加え、軽く混ぜます。','Completare con soda e mescolare delicatamente.'),
  nutmeg:L('Grate a little nutmeg over the surface.','在酒面刨少许肉豆蔻。','Râper un peu de muscade en surface.','Etwas Muskatnuss darüberreiben.','Ralla un poco de nuez moscada encima.','표면에 육두구를 조금 갈아 올립니다.','表面にナツメグを少量すりおろします。','Grattugiare poca noce moscata in superficie.'),
  shake:L('Shake the ingredients with ice until cold.','将材料加冰摇匀至冰凉。','Shaker les ingrédients avec de la glace pour refroidir.','Die Zutaten mit Eis kalt shaken.','Agita los ingredientes con hielo hasta enfriar.','재료를 얼음과 함께 차갑게 셰이크합니다.','材料を氷とともに冷えるまでシェイクします。','Shakerare gli ingredienti con ghiaccio fino a raffreddarli.'),
  stir:L('Stir the ingredients with ice until cold.','将材料加冰搅拌至冰凉。','Remuer les ingrédients avec de la glace pour refroidir.','Die Zutaten mit Eis kalt rühren.','Remueve los ingredientes con hielo hasta enfriar.','재료를 얼음과 함께 저어 차갑게 합니다.','材料を氷とともに冷えるまでステアします。','Mescolare gli ingredienti con ghiaccio fino a raffreddarli.'),
  dry:L('Shake without ice first.','先不加冰干摇。','Shaker d’abord sans glace.','Zuerst ohne Eis shaken.','Agita primero sin hielo.','먼저 얼음 없이 셰이크합니다.','まず氷なしでシェイクします。','Shakerare prima senza ghiaccio.'),
  coupe:L('Strain into a chilled coupe.','滤入冰镇碟形杯。','Filtrer dans une coupe refroidie.','In eine gekühlte Coupette abseihen.','Cuela en una copa coupé fría.','차가운 쿠페 잔에 거릅니다.','冷やしたクープにこし入れます。','Filtrare in una coppetta fredda.'),
  fineCoupe:L('Fine-strain into a chilled coupe.','细滤入冰镇碟形杯。','Filtrer finement dans une coupe refroidie.','Fein in eine gekühlte Coupette abseihen.','Cuela finamente en una copa coupé fría.','차가운 쿠페 잔에 곱게 거릅니다.','冷やしたクープに細かくこし入れます。','Filtrare finemente in una coppetta fredda.'),
  nick:L('Strain into a chilled Nick & Nora glass.','滤入冰镇尼克与诺拉杯。','Filtrer dans un verre Nick & Nora refroidi.','In ein gekühltes Nick-&-Nora-Glas abseihen.','Cuela en una copa Nick & Nora fría.','차가운 닉 앤 노라 잔에 거릅니다.','冷やしたニック＆ノラグラスにこし入れます。','Filtrare in un bicchiere Nick & Nora freddo.'),
  rocks:L('Strain into a rocks glass over a large ice cube.','滤入放有大冰块的古典杯。','Filtrer dans un verre bas sur un gros glaçon.','In ein Tumblerglas über einen großen Eiswürfel abseihen.','Cuela en un vaso bajo sobre un cubo grande de hielo.','큰 얼음을 넣은 록스 잔에 거릅니다.','大きな氷を入れたロックグラスにこし入れます。','Filtrare in un bicchiere basso su un cubo di ghiaccio grande.'),
  crushed:L('Strain into a rocks glass filled with crushed ice.','滤入装满碎冰的古典杯。','Filtrer dans un verre bas rempli de glace pilée.','In einen Tumbler mit Crushed Ice abseihen.','Cuela en un vaso bajo lleno de hielo picado.','부순 얼음을 채운 록스 잔에 거릅니다.','クラッシュドアイスを詰めたロックグラスにこし入れます。','Filtrare in un bicchiere basso pieno di ghiaccio tritato.'),
  lemon:L('Finish with a lemon twist.','以柠檬皮卷收尾。','Terminer avec un zeste de citron.','Mit einer Zitronenzeste abschließen.','Termina con piel de limón.','레몬 트위스트로 마무리합니다.','レモンピールを飾ります。','Completare con una scorza di limone.'),
  orange:L('Finish with an orange twist.','以橙皮卷收尾。','Terminer avec un zeste d’orange.','Mit einer Orangenzeste abschließen.','Termina con piel de naranja.','오렌지 트위스트로 마무리합니다.','オレンジピールを飾ります。','Completare con una scorza d’arancia.'),
  lime:L('Finish with a lime wheel.','以青柠片收尾。','Terminer avec une rondelle de citron vert.','Mit einer Limettenscheibe abschließen.','Termina con una rodaja de lima.','라임 슬라이스로 마무리합니다.','ライムスライスを飾ります。','Completare con una rondella di lime.'),
  mint:L('Finish with fresh mint.','以新鲜薄荷收尾。','Terminer avec de la menthe fraîche.','Mit frischer Minze abschließen.','Termina con menta fresca.','생민트로 마무리합니다.','フレッシュミントを飾ります。','Completare con menta fresca.'),
  discardLemon:L('Express lemon peel over the surface, then discard it.','在酒面挤出柠檬皮油后丢弃果皮。','Exprimer un zeste de citron sur le verre, puis le jeter.','Zitronenschale über dem Drink ausdrücken und entfernen.','Exprime la piel de limón sobre la bebida y deséchala.','음료 위에 레몬 껍질 오일을 짜고 껍질은 버립니다.','レモンピールの油を表面に絞り、ピールは捨てます。','Spremere gli oli della scorza di limone sulla superficie e scartarla.'),
};
export const mSteps=(...items:Localized[]):Record<Locale,string[]>=>Object.fromEntries(LOCALES.map(locale=>[locale,items.map(item=>item[locale])])) as Record<Locale,string[]>;
export const mGlass={
  hurricane:L('Hurricane glass','飓风杯','Verre Hurricane','Hurricane-Glas','Copa Hurricane','허리케인 잔','ハリケーングラス','Bicchiere Hurricane'),
  port:L('Small port glass','小型波特酒杯','Petit verre à porto','Kleines Portweinglas','Copa pequeña de oporto','작은 포트 와인 잔','小さなポートワイングラス','Bicchiere piccolo da porto'),
  coupe:L('Coupe','碟形杯','Coupe','Coupette','Copa coupé','쿠페 잔','クープ','Coppetta'),
  nick:L('Nick & Nora glass','尼克与诺拉杯','Verre Nick & Nora','Nick-&-Nora-Glas','Copa Nick & Nora','닉 앤 노라 잔','ニック＆ノラグラス','Bicchiere Nick & Nora'),
  rocks:L('Rocks glass','古典杯','Verre bas','Tumbler','Vaso bajo','록스 잔','ロックグラス','Bicchiere basso'),
  collins:L('Collins glass','柯林斯杯','Verre Collins','Collins-Glas','Vaso Collins','콜린스 잔','コリンズグラス','Bicchiere Collins'),
  martini:L('Cocktail glass','鸡尾酒杯','Verre à cocktail','Cocktailglas','Copa de cóctel','칵테일 잔','カクテルグラス','Bicchiere da cocktail'),
  shot:L('Shot glass','小酒杯','Verre à shot','Shotglas','Vaso de chupito','샷 잔','ショットグラス','Bicchiere da shot'),
};
export const mGarnish={
  none:L('None','无','Aucune','Keine','Ninguna','없음','なし','Nessuna'),
  lemon:L('Lemon twist','柠檬皮卷','Zeste de citron','Zitronenzeste','Piel de limón','레몬 트위스트','レモンピール','Scorza di limone'),
  orange:L('Orange twist','橙皮卷','Zeste d’orange','Orangenzeste','Piel de naranja','오렌지 트위스트','オレンジピール','Scorza d’arancia'),
  lime:L('Lime wheel','青柠片','Rondelle de citron vert','Limettenscheibe','Rodaja de lima','라임 슬라이스','ライムスライス','Rondella di lime'),
  mint:L('Mint sprig','薄荷枝','Brin de menthe','Minzzweig','Ramita de menta','민트 가지','ミントの枝','Rametto di menta'),
};
