# I18N Restructure Plan: Option C with RecipeStore

## Goal

Split `data/recipes.json` into **structural data** (`data/recipes.json`) + **locale string files** (`data/locales/de.json`, `it.json`, `en.json`). All locale-backed data access goes through a single **RecipeStore** module — no other file touches locale objects directly.

**Why:** Eliminates triplication of localized strings in recipes.json. Adding a 4th language becomes trivial — just add one locale file. The central store means consumer modules never scatter locale lookups.

**Current size:** ~9,500 lines of JSON with 3-way duplication  
**After:** ~200 lines structural JSON + 3 × ~600 line locale files

---

## New File Layout

```
data/
  recipes.json          ← structural only (id, category, price, quantity, typed steps/ingredients, tags)
  locales/
    de.json             ← all German display strings
    it.json             ← all Italian display strings  
    en.json             ← all English display strings
```

---

## Architecture: RecipeStore

`js/recipes.js` becomes the sole data access layer. Every module that needs recipe display data calls the store — never accesses locale objects directly.

```
        main.js
           │
           ▼
     ┌─────────────┐
     │ RecipeStore  │──── fetches ────► recipes.json
     │ (recipes.js) │──── fetches ────► locales/{de,it,en}.json
     └──┬──┬──┬──┬──┘
        │  │  │  │
  getName│  │  │  │
         │  │  │  │getAllIngredients
  getEffect  │  │
       getSteps │
            getBaseLiquid
                   filter, sort
                        │
     ┌──────────┬───────┼───────┬──────────┐
     ▼          ▼       ▼       ▼          ▼
  ui-card    ui-timer ui-filter ui-list  (other)
```

**Store API surface (all exported functions):**

```js
// Initialization — called once by main.js
store.init('/data/recipes.json', '/data/locales')
  // → resolves when recipes + all 3 locales are loaded
  // → sets store.recipes, store.locales, store.lang

// Language switching
store.setLang('de')  // switches active language, returns nothing

// Individual recipe display access (for ui-recipe-card.js, ui-timer.js)
store.getName(recipeId)                    // → "Aqua Vitalis" (current lang)
store.getEffect(recipeId, 'henrys')        // → effect text for tier (current lang)
store.getIngredients(recipeId)             // → ["2 x Dandelion", "1 x Marigold"] (current lang)
store.getSteps(recipeId)                   // → [{ description: "Water", duration: 0, type: "base" }, ...]
store.getBaseLiquid(recipeId)              // → "Water" (current lang)

// Filter & sort (for ui-filter.js, ui-recipe-list.js)
store.filter(filters)                      // → filtered recipe array (uses all locales for search)
store.sort(recipes, sortKey)               // → sorted copy
store.getAllIngredients()                  // → Map of ingredient maps: { id → { de, it, en } }
store.getAvailableIngredients(recipes, filtered)  // → Set of available ingredient keys
```

### What the Store Hides

- **`renderStep()`** is **private** — consumers never call it. `store.getSteps(id)` returns fully-composed step objects with localized `description` strings.
- **`stepKeywords`** object is **deleted** — step types are structural now.
- **`categorizeStep()`** is **deleted** — each step has a `type` field.
- All locale file contents are **private** inside the store. No module imports `locales/en.json` directly.

### Consumer Impact: Before vs After

```js
// ui-recipe-card.js — BEFORE (scattered locale access)
var name = recipe.name[lang] || recipe.name.de;
var effect = recipe.effect_description[lang] || recipe.effect_description.de;
var ings = recipe.ingredients[lang] || recipe.ingredients.de;
ings.forEach(function(t) { var parts = t.match(/^(\d+)\s*x\s*(.+)/); /* parse */ });
var steps = recipe.recipe_steps[lang] || recipe.recipe_steps.de;
steps.forEach(function(s) { var desc = s.description; var type = categorizeStep(desc, lang); });

// ui-recipe-card.js — AFTER (single store calls, no parsing)
import { getName, getEffect, getIngredients, getSteps } from './recipes.js';
var name = getName(recipe.id);
var effect = getEffect(recipe.id, 'henrys');
var ings = getIngredients(recipe.id);     // already localized, formatted "2 x Dandelion"
var steps = getSteps(recipe.id);          // already localized, typed, durationed
steps.forEach(function(s) { var desc = s.description; var type = s.type; });  // no categorizeStep needed!
```

---

## recipes.json — New Format

