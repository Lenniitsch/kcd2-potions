import { state, setState, onState } from './state.js';
import { el } from './dom.js';
import { getText } from './i18n.js';

var BTN_CLASS = 'px-3 py-1 rounded text-sm font-medium transition-colors focus:outline-none';

export function buildHeader() {
    var langDe = el('button', {
        class: BTN_CLASS,
        'aria-label': 'Deutsch',
        onClick: function () { setState('language', 'de'); },
    }, 'DE');

    var langIt = el('button', {
        class: BTN_CLASS,
        'aria-label': 'Italiano',
        onClick: function () { setState('language', 'it'); },
    }, 'IT');

    var langEn = el('button', {
        class: BTN_CLASS,
        'aria-label': 'English',
        onClick: function () { setState('language', 'en'); },
    }, 'EN');

    var themeToggle = el('button', {
        class: 'p-2 rounded text-kcd-muted hover:text-kcd-gold hover:bg-kcd-hover transition-colors focus:outline-none',
        'aria-label': getText('header.themeDark'),
        onClick: function () {
            setState('theme', state.theme === 'dark' ? 'light' : 'dark');
        },
    });

    var menuBtn = el('button', {
        class: 'p-2 rounded text-kcd-text-secondary hover:text-kcd-gold hover:bg-kcd-hover transition-colors focus:outline-none sm:hidden',
        'aria-label': 'Menu',
        'aria-expanded': 'false',
        onClick: function (e) {
            e.stopPropagation();
            var expanded = menuBtn.getAttribute('aria-expanded') === 'true';
            if (expanded) {
                closeMenu();
            } else {
                openMenu();
            }
        },
    });
    menuBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';

    var mobileLangDe = el('button', {
        class: 'w-full px-3 py-2 rounded text-sm text-left border border-transparent transition-colors focus:outline-none',
        onClick: function () { setState('language', 'de'); closeMenu(); },
    }, 'Deutsch');

    var mobileLangIt = el('button', {
        class: 'w-full px-3 py-2 rounded text-sm text-left border border-transparent transition-colors focus:outline-none',
        onClick: function () { setState('language', 'it'); closeMenu(); },
    }, 'Italiano');

    var mobileLangEn = el('button', {
        class: 'w-full px-3 py-2 rounded text-sm text-left border border-transparent transition-colors focus:outline-none',
        onClick: function () { setState('language', 'en'); closeMenu(); },
    }, 'English');

    var mobileThemeBtn = el('button', {
        class: 'w-full px-3 py-2 rounded text-sm text-left flex items-center gap-2 transition-colors focus:outline-none',
        onClick: function () {
            setState('theme', state.theme === 'dark' ? 'light' : 'dark');
            closeMenu();
        },
    });

    var menuDropdown = el('div', {
        class: 'absolute right-0 top-full mt-2 bg-kcd-elevated border border-kcd-border rounded-lg p-2 shadow-lg z-50 hidden min-w-[180px] sm:hidden',
    },
        el('div', { class: 'flex flex-col gap-0.5' },
            mobileLangDe, mobileLangIt, mobileLangEn
        ),
        el('div', { class: 'border-t border-kcd-border mt-2 pt-2' },
            mobileThemeBtn
        )
    );

    function openMenu() {
        menuDropdown.classList.remove('hidden');
        menuBtn.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
        menuDropdown.classList.add('hidden');
        menuBtn.setAttribute('aria-expanded', 'false');
    }

    document.addEventListener('click', function (e) {
        if (!menuBtn.contains(e.target) && !menuDropdown.contains(e.target)) {
            closeMenu();
        }
    });

    var titleSpan = el('span', { class: 'font-serif text-[1.55rem] leading-[1.2] md:text-[2.8rem] md:leading-[1.1] text-kcd-gold' }, getText('app.title'));
    var subtitleSpan = el('span', { class: 'text-sm text-kcd-text-secondary sm:text-base' }, getText('app.subtitle'));

    var titleRow = el('div', { class: 'flex items-center gap-3' },
        titleSpan,
        el('span', { class: 'kcd-title-ornament kcd-title-ornament-right hidden md:block' })
    );

    var logo = el('div', { class: 'py-0.5' },
        titleRow,
        subtitleSpan
    );

    var langGroup = el('div', { class: 'flex items-center gap-0.5 bg-kcd-surface rounded-lg p-0.5' },
        langDe, langIt, langEn
    );

    var controls = el('div', { class: 'hidden sm:flex items-center gap-2 mt-[9px]' },
        langGroup,
        themeToggle
    );

    var root = el('header', {
        class: 'mb-4 flex items-center sm:items-start justify-between relative',
    }, logo, controls, menuBtn, menuDropdown);

    function updateLanguage(lang) {
        langDe.className = BTN_CLASS +
            (lang === 'de' ? ' bg-kcd-gold text-kcd-bg' : ' text-kcd-text-secondary hover:text-kcd-text');
        langIt.className = BTN_CLASS +
            (lang === 'it' ? ' bg-kcd-gold text-kcd-bg' : ' text-kcd-text-secondary hover:text-kcd-text');
        langEn.className = BTN_CLASS +
            (lang === 'en' ? ' bg-kcd-gold text-kcd-bg' : ' text-kcd-text-secondary hover:text-kcd-text');
        titleSpan.textContent = getText('app.title');
        subtitleSpan.textContent = getText('app.subtitle');

        var mobileBase = 'w-full px-3 py-2 rounded text-sm text-left border transition-colors focus:outline-none';
        mobileLangDe.className = mobileBase +
            (lang === 'de' ? ' border-kcd-gold text-kcd-gold bg-kcd-hover' : ' border-transparent text-kcd-text-secondary hover:text-kcd-text hover:bg-kcd-hover');
        mobileLangIt.className = mobileBase +
            (lang === 'it' ? ' border-kcd-gold text-kcd-gold bg-kcd-hover' : ' border-transparent text-kcd-text-secondary hover:text-kcd-text hover:bg-kcd-hover');
        mobileLangEn.className = mobileBase +
            (lang === 'en' ? ' border-kcd-gold text-kcd-gold bg-kcd-hover' : ' border-transparent text-kcd-text-secondary hover:text-kcd-text hover:bg-kcd-hover');
        updateTheme(state.theme);
    }

    function updateTheme(theme) {
        var icon = theme === 'dark'
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
        themeToggle.innerHTML = icon;
        themeToggle.setAttribute('aria-label', theme === 'dark' ? getText('header.themeLight') : getText('header.themeDark'));

        var mobileIcon = theme === 'dark'
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
        mobileThemeBtn.innerHTML = mobileIcon + '<span>' + (theme === 'dark' ? getText('header.themeLight') : getText('header.themeDark')) + '</span>';
        mobileThemeBtn.className = 'w-full px-3 py-2 rounded text-sm text-left flex items-center gap-2 transition-colors focus:outline-none text-kcd-text-secondary hover:text-kcd-text hover:bg-kcd-hover';
    }

    updateLanguage(state.language);
    updateTheme(state.theme);

    onState('language', updateLanguage);
    onState('theme', updateTheme);

    return { root: root, update: function () {} };
}
