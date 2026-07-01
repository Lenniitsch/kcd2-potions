let currentLang = 'de';

export function setLanguage(lang) {
    currentLang = lang;
}

export function getCurrentLanguage() {
    return currentLang;
}

export function getText(key) {
    var entry = UI[key];
    if (!entry) return key;
    if (entry[currentLang] != null) return entry[currentLang];
    return entry.en || key;
}

const UI = {
    'app.title': {
        de: 'KCD2 Tränke & Karten',
        it: 'KCD2 Strumento Pozioni e Mappe',
        en: 'KCD2 Potions & Maps',
    },
    'app.subtitle': {
        de: 'Trank-Rezepte & Maps',
        it: 'Ricette di Pozioni e Mappe',
        en: 'Potion Recipes & Maps',
    },
    'tab.recipes': {
        de: 'Rezepte',
        it: 'Ricette',
        en: 'Recipes',
    },
    'tab.maps': {
        de: 'Karten',
        it: 'Mappe',
        en: 'Maps',
    },
    'filter.searchPlaceholder': {
        de: 'Rezept oder Effekt suchen...',
        it: 'Cerca ricetta o effetto...',
        en: 'Search recipe or effect...',
    },
    'filter.categoryLabel': {
        de: 'Kategorie',
        it: 'Categoria',
        en: 'Category',
    },
    'filter.categoryAll': {
        de: 'Alle Kategorien',
        it: 'Tutte le categorie',
        en: 'All Categories',
    },
    'filter.sortLabel': {
        de: 'Sortierung',
        it: 'Ordinamento',
        en: 'Sort',
    },
    'filter.layoutGrid': {
        de: 'Raster',
        it: 'Griglia',
        en: 'Grid',
    },
    'filter.layoutList': {
        de: 'Liste',
        it: 'Lista',
        en: 'List',
    },
    'section.filters': {
        de: 'Filter',
        it: 'Filtri',
        en: 'Filters',
    },
    'filter.ingredientHeader': {
        de: 'Zutaten',
        it: 'Ingredienti',
        en: 'Ingredients',
    },
    'filter.expand': {
        de: 'Filter einblenden',
        it: 'Mostra filtri',
        en: 'Show filters',
    },
    'filter.collapse': {
        de: 'Filter ausblenden',
        it: 'Nascondi filtri',
        en: 'Hide filters',
    },
    'filter.statsShowing': {
        de: '{0} von {1} Rezepten',
        it: '{0} di {1} ricette',
        en: '{0} of {1} recipes',
    },
    'filter.statsActive': {
        de: '{0} aktive Filter',
        it: '{0} filtri attivi',
        en: '{0} active filters',
    },
    'filter.clearFilters': {
        de: 'Zurücksetzen',
        it: 'Azzera',
        en: 'Clear',
    },
    'filter.noResults': {
        de: 'Keine Rezepte gefunden',
        it: 'Nessuna ricetta trovata',
        en: 'No recipes found',
    },
    'filter.noResultsHint': {
        de: 'Versuche andere Filter oder weniger Zutaten auszuwählen.',
        it: 'Prova altri filtri o seleziona meno ingredienti.',
        en: 'Try different filters or select fewer ingredients.',
    },
    'card.baseLiquid': {
        de: 'Basis',
        it: 'Base',
        en: 'Base',
    },
    'card.price': {
        de: 'Preis',
        it: 'Prezzo',
        en: 'Price',
    },
    'card.ingredients': {
        de: 'Zutaten',
        it: 'Ingredienti',
        en: 'Ingredients',
    },
    'card.steps': {
        de: 'Brauschritte',
        it: 'Procedimento',
        en: 'Brewing Steps',
    },
    'card.expand': {
        de: 'Details einblenden',
        it: 'Mostra dettagli',
        en: 'Show details',
    },
    'card.collapse': {
        de: 'Details ausblenden',
        it: 'Nascondi dettagli',
        en: 'Hide details',
    },
    'card.effect': {
        de: 'Wirkung',
        it: 'Effetto',
        en: 'Effect',
    },
    'header.themeDark': {
        de: 'Dunkles Design',
        it: 'Tema scuro',
        en: 'Dark theme',
    },
    'header.themeLight': {
        de: 'Helles Design',
        it: 'Tema chiaro',
        en: 'Light theme',
    },
    'header.language': {
        de: 'Sprache',
        it: 'Lingua',
        en: 'Language',
    },
    'maps.districts': {
        de: 'Kuttenberg - Bezirke',
        it: 'Kuttenberg - Distretti',
        en: 'Kuttenberg - Districts',
    },
    'maps.underground': {
        de: 'Kuttenberg - Untergrund',
        it: 'Kuttenberg - Sotterraneo',
        en: 'Kuttenberg - Underground',
    },
    'maps.description': {
        de: 'Nutze die Maus oder Touch-Gesten zum Zoomen und Navigieren',
        it: 'Usa il mouse o i gesti touch per ingrandire e navigare',
        en: 'Use mouse or touch gestures to zoom and navigate',
    },
    'maps.districtsDesc': {
        de: 'Eine Karte von Kuttenberg mit eingezeichneten Bezirken',
        it: 'Una mappa di Kuttenberg con i distretti contrassegnati',
        en: 'A map of Kuttenberg with marked districts',
    },
    'maps.undergroundDesc': {
        de: 'Eine Karte des Tunnelsystems in Kuttenberg',
        it: 'Una mappa del sistema di tunnel a Kuttenberg',
        en: 'A map of the tunnel system in Kuttenberg',
    },
    'maps.unavailable': {
        de: 'Karten nicht verfügbar. Bitte Seite neu laden.',
        it: 'Mappe non disponibili. Ricarica la pagina.',
        en: 'Maps unavailable. Please reload the page.',
    },
    'loading.text': {
        de: 'Rezepte werden geladen...',
        it: 'Caricamento ricette...',
        en: 'Loading recipes...',
    },
    'error.loadFailed': {
        de: 'Rezepte konnten nicht geladen werden.',
        it: 'Impossibile caricare le ricette.',
        en: 'Failed to load recipes.',
    },
    'error.retry': {
        de: 'Neu laden',
        it: 'Riprova',
        en: 'Retry',
    },
    'pwa.install': {
        de: 'App installieren',
        it: 'Installa app',
        en: 'Install app',
    },
    'pwa.update': {
        de: 'Update verfügbar',
        it: 'Aggiornamento disponibile',
        en: 'Update available',
    },
    'pwa.updateAction': {
        de: 'Aktualisieren',
        it: 'Aggiorna',
        en: 'Update',
    },
    'misc.ingredientDisabled': {
        de: 'Kein Rezept enthält diese Zutat mit der aktuellen Auswahl',
        it: 'Nessuna ricetta contiene questo ingrediente con la selezione attuale',
        en: 'No recipe contains this ingredient with the current selection',
    },
    'misc.groschen': {
        de: 'Groschen',
        it: 'Groschen',
        en: 'Groschen',
    },
    'misc.backToTop': {
        de: 'Nach oben',
        it: 'Torna su',
        en: 'Back to top',
    },
    'timer.start': {
        de: 'Start',
        it: 'Avvia',
        en: 'Start',
    },
    'timer.pause': {
        de: 'Pause',
        it: 'Pausa',
        en: 'Pause',
    },
    'timer.resume': {
        de: 'Fortsetzen',
        it: 'Riprendi',
        en: 'Resume',
    },
    'timer.reset': {
        de: 'Zurücksetzen',
        it: 'Azzera',
        en: 'Reset',
    },
    'timer.prevStep': {
        de: 'Vorheriger Schritt',
        it: 'Passo precedente',
        en: 'Previous step',
    },
    'timer.nextStep': {
        de: 'Nächster Schritt',
        it: 'Passo successivo',
        en: 'Next step',
    },
    'timer.noTimedSteps': {
        de: 'Keine zeitgesteuerten Schritte',
        it: 'Nessun passo a tempo',
        en: 'No timed steps',
    },
    'timer.stepXofY': {
        de: 'Schritt {0} von {1}',
        it: 'Passo {0} di {1}',
        en: 'Step {0} of {1}',
    },
    'timer.modeTimed': {
        de: 'Timed',
        it: 'Timed',
        en: 'Timed',
    },
    'timer.modeAll': {
        de: 'Alle',
        it: 'Tutti',
        en: 'All',
    },
    'timer.brewMode': {
        de: 'Braumodus',
        it: 'Modalità infusione',
        en: 'Brew mode',
    },
    'timer.brewModeOpen': {
        de: 'Braumodus öffnen',
        it: 'Apri modalità infusione',
        en: 'Open brew mode',
    },
    'timer.brewComplete': {
        de: 'Brauvorgang abgeschlossen',
        it: 'Infusione completata',
        en: 'Brew complete',
    },
};

