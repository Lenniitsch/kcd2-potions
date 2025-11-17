// Main Application
class KCD2App {
    constructor() {
        this.languageManager = null;
        this.recipeManager = null;
        this.mapsManager = null;
        this.tabManager = null;
        this.filterToggle = null;
    }

    async initialize() {
        try {
            // Initialize managers in correct order
            this.languageManager = new LanguageManager();
            this.mapsManager = new MapsManager();
            this.tabManager = new TabManager(this.mapsManager);
            this.recipeManager = new RecipeManager(this.languageManager);
            
            // Set initial language
            this.languageManager.switchLanguage(this.languageManager.getCurrentLanguage());
            
            // Load recipes
            await this.recipeManager.loadRecipes();

			// Initialize FilterToggle AFTER DOM elements are loaded
			this.filterToggle = new FilterToggle(this.languageManager);

            // Initialize maps if maps tab is active
            if (this.tabManager.getActiveTab() === 'maps') {
                setTimeout(() => {
                    this.mapsManager.initialize();
                }, 100);
            }

            console.log('🎮 KCD2 App initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize KCD2 App:', error);
        }
    }

    // Utility method for debugging
    getManagers() {
        return {
            language: this.languageManager,
            recipe: this.recipeManager,
            maps: this.mapsManager,
            tab: this.tabManager,
            filterToggle: this.filterToggle 
        };
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    window.KCD2App = new KCD2App();
    await window.KCD2App.initialize();
});