```jsonc
{
  "schema_version": "4.0.0",
  "last_updated": "2026-07-01",
  "locales": ["de", "it", "en"],
  "total_recipes": 28,
  "recipes": [
    {
      "id": "aqua-vitalis",
      "category": "Heiltrank",
      "price": 70,
      "quantity": { "base": 3, "matter_i": 4, "matter_ii": 5, "matter_both": 6 },
      "ingredients": [
        { "key": "dandelion", "qty": 2 },
        { "key": "marigold", "qty": 1 }
      ],
      "steps": [
        { "type": "base",            "key": "water" },
        { "type": "ingredient",      "key": "dandelion", "qty": 2 },
        { "type": "boil",            "duration": 10 },
        { "type": "grind",           "key": "marigold", "qty": 1 },
        { "type": "boil",            "duration": 20 },
        { "type": "distil" }
      ],
      "tags": ["healing", "short-duration"]
    }
    // ... 27 more recipes
  ]
}
```

### Step Types

| `type` | `key` required? | `duration` required? | Example rendered text |
|--------|----------------|---------------------|----------------------|
| `base` | yes (water/oil/wine/spirits) | no | "Water" |
| `ingredient` | yes | no | "2 x Dandelion" |
| `grind` | yes (ingredient key) | no | "1 x Marigold grind" |
| `boil` | no | yes (seconds) | "Boil" |
| `boil_bellows` | no | yes (seconds) | "Boil with bellows" |
| `distil` | no | no | "Distill" |
| `pour` | no | no | "Pour" |
| `cauldron_grind` | no | no | "Grind the contents of the boiler" |

### Ingredient Keys (canonical, same across all languages)

```text
amanita_muscaria, belladonna, boars_tusk, chamomile, charcoal, cobweb,
comfrey, dandelion, elderberry_leaves, eyebright, feverfew, freshwater_pearl,
ginger, henbane, herb_paris, leached_coal, mandrake_root, marigold, mint,
nettle, poppy, sage, saltpetre, st_johns_wort, sulphur, thistle, valerian,
wormwood
```

### Removed Top-Level Fields

- **`categories`** — duplicated in `i18n.js`, never read from recipes.json
- **`languages`** — unused, replaced by `locales` array listing available locale files

---

## locales/en.json — Structure

```jsonc
{
  "ingredients": {
    "amanita_muscaria": "Amanita Muscaria",
    "belladonna": "Belladonna",
    // ... all 29 ingredient keys
  },
  "steps": {
    "water": "Water",
    "oil": "Oil",
    "wine": "Wine",
    "spirits": "Spirits",
    "boil": "Boil",
    "boil_bellows": "Boil with bellows",
    "distil": "Distill",
    "pour": "Pour",
    "grind": "grind",
    "cauldron_grind": "Grind the contents of the boiler"
  },
  "recipes": {
    "aqua-vitalis": {
      "name": "Aqua Vitalis",
      "effect": {
        "weak": "...",
        "standard": "...",
        "strong": "...",
        "henrys": "..."
      }
    }
    // ... all 28 recipes
  }
}
```

`de.json` and `it.json` mirror this structure exactly.

---

## RecipeStore Internals (`js/recipes.js`)

This module grows from ~185 to ~300 lines. It becomes the only file aware of locale data.

### Store State (module-level closure)

```js
var store = {
    recipes: [],
    locales: { de: {}, it: {}, en: {} },
    lang: 'de',
};
```

### Exported Functions

| Function | Signature | Description |
|----------|-----------|-------------|
| `init` | `(recipeUrl, localesDir) → Promise` | Fetches structural + all 3 locales. Resolves when ready. |
| `setLang` | `(lang)` | Switches active language. No return. |
| `getAll` | `() → recipes[]` | Returns the raw recipe array (for state store, iteration). |
| `getCategories` | `() → string[]` | Returns category keys in order (for filter UI). |
| `getName` | `(recipeId) → string` | Recipe name in current language. |
| `getEffect` | `(recipeId, tier) → string` | Effect text for given tier in current language. |
| `getIngredients` | `(recipeId) → string[]` | Ingredient strings like `"2 x Dandelion"` in current language. |
| `getSteps` | `(recipeId) → object[]` | Step objects `{ description, duration, type }` in current language. |
| `getBaseLiquid` | `(recipeId) → string` | Base liquid name in current language. |
| `filter` | `(filters) → recipes[]` | Filters by category, search (all 3 locales), ingredients. |
| `sort` | `(recipes, sortKey) → recipes[]` | Sorts by name (DE locale), category order, price, ingredient count. |
| `getAllIngredients` | `() → Map<string, {de,it,en}>` | Map of ingredient key → localized names, for filter UI. |
| `getAvailableIngredients` | `(recipes, filtered) → Set<string>` | Which ingredient keys are available in the filtered set. |

