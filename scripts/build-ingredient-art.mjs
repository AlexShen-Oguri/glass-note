import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

// Original vector drawings. Families deliberately share a visual vocabulary;
// the material name identifies a cultivar or preparation, not a fictional photo.
const output = 'assets/ingredients';
fs.mkdirSync(output, {recursive: true});
const stroke = '#5b634d';
const leaf = (x,y,r=0) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0Q-21-31 2-43Q24-17 0 0" fill="#80916a"/><path d="M0 0L2-33" fill="none"/></g>`;
const bottle = (color, small=false) => `<rect x="${small?67:69}" y="25" width="${small?26:22}" height="17" rx="4" fill="#76715c"/><path d="M68 43h24v17q0 9 11 17v56q0 7-9 7H66q-9 0-9-7V77q11-8 11-17z" fill="${color}"/><path d="M64 82h32v35H64z" fill="#e8dfc7" stroke="none"/><path d="M72 95h16m-13 8h10" fill="none"/><path d="M65 70v12" stroke="#fff6df" opacity=".6"/>`;
const jar = color => `<rect x="48" y="47" width="64" height="13" rx="4" fill="#969778"/><rect x="46" y="62" width="68" height="69" rx="13" fill="${color}"/><path d="M48 86h64v23H48z" fill="#ece2c8" stroke="none"/><path d="M68 97h24"/>`;
const bowl = color => `<ellipse cx="80" cy="85" rx="45" ry="19" fill="${color}"/><path d="M35 85q4 46 45 46t45-46q-45 18-90 0z" fill="#d6cbb0"/><path d="M55 114q18 11 40 2" fill="none" opacity=".4"/>`;
const beans = (color, line=false) => [0,1,2,3,4].map((v)=>`<g transform="translate(${55+(v%3)*23} ${65+Math.floor(v/3)*31}) rotate(${v*27-32})"><ellipse rx="12" ry="18" fill="${color}"/>${line?'<path d="M0-13Q8 0 0 13" fill="none"/>':''}</g>`).join('');
const berries = (color) => [0,1,2,3,4,5].map((v)=>`<circle cx="${58+(v%3)*23}" cy="${78+Math.floor(v/3)*24}" r="16" fill="${color}"/><path d="M${54+(v%3)*23} ${68+Math.floor(v/3)*24}l4 5 5-5" fill="none"/>`).join('')+leaf(83,66,70);
const roundFruit = (color,kind='round') => `<path d="${kind==='pear'?'M73 45q-7 11-7 26t-20 27q-18 38 29 40 45 4 36-28-3-11-16-24-11-12-7-33z':'M80 63C26 43 31 127 65 134q16 6 28 0c38-9 47-91-13-71z'}" fill="${color}"/><path d="M80 61q-6-15 2-23" fill="none"/>${leaf(84,53,68)}<path d="M55 83q-7 18 2 28" stroke="#fff1cc" opacity=".55" fill="none"/>`;
const sprig = (color='#80916a',flower=false) => `<path d="M66 136q15-51 20-100" fill="none"/>${[0,1,2,3].map(v=>flower?`<g transform="translate(${v%2?97:69} ${55+v*19})"><circle r="13" fill="${color}"/><circle r="4" fill="#d7aa59"/></g>`:leaf(v%2?83:78,65+v*18,v%2?80:-55)).join('')}`;
const powder = color => `<path d="M41 115q18-40 38-45 24 7 42 45z" fill="${color}"/><ellipse cx="80" cy="118" rx="48" ry="10" fill="#d9caaa"/><path d="M55 98l4-3m10-5 3-5m19 9 4 2m-17 7 5 1" opacity=".6"/>`;
const art = {
  spirit:bottle('#c0af81'), liqueur:bottle('#bf9261'), wine:bottle('#79825b'), bitters:bottle('#96694e',true), beer:bottle('#c69851'),
  citrus:`<circle cx="73" cy="84" r="37" fill="#dab662"/>${leaf(82,50,58)}<circle cx="105" cy="107" r="26" fill="#efe1a0"/><circle cx="105" cy="107" r="20" fill="#d4a853"/>${[0,60,120,180,240,300].map(a=>`<path d="M105 107l0-19" transform="rotate(${a} 105 107)" stroke="#efe1a0"/>`).join('')}`,
  berry:berries('#807092'), cherry:`<circle cx="59" cy="108" r="22" fill="#a76159"/><circle cx="104" cy="102" r="22" fill="#94524f"/><path d="M58 87q6-28 32-44 18 25 15 37" fill="none"/>${leaf(89,49,80)}`,
  apple:roundFruit('#b87b64'), pear:roundFruit('#b8b374','pear'), 'stone-fruit':roundFruit('#cf9972'), grape:berries('#8d879f'), tropical:roundFruit('#cfa86c'),
  banana:`<path d="M49 44q-12 69 61 72l12-15q-59 10-61-56z" fill="#d7bc6d"/><path d="M43 56q-4 69 62 70l11-11" fill="none"/><path d="M49 43l10-4 5 9-11 3z" fill="#828363"/>`,
  pineapple:`<path d="M58 56q-4-17-15-28 22 5 29 21-4-23 6-34 14 10 13 31 10-12 28-18-10 23-20 29" fill="#7d9167"/><rect x="45" y="55" width="70" height="84" rx="31" fill="#c0a06b"/><path d="M50 71l53 53m-52-29 38 39m-28-73 52 52m-3-42-53 53m52-29-38 39m28-73-52 52" fill="none" opacity=".65"/>`,
  coconut:`<circle cx="75" cy="85" r="42" fill="#8e7256"/><ellipse cx="95" cy="109" rx="35" ry="26" fill="#856e54" transform="rotate(-20 95 109)"/><ellipse cx="95" cy="109" rx="28" ry="20" fill="#ede4cc" transform="rotate(-20 95 109)"/><circle cx="56" cy="61" r="3"/><circle cx="65" cy="65" r="3"/><circle cx="58" cy="73" r="3"/>`,
  melon:`<path d="M31 70h100q-6 64-50 64T31 70z" fill="#8c9a70"/><path d="M40 72h82q-10 53-41 53T40 72z" fill="#ce947e"/><path d="M59 86l3 5m23-3 1 6m20-9-3 5m-22 18v5"/>`,
  herb:sprig(), flower:sprig('#b595aa',true), leaf:sprig(),
  root:`<path d="M65 69l13-24 18 8 2 24 22 12-8 21-24-5-12 27-19-8 3-20-22-13 10-22z" fill="#c6ae83"/><path d="M67 73l9 4m17 7-4 10m-27-9 5 10m5 20 7 2" fill="none"/>`,
  vegetable:`<ellipse cx="78" cy="96" rx="42" ry="34" fill="#a98a64"/>${leaf(74,68,-38)}${leaf(80,65,20)}${leaf(88,68,65)}`,
  pepper:`<path d="M93 53q-35 17-19 53-3 16-30 29 57-4 65-49 3-29-16-33z" fill="#bb735a"/><path d="M93 56q0-19-12-23" fill="none"/>`,
  mushroom:`<path d="M71 87h21l10 46H60z" fill="#dcc8a3"/><path d="M29 85q8-51 51-51t52 51q-40 26-103 0z" fill="#a88b72"/><ellipse cx="80" cy="87" rx="48" ry="12" fill="#d2bfa0"/>`,
  seaweed:`<path d="M56 133q-29-24-10-42T51 49q31 8 19 35t10 49M88 136q-16-32 6-51t6-47q36 19 15 49t0 45" fill="#6f8467"/>`,
  cinnamon:`${[0,1,2].map(v=>`<g transform="translate(${57+v*21} ${83+v*7}) rotate(24)"><rect x="-9" y="-38" width="18" height="79" rx="7" fill="#b58a63"/><ellipse cy="-34" rx="9" ry="5" fill="#d2ad7f"/><path d="M-2-29V36" fill="none"/></g>`).join('')}`,
  'star-anise':`<path d="M80 34l11 28 29-17-12 32 31 7-29 14 12 29-30-14-12 28-12-27-29 11 12-28-28-13 31-9-10-28 29 17z" fill="#ac845e"/><circle cx="81" cy="86" r="13" fill="#785e49"/><path d="M80 44v28m31-15L92 77m34 8h-31m-15 44V99m-34-39 24 18" fill="none"/>`,
  vanilla:`<path d="M54 128q34-38 36-91m-21 94q25-36 34-86m-65 72q35-32 41-82" stroke="#79674f" stroke-width="8" fill="none"/>`,
  spice:powder('#bd936c'), seed:beans('#bdad87'), nut:beans('#b5966d',true), grain:`${bowl('#ceb986')}<path d="M58 77l10-8m2 19 10-8m8-6 8-7m2 20 9-7"/>`, legume:beans('#b1ab83'),
  tea:`${bowl('#82906e')}<path d="M55 72l12 9m4-12 5 13m9-7 12-7m-9 19 14-5"/>`,
  coffee:beans('#8f745d',true), cocoa:powder('#a28467'), juice:bottle('#d4ac65'), soda:bottle('#c4c9a9'), water:bottle('#b2c9c0'),
  syrup:bottle('#b99a68'), honey:jar('#c6a666'), sugar:powder('#e4d9bb'), milk:bottle('#e4dfca'), cream:jar('#e5dcca'),
  cheese:`<path d="M39 90l64-44 22 64-69 25z" fill="#dac38f"/><path d="M39 90l63 5 23 15-69 25z" fill="#e6d5a7"/><circle cx="81" cy="112" r="4"/><circle cx="62" cy="113" r="3"/>`,
  egg:`<path d="M79 34c-22 0-43 49-36 76 11 33 62 34 73 0 7-25-14-76-37-76z" fill="#e0cfb4"/><path d="M55 92q-1-22 13-35" fill="none" stroke="#f5ecd8"/>`,
  oil:bottle('#b4af72'), vinegar:bottle('#ab8664'), sauce:jar('#b28165'), preserve:jar('#ab7470'), salt:powder('#e0dfd0'), pantry:jar('#c4b38d'),
};
for (const [id,body] of Object.entries(art)) {
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="36" fill="#e8e1cf"/><circle cx="80" cy="78" r="68" fill="#efe8d7"/><ellipse cx="80" cy="138" rx="43" ry="5" fill="#b6af98" opacity=".24"/><g stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
  fs.writeFileSync(path.join(output,`${id}.svg`),svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(output,`${id}.png`));
}
fs.mkdirSync('src/media/ingredients',{recursive:true});
fs.writeFileSync('src/media/ingredients/index.ts',`// Generated by scripts/build-ingredient-art.mjs. Original family illustrations, shared by related materials.\nimport type {IngredientFamily} from '../../domain/contracts';\nexport const ingredientArt: Record<IngredientFamily, number> = {\n${Object.keys(art).map(id=>`  '${id}': require('../../../assets/ingredients/${id}.png'),`).join('\n')}\n};\n`);
console.log(`Built ${Object.keys(art).length} original SVG drawings and native-compatible PNG thumbnails.`);
