import type {Localized} from '../domain/contracts';
import type {ResearchMaterial,ResearchPreparation,ResearchWork} from './topics';

// Source facts stay in their published units; the reading overlay translates them.
const name=(value:string):Localized=>({en:value,zh:value,fr:value,de:value,es:value,ko:value,ja:value,it:value});
const ingredient=(value:string,amount:string):ResearchMaterial=>({name:name(value),amount});
const preparation=(id:string,title:string,ingredients:ResearchMaterial[],method:string[]):ResearchPreparation=>({id,name:name(title),ingredients,method});
const checkedAt='2026-10-13';
const patronSource=(title:string,path:string)=>({title:`Patrón · ${title} official recipe`,url:`https://www.patrontequila.com/cocktails/${path}.html`,checkedAt});
const angosturaSource=(year:number)=>({title:`Angostura Global Cocktail Challenge · ${year} official winning recipes`,url:`https://angosturaglobalcocktailchallenge.com/winners/?Y=${year}`,checkedAt});

export const patron2018PublishedWorks:ResearchWork[]=[
  {
    id:'patron-2018-wind',title:'Wind',author:'Yeray Monforte',region:'Spain',award:'Spain winner · global finalist',disclosure:'published-recipe',
    materials:[ingredient('Patrón Silver','60 ml'),ingredient('Eternal Youth Mixture','60 ml'),ingredient('Fino sherry','15 ml'),ingredient('Egg white','15 ml'),ingredient('Thyme','3 branches'),ingredient('Bee-pollen-infused Patrón Reposado','3 sprays')],
    method:['Shake all ingredients with ice until chilled and combined.','Double-strain into a chilled coupe.','Finish with a fresh thyme sprig.'],
    preparations:[
      preparation('eternal-youth-mixture','Eternal Youth Mixture',[ingredient('Honey','2 oz'),ingredient('Lemon juice','2 oz'),ingredient('Olive oil','1.25 oz')],['Blend the honey, lemon juice and olive oil until combined.']),
      preparation('pollen-reposado-spray','Bee-pollen-infused Patrón Reposado',[ingredient('Bee pollen','10 g'),ingredient('Patrón Reposado','3.5 oz')],['Infuse the bee pollen in the tequila for 1 hour.','Filter and transfer to a spray bottle.']),
    ],
    summary:name('The official page publishes both bespoke preparations. Serving and preparation measures retain the source units.'),
    source:patronSource('Wind','patron-silver/wind'),
  },
  {
    id:'patron-2018-harmony',title:'Harmony',author:'Bruce Dorfling',region:'South Africa',award:'South Africa winner · global finalist',disclosure:'published-recipe',
    materials:[ingredient('Patrón Añejo','52.5 ml'),ingredient('Whey','22.5 ml'),ingredient('Marigold tincture','15 ml'),ingredient('Italicus','15 ml'),ingredient('Pineapple juice','15 ml'),ingredient('Lemon juice','15 ml'),ingredient('Vanilla syrup','15 ml'),ingredient("Galliano L’Aperitivo",'7.5 ml'),ingredient('Bee pollen','0.25 bar spoon')],
    method:['Shake the listed ingredients with ice for at least 10 seconds.','Double-strain into a stemless wine glass; garnish with dried marigold and a sprinkle of bee pollen.'],
    preparations:[preparation('marigold-tincture','Marigold tincture',[ingredient('Whole marigold flowers','4 flowers'),ingredient('Patrón Añejo','3 oz')],['Steep the whole flowers in the tequila for 24 hours.'])],
    summary:name('The source publishes the marigold tincture. Vanilla syrup has no specified brand or additional formula; garnish quantities are not specified.'),
    source:patronSource('Harmony','patron-anejo/harmony'),
  },
  {
    id:'patron-2018-best-promise',title:'The Best Promise',author:'Mitsuhiro Nakamura',region:'Japan',award:'Japan winner · global finalist',disclosure:'published-recipe',
    materials:[ingredient('Patrón Reposado','60 ml'),ingredient('Mead','15 ml'),ingredient('Manzanilla sherry','15 ml'),ingredient('Tepache syrup','7.5 ml'),ingredient('Lime juice','7.5 ml'),ingredient('Green tea','2 tsp')],
    method:['Whisk the ingredients together in a tea bowl, then transfer to a shaker with ice and shake.','Strain into a paper glass and garnish with a pineapple leaf.'],
    preparations:[preparation('tepache-syrup','Tepache syrup',[ingredient('Pineapple purée','5.25 oz'),ingredient('Water','2.75 oz'),ingredient('Black sugar','0.75 cup'),ingredient('White sugar','1 cup'),ingredient('Ginger','16 slices'),ingredient('Cardamom','30 pieces')],['Warm the pineapple purée, water and both sugars in a saucepan until the sugars dissolve.','Add ginger and cardamom, keep on low heat for 60 minutes, then filter out the spices.'])],
    summary:name('Green tea is the source wording; its form is not specified. The published syrup is heated, so no fermentation step is inferred.'),
    source:patronSource('The Best Promise','patron-reposado/the-best-promise'),
  },
  {
    id:'patron-2018-cyanocitta',title:'Cyanocitta',author:'Makina Labrecque',region:'Canada',award:'Canada winner · global finalist',disclosure:'published-recipe',
    materials:[ingredient('Patrón Silver','37.5 ml'),ingredient('Martini Extra Dry Vermouth','15 ml'),ingredient('Szechuan peppercorn and lime oleo saccharum','30 ml'),ingredient('Blue Citrónge','7.5 ml'),ingredient('Lime juice','7.5 ml'),ingredient('Albertan spruce tips','8 branches'),ingredient('Salt','1 pinch')],
    method:['Muddle 6 spruce tips with the other ingredients, add ice and shake for 20 seconds.','Double-strain into a rocks glass over pebble ice; crushed ice is the source alternative.','Garnish with the remaining 2 spruce tips. The source permits rosemary when spruce tips are unavailable.'],
    preparations:[
      preparation('szechuan-lime-oleo','Szechuan peppercorn and lime oleo saccharum',[ingredient('Lime zest','zest of 12 limes'),ingredient('Dried whole Szechuan peppercorns','4 tbsp'),ingredient('Whole white peppercorns','1 tbsp'),ingredient('Citric acid','0.5 tsp'),ingredient('Fine granulated white sugar','300 g'),ingredient('Lime juice','juice of 6 limes')],['Bag the lime zest, peppercorns and sugar, then muddle the mixture.','Seal the bag and place it in warm, non-boiling water until the sugar dissolves; the source allows up to 12 hours.','Fine-filter through cheesecloth, dissolve the citric acid and stir in the juice of 6 limes.']),
      preparation('blue-citronge','Blue Citrónge',[ingredient('Citrónge','0.25 oz'),ingredient('Blue food colouring','3 drops')],['Mix the Citrónge and blue food colouring.']),
    ],
    summary:name('The page publishes the oleo and coloured liqueur. Spruce and rosemary alternatives are attributed to the source.'),
    source:patronSource('Cyanocitta','patron-silver/cyanocitta'),
  },
  {
    id:'patron-2018-balancing-act',title:'The Balancing Act',author:'Lance Bowman',region:'United States · Chicago',award:'Chicago winner · global finalist',disclosure:'published-recipe',
    materials:[ingredient('Patrón Reposado','45 ml'),ingredient('Kikusui Funaguchi Nama Genshu sake','15 ml'),ingredient('Rabarbaro','15 ml'),ingredient('Dolin Genepy de Alpes','7.5 ml'),ingredient('Lemon juice','22.5 ml'),ingredient('Sirop Capillaire','15 ml'),ingredient('Egg white','1 egg')],
    method:['Dry-shake the ingredients vigorously for 45 seconds.','Add a 1.25-inch ice cube and shake again.','Strain into a chilled Collins glass; finish with an orange wing and a mist of bergamot essence.'],
    preparations:[
      preparation('sirop-capillaire','Sirop Capillaire',[ingredient('Water','32 oz'),ingredient('Sugar','32 oz'),ingredient('Dried maidenhair fern','15 g'),ingredient('Orange blossom water','3 g')],['Bring the water to a boil, remove from the heat and dissolve the sugar.','Add the dried maidenhair fern and steep for 45 minutes.','Add the orange blossom water, filter and bottle.']),
      preparation('bergamot-essence','Bergamot essence',[ingredient('Patrón Reposado','6.5 oz'),ingredient('Bergamot oil','0.3 oz'),ingredient('Smoked fleur de sel','3.5 g')],['Combine the tequila, bergamot oil and smoked fleur de sel.']),
    ],
    summary:name('Both bespoke preparations are published. The amount of garnish spray and the weight/volume basis of the syrup’s oz measures are unspecified; no conversions are inferred.'),
    source:patronSource('The Balancing Act','patron-reposado/the-balancing-act'),
  },
  {
    id:'patron-2018-maestranza',title:'Maestranza',author:'Peter Hannah',region:'United States · Washington, D.C.',award:'Washington, D.C. winner · global finalist',disclosure:'published-recipe',
    materials:[ingredient('Pink-peppercorn-infused Patrón Silver','45 ml'),ingredient('Rubino Vermouth di Torino','15 ml'),ingredient('Fermented papaya juice','60 ml'),ingredient('Key lime juice','22.5 ml'),ingredient('Guava cordial','15 ml')],
    method:['Shake everything except the fermented papaya juice with a large ice cube for 8–10 seconds.','Double-strain into a double old-fashioned glass over a large ice cube.','Top with the fermented papaya juice and grind pink peppercorn over the drink.'],
    preparations:[
      preparation('pink-peppercorn-tequila','Pink-peppercorn-infused Patrón Silver',[ingredient('Pink peppercorns','1 tbsp'),ingredient('Patrón Silver','16 oz')],['Infuse the peppercorns in the tequila for 48 hours, shaking periodically.','Filter out the peppercorns and rebottle.']),
      preparation('fermented-papaya-juice','Fermented papaya juice',[ingredient('Papaya juice','juice of 2 papayas'),ingredient('Honey','2 tbsp'),ingredient('Organic pineapple peel','peel of 1 pineapple')],['The source records 3 days of fermentation for the papaya juice, honey and pineapple peel.','The source describes filtering and holding the mixture in bottles for another 2 days. Fermentation pressure can rupture bottles.','The source describes periodically opening bottles to release gas and gives no validated controls for safe bottling.']),
      preparation('guava-cordial','Guava cordial',[ingredient('Guava juice','4 parts'),ingredient('Granulated white sugar','3 parts')],['Stir the guava juice and sugar until dissolved.']),
    ],
    summary:name('The three preparations follow the archive; fermentation temperature and validated food-safety controls are not provided. The guava ratio retains unspecified parts rather than invented mass or volume.'),
    source:patronSource('Maestranza','patron-silver/maestranza'),
  },
];

