// Language Configuration
const LANGUAGES = {
    de: {
        'all-recipes': 'Alle Rezepte',
        'page-title': 'KCD2 Tränke & Karten Tool',
        'header-subtitle': 'Trank-Rezepte & Maps', 
        'tab-potions': 'Tränke',
        'tab-maps': 'Maps',
        'search-placeholder': 'Trank suchen...',
        'category-all': 'Alle Kategorien',
        'category-healing': 'Heiltrank',
        'category-combat': 'Kampf-Buff',
        'category-poison': 'Gift',
        'category-crafting': 'Handwerk',
        'category-utility': 'Utility',
        'layout-label': 'Layout:',
        'layout-grid': '⊞ Grid',
        'layout-list': '☰ List',
        'filter-title': 'Filter & Suche', 
        'filter-toggle': 'Einblenden', 
        'ingredient-filter': 'Zutaten-Filter (mehrfach auswählbar):',
        'active-filters': 'Aktive Filter:',
        'loading': 'Lade Tränke...',
        'no-results': 'Keine Tränke gefunden',
        'no-results-desc': 'Versuche andere Suchbegriffe oder Filter.',
        'maps-title': 'Ingame-Karten',
        'maps-description': 'Nutze die Maus oder Touch-Gesten zum Zoomen und Navigieren',
        'map-underground-title': 'Kuttenberg - Untergrund',
        'map-underground-desc': 'Eine Karte des Tunnelsystems in Kuttenberg',
        'map-districts-title': 'Kuttenberg - Bezirke',
        'map-districts-desc': 'Eine Karte von Kuttenberg mit eingezeichneten Bezirken',
        'ingredients': 'Zutaten',
        'recipe-steps': 'Rezept-Schritte',
        'price': 'Preis'
    },
    it: {
        'all-recipes': 'Tutte le Ricette',
        'page-title': 'KCD2 Strumento Pozioni e Mappe',
        'header-subtitle': 'Ricette di Pozioni e Mappe', 
        'tab-potions': 'Pozioni',
        'tab-maps': 'Mappe',
        'search-placeholder': 'Cerca pozione...',
        'category-all': 'Tutte le Categorie',
        'category-healing': 'Pozione Curativa',
        'category-combat': 'Potenziamento Combattimento',
        'category-poison': 'Veleno',
        'category-crafting': 'Artigianato',
        'category-utility': 'Utilità',
        'layout-label': 'Layout:',
        'layout-grid': '⊞ Griglia',
        'layout-list': '☰ Lista',
        'filter-title': 'Filtri & Ricerca', 
        'filter-toggle': 'Mostra',
        'ingredient-filter': 'Filtro Ingredienti (selezione multipla):',
        'active-filters': 'Filtri Attivi:',
        'loading': 'Caricamento pozioni...',
        'no-results': 'Nessuna pozione trovata',
        'no-results-desc': 'Prova altri termini di ricerca o filtri.',
        'maps-title': 'Mappe del Gioco',
        'maps-description': 'Usa il mouse o i gesti touch per ingrandire e navigare',
        'map-underground-title': 'Kuttenberg - Sotterraneo',
        'map-underground-desc': 'Una mappa del sistema di tunnel a Kuttenberg',
        'map-districts-title': 'Kuttenberg - Distretti',
        'map-districts-desc': 'Una mappa di Kuttenberg con i distretti contrassegnati',
        'ingredients': 'Ingredienti',
        'recipe-steps': 'Passaggi Ricetta',
        'price': 'Prezzo'
    },
    en: {
        'all-recipes': 'All Recipes',
        'page-title': 'KCD2 Potions & Maps Tool',
        'header-subtitle': 'Potion Recipes & Maps', 
        'tab-potions': 'Potions',
        'tab-maps': 'Maps',
        'search-placeholder': 'Search potion...',
        'category-all': 'All Categories',
        'category-healing': 'Healing Potion',
        'category-combat': 'Combat Buff',
        'category-poison': 'Poison',
        'category-crafting': 'Crafting',
        'category-utility': 'Utility',
        'layout-label': 'Layout:',
        'layout-grid': '⊞ Grid',
        'layout-list': '☰ List',
        'filter-title': 'Filter & Search', 
        'filter-toggle': 'Show', 
        'ingredient-filter': 'Ingredient Filter (multiple selection):',
        'active-filters': 'Active Filters:',
        'loading': 'Loading potions...',
        'no-results': 'No potions found',
        'no-results-desc': 'Try different search terms or filters.',
        'maps-title': 'In-Game Maps',
        'maps-description': 'Use mouse or touch gestures to zoom and navigate',
        'map-underground-title': 'Kuttenberg - Underground',
        'map-underground-desc': 'A map of the tunnel system in Kuttenberg',
        'map-districts-title': 'Kuttenberg - Districts',
        'map-districts-desc': 'A map of Kuttenberg with marked districts',
        'ingredients': 'Ingredients',
        'recipe-steps': 'Recipe Steps',
        'price': 'Price'
    }
};

