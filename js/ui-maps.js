import { state, onState } from './state.js';
import { el } from './dom.js';
import { getText } from './i18n.js';

var zoomistInstances = {};
var mapsBuilt = false;

export function buildMaps(container) {
    var mapDescEl = el('p', { class: 'text-sm text-kcd-text-secondary mb-6' }, getText('maps.description'));

    var divider = function () {
        return el('div', { class: 'kcd-ornament-divider' },
            el('span', { class: 'kcd-ornament-line' }),
            el('span', { class: 'kcd-ornament-diamond' }),
            el('span', { class: 'kcd-ornament-line' })
        );
    };

    var root = el('div', { class: 'flex flex-col' },
        mapDescEl,
        divider(),
        el('div', { class: '' },
            el('h2', { class: 'font-serif text-xl text-kcd-gold font-bold mb-1' }, getText('maps.districts')),
            el('p', { class: 'text-sm text-kcd-text-secondary mb-3' }, getText('maps.districtsDesc')),
            el('div', { class: 'zoomist-container' },
                el('div', { class: 'zoomist-wrapper' },
                    el('div', { class: 'zoomist-image' },
                        el('img', { src: 'assets/img/maps/map-kuttenberg-districts.webp', width: '1929', height: '1929', alt: getText('maps.districts') })
                    )
                )
            )
        ),
        divider(),
        el('div', { class: '' },
            el('h2', { class: 'font-serif text-xl text-kcd-gold font-bold mb-1' }, getText('maps.underground')),
            el('p', { class: 'text-sm text-kcd-text-secondary mb-3' }, getText('maps.undergroundDesc')),
            el('div', { class: 'zoomist-container' },
                el('div', { class: 'zoomist-wrapper' },
                    el('div', { class: 'zoomist-image' },
                        el('img', { src: 'assets/img/maps/map-kuttenberg-underground.webp', width: '2048', height: '1024', alt: getText('maps.underground') })
                    )
                )
            )
        )
    );

    container.appendChild(root);

    function initMaps() {
        if (mapsBuilt) return;
        if (typeof Zoomist === 'undefined') {
            container.querySelectorAll('.zoomist-container').forEach(function (el) {
                el.innerHTML = '<div class="text-sm text-kcd-text-secondary text-center py-8">' + getText('maps.unavailable') + '</div>';
            });
            return;
        }

        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                var districtEl = root.querySelectorAll('.zoomist-container')[0];
                var undergroundEl = root.querySelectorAll('.zoomist-container')[1];

                if (districtEl && districtEl.offsetParent) {
                    zoomistInstances.districts = new Zoomist(districtEl, {
                        maxScale: 4,
                        bounds: true,
                        slider: true,
                        zoomer: true,
                        wheelable: false,
                        pinchable: true,
                        initScale: 1,
                        wheelReleaseOnMinMax: true,
                    });
                }

                if (undergroundEl && undergroundEl.offsetParent) {
                    zoomistInstances.underground = new Zoomist(undergroundEl, {
                        maxScale: 4,
                        bounds: true,
                        slider: true,
                        zoomer: true,
                        wheelable: false,
                        pinchable: true,
                        initScale: 1,
                        wheelReleaseOnMinMax: true,
                    });
                }

                mapsBuilt = true;
            });
        });
    }

    function destroyMaps() {
        Object.keys(zoomistInstances).forEach(function (key) {
            if (zoomistInstances[key] && typeof zoomistInstances[key].destroy === 'function') {
                zoomistInstances[key].destroy();
            }
        });
        zoomistInstances = {};
        mapsBuilt = false;
    }

    function update(tab) {
        if (tab === 'maps') {
            initMaps();
        } else {
            destroyMaps();
        }
    }

    function updateHeadings() {
        mapDescEl.textContent = getText('maps.description');
        var h2s = root.querySelectorAll('h2');
        var descs = root.querySelectorAll('p.text-kcd-text-secondary.mb-3');
        if (h2s[0]) h2s[0].textContent = getText('maps.districts');
        if (descs[0]) descs[0].textContent = getText('maps.districtsDesc');
        if (h2s[1]) h2s[1].textContent = getText('maps.underground');
        if (descs[1]) descs[1].textContent = getText('maps.undergroundDesc');
    }

    onState('activeTab', update);
    onState('language', updateHeadings);

    return { root: root, update: update };
}
