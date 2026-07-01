import { state, setState, onState } from './state.js';
import { el } from './dom.js';
import { setLanguage, CATEGORIES, SORT_OPTIONS } from './i18n.js';
import { init as initStore, getAll, setLang } from './recipes.js';
import { buildHeader } from './ui-header.js';
import { buildTabs } from './ui-tabs.js';
import { buildFilter } from './ui-filter.js';
import { buildRecipeList } from './ui-recipe-list.js';
import { buildMaps } from './ui-maps.js';
import { buildSettings } from './ui-settings.js';

async function init() {
    var app = document.getElementById('app');

    restoreSavedState();

    restoreStateFromURL();

    setLanguage(state.language);

    onState('language', function (lang) {
        setLang(lang);
        setLanguage(lang);
        document.documentElement.setAttribute('lang', lang);
        localStorage.setItem('kcd2-lang', lang);
    });

    onState('theme', function (theme) {
        var resolved = resolveTheme(theme);
        document.documentElement.setAttribute('data-theme', resolved);
        localStorage.setItem('kcd2-theme', theme);
        var meta = document.getElementById('theme-color-meta');
        if (meta) {
            meta.setAttribute('content', resolved === 'dark' ? '#000713' : '#f1ecd8');
        }
    });

    var systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemThemeQuery.addEventListener('change', function () {
        if (state.theme === 'system') {
            var resolved = resolveTheme('system');
            document.documentElement.setAttribute('data-theme', resolved);
            var meta = document.getElementById('theme-color-meta');
            if (meta) meta.setAttribute('content', resolved === 'dark' ? '#000713' : '#f1ecd8');
        }
    });

    var header = buildHeader();
    var tabs = buildTabs();
    var filter = buildFilter();
    var recipeList = buildRecipeList(tabs.recipesContent);
    var maps = buildMaps(tabs.mapsContent);

    var settings = buildSettings();
    header.gearSlot.appendChild(settings.gearBtnDesktop);
    header.gearSlotMobile.appendChild(settings.gearBtnMobile);
    document.body.appendChild(settings.popover);

    var topDivider = buildOrnamentDivider();
    var ornamentDivider = buildOrnamentDivider();

    app.append(header.root, tabs.root, topDivider, filter.root, ornamentDivider, tabs.recipesContent, tabs.mapsContent);

    var footer = el('footer', { class: 'border-t border-kcd-border mt-10 pt-6 pb-16 px-6' },
        el('div', { class: 'flex justify-center items-center gap-2 text-sm text-kcd-text-muted' },
            el('span', null, 'Built with love in'),
            el('span', { class: 'inline-flex', html: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="14" viewBox="0 0 900 600"><rect width="900" height="600" fill="#039"/><g fill="#fc0" transform="translate(450,300)"><path id="eu-s" d="M0,162.5 22.041947,230.338137 -35.664619,188.411863H35.664619L-22.041947,230.338137z"/><use href="#eu-s" y="-400"/><g id="eu-s5"><use href="#eu-s" transform="rotate(30) rotate(-30,0,200)"/><use href="#eu-s" transform="rotate(60) rotate(-60,0,200)"/><use href="#eu-s" transform="rotate(90) rotate(-90,0,200)"/><use href="#eu-s" transform="rotate(120) rotate(-120,0,200)"/><use href="#eu-s" transform="rotate(150) rotate(-150,0,200)"/></g><use href="#eu-s5" transform="scale(-1,1)"/></g></svg>' })
        )
    );
    app.append(footer);

    var backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 300) {
                backToTopBtn.classList.remove('hidden');
            } else {
                backToTopBtn.classList.add('hidden');
            }
        }, { passive: true });
        backToTopBtn.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    maps.update(state.activeTab);

    onState('activeTab', function (tab) {
        var showRecipes = tab === 'recipes';
        filter.root.classList.toggle('hidden', !showRecipes);
        topDivider.classList.toggle('hidden', !showRecipes);
        ornamentDivider.classList.toggle('hidden', !showRecipes);
    });

    filter.root.classList.toggle('hidden', state.activeTab !== 'recipes');
    topDivider.classList.toggle('hidden', state.activeTab !== 'recipes');
    ornamentDivider.classList.toggle('hidden', state.activeTab !== 'recipes');

    onState('filters', pushFiltersToURL);
    onState('activeTab', pushTabToURL);

    try {
        if (!localStorage.getItem('kcd2-filterExpanded')) {
            setState('filters', { ...state.filters, filterExpanded: false });
        }
    } catch (e) {}

    try {
        await initStore('data/recipes.json', 'data/locales');
        setState('recipes', getAll());
    } catch (err) {
        setState('recipes', null);
    }
}

