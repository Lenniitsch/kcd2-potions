import { state, setState, onState } from './state.js';
import { el } from './dom.js';
import { getText, getSortLabel } from './i18n.js';
import { filterRecipes, sortRecipes } from './recipes.js';
import { buildRecipeCard } from './ui-recipe-card.js';

var gridIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>';

var listIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>';

export function buildRecipeList(outerContainer) {
    if (!outerContainer) {
        outerContainer = el('div', { class: '' });
    }

    var cardMap = new Map();

    var layoutGridBtn = el('button', {
        class: 'p-1 rounded focus:outline-none',
        'aria-label': getText('filter.layoutGrid'),
        onClick: function () { setState('filters', { ...state.filters, layout: 'grid' }); },
    });
    layoutGridBtn.innerHTML = gridIcon;

    var layoutListBtn = el('button', {
        class: 'p-1 rounded focus:outline-none',
        'aria-label': getText('filter.layoutList'),
        onClick: function () { setState('filters', { ...state.filters, layout: 'list' }); },
    });
    layoutListBtn.innerHTML = listIcon;

    var layoutToggle = el('div', { class: 'flex gap-1' }, layoutGridBtn, layoutListBtn);

    var sortSelect = el('select', {
        class: 'bg-kcd-surface border border-kcd-border rounded-lg pl-2 pr-6 py-1 text-xs text-kcd-text-secondary focus:outline-none appearance-none',
        onChange: function (e) {
            setState('filters', { ...state.filters, sort: e.target.value });
        },
    });

    function populateSortOptions() {
        sortSelect.textContent = '';
        var sortKeys = ['name-asc', 'name-desc', 'category-asc', 'category-desc', 'price-asc', 'price-desc', 'ingredients-asc', 'ingredients-desc'];
        sortKeys.forEach(function (key) {
            var opt = el('option', { value: key }, getSortLabel(key));
            sortSelect.appendChild(opt);
        });
    }
    populateSortOptions();

    var headerTitle = el('span', { class: 'text-xs text-kcd-muted uppercase tracking-wide kcd-section-label' }, getText('tab.recipes'));
    var countEl = el('span', { class: 'text-xs text-kcd-muted font-normal normal-case tracking-normal' }, '');

    var recipesHeader = el('div', { class: 'flex items-center justify-between' },
        el('div', { class: 'flex items-center gap-2' },
            headerTitle,
            el('span', { class: 'text-kcd-muted' }, '·'),
            countEl
        ),
        el('div', { class: 'flex items-center gap-2' },
            sortSelect,
            layoutToggle
        )
    );

    var container = el('div', { class: '' });

    var wrapper = el('div', { class: 'bg-kcd-surface rounded-lg p-3 mb-3' }, recipesHeader);
    outerContainer.appendChild(wrapper);
    outerContainer.appendChild(container);

    var root = outerContainer;

    var loadingEl = el('div', { class: 'flex flex-col items-center justify-center py-20 gap-4' },
        el('div', { class: 'kcd-spinner' }),
        el('p', { class: 'text-sm text-kcd-muted', id: 'kcd-loading-text' }, getText('loading.text'))
    );

    var errorEl = el('div', { class: 'flex flex-col items-center justify-center py-20 gap-4' },
        el('p', { class: 'text-sm text-red-400 font-medium', id: 'kcd-error-text' }, getText('error.loadFailed')),
        el('button', {
            class: 'px-5 py-2 bg-kcd-gold text-kcd-bg rounded-lg text-sm font-medium hover:opacity-90 transition-opacity',
            onClick: function () { window.location.reload(); },
            id: 'kcd-retry-btn',
        }, getText('error.retry'))
    );

    var emptyEl = el('div', { class: 'flex flex-col items-center justify-center py-20 gap-2' },
        el('p', { class: 'text-sm text-kcd-muted font-medium', id: 'kcd-empty-text' }, getText('filter.noResults')),
        el('p', { class: 'text-xs text-kcd-muted/70', id: 'kcd-empty-hint' }, getText('filter.noResultsHint'))
    );

    var cardsBuilt = false;
    var currentMode = null;

    function clearContainer() {
        while (container.firstChild) container.removeChild(container.firstChild);
    }

    function buildAllCards() {
        var recipes = state.recipes;
        for (var i = 0; i < recipes.length; i++) {
            var recipe = recipes[i];
            var key = recipe.id;
            var card = buildRecipeCard(recipe, function () { return state.language; });
            card.root.classList.add('hidden');
            container.appendChild(card.root);
            cardMap.set(key, card);
        }
        cardsBuilt = true;
    }

    function render() {
        if (state.recipes === null) {
            if (currentMode !== 'error') {
                cardMap.forEach(function (entry) { entry.root.classList.add('hidden'); });
                currentMode = 'error';
            }
            container.className = 'flex items-center justify-center py-20';
            if (!container.contains(errorEl)) container.appendChild(errorEl);
            return;
        }

        if (!state.recipes || state.recipes.length === 0) {
            if (currentMode !== 'loading') {
                currentMode = 'loading';
            }
            container.className = 'flex items-center justify-center py-20';
            if (!container.contains(loadingEl)) {
                clearContainer();
                container.appendChild(loadingEl);
            }
            return;
        }

        if (!cardsBuilt) {
            buildAllCards();
        }

        if (loadingEl.parentNode === container) loadingEl.remove();
        if (errorEl.parentNode === container) errorEl.remove();
        if (emptyEl.parentNode === container) emptyEl.remove();
        currentMode = 'cards';

        var filtered = filterRecipes(state.recipes, state.filters);
        var sorted = sortRecipes(filtered, state.filters.sort);
        countEl.textContent = getText('filter.statsShowing').replace('{0}', sorted.length).replace('{1}', state.recipes.length);

        if (sorted.length === 0) {
            cardMap.forEach(function (entry) { entry.root.classList.add('hidden'); });
            container.className = 'flex items-center justify-center py-20';
            if (!container.contains(emptyEl)) container.appendChild(emptyEl);
            currentMode = 'empty';
            return;
        }

        if (state.filters.layout === 'grid') {
            container.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start';
        } else {
            container.className = 'flex flex-col gap-4';
        }

        var visibleKeys = new Set();
        for (var i = 0; i < sorted.length; i++) {
            visibleKeys.add(sorted[i].id);
        }

        cardMap.forEach(function (entry, key) {
            if (visibleKeys.has(key)) {
                entry.root.classList.remove('hidden');
                if (entry.setLayout) entry.setLayout(state.filters.layout);
            } else {
                entry.root.classList.add('hidden');
            }
        });

        for (var i2 = 0; i2 < sorted.length; i2++) {
            var key = sorted[i2].id;
            var entry = cardMap.get(key);
            if (entry) {
                container.appendChild(entry.root);
            }
        }

        if (state.filters.layout === 'grid') {
            layoutGridBtn.className = 'p-1 rounded bg-kcd-gold text-kcd-bg focus:outline-none';
            layoutListBtn.className = 'p-1 rounded text-kcd-text-secondary hover:text-kcd-text hover:bg-kcd-hover focus:outline-none';
        } else {
            layoutListBtn.className = 'p-1 rounded bg-kcd-gold text-kcd-bg focus:outline-none';
            layoutGridBtn.className = 'p-1 rounded text-kcd-text-secondary hover:text-kcd-text hover:bg-kcd-hover focus:outline-none';
        }
        layoutGridBtn.setAttribute('aria-label', getText('filter.layoutGrid'));
        layoutListBtn.setAttribute('aria-label', getText('filter.layoutList'));
        sortSelect.value = state.filters.sort;
    }

    onState('recipes', function (recipes) {
        if (recipes && recipes.length > 0) {
            cardMap.forEach(function (entry) {
                if (entry.root.parentNode) entry.root.remove();
            });
            cardMap.clear();
            cardsBuilt = false;
            currentMode = null;
        }
        render();
    });

    onState('filters', function () {
        cardMap.forEach(function (entry) {
            if (entry.collapse) entry.collapse();
        });
        render();
    });

    onState('language', function (lang) {
        cardMap.forEach(function (card) {
            if (card.update) card.update(lang);
        });
        headerTitle.textContent = getText('tab.recipes');
        if (loadingEl.querySelector('#kcd-loading-text')) {
            loadingEl.querySelector('#kcd-loading-text').textContent = getText('loading.text');
        }
        if (errorEl.querySelector('#kcd-error-text')) {
            errorEl.querySelector('#kcd-error-text').textContent = getText('error.loadFailed');
        }
        if (errorEl.querySelector('#kcd-retry-btn')) {
            errorEl.querySelector('#kcd-retry-btn').textContent = getText('error.retry');
        }
        if (emptyEl.querySelector('#kcd-empty-text')) {
            emptyEl.querySelector('#kcd-empty-text').textContent = getText('filter.noResults');
        }
        if (emptyEl.querySelector('#kcd-empty-hint')) {
            emptyEl.querySelector('#kcd-empty-hint').textContent = getText('filter.noResultsHint');
        }
        populateSortOptions();
        sortSelect.value = state.filters.sort;
        render();
    });

    render();

    return { root: root, update: render };
}
