import { state, setState, onState } from './state.js';
import { el } from './dom.js';
import { getText, getCategoryLabel, CATEGORIES } from './i18n.js';
import { getAllIngredients, getAvailableIngredients, filterRecipes } from './recipes.js';
import { CATEGORY_ICONS, CATEGORY_COLORS } from './ui-recipe-card.js';

function debounce(fn, delay) {
    var timer;
    return function () {
        var context = this;
        var args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () { fn.apply(context, args); }, delay);
    };
}

var INPUT_CLASS = 'bg-kcd-surface border border-kcd-border rounded-lg pl-3 pr-10 py-2 text-sm text-kcd-text placeholder:text-kcd-muted w-full focus:outline-none';

var closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

export function buildFilter() {
    state.filters.filterExpanded = true;

    var clearBtn;
    var mobileToggleBtn;
    var mobileToggleText;
    var filterSectionWrapper;
    var searchInput;
    var searchClearBtn;
    var categoryPillsContainer;
    var ingredientSectionWrapper;
    var ingredientHeader;
    var ingredientLabelEl;
    var ingredientBody;
    var ingredientContainer;

    searchInput = el('input', {
        type: 'text',
        class: INPUT_CLASS,
    });

    var debouncedSearch = debounce(function (e) {
        setState('filters', { ...state.filters, search: e.target.value });
    }, 300);
    searchInput.addEventListener('input', debouncedSearch);

    searchClearBtn = el('button', {
        class: 'absolute right-2 top-1/2 -translate-y-1/2 p-1 text-kcd-muted hover:text-kcd-text rounded',
        onClick: function () {
            searchInput.value = '';
            setState('filters', { ...state.filters, search: '' });
        },
    });
    searchClearBtn.innerHTML = closeIcon;

    var searchWrapper = el('div', { class: 'relative flex-1' }, searchInput, searchClearBtn);

    categoryPillsContainer = el('div', { class: 'flex flex-wrap gap-2' });

    clearBtn = el('button', {
        class: 'filter-clear-btn',
        onClick: function (e) {
            e.stopPropagation();
            if (clearBtn.disabled) return;
            setState('filters', {
                search: '',
                category: 'all',
                ingredients: new Set(),
                sort: 'name-asc',
                layout: state.filters.layout,
                filterExpanded: state.filters.filterExpanded,
            });
        },
    });

    var searchRow = el('div', { class: 'flex items-center gap-2' },
        searchWrapper,
        clearBtn
    );

    filterSectionWrapper = el('div', {
        class: 'kcd-filter-panel bg-kcd-surface rounded-lg p-3 mb-3 flex flex-col gap-3'
    },
        searchRow,
        categoryPillsContainer
    );

    ingredientContainer = el('div', { class: 'flex flex-wrap gap-2' });

    ingredientBody = el('div', { class: 'pt-2' }, ingredientContainer);

    ingredientLabelEl = el('span', {}, getText('filter.ingredientHeader'));
    ingredientHeader = el('div', {
        class: 'flex items-center gap-1 w-full text-xs text-kcd-muted uppercase tracking-wide kcd-section-label',
    }, ingredientLabelEl);

    ingredientSectionWrapper = el('div', { class: 'border-t border-kcd-border pt-2' }, ingredientHeader, ingredientBody);

    filterSectionWrapper.appendChild(ingredientSectionWrapper);

    mobileToggleText = document.createTextNode('');

    mobileToggleBtn = el('button', {
        class: 'w-full px-3 py-2 rounded-lg text-sm text-kcd-text-secondary hover:text-kcd-text bg-kcd-surface transition-colors mb-2 focus:outline-none',
        onClick: function () {
            setState('filters', { ...state.filters, filterExpanded: !state.filters.filterExpanded });
        },
    });
    mobileToggleBtn.appendChild(mobileToggleText);

    var root = el('div', { class: 'mb-4' },
        mobileToggleBtn,
        filterSectionWrapper
    );

    function renderCategoryPills(f) {
        categoryPillsContainer.textContent = '';

        var allSelected = f.category === 'all';
        var allPill = el('button', {
            class: 'kcd-tag ' + (allSelected ? 'kcd-tag-selected' : 'kcd-tag-normal') + ' focus:outline-none',
            onClick: function () { setState('filters', { ...state.filters, category: 'all' }); },
        }, getText('filter.categoryAll'));
        categoryPillsContainer.appendChild(allPill);

        var categories = Object.keys(CATEGORIES);
        categories.forEach(function (cat) {
            var isSelected = f.category === cat;
            var catColor = CATEGORY_COLORS[cat] || 'kcd-gold';
            var catIcon = CATEGORY_ICONS[cat] || '';
            var pillEl = el('button', {
                class: 'kcd-tag focus:outline-none',
                style: isSelected ? {
                    background: 'var(--' + catColor + '-bg)',
                    color: 'var(--' + catColor + ')',
                    borderColor: 'var(--kcd-gold-dim)',
                } : {
                    background: 'var(--kcd-hover)',
                    color: 'var(--' + catColor + ')',
                    borderColor: 'transparent',
                    opacity: '0.65',
                },
                onClick: function () {
                    if (isSelected) {
                        setState('filters', { ...state.filters, category: 'all' });
                    } else {
                        setState('filters', { ...state.filters, category: cat });
                    }
                },
            });
            pillEl.innerHTML = catIcon + ' ' + getCategoryLabel(cat);
            categoryPillsContainer.appendChild(pillEl);
        });
    }

    function toggleIngredient(id) {
        var newSet = new Set(state.filters.ingredients);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setState('filters', { ...state.filters, ingredients: newSet });
    }

    function renderIngredientTags(filters, recipes, lang) {
        ingredientContainer.textContent = '';

        if (!recipes || recipes.length === 0) return;

        var allIngredients = getAllIngredients(recipes);

        var hasOtherFilters = filters.search !== '' || filters.category !== 'all';
        var hasSelectedIngredients = filters.ingredients && filters.ingredients.size > 0;

        var availableIngredients;
        if (!hasOtherFilters && !hasSelectedIngredients) {
            availableIngredients = new Set(allIngredients.keys());
        } else {
            var filtersWithoutIngredients = { ...filters, ingredients: new Set() };
            var filtered = filterRecipes(recipes, filtersWithoutIngredients);
            availableIngredients = getAvailableIngredients(recipes, filtered);
        }

        var sortedIds = Array.from(allIngredients.keys()).sort(function (a, b) {
            var mapA = allIngredients.get(a);
            var mapB = allIngredients.get(b);
            var nameA = (mapA[lang] || mapA.de || a).toLowerCase();
            var nameB = (mapB[lang] || mapB.de || b).toLowerCase();
            return nameA.localeCompare(nameB);
        });

        var disabledTooltip = getText('misc.ingredientDisabled');
        var canShowTooltip = CSS.supports('selector(:has(*))');

        sortedIds.forEach(function (id) {
            var isSelected = filters.ingredients && filters.ingredients.has(id);
            var isDisabled = !isSelected && !availableIngredients.has(id);

            var tagClass;
            if (isSelected) {
                tagClass = 'kcd-tag kcd-tag-selected';
            } else if (isDisabled) {
                tagClass = 'kcd-tag kcd-tag-disabled';
            } else {
                tagClass = 'kcd-tag kcd-tag-normal';
            }

            var ingData = allIngredients.get(id);
            var name = ingData[lang] || ingData.de || id;

            if (isDisabled && canShowTooltip) {
                ingredientContainer.appendChild(el('span', {
                    class: tagClass + ' relative',
                    title: disabledTooltip,
                },
                    el('span', { html: name }),
                    el('span', { class: 'kcd-tooltip' }, disabledTooltip)
                ));
            } else if (isDisabled) {
                ingredientContainer.appendChild(el('span', {
                    class: tagClass,
                    title: disabledTooltip,
                }, name));
            } else {
                ingredientContainer.appendChild(el('button', {
                    class: tagClass + ' focus:outline-none',
                    'data-ingredient': id,
                    onClick: function () {
                        toggleIngredient(id);
                    },
                }, name));
            }
        });
    }

    function updateFilterUI(filters) {
        var f = filters || state.filters;
        var recipes = state.recipes || [];
        var lang = state.language;

        var mobileExpanded = f.filterExpanded;
        filterSectionWrapper.classList.toggle('hidden', !mobileExpanded);

        mobileToggleText.textContent = f.filterExpanded ? getText('filter.collapse') : getText('filter.expand');

        searchInput.placeholder = getText('filter.searchPlaceholder');
        if (searchInput.value !== f.search) {
            searchInput.value = f.search;
        }
        searchClearBtn.classList.toggle('hidden', !f.search);

        renderCategoryPills(f);

        ingredientLabelEl.textContent = getText('filter.ingredientHeader');

        renderIngredientTags(f, recipes, lang);

        var activeCount = 0;
        if (f.search) activeCount++;
        if (f.category !== 'all') activeCount++;
        if (f.ingredients && f.ingredients.size > 0) activeCount++;

        if (activeCount > 0) {
            clearBtn.disabled = false;
        } else {
            clearBtn.disabled = true;
        }

        clearBtn.textContent = getText('filter.clearFilters');
    }

    onState('filters', updateFilterUI);
    onState('language', function () { updateFilterUI(state.filters); });
    onState('recipes', function () {
        updateFilterUI(state.filters);
    });

    updateFilterUI(state.filters);

    return { root: root, update: function () { updateFilterUI(state.filters); } };
}
