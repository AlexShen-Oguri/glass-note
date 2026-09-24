import type {Localized} from '../../domain/contracts';

/** Editorial renderings of descriptive titles. Personal/place names and
 * established local spellings remain in the base catalogue. Not official
 * translation evidence; the source name remains visible under each title. */
const rows = `
dry-martini|Martini sec|Trockener Martini|Martini seco|Martini secco
whiskey-sour|Sour au whiskey|Whiskey-Sour|Sour de whiskey|Sour al whiskey
old-fashioned|À l'ancienne|Nach alter Art|A la antigua|Alla vecchia maniera
espresso-martini|Martini à l'espresso|Espresso-Martini|Martini de espresso|Martini all'espresso
mojito-mocktail|Mojito sans alcool|Alkoholfreier Mojito|Mojito sin alcohol|Mojito analcolico
alcohol-free-amaretto-sour|Sour à l'amaretto sans alcool|Alkoholfreier Amaretto-Sour|Sour de amaretto sin alcohol|Sour all'amaretto analcolico
aviation|Aviation|Luftfahrt|Aviación|Aviazione
clover-club|Club du trèfle|Kleeblattklub|Club del trébol|Club del trifoglio
bees-knees|La crème de la crème|Das Beste vom Besten|Lo mejor de lo mejor|Il meglio del meglio
bramble|Ronce|Brombeerstrauch|Zarza|Rovo
last-word|Dernier mot|Letztes Wort|Última palabra|Ultima parola
french-75|Français 75|Französische 75|Francés 75|Francese 75
boulevardier|Boulevardier|Boulevardgänger|Paseante de bulevar|Viveur dei boulevard
mint-julep|Julep à la menthe|Minz-Julep|Julepe de menta|Julep alla menta
penicillin|Pénicilline|Penicillin|Penicilina|Penicillina
paper-plane|Avion en papier|Papierflieger|Avión de papel|Aeroplano di carta
sidecar|Side-car|Beiwagen|Sidecar|Sidecar
pisco-sour|Sour au pisco|Pisco-Sour|Pisco sour|Sour al pisco
cosmopolitan|Cosmopolite|Kosmopolit|Cosmopolita|Cosmopolitan
moscow-mule|Mule de Moscou|Moskauer Maultier|Mula de Moscú|Mulo di Mosca
bloody-mary|Marie sanglante|Blutige Mary|María sangrienta|Maria sanguinaria
cuba-libre|Cuba libre|Freies Kuba|Cuba libre|Cuba libera
dark-n-stormy|Sombre et orageux|Dunkel und stürmisch|Oscuro y tormentoso|Buio e tempestoso
angel-face|Visage d'ange|Engelsgesicht|Cara de ángel|Volto d'angelo
between-the-sheets|Entre les draps|Zwischen den Laken|Entre las sábanas|Tra le lenzuola
black-russian|Russe noir|Schwarzer Russe|Ruso negro|Russo nero
brandy-crusta|Crusta au brandy|Brandy-Crusta|Crusta de brandy|Crusta al brandy
champagne-cocktail|Cocktail au champagne|Champagnercocktail|Cóctel de champán|Cocktail allo champagne
chartreuse-swizzle|Swizzle à la chartreuse|Chartreuse-Swizzle|Swizzle de chartreuse|Swizzle alla chartreuse
corpse-reviver-2|Réveil des morts n° 2|Leichenerwecker Nr. 2|Revividor n.º 2|Risveglia morti n. 2
dons-special-daiquiri|Daiquiri spécial de Don|Dons besonderer Daiquiri|Daiquiri especial de Don|Daiquiri speciale di Don
french-connection|Connexion française|Französische Verbindung|Conexión francesa|Connessione francese
french-martini|Martini français|Französischer Martini|Martini francés|Martini francese
gin-basil-smash|Smash au gin et au basilic|Gin-Basilikum-Smash|Smash de ginebra y albahaca|Smash al gin e basilico
gin-fizz|Fizz au gin|Gin-Fizz|Fizz de ginebra|Fizz al gin
grand-margarita|Grande margarita|Große Margarita|Gran margarita|Grande margarita
grasshopper|Sauterelle|Grashüpfer|Saltamontes|Cavalletta
hanky-panky|Friponnerie|Techtelmechtel|Travesura|Intrigo
hemingway-special|Spécial Hemingway|Hemingway-Spezial|Especial Hemingway|Speciale Hemingway
horses-neck|Cou de cheval|Pferdehals|Cuello de caballo|Collo di cavallo
illegal|Illégal|Illegal|Ilegal|Illegale
irish-coffee|Café irlandais|Irischer Kaffee|Café irlandés|Caffè irlandese
jungle-bird|Oiseau de la jungle|Dschungelvogel|Ave de la selva|Uccello della giungla
lemon-drop-martini|Martini bonbon au citron|Zitronenbonbon-Martini|Martini caramelo de limón|Martini caramella al limone
long-island-iced-tea|Thé glacé de Long Island|Long-Island-Eistee|Té helado de Long Island|Tè freddo di Long Island
missionarys-downfall|Chute du missionnaire|Untergang des Missionars|Caída del misionero|Caduta del missionario
monkey-gland|Glande de singe|Affendrüse|Glándula de mono|Ghiandola di scimmia
naked-and-famous|Nu et célèbre|Nackt und berühmt|Desnudo y famoso|Nudo e famoso
new-york-sour|Sour de New York|New-York-Sour|Sour de Nueva York|Sour di New York
old-cuban|Vieux Cubain|Alter Kubaner|Viejo cubano|Vecchio cubano
paradise|Paradis|Paradies|Paraíso|Paradiso
pisco-punch|Punch au pisco|Pisco-Punsch|Ponche de pisco|Punch al pisco
planters-punch|Punch du planteur|Pflanzerpunsch|Ponche del plantador|Punch del piantatore
porn-star-martini|Martini de star du X|Pornostar-Martini|Martini estrella porno|Martini della pornostar
porto-flip|Flip au porto|Portwein-Flip|Flip de oporto|Flip al porto
rabo-de-galo|Queue de coq|Hahnenschwanz|Cola de gallo|Coda di gallo
ramos-fizz|Fizz de Ramos|Ramos-Fizz|Fizz de Ramos|Fizz di Ramos
remember-the-maine|Souvenez-vous du Maine|Erinnert euch an die Maine|Recordad el Maine|Ricordate il Maine
russian-spring-punch|Punch du printemps russe|Russischer Frühlingspunsch|Ponche de primavera rusa|Punch della primavera russa
rusty-nail|Clou rouillé|Rostiger Nagel|Clavo oxidado|Chiodo arrugginito
sea-breeze|Brise marine|Meeresbrise|Brisa marina|Brezza marina
sex-on-the-beach|Sexe sur la plage|Sex am Strand|Sexo en la playa|Sesso in spiaggia
sherry-cobbler|Cobbler au xérès|Sherry-Cobbler|Cobbler de jerez|Cobbler allo sherry
singapore-sling|Sling de Singapour|Singapur-Sling|Sling de Singapur|Sling di Singapore
south-side|Côté sud|Südseite|Lado sur|Lato sud
spicy-fifty|Cinquante épicé|Würzige Fünfzig|Cincuenta picante|Cinquanta piccante
stinger|Dard|Stachel|Aguijón|Pungiglione
suffering-bastard|Salaud souffrant|Leidender Bastard|Bastardo sufriente|Bastardo sofferente
tequila-sunrise|Lever de soleil à la tequila|Tequila-Sonnenaufgang|Amanecer de tequila|Alba di tequila
three-dots-and-a-dash|Trois points et un trait|Drei Punkte und ein Strich|Tres puntos y una raya|Tre punti e una linea
tommys-margarita|Margarita de Tommy|Tommys Margarita|Margarita de Tommy|Margarita di Tommy
trinidad-sour|Sour de Trinité|Trinidad-Sour|Sour de Trinidad|Sour di Trinidad
tuxedo|Smoking|Smoking|Esmoquin|Smoking
vieux-carre|Vieux Carré|Altes Viertel|Barrio antiguo|Vecchio quartiere
white-lady|Dame blanche|Weiße Dame|Dama blanca|Dama bianca
zombie|Zombie|Zombie|Zombi|Zombie
gin-and-tonic|Gin-tonic|Gin Tonic|Ginebra con tónica|Gin tonic
dirty-martini|Martini trouble|Trüber Martini|Martini sucio|Martini sporco
gin-rickey|Rickey au gin|Gin-Rickey|Rickey de ginebra|Rickey al gin
gin-buck|Buck au gin|Gin-Buck|Buck de ginebra|Buck al gin
gin-sour|Sour au gin|Gin-Sour|Sour de ginebra|Sour al gin
gin-fix|Fix au gin|Gin-Fix|Fix de ginebra|Fix al gin
bijou|Bijou|Juwel|Joya|Gioiello
white-negroni|Negroni blanc|Weißer Negroni|Negroni blanco|Negroni bianco
negroni-sbagliato|Negroni raté|Versehentlicher Negroni|Negroni equivocado|Negroni sbagliato
pimms-cup|Coupe de Pimm's|Pimm's-Cup|Copa de Pimm's|Coppa di Pimm's
white-russian|Russe blanc|Weißer Russe|Ruso blanco|Russo bianco
screwdriver|Tournevis|Schraubendreher|Destornillador|Cacciavite
greyhound|Lévrier|Windhund|Galgo|Levriero
salty-dog|Chien salé|Salziger Hund|Perro salado|Cane salato
cape-codder|Habitant de Cape Cod|Cape-Cod-Bewohner|Habitante de Cape Cod|Abitante di Cape Cod
bay-breeze|Brise de la baie|Buchtenbrise|Brisa de la bahía|Brezza della baia
harvey-wallbanger|Harvey frappe-mur|Harvey der Wandklopfer|Harvey golpeamuros|Harvey picchiamuro
blue-lagoon|Lagon bleu|Blaue Lagune|Laguna azul|Laguna blu
japanese-slipper|Pantoufle japonaise|Japanischer Hausschuh|Zapatilla japonesa|Pantofola giapponese
melon-ball|Boule de melon|Melonenkugel|Bola de melón|Pallina di melone
black-velvet|Velours noir|Schwarzer Samt|Terciopelo negro|Velluto nero
porto-tonico|Porto-tonic|Portwein Tonic|Oporto con tónica|Porto tonico
blood-and-sand|Sang et sable|Blut und Sand|Sangre y arena|Sangue e sabbia
godfather|Parrain|Pate|Padrino|Padrino
godmother|Marraine|Patin|Madrina|Madrina
amaretto-sour|Sour à l'amaretto|Amaretto-Sour|Sour de amaretto|Sour all'amaretto
whiskey-highball|Highball au whiskey|Whiskey-Highball|Highball de whiskey|Highball al whiskey
scotch-and-soda|Scotch et soda|Scotch und Soda|Whisky escocés con soda|Scotch e soda
whiskey-smash|Smash au whiskey|Whiskey-Smash|Smash de whiskey|Smash al whiskey
gold-rush|Ruée vers l'or|Goldrausch|Fiebre del oro|Corsa all'oro
brown-derby|Chapeau melon brun|Braune Melone|Bombín marrón|Bombetta marrone
old-pal|Vieil ami|Alter Freund|Viejo amigo|Vecchio amico
red-hook|Crochet rouge|Roter Haken|Gancho rojo|Gancio rosso
bamboo|Bambou|Bambus|Bambú|Bambù
brandy-milk-punch|Punch au lait et au brandy|Brandy-Milchpunsch|Ponche de leche y brandy|Punch al latte e brandy
hot-toddy|Toddy chaud|Heißer Toddy|Toddy caliente|Toddy caldo
hurricane|Ouragan|Hurrikan|Huracán|Uragano
painkiller|Antidouleur|Schmerzmittel|Analgésico|Antidolorifico
navy-grog|Grog de la marine|Marine-Grog|Grog de la armada|Grog della marina
jet-pilot|Pilote de jet|Düsenpilot|Piloto de reactor|Pilota di jet
test-pilot|Pilote d'essai|Testpilot|Piloto de pruebas|Pilota collaudatore
pearl-diver|Pêcheur de perles|Perlentaucher|Buceador de perlas|Pescatore di perle
scorpion|Scorpion|Skorpion|Escorpión|Scorpione
rum-runner|Contrebandier de rhum|Rumschmuggler|Contrabandista de ron|Contrabbandiere di rum
blue-hawaii|Hawaï bleu|Blaues Hawaii|Hawái azul|Hawaii blu
pink-lady|Dame rose|Rosa Dame|Dama rosa|Dama rosa
army-and-navy|Armée et marine|Heer und Marine|Ejército y armada|Esercito e marina
final-ward|Dernier Ward|Letzter Ward|Último Ward|Ultimo Ward
revolver|Revolver|Revolver|Revólver|Revolver
presbyterian|Presbytérien|Presbyterianer|Presbiteriano|Presbiteriano
black-manhattan|Manhattan noir|Schwarzer Manhattan|Manhattan negro|Manhattan nero
scofflaw|Hors-la-loi|Gesetzesverächter|Infractor|Fuorilegge
ward-eight|Huitième quartier|Achter Bezirk|Octavo distrito|Ottavo distretto
lions-tail|Queue de lion|Löwenschwanz|Cola de león|Coda di leone
pegu-club|Club de Pégou|Pegu-Klub|Club de Pegú|Club di Pegu
saturn|Saturne|Saturn|Saturno|Saturno
fog-cutter|Brise-brume|Nebelschneider|Cortanieblas|Taglianebbia
queens-park-swizzle|Swizzle du parc de la reine|Queen's-Park-Swizzle|Swizzle del parque de la reina|Swizzle del parco della regina
el-presidente|Le président|Der Präsident|El presidente|Il presidente
ti-punch|Ti' punch|Kleiner Punsch|Pequeño ponche|Piccolo punch
death-in-the-afternoon|Mort dans l'après-midi|Tod am Nachmittag|Muerte en la tarde|Morte nel pomeriggio
cable-car|Téléphérique|Seilbahn|Teleférico|Funivia
corn-n-oil|Maïs et huile|Mais und Öl|Maíz y aceite|Mais e olio
roku-momiji-fizz|Fizz Roku aux feuilles d'automne|Roku-Herbstlaub-Fizz|Fizz Roku de hojas otoñales|Fizz Roku alle foglie d'autunno
roku-orchard-martinez|Martinez Roku du verger|Roku-Obstgarten-Martinez|Martinez Roku del huerto|Martinez Roku del frutteto
roku-sakura-aperitif|Apéritif Roku aux fleurs de cerisier|Roku-Kirschblüten-Aperitif|Aperitivo Roku de flor de cerezo|Aperitivo Roku ai fiori di ciliegio
roku-hanami-fizz|Fizz Roku de contemplation des fleurs|Roku-Blütenschau-Fizz|Fizz Roku de contemplación floral|Fizz Roku della fioritura
noryo-nori-collins|Collins fraîcheur au nori|Erfrischender Nori-Collins|Collins refrescante de nori|Collins rinfrescante al nori
million-dollar|Cocktail à un million de dollars|Millionen-Dollar-Cocktail|Cóctel de un millón de dólares|Cocktail da un milione di dollari
mount-fuji|Mont Fuji|Berg Fuji|Monte Fuji|Monte Fuji
air-mail|Courrier aérien|Luftpost|Correo aéreo|Posta aerea
la-louisiane|À la Louisiane|Nach Louisiana-Art|A la Luisiana|Alla Louisiana
bicicletta|Bicyclette|Fahrrad|Bicicleta|Bicicletta
breakfast-martini|Martini du petit-déjeuner|Frühstücks-Martini|Martini del desayuno|Martini della colazione
chrysanthemum|Chrysanthème|Chrysantheme|Crisantemo|Crisantemo
division-bell|Cloche du vote|Abstimmungsglocke|Campana de votación|Campana del voto
el-diablo|Le diable|Der Teufel|El diablo|Il diavolo
mexican-firing-squad|Peloton d'exécution mexicain|Mexikanisches Erschießungskommando|Pelotón de fusilamiento mexicano|Plotone d'esecuzione messicano
oaxaca-old-fashioned|À l'ancienne d'Oaxaca|Oaxaca nach alter Art|A la antigua de Oaxaca|Alla vecchia maniera di Oaxaca
hotel-nacional|Hôtel national|Nationalhotel|Hotel Nacional|Hotel nazionale
rum-old-fashioned|Rhum à l'ancienne|Rum nach alter Art|Ron a la antigua|Rum alla vecchia maniera
bacardi-cocktail|Cocktail Bacardi|Bacardi-Cocktail|Cóctel Bacardi|Cocktail Bacardi
gin-gin-mule|Mule au double gin|Doppel-Gin-Maultier|Mula de doble ginebra|Mulo al doppio gin
champs-elysees|Champs-Élysées|Champs-Élysées|Campos Elíseos|Campi Elisi
man-o-war|Navire de guerre|Kriegsschiff|Buque de guerra|Nave da guerra
golden-dream|Rêve doré|Goldener Traum|Sueño dorado|Sogno dorato
st-germain-cocktail|Cocktail St-Germain|St-Germain-Cocktail|Cóctel St-Germain|Cocktail St-Germain
hugo-spritz|Spritz Hugo|Hugo-Spritz|Spritz Hugo|Spritz Hugo
kir-royal|Kir royal|Königlicher Kir|Kir real|Kir reale
london-mule|Mule de Londres|Londoner Maultier|Mula de Londres|Mulo di Londra
mezcal-mule|Mule au mezcal|Mezcal-Maultier|Mula de mezcal|Mulo al mezcal
lady-in-blue|Dame en bleu|Dame in Blau|Dama de azul|Dama in blu
irish-old-fashioned|Irlandais à l'ancienne|Irisch nach alter Art|Irlandés a la antigua|Irlandese alla vecchia maniera
applejack-rabbit|Lapin à l'applejack|Applejack-Kaninchen|Conejo de applejack|Coniglio all'applejack
brown-butter-old-fashioned|À l'ancienne au beurre noisette|Nach alter Art mit brauner Butter|A la antigua con mantequilla tostada|Alla vecchia maniera con burro nocciola
picon-punch|Punch au Picon|Picon-Punsch|Ponche de Picon|Punch al Picon
tequila-mockingbird|Moqueur à la tequila|Tequila-Spottdrossel|Sinsonte de tequila|Tordo beffeggiatore alla tequila
bourbon-renewal|Renouveau au bourbon|Bourbon-Erneuerung|Renovación de bourbon|Rinascita al bourbon
turf-club|Club hippique|Reitklub|Club hípico|Circolo ippico
bourbon-rickey|Rickey au bourbon|Bourbon-Rickey|Rickey de bourbon|Rickey al bourbon
`;
export const westernCocktailNames: Record<string, Partial<Localized>> = Object.fromEntries(rows.trim().split('\n').map(row => {
  const [id, fr, de, es, it] = row.split('|');
  return [id, {fr, de, es, it}];
}));
