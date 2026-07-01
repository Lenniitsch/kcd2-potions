# PLAN: KCD2 Brewing Timer

## Overview

Add a per-recipe brewing timer to the KCD2 Potion Guide. One prominent timer control at the **bottom** of each expanded recipe card, with large Prev/Next buttons above it to cycle through timed steps. Designed for second-screen iPad use — big touch targets, steps remain visible above the timer (hand doesn't cover them).

---

## Data Model Change: recipes.json v3.0.0

Steps change from plain strings to `{ description, duration }` objects:

```json
// Before
"recipe_steps": {
    "de": ["Kochen (20 Sekunden)", "Destillieren"]
}

// After
"recipe_steps": {
    "de": [
        { "description": "Kochen", "duration": 20 },
        { "description": "Destillieren", "duration": 0 }
    ]
}
```

- `duration: 0` = non-timed step (grind, distill, add ingredient)
- `duration: 10|20|30` = timed step
- Description is clean — the `(X Sekunden)` parenthetical is removed; UI derives display from `duration`
- Schema version bumped to `"3.0.0"`
- 27 recipes × ~6 steps × 3 languages to migrate

---

## UX Layout (Expanded Card)

```
┌─────────────────────────────────────────┐
│  ◆ Aqua Vitalis          💰 70 Groschen │  header (collapsed section)
│  60% less health loss...                 │
├─────────────────────────────────────────┤
│  Ingredients                             │
│  · 2 x Löwenzahn                        │
│  · 1 x Ringelblume                      │
│                                          │
│  Brewing Steps                           │  user can read these
│  ◆ 1  Wasser                            │  without hand covering
│  ◆ 2  2 x Löwenzahn                     │
│  ◆ 3  Kochen (20s)         ◀ active     │  active step highlighted
│  ◆ 4  1 x Ringelblume zerstoßen         │  gold left border or bg
│  ◆ 5  Kochen (20s)                      │
│  ◆ 6  Destillieren                      │
│  ─────────────────────────────────────  │
│      ⬆ PREV STEP    NEXT STEP ⬇        │  nav: cycles only timed steps
│  ─────────────────────────────────────  │
│  ◉ Kochen                    ┌────────┐ │
│    0:14 / 20s               │  PAUSE  │ │  timer bar at BOTTOM
│  ████████████░░░░░░░░░░░    │  RESET  │ │  (hand reaches here)
│                              └────────┘ │
└─────────────────────────────────────────┘
```

**Timer bar states:**

| State | Display |
|---|---|
| Ready | Step name + `Xs` duration + **[START]** button. No progress bar. |
| Running | `MM:SS` countdown + progress bar filling + **[PAUSE] [RESET]** |
| Paused | Frozen `MM:SS` countdown + frozen bar + **[RESUME] [RESET]** |
| Finished | Bar pulses gold 3×, then auto-returns to Ready state |

**Button semantics:**
- **START** — begins countdown
- **PAUSE** — freezes countdown at current value
- **RESUME** — continues from frozen value
- **RESET** — stops, resets to full original duration, returns to Ready state

**Behaviors:**
- First timed step auto-selected when card expands
- Prev/Next cycle **only** through steps with `duration > 0` (skip non-timed)
- Tapping a step in the step list selects it (updates timer bar to that step)
- Tapping a different step while timer is running → stops and resets, selects new step, shows Ready
- Starting a timer on card B stops card A's timer (enforced via `state.activeTimer`)
- Collapsing card while timer runs → timer continues in background; re-expand shows current state
- Timer finishes while card collapsed → next expand shows Ready state
- Both Prev/Next disabled when only 1 timed step exists, or at bounds (first/last)
- Recipe with 0 timed steps: timer bar hidden or shows "No timed steps" message

---

## Architecture

```
state.activeTimer              ← new global state key (pub/sub)
     │
     ▼
js/ui-timer.js (NEW)          ← timer logic + DOM rendering
     ├── Timer class               countdown engine (Date.now-based, drift-resistant)
     └── TimerBar(el, recipe)     DOM builder for the timer bar section
     
js/ui-recipe-card.js (MODIFY)
     ├── Steps render with (Xs) from duration field
     ├── Active step highlight (kcd-step-active class)
     ├── Prev/Next nav buttons at bottom of expanded body
     ├── TimerBar integrated below nav buttons
     └── Step list items are tappable to select step

js/recipes.js (MODIFY)
     └── categorizeStep() updated for {description, duration} format

js/i18n.js (MODIFY)
     └── New keys: timer.start, timer.pause, timer.resume, timer.reset,
         timer.prevStep, timer.nextStep, timer.noTimedSteps

js/state.js (MODIFY)
     └── + activeTimer: null

css/style.css (MODIFY)
     └── Timer bar styles, button styles (min 44px touch targets),
         progress bar, active step highlight, @keyframes timer-pulse,
         dark + light theme support

data/recipes.json (MODIFY)
     └── All 27 recipes: strings → {description, duration}
     └── schema_version → "3.0.0"

sw.js (MODIFY)
     └── CACHE_NAME → 'kcd2-v10'
     └── Add 'js/ui-timer.js' to PRECACHE_URLS
```

---

## Tasks

### Task 1: Migrate recipes.json to v3.0.0

Convert all 27 recipes × 3 languages. Each step string becomes `{ description: string, duration: number }`.

Patterns to extract timing from (per language):
- DE: `Kochen (X Sekunden)` → `{ description: "Kochen", duration: X }`
- EN: `Boil (X seconds)` → `{ description: "Boil", duration: X }`
- IT: `Bollire (X secondi)` → `{ description: "Bollire", duration: X }`
- Also: `Mit Blasebalg kochen (X Sekunden)` → `{ description: "Mit Blasebalg kochen", duration: X }`
- Non-timed: `Wasser`, `Destillieren`, `Distillare`, `Distill`, etc. → `{ description: "...", duration: 0 }`

Bump `schema_version` to `"3.0.0"`, update `last_updated`.

**Verify:** JSON parses without errors, all durations are 0/10/20/30, descriptions are clean.
**Files:** `data/recipes.json`

---

### Task 2: Update categorizeStep() for new step format

Currently `categorizeStep(stepText, lang)` matches against raw string. Must now accept `step.description` string.

Remove the timing regex matching — categorisation is now based only on keywords in the description. The `duration` field separately tells us if it's timed.

Existing category keywords per language (word-boundary matching):
- `'base'`: first step only (Wasser/Acqua/Water)
- `'cooking'`: Kochen/Bollire/Boil, Blasebalg/mantice/bellows
- `'finishing'`: Destillieren/Distillare/Distill, Phiole/fiala/phial
- `'ingredient'`: everything else (grind, add ingredient)

**Verify:** All step types render correct colored diamond badges in all 3 languages.
**Files:** `js/recipes.js`

---

### Task 3: Add activeTimer to state + i18n keys

Add to `state.js`:
```js
activeTimer: null,
```

No subscriber setup in state.js — ui-timer.js subscribes to it directly.

Add to `js/i18n.js` `UI` object:
```js
timer: {
    start:       { de: "Start",                it: "Avvia",             en: "Start" },
    pause:       { de: "Pause",                it: "Pausa",             en: "Pause" },
    resume:      { de: "Fortsetzen",           it: "Riprendi",          en: "Resume" },
    reset:       { de: "Zurücksetzen",         it: "Azzera",            en: "Reset" },
    prevStep:    { de: "Vorheriger Schritt",   it: "Passo precedente",  en: "Previous step" },
    nextStep:    { de: "Nächster Schritt",     it: "Passo successivo",  en: "Next step" },
    noTimedSteps:{ de: "Keine zeitgesteuerten Schritte", it: "Nessun passo a tempo", en: "No timed steps" },
}
```

**Verify:** `getText('timer.start')` returns correct translation for current language.
**Files:** `js/state.js`, `js/i18n.js`

---

### Task 4: Build js/ui-timer.js

New module exporting `Timer` class and `TimerBar` DOM builder.

**Timer class** — drift-resistant countdown engine:
```
Properties: recipeId, stepIndex, duration, startedAt, remaining, running, pausedRemaining
Methods:
  - start(duration)     → begins countdown, sets interval
  - pause()             → freezes, stores pausedRemaining
  - resume()            → continues from pausedRemaining, recalculates target
  - reset()             → stops interval, resets remaining to duration
  - getRemaining()      → calculates from Date.now() minus startedAt (drift-proof)
  - onTick(callback)    → called every second with remaining seconds
  - onFinish(callback)  → called when remaining hits 0
  - destroy()           → clears interval

Implementation note: Use Date.now() - startedAt to calculate remaining, not accumulated ticks.
This handles tab backgrounding correctly.
```

**TimerBar function** `TimerBar(container, recipe, getLang)`:
- Renders the timer bar DOM into `container`:
  - Step indicator (small icon/dot)
  - Step description + duration label (e.g., "Kochen · 20s" / "Kochen · 0:14")
  - Button group: START | PAUSE+RESET | RESUME+RESET
  - Progress bar (thin line, displays only during running/paused)
- Subscribes to `state.activeTimer` — if a timer starts on another card, this one's timer stops
- Updates DOM on tick (countdown, progress bar width), on pause, on resume, on reset, on finish
- On finish: adds `.timer-pulse` class for 3-pulse animation, then returns to Ready
- `updateLanguage(lang)` method for reactive language switching
- All buttons use i18n via `getText('timer.xxx')`
- Buttons have `min-width: 44px; min-height: 44px` for touch targets

**Export:** `export { Timer, TimerBar };`

**Verify:** Manual test in browser — start, pause, resume, reset, finish animation.
**Files:** `js/ui-timer.js` (new file)

---

### Task 5: Integrate timer into recipe cards

Modify `js/ui-recipe-card.js`:

1. **Step rendering** (`populateSteps`):
   - Pass step object `{ description, duration }` instead of raw string
   - Display: `description + " (" + duration + "s)"` when duration > 0, else just `description`
   - Each `<li>` gets `data-step-index` attribute for tappable selection

2. **Active step highlight**:
   - Track `activeStepIndex` in card scope (defaults to first timed step index on expand)
   - Apply `.kcd-step-active` class to the active step's `<li>`
   - Active step gets gold left border or subtle gold background tint

3. **Step list tappability**:
   - `onClick` on each step `<li>`: if timer is running, stop and reset it; then set `activeStepIndex` and update TimerBar

4. **Prev/Next navigation**:
   - Rendered between steps list and timer bar
   - Two large buttons: ◀ PREV STEP / NEXT STEP ▶
   - Cycle through `getTimedStepIndices(recipe)` — an array of indices where `duration > 0`
   - Disabled state when at first/last timed step, or when only 1 timed step exists
   - Updating: calls `setActiveStep(index)` which stops current timer, updates highlight, updates TimerBar

5. **TimerBar integration**:
   - Import `{ TimerBar }` from `'./ui-timer.js'`
   - Create a container div for the timer bar at the bottom of the expanded body
   - Call `TimerBar(timerContainer, recipe, getLang)` on expand
   - On collapse: destroy the timer (clearInterval)
   - TimerBar instance stored on card for lifecycle management

6. **Card layout order (expanded body):**
   ```
   [ingredients section]
   [steps section]
   [prev/next nav]
   [timer bar]           ← at BOTTOM
   ```

7. **Helper:**
   ```js
   function getTimedStepIndices(recipe) {
       var indices = [];
       var steps = recipe.recipe_steps.de; // all languages have same structure
       for (var i = 0; i < steps.length; i++) {
           if (steps[i].duration > 0) indices.push(i);
       }
       return indices;
   }
   ```

**Verify:** 
- Expand card → first timed step auto-selected, timer bar shows START
- START → countdown runs, PAUSE/RESET shown
- PAUSE → countdown freezes, RESUME/RESET shown
- RESET → back to full duration, START shown
- PREV/NEXT cycle correctly, skipping non-timed steps
- Tapping a step in list selects it
- Only **1 active timer** across all cards (timer on card B stops card A)
- Collapse + re-expand preserves timer state
- Works in list and grid layouts
**Files:** `js/ui-recipe-card.js`

---

### Task 6: Add timer CSS styles

Add to `css/style.css`:

```css
/* Timer bar */
.timer-bar {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 1px solid var(--kcd-border);
    border-radius: 0.5rem;
    background: var(--kcd-surface);
}
.timer-bar-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}
.timer-bar-step-label {
    font-size: 0.875rem;
    color: var(--kcd-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.timer-bar-time {
    font-family: 'Georgia', serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--kcd-gold);
    font-variant-numeric: tabular-nums;
    min-width: 4ch;
    text-align: right;
}
.timer-bar-buttons {
    display: flex;
    gap: 0.5rem;
}
.timer-bar-btn {
    min-width: 44px;          /* touch target */
    min-height: 44px;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s;
    border: 1px solid transparent;
}
.timer-bar-btn-start {
    background: var(--kcd-gold);
    color: var(--kcd-bg);
    border-color: var(--kcd-gold);
}
.timer-bar-btn-start:hover {
    background: var(--kcd-gold-hover);
}
.timer-bar-btn-pause,
.timer-bar-btn-resume {
    background: var(--kcd-accent);
    color: white;
    border-color: var(--kcd-accent);
}
.timer-bar-btn-reset {
    background: transparent;
    color: var(--kcd-text-secondary);
    border-color: var(--kcd-border);
}
.timer-bar-btn-reset:hover {
    background: var(--kcd-hover);
    color: var(--kcd-text);
}

/* Progress bar */
.timer-bar-progress-track {
    height: 3px;
    background: var(--kcd-border);
    border-radius: 999px;
    overflow: hidden;
}
.timer-bar-progress-fill {
    height: 100%;
    background: var(--kcd-gold);
    border-radius: 999px;
    transition: width 1s linear;
}

/* Active step highlight */
.kcd-step-active {
    border-left: 2px solid var(--kcd-gold);
    background: linear-gradient(to right, rgba(243, 205, 118, 0.08), transparent);
}

/* Pulse animation on timer finish */
@keyframes timer-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(243, 205, 118, 0); }
    25%      { box-shadow: 0 0 0 2px rgba(243, 205, 118, 0.5); }
    50%      { box-shadow: 0 0 0 0 rgba(243, 205, 118, 0); }
    75%      { box-shadow: 0 0 0 2px rgba(243, 205, 118, 0.5); }
}
.timer-pulse {
    animation: timer-pulse 0.6s ease-in-out 3;
}

/* Prev/Next nav buttons */
.timer-nav {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
}
.timer-nav-btn {
    min-width: 44px;
    min-height: 44px;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.15s, opacity 0.15s;
    background: transparent;
    border: 1px solid var(--kcd-border);
    color: var(--kcd-text-secondary);
}
.timer-nav-btn:hover:not(:disabled) {
    background: var(--kcd-hover);
    color: var(--kcd-text);
    border-color: var(--kcd-gold-dim);
}
.timer-nav-btn:disabled {
    opacity: 0.3;
    cursor: default;
}

/* Light theme overrides */
[data-theme="light"] .timer-bar-btn-start {
    background: var(--kcd-gold);
    color: var(--kcd-bg);
}
[data-theme="light"] .kcd-step-active {
    border-left-color: var(--kcd-gold);
}
```

**Verify:** Visual check in dark and light themes, buttons are at least 44×44px, pulse animation triggers on finish.
**Files:** `css/style.css`

---

### Task 7: Update service worker cache

In `sw.js`:
- Bump `CACHE_NAME` from `'kcd2-v9'` to `'kcd2-v10'`
- Add `'js/ui-timer.js'` to the `PRECACHE_URLS` array

**Verify:** Check that SW install event includes the new file, no errors in console.
**Files:** `sw.js`

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Recipe has 0 timed steps | Timer bar hidden; prev/next hidden; steps render normally |
| Recipe has 1 timed step | Timer bar works normally; prev/next disabled (no other steps to cycle to) |
| Tab switched to Maps | Timer continues in background (state.activeTimer untouched); card not mounted so no DOM updates, but timer engine keeps counting |
| Browser tab backgrounded | Date.now()-based timer handles this — on return, remaining time is correct |
| Timer finishes while card collapsed | state.activeTimer set to null. Next expand: no active timer shown, step returns to Ready |
| Card B timer started while Card A running | state.activeTimer subscriber in Card A's TimerBar stops and resets Card A's timer |
| Language switched while timer running | TimerBar.updateLanguage() re-renders labels; countdown unaffected |
| Theme toggled while timer running | CSS variables handle this; no JS action needed |
| Page reloaded | Timer state lost (not persisted to localStorage); that's intentional — keep it simple |

---

## Verification Checklist

- [ ] All 27 recipes migrated, JSON valid
- [ ] categorizeStep() returns correct types for all 3 languages
- [ ] i18n keys return correct translations
- [ ] First timed step auto-selected on card expand
- [ ] START → countdown runs → PAUSE → resume → RESET → back to Ready
- [ ] Prev/Next cycle correctly, only timed steps
- [ ] Prev/Next disabled when only 1 timed step or at bounds
- [ ] Tapping step in list selects it, stops any running timer
- [ ] Only 1 active timer across all cards
- [ ] Collapse + re-expand preserves timer state
- [ ] Timer finish pulse animation plays, returns to Ready
- [ ] Dark theme looks correct
- [ ] Light theme looks correct
- [ ] Grid layout works with timer
- [ ] List layout works with timer
- [ ] SW caches ui-timer.js
- [ ] No console errors
