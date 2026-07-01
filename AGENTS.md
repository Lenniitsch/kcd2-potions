# AGENTS.md — KCD2 Potion Guide

## Quick Start

- **Zero dependencies, zero build step.** Vanilla JS (ES modules), no npm, no bundler, no framework.
- **Precompiled Tailwind CSS v4** is in `css/tailwind.css` — you do NOT run a Tailwind build. Add custom styles to `css/style.css` only.
- **DO NOT modify `css/tailwind.css` directly** — it's precompiled. Some Tailwind utilities may not be available in the build (e.g., `justify-end`, `flex` as standalone class). Use inline styles or CSS classes in `style.css` as fallback.
- **Local dev**: Start the Node.js server (see root `AGENTS.md`), navigate to `http://127.0.0.1:8083/`.

## Architecture

```
tools/kcd2/
├── data/
│   ├── recipes.json          ← structural data (keys, categories, typed steps, ingredient keys)
│   └── locales/
│       ├── de.json           ← German display strings
│       ├── it.json           ← Italian display strings
│       └── en.json           ← English display strings
├── js/
│   ├── recipes.js            ← RecipeStore — ALL locale-backed data goes through here
│   ├── state.js              ← Pub/sub state management (setState, onState)
│   ├── i18n.js               ← UI string translations (getText, CATEGORIES, SORT_OPTIONS)
│   ├── dom.js                ← DOM factory: el(tag, attrs, ...children)
│   ├── ui-timer.js           ← Timer + TimerBar (3-row collapsible brew mode)
│   ├── ui-recipe-card.js     ← Recipe card with timers, steps, ingredients
│   ├── ui-recipe-list.js     ← Card list rendering, filtering, sorting
│   ├── ui-filter.js          ← Filter panel: search, category pills, ingredient tags
│   ├── ui-header.js          ← App header (title, theme, language)
│   ├── ui-tabs.js            ← Recipes/Maps tab switcher
│   ├── ui-maps.js            ← Map viewer (Zoomist)
│   └── main.js               ← Entry point, state init, component assembly
├── sw.js                     ← Service worker (bump CACHE_NAME on changes)
├── manifest.json             ← PWA manifest
└── index.html                ← Single HTML shell
```

## Key Patterns

### State (`js/state.js`)
```js
import { state, setState, onState } from './state.js';
setState('key', value);           // triggers all subscribers
onState('key', callback);         // returns unsubscribe function
```

### DOM factory (`js/dom.js`)
```js
import { el } from './dom.js';
el('div', { class: 'foo', onClick: handler, 'aria-label': 'Bar' }, child1, child2);
el('span', { html: '<svg>...</svg>' });  // innerHTML via `html` attribute
el('div', { style: { display: 'flex' } });  // inline styles via `style` object
```

### i18n (`js/i18n.js`)
```js
import { getText, getCategoryLabel, getSortLabel } from './i18n.js';
getText('timer.start');  // returns current language translation
```
Add new keys to the `UI` object. All recipe display data comes from `recipes.js`, not i18n.

### RecipeStore (`js/recipes.js`)
All locale data access goes through this module. No other file reads `data/locales/` or `data/recipes.json` directly.
```js
import { init, getAll, getName, getEffect, getIngredients, getSteps } from './recipes.js';
await init('data/recipes.json', 'data/locales');  // called once in main.js
setState('recipes', getAll());
getName(recipeId);                // localized name
getSteps(recipeId);               // [{description, duration, type}, ...]
```

### Steps format
Each step is `{ type, key?, qty?, duration? }`:
- `base` (water/oil/wine/spirits), `ingredient`, `grind`, `boil`, `boil_bellows`, `distil`, `pour`, `cauldron_grind`
- `duration` only on timed steps (boil, boil_bellows)
- `key` on steps that reference an ingredient or base liquid

### Timer (`js/ui-timer.js`)
```js
import { Timer, TimerBar } from './ui-timer.js';
TimerBar(container, recipe, getLang, getActiveStepIndex, setActiveStep,
         getActiveStepIndices, getTotalSteps, onPrevStep, onNextStep,
         onToggleMode, showTimedOnly);
```
Default collapsed (body has `hidden` class). Header click toggles body without affecting running timer. Step highlight only appears when body is visible.

## Available MCP Servers

When working on this project, two MCP servers are available to help:

### Chrome DevTools MCP (`chrome-devtools_*`)
- Inspect the running app at `http://127.0.0.1:8083/`
- Take snapshots of the DOM (a11y tree)
- Evaluate JavaScript against the page
- Check console messages for errors
- Click elements, navigate, take screenshots

### Tailwind CSS v4 Docs (`tailwindcss-docs_*`)
- Search Tailwind v4 documentation for utility classes
- List available utilities by category
- Fetch and index docs for reference
- **Note**: This project uses precompiled Tailwind v4 (`css/tailwind.css`). Not all utilities may be included in the build. If a Tailwind class doesn't work, use `css/style.css` classes or inline styles as fallback.

## Code Style

- **`var` not `let`/`const`** in module-level code and function scopes
- **No arrow functions in module exports** (use `function` declarations)
- **German comment strings are fine**, but prefer no new comments unless essential
- **44px minimum touch targets** for all interactive elements
- **Both dark and light themes** must be covered in CSS via `var(--kcd-*)` variables
- **Use existing CSS variables** instead of hardcoded colors
- **Prefer Tailwind utilities** in class strings over inline styles

## Gotchas

- The kcd2 folder is its own git repo, NOT part of the parent duckoverflow.com repo
- `css/tailwind.css` is precompiled — not all Tailwind v4 utilities may be included
- Some Tailwind classes (like `flex`, `justify-end`) were not in the build — use inline styles or `style.css` as fallback
- The `.timer-action-primary--running` class applies solid gold fill during countdown
- Category pills use dynamic `var(--cat-*)` CSS variables for per-category coloring
- `filterRecipes(recipes, filters)` takes TWO arguments — not just filters
- `getAllIngredients(recipes)` accepts optional recipes array, defaults to store
- Step highlighting is suppressed when the timer body has the `hidden` class
- Service worker in `sw.js` caches files explicitly — bump CACHE_NAME and update PRECACHE_URLS when adding new files
- Language switch rebuilds step/ingredient lists via the card's `update()` function