export const CATEGORIES = {
    'Heiltrank': {
        de: 'Heiltrank',
        it: 'Curativa',
        en: 'Healing',
    },
    'Kampf-Buff': {
        de: 'Kampf',
        it: 'Combattimento',
        en: 'Combat',
    },
    'Gift': {
        de: 'Gift',
        it: 'Veleno',
        en: 'Poison',
    },
    'Werken': {
        de: 'Werken',
        it: 'Artigianato',
        en: 'Crafting',
    },
    'Sonstiges': {
        de: 'Sonstiges',
        it: 'Utilità',
        en: 'Utility',
    },
    'DLC/Quest': {
        de: 'DLC/Quest',
        it: 'DLC/Quest',
        en: 'DLC/Quest',
    },
};

export function getCategoryLabel(categoryKey) {
    var entry = CATEGORIES[categoryKey];
    if (!entry) return categoryKey;
    if (entry[currentLang] != null) return entry[currentLang];
    return entry.en || categoryKey;
}

export const SORT_OPTIONS = {
    'name-asc': {
        de: 'Name A–Z',
        it: 'Nome A–Z',
        en: 'Name A–Z',
    },
    'name-desc': {
        de: 'Name Z–A',
        it: 'Nome Z–A',
        en: 'Name Z–A',
    },
    'category-asc': {
        de: 'Kategorie A–Z',
        it: 'Categoria A–Z',
        en: 'Category A–Z',
    },
    'category-desc': {
        de: 'Kategorie Z–A',
        it: 'Categoria Z–A',
        en: 'Category Z–A',
    },
    'price-asc': {
        de: 'Preis aufsteigend',
        it: 'Prezzo crescente',
        en: 'Price Low–High',
    },
    'price-desc': {
        de: 'Preis absteigend',
        it: 'Prezzo decrescente',
        en: 'Price High–Low',
    },
    'ingredients-asc': {
        de: 'Zutaten wenige',
        it: 'Meno ingredienti',
        en: 'Ingredients Few–Many',
    },
    'ingredients-desc': {
        de: 'Zutaten viele',
        it: 'Più ingredienti',
        en: 'Ingredients Many–Few',
    },
};

export function getSortLabel(sortKey) {
    var entry = SORT_OPTIONS[sortKey];
    if (!entry) return sortKey;
    if (entry[currentLang] != null) return entry[currentLang];
    return entry.en || sortKey;
}
