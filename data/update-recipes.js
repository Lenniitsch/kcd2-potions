const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'recipes.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let countHandwerk = 0;
let countUtility = 0;

// Change 1: alraunentrank → DLC
const alraunentrank = data.recipes.find(r => r.id === 'alraunentrank');
if (alraunentrank) {
  alraunentrank.category = 'DLC';
  console.log('alraunentrank category changed to DLC');
}

// Change 2: Remove "dlc" tag from schlaftrunk and strauchdiebtrunk
for (const id of ['schlaftrunk', 'strauchdiebtrunk']) {
  const recipe = data.recipes.find(r => r.id === id);
  if (recipe && recipe.tags) {
    recipe.tags = recipe.tags.filter(t => t !== 'dlc');
    console.log(id + ': removed "dlc" tag, remaining tags:', recipe.tags);
  }
}

// Change 3: categories.de[3] Handwerk → Werken
if (data.categories.de[3] === 'Handwerk') {
  data.categories.de[3] = 'Werken';
  console.log('categories.de[3] changed to Werken');
}

// Change 3: recipes with category "Handwerk" → "Werken"
for (const recipe of data.recipes) {
  if (recipe.category === 'Handwerk') {
    recipe.category = 'Werken';
    countHandwerk++;
  }
}
console.log('Handwerk → Werken: ' + countHandwerk + ' recipes affected');

// Change 4: categories.de[4] Utility → Sonstiges
if (data.categories.de[4] === 'Utility') {
  data.categories.de[4] = 'Sonstiges';
  console.log('categories.de[4] changed to Sonstiges');
}

// Change 4: recipes with category "Utility" → "Sonstiges"
for (const recipe of data.recipes) {
  if (recipe.category === 'Utility') {
    recipe.category = 'Sonstiges';
    countUtility++;
  }
}
console.log('Utility → Sonstiges: ' + countUtility + ' recipes affected');

// Change 5: Update last_updated
data.last_updated = '2026-07-01';
console.log('last_updated set to', data.last_updated);

fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log('\nDone. File written.');
