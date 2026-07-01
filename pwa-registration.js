import { getText } from './js/i18n.js';

var deferredPrompt;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js', { scope: './' }).then(function (registration) {
            if (registration.waiting) {
                showUpdateBanner(registration.waiting);
                return;
            }

            registration.addEventListener('updatefound', function () {
                var newWorker = registration.installing;
                if (!newWorker) return;

                newWorker.addEventListener('statechange', function () {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateBanner(newWorker);
                    }
                });
            });
        }).catch(function (err) {
            console.log('SW registration failed:', err);
        });
    });

    var reloadOnControllerChange = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (reloadOnControllerChange) {
            window.location.reload();
        }
    });

    function showUpdateBanner(worker) {
        var updateEl = document.createElement('div');
        updateEl.className = 'fixed bottom-4 right-4 bg-kcd-surface border border-kcd-gold rounded-lg p-3 shadow-lg z-50 flex items-center gap-3';

        var span = document.createElement('span');
        span.className = 'text-sm text-kcd-text';
        span.textContent = getText('pwa.update');

        var btn = document.createElement('button');
        btn.className = 'px-3 py-1 bg-kcd-gold text-kcd-bg rounded text-sm font-medium';
        btn.textContent = getText('pwa.updateAction');
        btn.addEventListener('click', function () {
            reloadOnControllerChange = true;
            worker.postMessage({ action: 'skipWaiting' });
        });

        updateEl.appendChild(span);
        updateEl.appendChild(btn);
        document.body.appendChild(updateEl);
    }
}

window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;

    var installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
        installBtn.classList.remove('hidden');
        installBtn.addEventListener('click', function () {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(function (choiceResult) {
                if (choiceResult.outcome === 'accepted') {
                    installBtn.classList.add('hidden');
                }
                deferredPrompt = null;
            });
        });
    }
});

window.addEventListener('appinstalled', function () {
    var installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
        installBtn.classList.add('hidden');
    }
    deferredPrompt = null;
});