### Private Helpers (not exported)

```js
function renderStep(step) {
    var l = store.locales[store.lang].steps;
    var ing = store.locales[store.lang].ingredients;
    switch (step.type) {
        case 'base':            return l[step.key];
        case 'ingredient':      return step.qty + ' x ' + ing[step.key];
        case 'grind':           return step.qty + ' x ' + ing[step.key] + ' ' + l.grind;
        case 'boil':            return l.boil;
        case 'boil_bellows':    return l.boil_bellows;
        case 'distil':          return l.distil;
        case 'pour':            return l.pour;
        case 'cauldron_grind':  return l.cauldron_grind;
    }
}
```

### What Gets Deleted from Current recipes.js

- `categorizeStep()` — obsolete, steps have structural `type`
- `keywordMatch()` — only used by categorizeStep
- `stepKeywords` object — 17-line hardcoded localized keyword map, no longer needed
- `fetchRecipes()` — replaced by `init()`
- All direct locale lookup scattering (consolidated into private helpers)

---

## Per-File Changes

### `js/main.js`

```diff
- import { fetchRecipes } from './recipes.js';
+ import { init, getAll } from './recipes.js';

  // ...
- var data = await fetchRecipes('data/recipes.json');
- setState('recipes', data.recipes);
+ await init('data/recipes.json', 'data/locales');
+ setState('recipes', getAll());
```

### `js/state.js`

```diff
  recipes: null,
  // no new fields needed — locale is internal to the store
```

### `js/ui-recipe-card.js`

All locale-aware accesses replaced with store calls. No more `recipe.name[lang]`, `recipe.effect_description[lang]`, `recipe.ingredients[lang]`, `recipe.recipe_steps[lang]`.

| What | Before | After |
|------|--------|-------|
| Recipe name | `recipe.name[lang] \|\| recipe.name.de` | `getName(recipe.id)` |
| Effect text | `recipe.effect_description[lang] \|\| recipe.effect_description.de` | `getEffect(recipe.id, 'henrys')` |
| Ingredient list | Parse `"2 x Dandelion"` regex | `getIngredients(recipe.id)` — pre-formatted |
| Step list | `recipe.recipe_steps[lang]`, iterate `step.description` | `getSteps(recipe.id)`, iterate `step.description` |
| Step categorization | `categorizeStep(step.description, lang)` import | Use `step.type` directly |
| Timed-only indices | `recipe.recipe_steps.de` | `getSteps(recipe.id)` with duration check |
| Timer step count | `recipe.recipe_steps.de.length` | `getSteps(recipe.id).length` |
| Language switch | Re-read `recipe.name[lang]`, etc. | Call `getName(recipe.id)` — store already switched |

**Imports change:**
```diff
- import { categorizeStep } from './recipes.js';
+ import { getName, getEffect, getIngredients, getSteps } from './recipes.js';
```

**Ingredient rendering (before → after):**
```js
// BEFORE — regex parsing
var ingNames = recipe.ingredients[lang] || recipe.ingredients.de;
for (var i = 0; i < ingNames.length; i++) {
    var match = ingNames[i].match(/^(\d+)\s*x\s*(.+)/);
    // render match[1] as qty, match[2] as name
}

// AFTER — store returns pre-formatted strings
var ings = getIngredients(recipe.id);
for (var i = 0; i < ings.length; i++) {
    // ings[i] is already "2 x Dandelion"
}
```

**Step rendering (before → after):**
```js
// BEFORE — manual description + categorizeStep import
var steps = recipe.recipe_steps[lang] || recipe.recipe_steps.de;
for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    var desc = step.description;
    var type = categorizeStep(desc, lang);
    if (step.duration > 0) { /* render timer */ }
}

// AFTER — store returns pre-composed step objects with type
var steps = getSteps(recipe.id);
for (var i = 0; i < steps.length; i++) {
    var step = steps[i];
    // step.description is localized, step.type is structural, step.duration is structural
    if (step.duration > 0) { /* render timer */ }
}
```

### `js/ui-timer.js`

Timer logic stays the same — only data access changes.

| Before | After |
|--------|-------|
| `recipe.recipe_steps.de` (29 occurrences) | `getSteps(recipe.id)` — single call, cache result |
| `step.description` (11 occurrences) | `step.description` — same field name, now from store |
| `recipe.id` (2 occurrences) | `recipe.id` — unchanged |

