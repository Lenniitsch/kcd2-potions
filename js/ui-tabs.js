import { state, setState, onState } from './state.js';
import { el } from './dom.js';
import { getText } from './i18n.js';

var TAB_CLASS = 'px-5 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none';

export function buildTabs() {
    var recipesTab = el('button', {
        class: TAB_CLASS,
        onClick: function () { setState('activeTab', 'recipes'); },
    });

    var mapsTab = el('button', {
        class: TAB_CLASS,
        onClick: function () { setState('activeTab', 'maps'); },
    });

    var tabBar = el('div', { class: 'flex gap-1 bg-kcd-surface rounded-lg p-1 mb-4' },
        recipesTab, mapsTab
    );

    var recipesContent = el('div', { id: 'tab-recipes', class: '' });
    var mapsContent = el('div', { id: 'tab-maps', class: 'hidden' });

    function update(tab) {
        recipesTab.className = TAB_CLASS +
            (tab === 'recipes' ? ' bg-kcd-gold text-kcd-bg' : ' text-kcd-text-secondary hover:text-kcd-text hover:bg-kcd-hover');

        mapsTab.className = TAB_CLASS +
            (tab === 'maps' ? ' bg-kcd-gold text-kcd-bg' : ' text-kcd-text-secondary hover:text-kcd-text hover:bg-kcd-hover');

        recipesTab.textContent = getText('tab.recipes');
        mapsTab.textContent = getText('tab.maps');

        recipesContent.className = tab === 'recipes' ? '' : 'hidden';
        mapsContent.className = tab === 'maps' ? '' : 'hidden';
    }

    update(state.activeTab);

    onState('activeTab', update);
    onState('language', function () { update(state.activeTab); });

    return {
        root: tabBar,
        recipesContent: recipesContent,
        mapsContent: mapsContent,
        update: update,
    };
}
