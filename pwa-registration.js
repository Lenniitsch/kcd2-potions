// PWA Registration and Install Prompt
let deferredPrompt;
let installButton = null;

// Create install button (optional)
function createInstallButton() {
    if (!installButton) {
        installButton = document.createElement('button');
        installButton.textContent = '📱 App installieren';
        installButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            padding: 12px 20px;
            background: #c9a640;
            color: #0e1419;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(201, 166, 64, 0.3);
            transition: all 0.2s ease;
            display: none;
        `;
        installButton.addEventListener('click', installApp);
        document.body.appendChild(installButton);
    }
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            // Relative path for better portability
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('✅ Service Worker registered:', registration);
            
            // Check for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available
                        showUpdateNotification();
                    }
                });
            });
            
        } catch (error) {
            console.log('❌ Service Worker registration failed:', error);
        }
    });
}

// Handle install prompt
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('📱 Install prompt triggered');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button
    createInstallButton();
    if (installButton) {
        installButton.style.display = 'block';
    }
});

// Install the app
async function installApp() {
    if (!deferredPrompt) return;
    
    try {
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        
        if (result.outcome === 'accepted') {
            console.log('✅ App installed');
            if (installButton) {
                installButton.style.display = 'none';
            }
        } else {
            console.log('❌ Installation declined');
        }
        
        deferredPrompt = null;
    } catch (error) {
        console.log('❌ Installation failed:', error);
    }
}

// App installed event
window.addEventListener('appinstalled', () => {
    console.log('✅ PWA was installed');
    if (installButton) {
        installButton.style.display = 'none';
    }
    
    // Optional: Show welcome message
    showWelcomeMessage();
});

// Show update notification
function showUpdateNotification() {
    // Create a simple notification
    const updateBanner = document.createElement('div');
    updateBanner.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #c9a640;
            color: #0e1419;
            padding: 12px;
            text-align: center;
            z-index: 1001;
            font-weight: 600;
        ">
            🔄 Neue Version verfügbar! 
            <button onclick="location.reload()" style="
                margin-left: 10px;
                padding: 4px 12px;
                background: rgba(14, 20, 25, 0.2);
                border: none;
                border-radius: 4px;
                color: #0e1419;
                cursor: pointer;
                font-weight: 600;
            ">Aktualisieren</button>
            <button onclick="this.parentElement.parentElement.remove()" style="
                margin-left: 5px;
                padding: 4px 8px;
                background: transparent;
                border: none;
                color: #0e1419;
                cursor: pointer;
                font-weight: 600;
            ">✕</button>
        </div>
    `;
    document.body.appendChild(updateBanner);
}

// Welcome message after installation
function showWelcomeMessage() {
    // Optional: Show a welcome message when app is first installed
    console.log('🎉 Willkommen bei KCD2 Tools!');
}

// Check if running as PWA
function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// Optional: Different styling when running as PWA
if (isPWA()) {
    document.body.classList.add('pwa-mode');
    console.log('🚀 Running as PWA');
}

// iOS PWA Install Helper - Add to your pwa-registration.js

// Detect iOS
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Detect if already installed as PWA
function isInstalledPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// Show iOS install instructions
function showIOSInstallPrompt() {
    if (isIOS() && !isInstalledPWA()) {
        // Check if user already saw the prompt
        if (localStorage.getItem('ios-install-prompt-shown')) {
            return;
        }
        
        // Create iOS install prompt
        const iosPrompt = document.createElement('div');
        iosPrompt.innerHTML = `
            <div style="
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: #c9a640;
                color: #0e1419;
                padding: 16px;
                text-align: center;
                z-index: 1002;
                font-weight: 600;
                box-shadow: 0 -4px 12px rgba(0,0,0,0.3);
            ">
                <div style="margin-bottom: 8px;">
                    📱 <strong>App installieren</strong>
                </div>
                <div style="font-size: 14px; margin-bottom: 12px;">
                    Tippe auf <strong>⎙</strong> und dann auf <strong>"Zum Home-Bildschirm"</strong>
                </div>
                <button onclick="this.parentElement.parentElement.remove(); localStorage.setItem('ios-install-prompt-shown', 'true');" style="
                    padding: 8px 16px;
                    background: rgba(14, 20, 25, 0.2);
                    border: none;
                    border-radius: 4px;
                    color: #0e1419;
                    cursor: pointer;
                    font-weight: 600;
                    margin-right: 8px;
                ">Verstanden</button>
                <button onclick="this.parentElement.parentElement.remove(); localStorage.setItem('ios-install-prompt-shown', 'true');" style="
                    padding: 8px 12px;
                    background: transparent;
                    border: none;
                    color: #0e1419;
                    cursor: pointer;
                    font-weight: 600;
                ">✕</button>
            </div>
        `;
        
        document.body.appendChild(iosPrompt);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (iosPrompt.parentElement) {
                iosPrompt.remove();
                localStorage.setItem('ios-install-prompt-shown', 'true');
            }
        }, 10000);
    }
}

// Show iOS prompt after page load
window.addEventListener('load', () => {
    setTimeout(showIOSInstallPrompt, 2000); // 2 seconds delay
});