export const angosturaPublishedWorks:ResearchWork[]=[
  {
    id:'angostura-2008-narrow-minded',title:'Narrow Minded',author:'Jamie Stephenson',region:'Europe',year:2008,award:'Global winner recipe · 2008',disclosure:'published-recipe',
    materials:[ingredient('Angostura aromatic bitters','5 dashes'),ingredient('Orgeat syrup','15 ml'),ingredient('Pressed apple juice','70 ml'),ingredient('Cream soda','60 ml')],
    method:['Shake all four ingredients with ice.','Filter into a highball filled with cubed ice and finish with apple slices.'],
    summary:name('All four ingredients, including cream soda, are shaken in the published method. The source does not establish a zero-alcohol serve.'),source:angosturaSource(2008),
  },
  {
    id:'angostura-2011-scarlet-ibis',title:'The Scarlet Ibis',author:'Andrew Griffiths',region:'Australia',year:2011,award:'Global winner recipe · 2011',disclosure:'published-recipe',
    materials:[ingredient('Bunnahabhain 12 Year Old','60 ml'),ingredient('Aged Madeira','15 ml'),ingredient('Yellow Chartreuse','10 ml'),ingredient('Fresh black cherries','2 cherries'),ingredient('Angostura aromatic bitters','5 dashes'),ingredient('Sea salt','1 pinch')],
    method:['Pit the cherries and muddle them with the salt in a mixing vessel.','Add the other ingredients and leave to infuse; the source gives no duration. Stir with large pieces of ice.','Filter into a chilled martini glass; present the remaining cherry pieces with a little whisky and salt as the source garnish.'],
    summary:name('The source names an aged Madeira without a specific product. Infusion time and extra garnish whisky quantity are not specified.'),source:angosturaSource(2011),
  },
  {
    id:'angostura-2011-orinoco-flip',title:'The Orinoco Flip',author:'Andrew Griffiths',region:'Australia',year:2011,award:'Global winner recipe · 2011',disclosure:'published-recipe',
    materials:[ingredient('Angostura Rum','60 ml'),ingredient('Toasted sesame seeds','1 tsp'),ingredient('Treacle','1 flat tsp'),ingredient('Angostura aromatic bitters','5 dashes'),ingredient('Egg yolk','1 egg'),ingredient('Mozart Dark chocolate liqueur','10 ml')],
    method:['Muddle the toasted sesame seeds and put them in the shaker.','Add the remaining ingredients and stir until the treacle dissolves.','Shake vigorously, double-strain into a chilled wine glass and serve dark chocolate alongside.'],
    summary:name('The archive specifies Angostura Rum without an age expression and names Mozart Dark for the chocolate liqueur.'),source:angosturaSource(2011),
  },
  {
    id:'angostura-2014-big-bird',title:'Big Bird',author:'Mike Tomasic',region:'Australia',year:2014,award:'Global winner recipe · 2014',disclosure:'published-recipe',
    materials:[ingredient('Angostura 7 Year Old Rum','45 ml'),ingredient('Fernet Branca','7.5 ml'),ingredient('Fresh lemon or lime juice','20 ml'),ingredient("Crawley's Spiced Honey Apple",'20 ml'),ingredient('Fresh pineapple juice','40 ml'),ingredient('Angostura aromatic bitters','6 dashes')],
    method:['Shake the ingredients with ice.','Double-strain and serve without ice; present pineapple chips and a liquorice aroma alongside.'],
    summary:name('Keep the named Crawley’s product and the source’s lemon-or-lime choice. No unverified homemade substitute is supplied.'),source:angosturaSource(2014),
  },
  {
    id:'angostura-2014-olympia',title:'Olympia',author:'Mike Tomasic',region:'Australia',year:2014,award:'Global winner recipe · 2014',disclosure:'published-recipe',
    materials:[ingredient('Hine Cigar Reserve','45 ml'),ingredient('Lustau San Emilio Pedro Ximénez','15 ml'),ingredient('Fresh lemon juice','15 ml'),ingredient('Egg white','15 ml'),ingredient('Paul Simon Fig & Lemon Jam','1 bar spoon'),ingredient('Angostura aromatic bitters','6 dashes')],
    method:['Shake the other ingredients with ice and 1 dash of the bitters.','Double-strain into a tumbler over ice.','Float the remaining 5 dashes of bitters. The source presents grapes and tobacco leaves beside the glass.'],
    summary:name('The six dashes are split between mixing and the float. Tobacco leaves belong to the source presentation beside the glass.'),source:angosturaSource(2014),
  },
  {
    id:'angostura-2018-deliciousness',title:'Deliciousness',author:'Ray Letoa',region:'New Zealand',year:2018,award:'Global winner recipe · 2018',disclosure:'published-recipe',
    materials:[ingredient('Amaro di Angostura','30 ml'),ingredient('Pineapple syrup','10 ml'),ingredient('Angostura orange bitters','2 dashes'),ingredient('Coffee liqueur','20 ml'),ingredient('Egg white','1 egg')],
    method:['Whip the egg white until stiff, fold in the coffee liqueur and set the foam aside.','Stir the remaining ingredients in a rocks glass over a large ice cube.','Layer the coffee foam on top, lightly torch its surface and serve immediately.'],
    summary:name('Pineapple syrup and coffee liqueur are specified without brands or additional formulas. The coffee liqueur belongs in the foam.'),source:angosturaSource(2018),
  },
];