// Category translations
const CATEGORIES = {
    de: {
        'all': 'Alle Kategorien',
        'Heiltrank': 'Heiltrank',
        'Kampf-Buff': 'Kampf-Buff',
        'Gift': 'Gift',
        'Handwerk': 'Handwerk',
        'Utility': 'Utility'
    },
    it: {
        'all': 'Tutte le Categorie',
        'Heiltrank': 'Pozione Curativa',
        'Kampf-Buff': 'Potenziamento Combattimento',
        'Gift': 'Veleno',
        'Handwerk': 'Artigianato',
        'Utility': 'Utilità'
    },
    en: {
        'all': 'All Categories',
        'Heiltrank': 'Healing Potion',
        'Kampf-Buff': 'Combat Buff',
        'Gift': 'Poison',
        'Handwerk': 'Crafting',
        'Utility': 'Utility'
    }
};

// Sort Options translations
const SORT_OPTIONS = {
    de: {
        'name-asc': 'Name A→Z',
        'name-desc': 'Name Z→A',
        'category-asc': 'Kategorie A→Z', 
        'category-desc': 'Kategorie Z→A',
        'price-asc': 'Preis ↑',
        'price-desc': 'Preis ↓',
        'ingredients-asc': 'Zutaten ↑',
        'ingredients-desc': 'Zutaten ↓'
    },
    it: {
        'name-asc': 'Nome A→Z',
        'name-desc': 'Nome Z→A',
        'category-asc': 'Categoria A→Z',
        'category-desc': 'Categoria Z→A', 
        'price-asc': 'Prezzo ↑',
        'price-desc': 'Prezzo ↓',
        'ingredients-asc': 'Ingredienti ↑',
        'ingredients-desc': 'Ingredienti ↓'
    },
    en: {
        'name-asc': 'Name A→Z',
        'name-desc': 'Name Z→A',
        'category-asc': 'Category A→Z',
        'category-desc': 'Category Z→A', 
        'price-asc': 'Price ↑',
        'price-desc': 'Price ↓',
        'ingredients-asc': 'Ingredients ↑',
        'ingredients-desc': 'Ingredients ↓'
    }
};

// Language Management (rest bleibt gleich)
class LanguageManager {
    constructor() {
        this.currentLanguage = localStorage.getItem(CONFIG.STORAGE_KEYS.LANGUAGE) || CONFIG.DEFAULT_LANGUAGE;
        this.initializeLanguageButtons();
    }

    initializeLanguageButtons() {
        const langButtons = document.querySelectorAll('.lang-btn');
        langButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchLanguage(btn.dataset.lang);
            });
        });
    }

    switchLanguage(lang) {
        if (!LANGUAGES[lang]) return;
        
        this.currentLanguage = lang;
        this.updateAllElements();
        this.updateLanguageButtons();
        this.updateCategoryOptions();
        this.updateSortOptions();
        this.updatePlaceholders();
        
        // Save preference
        localStorage.setItem(CONFIG.STORAGE_KEYS.LANGUAGE, lang);
        
        // Trigger custom event for other modules
        document.dispatchEvent(new CustomEvent('languageChanged', { 
            detail: { language: lang } 
        }));
    }

    updateAllElements() {
        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            const translation = this.getText(key);
            
            if (translation) {
                if (element.tagName === 'TITLE') {
                    element.textContent = translation;
                } else {
                    element.textContent = translation;
                }
            }
        });
    }

    updateLanguageButtons() {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.currentLanguage);
        });
    }

    updateCategoryOptions() {
        const categorySelect = document.getElementById('category-select');
        if (!categorySelect) return;
        const currentValue = categorySelect.value;
        categorySelect.innerHTML = '';
        Object.entries(CATEGORIES[this.currentLanguage]).forEach(([value, text]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            categorySelect.appendChild(option);
        });
        categorySelect.value = currentValue;
    }

    updateSortOptions() {
        const sortSelect = document.getElementById('sort-select');
        if (!sortSelect) return;
        const currentValue = sortSelect.value;
        sortSelect.innerHTML = '';
        Object.entries(SORT_OPTIONS[this.currentLanguage]).forEach(([value, text]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            sortSelect.appendChild(option);
        });
        sortSelect.value = currentValue;
    }

    updatePlaceholders() {
        document.querySelectorAll('[data-lang-key-placeholder]').forEach(element => {
            const key = element.getAttribute('data-lang-key-placeholder');
            const translation = this.getText(key);
            if (translation) {
                element.placeholder = translation;
            }
        });
    }

    getText(key) {
        return LANGUAGES[this.currentLanguage]?.[key] || LANGUAGES[CONFIG.DEFAULT_LANGUAGE]?.[key] || key;
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }
}
