import { state, setState, onState } from './state.js';
import { el } from './dom.js';
import { getText } from './i18n.js';

var gearSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

function ToggleSegButton(text, isActive, onClick) {
    var btn = el('button', {
        class: 'settings-toggle-seg-btn' + (isActive ? ' active' : ''),
        onClick: onClick,
    }, text);
    return btn;
}

function SettingsToggleRow(labelKey, descKey, stateKey) {
    var offBtn = ToggleSegButton(getText('settings.off'), !state.settings[stateKey], function () {
        toggleSettingsKey(stateKey, false);
    });
    var onBtn = ToggleSegButton(getText('settings.on'), state.settings[stateKey], function () {
        toggleSettingsKey(stateKey, true);
    });

    var label = el('span', { class: 'settings-option-label' }, getText(labelKey));
    var desc = el('span', { class: 'settings-option-desc' }, getText(descKey));
    var segment = el('div', { class: 'settings-toggle-segment' }, offBtn, onBtn);

    function update(val) {
        offBtn.className = 'settings-toggle-seg-btn' + (val ? '' : ' active');
        onBtn.className = 'settings-toggle-seg-btn' + (val ? ' active' : '');
        offBtn.textContent = getText('settings.off');
        onBtn.textContent = getText('settings.on');
    }

    return {
        root: el('div', { class: 'settings-option' }, label, segment, desc),
        update: update,
    };
}

function toggleSettingsKey(key, val) {
    var settings = Object.assign({}, state.settings);
    settings[key] = val;
    setState('settings', settings);
    localStorage.setItem('kcd2-' + key, String(val));
}

var gearBtnClass = 'p-2 rounded text-kcd-muted hover:text-kcd-gold hover:bg-kcd-hover transition-colors focus:outline-none';