function restoreSavedState() {
    try {
        var stored = localStorage.getItem('kcd2-theme');
    if (stored === 'dark' || stored === 'light' || stored === 'system') {
        setState('theme', stored);
    }

    stored = localStorage.getItem('kcd2-lang');
    if (stored && /^(de|it|en)$/.test(stored)) {
        setState('language', stored);
    } else {
        var navLang = (navigator.language || '').slice(0, 2);
        if (navLang === 'de' || navLang === 'it') {
            setState('language', navLang);
        }
    }

    var filtersPatch = {};

    stored = localStorage.getItem('kcd2-layout');
    if (stored === 'grid' || stored === 'list') {
        filtersPatch.layout = stored;
    }

    stored = localStorage.getItem('kcd2-sort');
    if (stored) {
        filtersPatch.sort = stored;
    }

    stored = localStorage.getItem('kcd2-filterExpanded');
    if (stored === 'true' || stored === 'false') {
        filtersPatch.filterExpanded = stored === 'true';
    }

    if (Object.keys(filtersPatch).length > 0) {
        setState('filters', Object.assign({}, state.filters, filtersPatch));
    }

    var settings = Object.assign({}, state.settings);
    stored = localStorage.getItem('kcd2-mediaControls');
    if (stored === 'true') settings.mediaControls = true;
    stored = localStorage.getItem('kcd2-autoAdvance');
    if (stored === 'true') settings.autoAdvance = true;
    stored = localStorage.getItem('kcd2-timedStepsOnly');
    if (stored === 'true') settings.timedStepsOnly = true;
    else if (stored === 'false') settings.timedStepsOnly = false;
    setState('settings', settings);
    } catch (e) {}
}

function resolveTheme(theme) {
    if (theme === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
}

function restoreStateFromURL() {
    var params = new URLSearchParams(window.location.search);

    var tab = params.get('tab');
    if (tab === 'recipes' || tab === 'maps') {
        setState('activeTab', tab);
    }

    var search = params.get('search');
    var category = params.get('category');
    var sort = params.get('sort');
    var layout = params.get('layout');
    var ingredients = params.get('ingredients');

    var filters = Object.assign({}, state.filters);

    if (search) filters.search = search;
    if (category) {
        var foundCat = null;
        var lower = category.toLowerCase();
        var catKeys = Object.keys(CATEGORIES);
        for (var c = 0; c < catKeys.length; c++) {
            var ce = CATEGORIES[catKeys[c]];
            if (ce.de.toLowerCase() === lower || (ce.it || '').toLowerCase() === lower || (ce.en || '').toLowerCase() === lower) {
                foundCat = catKeys[c];
                break;
            }
        }
        if (foundCat) filters.category = foundCat;
    }
    if (sort && SORT_OPTIONS[sort]) filters.sort = sort;
    if (layout === 'grid' || layout === 'list') filters.layout = layout;
    if (ingredients) {
        filters.ingredients = new Set(decodeURIComponent(ingredients).split(',').filter(Boolean));
    }

    var hasUrlParams = search || category || sort || layout || ingredients;
    if (hasUrlParams) {
        setState('filters', filters);
    }
}

function pushFiltersToURL(filters) {
    var url = new URL(window.location);
    var changed = false;

    var setOrDelete = function (key, value) {
        if (value) {
            url.searchParams.set(key, value);
            changed = true;
        } else if (url.searchParams.has(key)) {
            url.searchParams.delete(key);
            changed = true;
        }
    };

    setOrDelete('search', filters.search || null);
    setOrDelete('category', filters.category !== 'all' ? filters.category : null);
    setOrDelete('sort', filters.sort !== 'name-asc' ? filters.sort : null);
    setOrDelete('layout', filters.layout !== 'grid' ? filters.layout : null);

    if (filters.ingredients && filters.ingredients.size > 0) {
        var encoded = encodeURIComponent(Array.from(filters.ingredients).join(','));
        url.searchParams.set('ingredients', encoded);
        changed = true;
    } else if (url.searchParams.has('ingredients')) {
        url.searchParams.delete('ingredients');
        changed = true;
    }

    if (changed) {
        window.history.replaceState(null, '', url);
    }

    try {
        localStorage.setItem('kcd2-layout', filters.layout);
        localStorage.setItem('kcd2-sort', filters.sort);
        localStorage.setItem('kcd2-filterExpanded', String(filters.filterExpanded));
    } catch (e) {}
}

function pushTabToURL(tab) {
    var url = new URL(window.location);

    if (tab !== 'recipes') {
        if (url.searchParams.get('tab') !== tab) {
            url.searchParams.set('tab', tab);
            window.history.replaceState(null, '', url);
        }
    } else if (url.searchParams.has('tab')) {
        url.searchParams.delete('tab');
        window.history.replaceState(null, '', url);
    }
}

function buildOrnamentDivider() {
    return el('div', { class: 'kcd-ornament-divider' },
        el('span', { class: 'kcd-ornament-line' }),
        el('span', { class: 'kcd-ornament-diamond' }),
        el('span', { class: 'kcd-ornament-line' })
    );
}

document.addEventListener('DOMContentLoaded', init);
