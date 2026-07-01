import { state, setState, onState } from './state.js';
import { el } from './dom.js';
import { getText } from './i18n.js';

var FLAG_BASE = 'assets/img/flags/';
var FLAGS = {
    de: FLAG_BASE + 'germany-min.png',
    it: FLAG_BASE + 'italy-min.png',
    en: FLAG_BASE + 'united-kingdom-usa-mix-min.png',
};
var NATIVE_NAMES = {
    de: 'Deutsch',
    it: 'Italiano',
    en: 'English',
};
var LANGS = ['de', 'it', 'en'];

var chevronDownSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

export function buildHeader() {
    // ---- Desktop language ----
    var langFlagImg = el('img', {
        src: FLAGS[state.language],
        alt: NATIVE_NAMES[state.language],
        class: 'header-lang-flag',
    });
    var langChevron = el('span', { class: 'header-lang-chevron', html: chevronDownSvg });

    var desktopDropdown = buildLangDropdown();
    var langTriggerDesktop = el('button', {
        class: 'header-lang-trigger',
        'aria-label': getText('header.language'),
            onClick: function (e) {
                e.stopPropagation();
                desktopDropdown.classList.toggle('hidden');
                mobileDropdown.classList.add('hidden');
                var sp = document.querySelector('.settings-popover');
                if (sp) sp.classList.add('hidden');
            },
    }, langFlagImg, langChevron);

    // ---- Mobile language ----
    var mobileFlagImg = el('img', {
        src: FLAGS[state.language],
        alt: NATIVE_NAMES[state.language],
        class: 'header-lang-flag',
    });
    var mobileChevron = el('span', { class: 'header-lang-chevron', html: chevronDownSvg });

    var mobileDropdown = buildLangDropdown();
    var langTriggerMobile = el('button', {
        class: 'header-lang-trigger-mobile',
        'aria-label': getText('header.language'),
            onClick: function (e) {
                e.stopPropagation();
                mobileDropdown.classList.toggle('hidden');
                desktopDropdown.classList.add('hidden');
                var sp = document.querySelector('.settings-popover');
                if (sp) sp.classList.add('hidden');
            },
    }, mobileFlagImg, mobileChevron);

    // ---- Theme toggle (desktop) ----
    var themeToggle = el('button', {
        class: 'p-2 rounded text-kcd-muted hover:text-kcd-gold hover:bg-kcd-hover transition-colors focus:outline-none',
        'aria-label': getText('header.themeDark'),
        onClick: function () {
            var next = state.theme === 'dark' ? 'light' : state.theme === 'light' ? 'system' : 'dark';
            setState('theme', next);
        },
    });

    // ---- Logo ----
    var titleSpan = el('span', { class: 'font-serif text-[1.55rem] leading-[1.2] md:text-[2.8rem] md:leading-[1.1] text-kcd-gold' }, getText('app.title'));
    var subtitleSpan = el('span', { class: 'text-sm text-kcd-text-secondary sm:text-base' }, getText('app.subtitle'));

    var titleRow = el('div', { class: 'flex items-center gap-3' },
        titleSpan
    );

    var logo = el('div', { class: 'py-0.5' }, titleRow, subtitleSpan);

    // ---- Assembly ----
    var gearSlot = el('span', {});
    var controls = el('div', { class: 'header-controls' },
        el('div', { class: 'header-lang-wrapper' }, langTriggerDesktop, desktopDropdown),
        themeToggle,
        gearSlot
    );

    var gearSlotMobile = el('span', {});
    var mobileActions = el('div', { class: 'header-mobile-actions' },
        el('div', { class: 'header-lang-wrapper' }, langTriggerMobile, mobileDropdown),
        gearSlotMobile
    );

    var root = el('header', {
        class: 'mb-4 flex items-start justify-between relative',
    }, logo, controls, mobileActions);

    // ---- Outside-click handlers ----
    var headerClickHandler = function (e) {
        if (!desktopDropdown.parentElement.contains(e.target)) {
            desktopDropdown.classList.add('hidden');
        }
        if (!mobileDropdown.parentElement.contains(e.target)) {
            mobileDropdown.classList.add('hidden');
        }
    };
    document.removeEventListener('click', headerClickHandler);
    document.addEventListener('click', headerClickHandler);

    // ---- Update functions ----
    function updateLanguage(lang) {
        langFlagImg.src = FLAGS[lang];
        langFlagImg.alt = NATIVE_NAMES[lang];
        mobileFlagImg.src = FLAGS[lang];
        mobileFlagImg.alt = NATIVE_NAMES[lang];
        syncDropdownActive(desktopDropdown, lang);
        syncDropdownActive(mobileDropdown, lang);
        titleSpan.textContent = getText('app.title');
        subtitleSpan.textContent = getText('app.subtitle');
        updateTheme(state.theme);
    }

    function updateTheme(theme) {
        var resolved = theme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme;
        var icon = resolved === 'dark'
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
        themeToggle.innerHTML = icon;
        themeToggle.setAttribute('aria-label', resolved === 'dark' ? getText('header.themeLight') : getText('header.themeDark'));
    }

    updateLanguage(state.language);
    updateTheme(state.theme);

    onState('language', updateLanguage);
    onState('theme', updateTheme);

    return { root: root, gearSlot: gearSlot, gearSlotMobile: gearSlotMobile, update: function () {} };
}

function buildLangDropdown() {
    var dd = el('div', { class: 'header-lang-dropdown hidden' });
    for (var i = 0; i < LANGS.length; i++) {
        (function (lang) {
            var img = el('img', { src: FLAGS[lang], alt: NATIVE_NAMES[lang], class: 'header-lang-flag' });
            var opt = el('button', {
                class: 'header-lang-option' + (lang === state.language ? ' header-lang-option--active' : ''),
                'data-lang': lang,
                onClick: function (e) {
                    e.stopPropagation();
                    setState('language', lang);
                    dd.classList.add('hidden');
                },
            }, img, el('span', {}, NATIVE_NAMES[lang]));
            dd.appendChild(opt);
        })(LANGS[i]);
    }
    return dd;
}

function syncDropdownActive(dropdown, lang) {
    dropdown.querySelectorAll('.header-lang-option').forEach(function (opt) {
        var optLang = opt.getAttribute('data-lang');
        if (optLang === lang) {
            opt.classList.add('header-lang-option--active');
        } else {
            opt.classList.remove('header-lang-option--active');
        }
    });
}
