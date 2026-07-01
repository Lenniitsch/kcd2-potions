import { el } from './dom.js';
import { getText, getCategoryLabel } from './i18n.js';
import { categorizeStep } from './recipes.js';
import { TimerBar } from './ui-timer.js';

var coinSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="12" rx="10" ry="10"/><line x1="12" y1="2" x2="12" y2="22"/><ellipse cx="12" cy="12" rx="3" ry="10"/></svg>';

export var CATEGORY_ICONS = {
    'Heiltrank': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    'Kampf-Buff': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>',
    'Gift': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    'Werken': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    'Sonstiges': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    'DLC/Quest': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>',
};

export var CATEGORY_COLORS = {
    'Heiltrank': 'cat-healing',
    'Kampf-Buff': 'cat-combat',
    'Gift': 'cat-poison',
    'Werken': 'cat-crafting',
    'Sonstiges': 'cat-utility',
    'DLC/Quest': 'cat-dlc',
};

export var CATEGORY_BG_CLASS = {
    'cat-healing': 'bg-cat-healing/12',
    'cat-combat': 'bg-cat-combat/12',
    'cat-poison': 'bg-cat-poison/12',
    'cat-crafting': 'bg-cat-crafting/12',
    'cat-utility': 'bg-cat-utility/12',
    'cat-dlc': 'bg-cat-dlc/12',
};

export var CATEGORY_TEXT_CLASS = {
    'cat-healing': 'text-cat-healing',
    'cat-combat': 'text-cat-combat',
    'cat-poison': 'text-cat-poison',
    'cat-crafting': 'text-cat-crafting',
    'cat-utility': 'text-cat-utility',
    'cat-dlc': 'text-cat-dlc',
};

function getTimedOnlyIndices(recipe) {
    var indices = [];
    var steps = recipe.recipe_steps.de;
    for (var i = 0; i < steps.length; i++) {
        if (steps[i].duration > 0) indices.push(i);
    }
    return indices;
}

function getIndicesForMode(recipe, timedOnly) {
    var indices = [];
    var steps = recipe.recipe_steps.de;
    for (var i = 0; i < steps.length; i++) {
        if (!timedOnly || steps[i].duration > 0) indices.push(i);
    }
    return indices;
}

