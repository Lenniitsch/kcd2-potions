// Tab Management
class TabManager {
    constructor(mapsManager) {
        this.mapsManager = mapsManager;
        this.activeTab = 'potions';
        this.initializeTabButtons();
    }

    initializeTabButtons() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(targetTab) {
        if (this.activeTab === targetTab) return;

        const tabButtons = document.querySelectorAll('.tab-btn');
        // Suche nach section-Elementen
        const tabContents = document.querySelectorAll('section[id$="-tab"], .tab-content');
        
        // Update active states
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === targetTab);
        });
        
        tabContents.forEach(content => {
            // Flexiblere ID-Matching
            const expectedId = targetTab + '-tab';
            const isActive = content.id === expectedId;
            content.classList.toggle('active', isActive);
        });

        // Handle maps initialization
        if (targetTab === 'maps') {
            setTimeout(() => {
                this.mapsManager.initialize();
            }, 100);
        }

        this.activeTab = targetTab;
        
        // Trigger custom event
        document.dispatchEvent(new CustomEvent('tabChanged', { 
            detail: { tab: targetTab } 
        }));
    }

    getActiveTab() {
        return this.activeTab;
    }
}