**Imports change:**
```diff
+ import { getSteps } from './recipes.js';
```

Timer functions that currently accept `recipe` as a parameter can cache `getSteps(recipe.id)` once at the top. Then all internal step access uses the cached array. This simplifies the timer code — no more `(recipe.recipe_steps && recipe.recipe_steps.de)` fallback chains.

### `js/ui-recipe-list.js`

**Critical: `recipe.name.de` used as Map key → switch to `recipe.id`.**

| Line | Old | New |
|------|-----|-----|
| 104 | `recipe.name.de` as Map key | `recipe.id` |
| 165 | `sorted[i].name.de` | `sorted[i].id` |
| 178 | `sorted[i2].name.de` | `sorted[i2].id` |

Filter/sort calls (`filterRecipes` → `store.filter`, `sortRecipes` → `store.sort`) are delegates — call signatures stay the same.

### `js/ui-filter.js`

| Line | What changes |
|------|-------------|
| 171 | `getAllIngredients(recipes)` → `store.getAllIngredients()`. Return type identical (Map). |
| 182 | `getAvailableIngredients(recipes, filtered)` → `store.getAvailableIngredients(recipes, filtered)`. Return type identical (Set). |
| 188-189, 210 | **Unchanged** — ingredient name lookup on map unchanged. |

### Files NOT Touched

- `js/dom.js`, `js/ui-header.js`, `js/ui-maps.js`, `js/ui-tabs.js` — no recipe data access
- `js/i18n.js` — hardcoded CATEGORIES stays (never read from recipes.json)
- `sw.js`, `pwa-registration.js` — no data access
- All CSS files

---

## Implementation Order

### Step 1: Generate locale files (Python script)
Extract all strings from current `recipes.json` into `locales/de.json`, `it.json`, `en.json`. Source: existing `name`, `effect_tiers` (new), `ingredient` array text, step `description` text. Output: one locale file per language matching the structure above.

### Step 2: Generate structural recipes.json (Python script)
Strip all localized fields. Convert old `ingredients: { de: [...], it: [...], en: [...] }` into `ingredients: [{ key, qty }]`. Map step descriptions to step types via keyword matching. Output: `recipes.json` in the new structural format.

### Step 3: Rewrite `js/recipes.js` as RecipeStore
Replace entire file. Implement `init()`, all exported getters, private `renderStep()`. Delete `stepKeywords`, `categorizeStep`, `keywordMatch`. Make `init` return when recipes + all 3 locales loaded.

### Step 4: Update `js/main.js`
`init()` replaces `fetchRecipes()`. Store language mapping.

### Step 5: Update `js/ui-recipe-card.js`
Replace all localized data access with store calls. Remove `categorizeStep` import. Remove regex ingredient parsing. Simplify step rendering.

### Step 6: Update `js/ui-timer.js`
Replace all `recipe.recipe_steps.*` access with `getSteps(recipe.id)`. Same `step.description` field name.

### Step 7: Update `js/ui-recipe-list.js`
Map key: `recipe.name.de` → `recipe.id`.

### Step 8: Update `js/ui-filter.js`
Update import paths if needed. Call signatures unchanged.

### Step 9: SW cache bust
Update `sw.js` cache URLs list. Bump cache version.

---

## Verification Checklist

1. [ ] All 28 recipes render with correct names in de, it, en
2. [ ] All 4 effect tiers render correctly per language
3. [ ] Recipe steps display correct localized text
4. [ ] Ingredient lists display correct localized text with quantities
5. [ ] Search works across all 3 languages
6. [ ] Category filter works
7. [ ] Ingredient filter works
8. [ ] Sort by name/category/price/ingredients works
9. [ ] Timer bar runs on timed steps and displays correct step descriptions
10. [ ] Language switcher updates all displayed text without page reload
11. [ ] URL params (search, category, sort, ingredients) sync correctly
12. [ ] No console errors
13. [ ] SW caches new locale files

---

## Risk Register

| Risk | Mitigation |
|------|-----------|
| Step type mapping wrong for edge cases | Manual review of all 28 recipes' step types after migration script |
| Ingredient key naming inconsistency | Migration script generates all 3 locales from one canonical source |
| `recipe.name.de` Map key change breaks card rendering | `recipe.id` is already unique across all recipes |
| SW serves stale cached files | Bump cache version in sw.js |
| `renderStep` produces incorrect text | Compare against current rendered output for all 8 step types |
| Cross-language search breaks | `store.filter` has access to all 3 locales internally |
| Timer references break | Timer code uses same `step.description` / `step.duration` field names — only the source changes |