function buildSettings() {
    var mediaControlsRow = SettingsToggleRow('settings.mediaControls', 'settings.mediaControlsDesc', 'mediaControls');
    var autoAdvanceRow = SettingsToggleRow('settings.autoAdvance', 'settings.autoAdvanceDesc', 'autoAdvance');

    // ---- Delay input row ----
    var delayInput = el('input', {
        type: 'number',
        class: 'settings-delay-input',
        min: '0',
        max: '5000',
        step: '50',
        value: String(state.settings.autoAdvanceDelay),
        onInput: function () {
            var val = parseInt(delayInput.value, 10);
            if (isNaN(val) || val < 0) return;
            if (val > 5000) delayInput.value = '5000';
        },
        onBlur: function () { saveDelay(); },
        onKeydown: function (e) { if (e.key === 'Enter') { saveDelay(); delayInput.blur(); } },
    });

    function saveDelay() {
        var val = parseInt(delayInput.value, 10);
        if (isNaN(val) || val < 0) val = 300;
        if (val > 5000) val = 5000;
        delayInput.value = String(val);
        toggleSettingsKey('autoAdvanceDelay', val);
    }

    var delayResetBtn = el('button', {
        class: 'settings-delay-reset-btn',
        onClick: function () {
            delayInput.value = '300';
            toggleSettingsKey('autoAdvanceDelay', 300);
        },
    }, getText('settings.autoAdvanceDelayReset'));

    var delayLabel = el('span', { class: 'settings-option-label' }, getText('settings.autoAdvanceDelay'));
    var delayDesc = el('span', { class: 'settings-option-desc' }, getText('settings.autoAdvanceDelayDesc'));
    var delayInputRow = el('div', { class: 'settings-delay-input-row' }, delayInput, delayResetBtn);

    function updateDelay(val) {
        delayInput.value = String(val);
    }

    var delayOption = el('div', { class: 'settings-option' },
        delayLabel, delayInputRow, delayDesc
    );

    var timedStepsRow = SettingsToggleRow('settings.timedStepsOnly', 'settings.timedStepsOnlyDesc', 'timedStepsOnly');

    // ---- Theme row ----
    var darkBtn = ToggleSegButton(getText('settings.themeDark'), state.theme === 'dark', function () {
        setState('theme', 'dark');
    });
    var systemBtn = ToggleSegButton(getText('settings.themeSystem'), state.theme === 'system', function () {
        setState('theme', 'system');
    });
    var lightBtn = ToggleSegButton(getText('settings.themeLight'), state.theme === 'light', function () {
        setState('theme', 'light');
    });

    var themeLabel = el('span', { class: 'settings-option-label' }, getText('settings.theme'));
    var themeDesc = el('span', { class: 'settings-option-desc' }, getText('settings.themeDesc'));
    var themeSegment = el('div', { class: 'settings-toggle-segment' }, darkBtn, systemBtn, lightBtn);

    function updateThemeToggle(theme) {
        darkBtn.className = 'settings-toggle-seg-btn' + (theme === 'dark' ? ' active' : '');
        systemBtn.className = 'settings-toggle-seg-btn' + (theme === 'system' ? ' active' : '');
        lightBtn.className = 'settings-toggle-seg-btn' + (theme === 'light' ? ' active' : '');
        darkBtn.textContent = getText('settings.themeDark');
        systemBtn.textContent = getText('settings.themeSystem');
        lightBtn.textContent = getText('settings.themeLight');
    }

    var themeOption = el('div', { class: 'settings-option settings-theme-row' },
        themeLabel, themeSegment, themeDesc
    );

    // ---- Popover ----
    var titleEl = el('div', { class: 'settings-title' }, getText('settings.title'));

    var popoverContent = el('div', { class: 'settings-popover-content' },
        titleEl,
        mediaControlsRow.root,
        autoAdvanceRow.root,
        delayOption,
        timedStepsRow.root,
        el('div', { class: 'settings-separator' }),
        themeOption
    );

    var popover = el('div', {
        class: 'settings-popover hidden',
    }, popoverContent);

    // ---- Gear buttons ----
    var gearBtnDesktop = el('button', {
        class: gearBtnClass,
        'aria-label': getText('settings.title'),
        onClick: function (e) {
            e.stopPropagation();
            togglePopover(gearBtnDesktop);
        },
        html: gearSvg,
    });

    var gearBtnMobile = el('button', {
        class: 'header-lang-trigger-mobile',
        'aria-label': getText('settings.title'),
        onClick: function (e) {
            e.stopPropagation();
            togglePopover(gearBtnMobile);
        },
        html: gearSvg,
    });

    // ---- Outside click ----
    var settingsClickHandler = function (e) {
        var langDropdowns = document.querySelectorAll('.header-lang-dropdown');
        for (var d = 0; d < langDropdowns.length; d++) {
            if (!langDropdowns[d].parentElement.contains(e.target)) {
                langDropdowns[d].classList.add('hidden');
            }
        }
        if (!popover.contains(e.target) && !gearBtnDesktop.contains(e.target) && !gearBtnMobile.contains(e.target)) {
            popover.classList.add('hidden');
        }
    };
    document.removeEventListener('click', settingsClickHandler);
    document.addEventListener('click', settingsClickHandler);

    function togglePopover(gearEl) {
        if (popover.classList.contains('hidden')) {
            var rect = gearEl.getBoundingClientRect();
            var topVal = rect.bottom + 8;
            var rightVal = window.innerWidth - rect.right;
            var popoverWidth = popover.offsetWidth || 300;
            var popoverHeight = popover.offsetHeight || 200;
            if (rightVal < 8) rightVal = 8;
            if (rightVal + popoverWidth > window.innerWidth - 8) rightVal = 8;
            if (topVal + popoverHeight > window.innerHeight - 8) {
                topVal = Math.max(8, rect.top - popoverHeight - 8);
            }
            popover.style.top = topVal + 'px';
            popover.style.right = rightVal + 'px';
            popover.classList.remove('hidden');
        } else {
            popover.classList.add('hidden');
        }
    }

    // ---- State subscriptions ----
    onState('settings', function (settings) {
        mediaControlsRow.update(settings.mediaControls);
        autoAdvanceRow.update(settings.autoAdvance);
        updateDelay(settings.autoAdvanceDelay);
        timedStepsRow.update(settings.timedStepsOnly);
    });

    onState('theme', updateThemeToggle);

    onState('language', function () {
        titleEl.textContent = getText('settings.title');
        mediaControlsRow.root.querySelector('.settings-option-label').textContent = getText('settings.mediaControls');
        mediaControlsRow.root.querySelector('.settings-option-desc').textContent = getText('settings.mediaControlsDesc');
        autoAdvanceRow.root.querySelector('.settings-option-label').textContent = getText('settings.autoAdvance');
        autoAdvanceRow.root.querySelector('.settings-option-desc').textContent = getText('settings.autoAdvanceDesc');
        delayLabel.textContent = getText('settings.autoAdvanceDelay');
        delayDesc.textContent = getText('settings.autoAdvanceDelayDesc');
        delayResetBtn.textContent = getText('settings.autoAdvanceDelayReset');
        timedStepsRow.root.querySelector('.settings-option-label').textContent = getText('settings.timedStepsOnly');
        timedStepsRow.root.querySelector('.settings-option-desc').textContent = getText('settings.timedStepsOnlyDesc');
        themeLabel.textContent = getText('settings.theme');
        themeDesc.textContent = getText('settings.themeDesc');
        updateThemeToggle(state.theme);
        gearBtnDesktop.setAttribute('aria-label', getText('settings.title'));
        gearBtnMobile.setAttribute('aria-label', getText('settings.title'));
    });

    updateThemeToggle(state.theme);

    return { gearBtnDesktop: gearBtnDesktop, gearBtnMobile: gearBtnMobile, popover: popover };
}

export { buildSettings };