export function buildRecipeCard(recipe, getLang) {
    var lang = getLang();
    var expanded = false;
    var activeStepIndex = -1;
    var timerBarInstance = null;
    var showTimedOnly = true;
    var catColor = CATEGORY_COLORS[recipe.category] || 'kcd-gold';

    var timedOnlyIndices = getTimedOnlyIndices(recipe);
    var hasTimedSteps = timedOnlyIndices.length > 0;
    var activeStepIndices = getIndicesForMode(recipe, showTimedOnly);

    var fullName = recipe.name[lang] || recipe.name.de;
    var first = fullName.charAt(0);
    var rest = fullName.slice(1);
    var dropCapSpan = el('span', { class: 'kcd-drop-cap' }, first);
    var restSpan = el('span', { class: 'font-bold' }, rest);
    var nameEl = el('h3', { class: 'font-serif text-lg text-kcd-text leading-tight' }, dropCapSpan, restSpan);

    var catIconHtml = CATEGORY_ICONS[recipe.category] || '';
    var categoryEl = el('span', {
        class: 'kcd-category-badge ' + CATEGORY_BG_CLASS[catColor] + ' ' + CATEGORY_TEXT_CLASS[catColor],
        html: catIconHtml + ' ' + getCategoryLabel(recipe.category),
    });

    var priceTextEl = el('span', { class: 'text-xs text-kcd-text-secondary' }, recipe.price + ' ' + getText('misc.groschen'));
    var priceEl = el('span', { class: 'flex items-center gap-1' },
        el('span', { class: 'shrink-0 text-kcd-muted', html: coinSvg }),
        priceTextEl
    );

    var headerRow = el('div', { class: 'kcd-card-header' },
        nameEl,
        el('div', { class: 'flex items-center gap-2 mt-1' }, categoryEl, priceEl)
    );

    var effectText = recipe.effect_description[lang] || recipe.effect_description.de || '';
    var effectEl = el('p', { class: 'text-sm text-kcd-text-secondary leading-snug line-clamp-3 min-h-[3.6rem]' }, effectText);

    var collapsedContent = el('div', { class: 'flex flex-col gap-2 cursor-pointer', onClick: toggle },
        headerRow, effectEl
    );

    var ingredientsList = el('ul', { class: 'space-y-0.5 mt-0.5' });
    var ingredientsTitle = el('h4', { class: 'font-serif text-sm font-bold text-kcd-gold' },
        getText('card.ingredients')
    );
    var ingredientsSection = el('div', {}, ingredientsTitle, ingredientsList);

    var stepsList = el('ol', { class: 'space-y-1.5 mt-0.5' });
    var stepsTitle = el('h4', { class: 'font-serif text-sm font-bold text-kcd-gold' },
        getText('card.steps')
    );
    var stepsSection = el('div', {}, stepsTitle, stepsList);

    var timerContainer = el('div', {});
    var timerControls = el('div', {
        class: 'timer-controls',
        onPointerdown: function (e) { e.stopPropagation(); },
    }, timerContainer);

    var bodyGrid = el('div', { class: 'kcd-card-body-grid flex flex-col gap-3' }, ingredientsSection, stepsSection);

    var bodyContent = el('div', { class: 'kcd-card-body-content flex flex-col gap-3' },
        bodyGrid,
        timerControls
    );

    var bodyInner = el('div', { class: 'overflow-hidden' },
        el('div', { class: 'pt-4 mt-2 border-t border-kcd-border' },
            bodyContent
        )
    );

    var bodyEl = el('div', {
        class: 'kcd-card-body grid grid-rows-[0fr] transition-[grid-template-rows] duration-300',
        'aria-hidden': 'true',
    }, bodyInner);

    var root = el('div', {
        class: 'kcd-card kcd-card-ornamented bg-kcd-surface rounded-lg p-4 flex flex-col',
        tabindex: '0',
        role: 'button',
        'aria-expanded': 'false',
        onKeydown: function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        },
    }, collapsedContent, bodyEl);

    populateIngredients(ingredientsList, recipe, lang);
    populateSteps(stepsList, recipe, lang, onStepTap);

    function toggleMode(timed) {
        showTimedOnly = timed;
        activeStepIndices = getIndicesForMode(recipe, showTimedOnly);
        if (activeStepIndices.indexOf(activeStepIndex) === -1 && activeStepIndices.length > 0) {
            setActiveStep(activeStepIndices[0]);
        } else if (activeStepIndices.length === 0) {
            setActiveStep(-1);
        }
        if (timerBarInstance) timerBarInstance.setMode(showTimedOnly);
    }

    function onStepTap(idx) {
        if (activeStepIndices.indexOf(idx) === -1) {
            toggleMode(false);
        }
        setActiveStep(idx);
    }

    function toggle() {
        expanded = !expanded;
        effectEl.classList.toggle('line-clamp-3', !expanded);
        if (expanded) {
            bodyEl.className = 'kcd-card-body expanded grid grid-rows-[1fr] transition-[grid-template-rows] duration-300';
            bodyEl.setAttribute('aria-hidden', 'false');
            root.setAttribute('aria-expanded', 'true');
            initActiveStep();
            enableTimer();
        } else {
            bodyEl.className = 'kcd-card-body grid grid-rows-[0fr] transition-[grid-template-rows] duration-300';
            bodyEl.setAttribute('aria-hidden', 'true');
            root.setAttribute('aria-expanded', 'false');
            if (timerBarInstance) {
                timerBarInstance.destroy();
                timerBarInstance = null;
            }
        }
    }

    function initActiveStep() {
        if (activeStepIndex >= 0) return;
        if (activeStepIndices.length > 0) {
            activeStepIndex = activeStepIndices[0];
        } else {
            activeStepIndex = -1;
        }
        updateStepHighlight();
    }

    function updateStepHighlight() {
        var items = stepsList.querySelectorAll('li');
        for (var i = 0; i < items.length; i++) {
            var idx = parseInt(items[i].getAttribute('data-step-index'), 10);
            if (idx === activeStepIndex) {
                items[i].classList.add('kcd-step-active');
            } else {
                items[i].classList.remove('kcd-step-active');
            }
        }
    }

    function navigateStep(direction) {
        if (activeStepIndices.length === 0) return;
        var currentIdxInList = activeStepIndices.indexOf(activeStepIndex);
        if (currentIdxInList === -1) return;
        var newIdxInList = currentIdxInList + direction;
        if (newIdxInList < 0 || newIdxInList >= activeStepIndices.length) return;
        setActiveStep(activeStepIndices[newIdxInList]);
    }

    function setActiveStep(idx) {
        activeStepIndex = idx;
        updateStepHighlight();
        if (timerBarInstance) {
            timerBarInstance.setStep(idx);
        }
    }

    function enableTimer() {
        while (timerContainer.firstChild) timerContainer.removeChild(timerContainer.firstChild);
        if (!hasTimedSteps) {
            timerContainer.appendChild(el('p', { class: 'text-xs text-kcd-text-muted text-center py-2' },
                getText('timer.noTimedSteps')));
            return;
        }
        if (timerBarInstance) {
            timerBarInstance.destroy();
            timerBarInstance = null;
        }
        timerBarInstance = TimerBar(timerContainer, recipe, getLang,
            function () { return activeStepIndex; },
            setActiveStep,
            function () { return activeStepIndices; },
            function () { return recipe.recipe_steps.de.length; },
            function () { navigateStep(-1); },
            function () { navigateStep(1); },
            function () { toggleMode(!showTimedOnly); },
            showTimedOnly
        );
    }

    function update(newLang) {
        lang = newLang;

        var updatedFullName = recipe.name[lang] || recipe.name.de;
        dropCapSpan.textContent = updatedFullName.charAt(0);
        restSpan.textContent = updatedFullName.slice(1);

        var currCatColor = CATEGORY_COLORS[recipe.category] || 'kcd-gold';
        categoryEl.className = 'kcd-category-badge ' + CATEGORY_BG_CLASS[currCatColor] + ' ' + CATEGORY_TEXT_CLASS[currCatColor];
        categoryEl.innerHTML = CATEGORY_ICONS[recipe.category] + ' ' + getCategoryLabel(recipe.category);

        priceTextEl.textContent = recipe.price + ' ' + getText('misc.groschen');

        effectEl.textContent = recipe.effect_description[lang] || recipe.effect_description.de || '';

        while (ingredientsList.firstChild) ingredientsList.removeChild(ingredientsList.firstChild);
        populateIngredients(ingredientsList, recipe, lang);
        ingredientsTitle.textContent = getText('card.ingredients');

        while (stepsList.firstChild) stepsList.removeChild(stepsList.firstChild);
        populateSteps(stepsList, recipe, lang, onStepTap);
        stepsTitle.textContent = getText('card.steps');

        updateStepHighlight();

        if (timerBarInstance) {
            timerBarInstance.updateLanguage(lang);
        }
    }

    function setLayout(layout) {
        if (layout === 'list') {
            root.classList.add('kcd-card-list');
            headerRow.className = 'kcd-card-header flex items-center gap-3';
        } else {
            root.classList.remove('kcd-card-list');
            headerRow.className = 'kcd-card-header';
        }
    }

    function collapse() {
        if (expanded) toggle();
    }

    return { root: root, update: update, setLayout: setLayout, collapse: collapse };
}

function populateIngredients(list, recipe, lang) {
    var ingNames = recipe.ingredients[lang] || recipe.ingredients.de || [];
    for (var i = 0; i < ingNames.length; i++) {
        var parts = ingNames[i].match(/^(\d+)\s*x\s*(.+)$/);
        var qty = parts ? parts[1] : '';
        var name = parts ? parts[2] : ingNames[i];
        var li = el('li', { class: 'flex items-center gap-2 text-sm' },
            el('span', { class: 'text-kcd-muted tabular-nums shrink-0' }, qty ? 'x' + qty : ''),
            el('span', { class: 'text-kcd-text' }, name)
        );
        list.appendChild(li);
    }
}

function populateSteps(list, recipe, lang, onStepTap) {
    var steps = recipe.recipe_steps[lang] || recipe.recipe_steps.de || [];
    for (var i = 0; i < steps.length; i++) {
        var step = steps[i];
        var stepText = step.description;
        if (step.duration > 0) {
            stepText += ' (' + step.duration + 's)';
        }
        var stepType = categorizeStep(step.description, lang);
        (function (stepIdx) {
            var li = el('li', {
                class: 'kcd-step kcd-step-' + stepType,
                'data-step-index': '' + stepIdx,
                onClick: function (e) {
                    e.stopPropagation();
                    if (onStepTap) onStepTap(stepIdx);
                },
                onPointerdown: function (e) { e.stopPropagation(); },
            },
                el('span', { class: 'kcd-step-num' },
                    el('span', {}, (stepIdx + 1))
                ),
                el('span', { class: 'text-kcd-text' }, stepText)
            );
            list.appendChild(li);
        })(i);
    }
}
