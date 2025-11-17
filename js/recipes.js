// Recipe Management
class RecipeManager {
    constructor(languageManager) {
        this.languageManager = languageManager;
        this.recipes = [];
        this.allIngredients = new Set();
        this.filteredRecipes = [];
        
        // Filter states
        this.searchTerm = '';
        this.selectedCategory = 'all';
        this.selectedIngredients = new Set();
        this.currentLayout = localStorage.getItem(CONFIG.STORAGE_KEYS.LAYOUT) || CONFIG.LAYOUT_TYPES.GRID;
        this.currentSort = localStorage.getItem(CONFIG.STORAGE_KEYS.SORT) || 'name-asc';
        this.initializeEventListeners();
    }

    /**
     * Load recipes from JSON file and initialize application state
     */
    async loadRecipes() {
        try {
            const response = await fetch(CONFIG.RECIPES_URL);
            const data = await response.json();
            this.recipes = data.recipes || [];
            this.extractIngredients();
            this.applyFilters();
            this.displayRecipes();
            this.updateStats();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading recipes:', error);
            this.showError();
        }
    }

	/**
	 * Find recipes that are compatible with current ingredient selection using IDs
	 * Returns all recipes if no ingredients are selected
	 */
	findCompatibleRecipes() {
		if (this.selectedIngredients.size === 0) {
			return this.recipes;
		}
		const currentLang = this.languageManager.getCurrentLanguage();
		
		return this.recipes.filter(recipe => {
			const recipeIngredientIds = new Set();
			const ingredients = recipe.ingredients[currentLang] || recipe.ingredients.de || [];
			
			// Convert recipe ingredients to IDs
			ingredients.forEach(ingredient => {
				const matchingGermanIngredient = this.findMatchingIngredient(ingredient, recipe);
				if (matchingGermanIngredient) {
					const ingredientId = matchingGermanIngredient.replace(/^\d+\s*x\s*/, '').trim();
					recipeIngredientIds.add(ingredientId);
				}
			});
			
			// Check if ALL selected ingredient IDs exist in this recipe
			for (const selectedId of this.selectedIngredients) {
				if (!recipeIngredientIds.has(selectedId)) {
					return false;
				}
			}
			return true;
		});
	}

	/**
	 * Get ingredients that are available based on current selection
	 * Returns ingredient objects with IDs for consistent filtering
	 */
	getAvailableIngredients() {
		if (this.selectedIngredients.size === 0) {
			return Array.from(this.allIngredients.values());
		}

		// Find recipes compatible with current selection
		const compatibleRecipes = this.findCompatibleRecipes();
		const currentLang = this.languageManager.getCurrentLanguage();
		
		// Collect all ingredients from compatible recipes
		const availableIngredients = new Map();
		
		compatibleRecipes.forEach(recipe => {
			const ingredients = recipe.ingredients[currentLang] || recipe.ingredients.de || [];
			ingredients.forEach(ingredient => {
				const cleanIngredient = ingredient.replace(/^\d+\s*x\s*/, '').trim();
				const matchingGermanIngredient = this.findMatchingIngredient(ingredient, recipe);
				
				if (matchingGermanIngredient) {
					const ingredientId = matchingGermanIngredient.replace(/^\d+\s*x\s*/, '').trim();
					availableIngredients.set(ingredientId, {
						id: ingredientId,
						currentLangText: cleanIngredient,
						germanText: ingredientId
					});
				}
			});
		});
		
		return Array.from(availableIngredients.values());
	}

    /**
     * Categorize recipe steps by type for visual differentiation
     * Assigns colors and types based on cooking keywords
     */
    categorizeSteps(steps, lang) {
        const cookingKeywords = {
            'de': ['kochen', 'blasebalg'],
            'it': ['bollire', 'mantice'],
            'en': ['boil', 'bellows']
        };
        
        const finishingKeywords = {
            'de': ['einschenken', 'destillieren', 'kesselinhalt'],
            'it': ['versare', 'distillare', 'kesselinhalt'],
            'en': ['pour', 'distill', 'grind cauldron']
        };
        
        const baseFluidKeywords = {
            'de': ['wasser', 'öl', 'alkohol', 'wein'],
            'it': ['acqua', 'olio', 'alcol', 'vino'],
            'en': ['water', 'oil', 'spirits', 'wine']
        };

        return steps.map((step, index) => {
            const stepLower = step.toLowerCase();
            let type = 'ingredient';
            let color = '#51cf66';
            
            // Determine step type and color based on keywords
            if (index === 0 || baseFluidKeywords[lang].some(fluid => stepLower.includes(fluid))) {
                type = 'base';
                color = '#f0c674';
            } else if (finishingKeywords[lang].some(keyword => stepLower.includes(keyword))) {
                type = 'finishing';
                color = '#ffd43b';  
            } else if (cookingKeywords[lang].some(keyword => stepLower.includes(keyword))) {
                type = 'cooking';
                color = '#ff6b6b';
            }
            
            return { 
                step, 
                type, 
                color, 
                index: index + 1 
            };
        });
    }

	/**
	 * Extract and deduplicate all ingredients from recipes
	 * Populates the ingredient filter system with ID-based ingredients
	 */
	extractIngredients() {
		this.allIngredients.clear();
		const currentLang = this.languageManager.getCurrentLanguage();
		
		// Create a map to store ingredient IDs and their translations
		const ingredientMap = new Map();
		
		this.recipes.forEach(recipe => {
			const ingredients = recipe.ingredients[currentLang] || recipe.ingredients.de || [];
			ingredients.forEach(ingredient => {
				// Remove quantity prefixes (e.g., "2x") from ingredient names
				const cleanIngredient = ingredient.replace(/^\d+\s*x\s*/, '').trim();
				
				// Create a unique ID based on the German name (as base reference)
				const germanIngredients = recipe.ingredients.de || [];
				const matchingGermanIngredient = this.findMatchingIngredient(ingredient, recipe);
				
				if (matchingGermanIngredient) {
					const ingredientId = matchingGermanIngredient.replace(/^\d+\s*x\s*/, '').trim();
					
					// Store the current language translation
					ingredientMap.set(ingredientId, {
						id: ingredientId,
						currentLangText: cleanIngredient,
						germanText: ingredientId
					});
				}
			});
		});
		
		// Convert map to set of ingredient objects
		this.allIngredients = ingredientMap;
		this.displayIngredientTags();
	}

	/**
	 * Find the corresponding German ingredient for cross-language matching
	 */
	findMatchingIngredient(ingredient, recipe) {
		const currentLang = this.languageManager.getCurrentLanguage();
		if (currentLang === 'de') {
			return ingredient;
		}
		
		const currentIngredients = recipe.ingredients[currentLang] || [];
		const germanIngredients = recipe.ingredients.de || [];
		
		// Find the index of the current ingredient
		const cleanCurrentIngredient = ingredient.replace(/^\d+\s*x\s*/, '').trim();
		const currentIndex = currentIngredients.findIndex(ing => 
			ing.replace(/^\d+\s*x\s*/, '').trim() === cleanCurrentIngredient
		);
		
		// Return the corresponding German ingredient at the same index
		if (currentIndex !== -1 && currentIndex < germanIngredients.length) {
			return germanIngredients[currentIndex];
		}
		
		return ingredient; // Fallback
	}

	/**
	 * Display ingredient filter tags with intelligent availability marking
	 * Uses ingredient IDs for consistent filtering across languages
	 */
	displayIngredientTags() {
		const container = document.getElementById('ingredient-tags');
		if (!container) return;
		
		const allIngredients = Array.from(this.allIngredients.values()).sort((a, b) => 
			a.currentLangText.localeCompare(b.currentLangText)
		);
		const availableIngredients = this.getAvailableIngredients();
		const currentLang = this.languageManager.getCurrentLanguage();
		
		container.innerHTML = allIngredients.map(ingredientObj => {
			const isAvailable = availableIngredients.some(avail => avail.id === ingredientObj.id);
			const isSelected = this.selectedIngredients.has(ingredientObj.id);
			
			let classes = 'ingredient-tag';
			let styles = '';
			let title = '';
			
			if (isSelected) {
				classes += ' selected';
			} else if (!isAvailable && this.selectedIngredients.size > 0) {
				classes += ' disabled';
				styles = 'opacity: 0.3; cursor: not-allowed;';
				
				// Multi-language tooltip messages
				const tooltipMessages = {
					'de': 'Keine Rezepte mit dieser Kombination verfügbar',
					'it': 'Nessuna ricetta disponibile con questa combinazione',
					'en': 'No recipes available with this combination'
				};
				title = tooltipMessages[currentLang] || tooltipMessages['en'];
			}
			
			return `
				<span class="${classes}" 
					  data-ingredient-id="${ingredientObj.id}"
					  data-ingredient-text="${ingredientObj.currentLangText}"
					  style="${styles}"
					  title="${title}">
					${ingredientObj.currentLangText}
				</span>
			`;
		}).join('');

		// Attach click listeners only to available or selected tags
		container.querySelectorAll('.ingredient-tag').forEach(tag => {
			const ingredientId = tag.dataset.ingredientId;
			const ingredientText = tag.dataset.ingredientText;
			const isAvailable = availableIngredients.some(avail => avail.id === ingredientId);
			const isSelected = this.selectedIngredients.has(ingredientId);
			
			if (isAvailable || isSelected) {
				tag.addEventListener('click', () => {
					this.toggleIngredient(ingredientId, ingredientText, tag);
				});
			}
		});
	}

	/**
	 * Toggle ingredient selection with validation using ingredient IDs
	 * Prevents selection of incompatible ingredient combinations
	 */
	toggleIngredient(ingredientId, ingredientText, tagElement) {
		if (this.selectedIngredients.has(ingredientId)) {
			// Removal is always allowed
			this.selectedIngredients.delete(ingredientId);
			tagElement.classList.remove('selected');
		} else {
			// Validate that adding this ingredient results in valid recipes
			const tempSelected = new Set(this.selectedIngredients);
			tempSelected.add(ingredientId);
			
			const hasCompatibleRecipes = this.recipes.some(recipe => {
				const currentLang = this.languageManager.getCurrentLanguage();
				const recipeIngredients = new Set();
				const ingredients = recipe.ingredients[currentLang] || recipe.ingredients.de || [];
				
				ingredients.forEach(ingredient => {
					const matchingGermanIngredient = this.findMatchingIngredient(ingredient, recipe);
					if (matchingGermanIngredient) {
						const ingredientId = matchingGermanIngredient.replace(/^\d+\s*x\s*/, '').trim();
						recipeIngredients.add(ingredientId);
					}
				});
				
				// Check if all selected ingredient IDs exist in this recipe
				for (const selectedId of tempSelected) {
					if (!recipeIngredients.has(selectedId)) {
						return false;
					}
				}
				return true;
			});

			if (hasCompatibleRecipes) {
				this.selectedIngredients.add(ingredientId);
				tagElement.classList.add('selected');
			} else {
				// Show validation warning to user with multi-language support
				const currentLang = this.languageManager.getCurrentLanguage();
				const validationMessages = {
					'de': 'Keine Rezepte mit dieser Zutatenkombination gefunden!',
					'it': 'Nessuna ricetta trovata con questa combinazione di ingredienti!',
					'en': 'No recipes found with this ingredient combination!'
				};
				const message = validationMessages[currentLang] || validationMessages['en'];
				this.showTemporaryMessage(message);
				return;
			}
		}
		
		// Update UI after successful ingredient toggle
		this.displayIngredientTags();
		this.updateSelectedIngredientsDisplay();
		this.applyFilters();
		this.displayRecipes();
		this.updateStats();
	}

    /**
     * Display temporary notification message to user
     * Automatically removes message after timeout
     */
    showTemporaryMessage(message) {
        let messageEl = document.getElementById('tempMessage');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'tempMessage';
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff6b6b;
                color: white;
                padding: 12px 20px;
                border-radius: 6px;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: opacity 0.3s ease;
                font-size: 0.9rem;
            `;
            document.body.appendChild(messageEl);
        }
        
        messageEl.textContent = message;
        messageEl.style.opacity = '1';
        
        // Auto-remove message with fade effect
        setTimeout(() => {
            messageEl.style.opacity = '0';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    /**
     * Update display of selected ingredients with statistics
     * Shows recipe count and available ingredient count
     */
    updateSelectedIngredientsDisplay() {
        const container = document.getElementById('selected-ingredients');
        const listContainer = document.getElementById('selected-ingredients-list');
        
        if (this.selectedIngredients.size === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        
        // Calculate statistics for current selection
        const compatibleRecipes = this.findCompatibleRecipes();
        const availableIngredients = this.getAvailableIngredients();
        const remainingIngredients = availableIngredients.length - this.selectedIngredients.size;
        
        const currentLang = this.languageManager.getCurrentLanguage();
    }

	/**
	 * Apply all active filters to recipe collection using ingredient IDs
	 * Filters by search term, category, and selected ingredients
	 */
	applyFilters() {
		const currentLang = this.languageManager.getCurrentLanguage();
		
		this.filteredRecipes = this.recipes.filter(recipe => {
			// Search filter - check name and effect description
			if (this.searchTerm) {
				const name = recipe.name[currentLang]?.toLowerCase() || '';
				const effect = recipe.effect_description[currentLang]?.toLowerCase() || '';
				const searchLower = this.searchTerm.toLowerCase();
				
				if (!name.includes(searchLower) && !effect.includes(searchLower)) {
					return false;
				}
			}
			
			// Category filter
			if (this.selectedCategory !== 'all' && recipe.category !== this.selectedCategory) {
				return false;
			}
			
			// Ingredients filter - all selected ingredient IDs must be present
			if (this.selectedIngredients.size > 0) {
				const recipeIngredientIds = new Set();
				const ingredients = recipe.ingredients[currentLang] || recipe.ingredients.de || [];
				
				ingredients.forEach(ingredient => {
					const matchingGermanIngredient = this.findMatchingIngredient(ingredient, recipe);
					if (matchingGermanIngredient) {
						const ingredientId = matchingGermanIngredient.replace(/^\d+\s*x\s*/, '').trim();
						recipeIngredientIds.add(ingredientId);
					}
				});
				
				const hasAllIngredients = Array.from(this.selectedIngredients).every(selectedId => {
					return recipeIngredientIds.has(selectedId);
				});
				
				if (!hasAllIngredients) {
					return false;
				}
			}
			
			return true;
		});
		this.sortRecipes();
	}

    /**
     * Display filtered recipes in one long ungrouped list
     * Handles both grid and list view layouts
     */
    displayRecipes() {
        const container = document.getElementById('recipe-sections');
        if (!container) return;

        if (this.filteredRecipes.length === 0) {
            this.showNoResults(container);
            return;
        }

        const currentLang = this.languageManager.getCurrentLanguage();
        const layoutClass = this.currentLayout === CONFIG.LAYOUT_TYPES.LIST ? 'list-view' : '';
        
        // Multi-language recipe count text
        const getRecipeCountText = (count) => {
            const countTexts = {
                'de': count === 1 ? 'Rezept' : 'Rezepte',
                'it': count === 1 ? 'Ricetta' : 'Ricette', 
                'en': count === 1 ? 'Recipe' : 'Recipes'
            };
            return countTexts[currentLang] || countTexts['en'];
        };
        
        // Render all recipes in one container without grouping
        container.innerHTML = `
            <div class="recipe-section">
                <div class="section-header">
                    <h2 class="section-title">${this.languageManager.getText('all-recipes')}</h2>
                    <span class="section-count">${this.filteredRecipes.length} ${getRecipeCountText(this.filteredRecipes.length)}</span>
                </div>
                <div class="section-recipes ${layoutClass}">
                    ${this.filteredRecipes.map(recipe => this.renderRecipeCard(recipe, currentLang)).join('')}
                </div>
            </div>
        `;
        this.attachRecipeEventListeners();
    }

/**
 * Render individual recipe card with expandable content
 * Includes categorized steps and formatted ingredients
 */
renderRecipeCard(recipe, currentLang) {
    const name = recipe.name[currentLang] || recipe.name.de;
    const effect = recipe.effect_description[currentLang] || recipe.effect_description.de;
    const ingredients = recipe.ingredients[currentLang] || recipe.ingredients.de;
    const steps = recipe.recipe_steps[currentLang] || recipe.recipe_steps.de;
    const price = recipe.price ? `${recipe.price.toFixed(0)} Groschen` : '';
    
    // Translate category using CATEGORIES object
    const translatedCategory = CATEGORIES[currentLang]?.[recipe.category] || 
                              CATEGORIES['en']?.[recipe.category] || 
                              recipe.category;
    
    // Categorize steps for visual organization
    const categorizedSteps = this.categorizeSteps(steps, currentLang);
    
    return `
        <div class="recipe-card" data-recipe-id="${recipe.id}">
            <div class="recipe-header">
                <div class="recipe-header-content">
                    <h3 class="recipe-name">${name}</h3>
                    <div class="recipe-meta">
                        <span class="recipe-category cat-${recipe.category.toLowerCase().replace(/[^a-z]/g, '-')}">${translatedCategory}</span>
                        ${price ? `<span class="recipe-price">${price}</span>` : ''}
                    </div>
                </div>
                <span class="expand-icon">▼</span>
            </div>
            
            <div class="recipe-effect">
                <p>${effect}</p>
            </div>
            
            <div class="recipe-body">
                <div class="body-section">
                    <h4>${this.languageManager.getText('ingredients')}</h4>
                    <ul class="ingredient-list">
                        ${ingredients.map(ingredient => `<li class="ingredient-item">${ingredient}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="body-section">
                    <h4>${this.languageManager.getText('recipe-steps')}</h4>
                    <div class="recipe-steps-chronological">
                        ${categorizedSteps.map(stepData => `
                            <div class="chronological-step" data-step-type="${stepData.type}">
                                <div class="step-indicator">
                                    <span class="step-number" style="background-color: ${stepData.color}">${stepData.index}</span>
                                </div>
                                <div class="step-content">${stepData.step}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}


    /**
     * Attach event listeners to recipe cards for expand/collapse functionality
     */
    attachRecipeEventListeners() {
        document.querySelectorAll('.recipe-header').forEach(header => {
            header.addEventListener('click', () => {
                const card = header.closest('.recipe-card');
                card.classList.toggle('expanded');
            });
        });
    }

    /**
     * Display no results message when no recipes match current filters
     */
    showNoResults(container) {
        container.innerHTML = `
            <div class="no-results">
                <h3>${this.languageManager.getText('no-results')}</h3>
                <p>${this.languageManager.getText('no-results-desc')}</p>
            </div>
        `;
    }

    /**
     * Display error message when recipe loading fails
     */
    showError() {
        const container = document.getElementById('recipe-sections');
        if (container) {
            const currentLang = this.languageManager.getCurrentLanguage();
            const errorMessages = {
                'de': {
                    title: 'Fehler beim Laden',
                    desc: 'Die Rezepte konnten nicht geladen werden. Bitte lade die Seite neu.'
                },
                'it': {
                    title: 'Errore di Caricamento',
                    desc: 'Le ricette non possono essere caricate. Ricarica la pagina.'
                },
                'en': {
                    title: 'Loading Error',
                    desc: 'Recipes could not be loaded. Please reload the page.'
                }
            };
            
            const messages = errorMessages[currentLang] || errorMessages['en'];
            
            container.innerHTML = `
                <div class="no-results">
                    <h3>${messages.title}</h3>
                    <p>${messages.desc}</p>
                </div>
            `;
        }
    }

    /**
     * Hide loading indicator after recipes are loaded
     */
    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    /**
     * Update statistics display showing filtered vs total recipe count
     */
    updateStats() {
        const statsElement = document.getElementById('filter-stats');
        if (!statsElement) return;
        const total = this.recipes.length;
        const filtered = this.filteredRecipes.length;
        const currentLang = this.languageManager.getCurrentLanguage();
        
        // Multi-language stats text
        const statsTexts = {
            'de': {
                'of': 'von',
                'potions': 'Tränken',
                'filters': 'Filter aktiv'
            },
            'it': {
                'of': 'di',
                'potions': 'Pozioni',
                'filters': 'Filtri attivi'
            },
            'en': {
                'of': 'of',
                'potions': 'Potions',
                'filters': 'Filters active'
            }
        };
        
        const texts = statsTexts[currentLang] || statsTexts['en'];
        
        statsElement.innerHTML = `
            <span>${filtered} ${texts.of} ${total} ${texts.potions}</span>
            ${this.selectedIngredients.size > 0 ? `<span> • ${this.selectedIngredients.size} ${texts.filters}</span>` : ''}
        `;
    }

    /**
     * Initialize all event listeners for user interactions
     * Sets up search, category filter, layout toggle, and language change handlers
     */
    initializeEventListeners() {
        // Search input with real-time filtering
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.applyFilters();
                this.displayRecipes();
                this.updateStats();
            });
        }

        // Category dropdown filter
        const categorySelect = document.getElementById('category-select');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.selectedCategory = e.target.value;
                this.applyFilters();
                this.displayRecipes();
                this.updateStats();
            });
        }

        // Sort dropdown
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                localStorage.setItem(CONFIG.STORAGE_KEYS.SORT, this.currentSort);
                this.applyFilters();
                this.displayRecipes();
            });
        }

        // Layout toggle between grid and list view
        document.querySelectorAll('.toggle-option').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!btn.classList.contains('active')) {
                    document.querySelectorAll('.toggle-option').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    
                    this.currentLayout = btn.dataset.layout;
                    localStorage.setItem(CONFIG.STORAGE_KEYS.LAYOUT, this.currentLayout);
                    this.displayRecipes();
                }
            });
        });

        // Language change event handler
        document.addEventListener('languageChanged', () => {
            this.extractIngredients();
            this.applyFilters();
            this.displayRecipes();
        });

        // Set initial layout button state from saved preference
        document.querySelectorAll('.toggle-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layout === this.currentLayout);
        });

        // Set initial sort option
        if (sortSelect) {
            sortSelect.value = this.currentSort;
        }
    }

    /**
     * Sort filtered recipes based on current sort option
     */
    sortRecipes() {
        const currentLang = this.languageManager.getCurrentLanguage();
        
        this.filteredRecipes.sort((a, b) => {
            switch (this.currentSort) {
                case 'name-asc':
                    const nameA = (a.name[currentLang] || a.name.de).toLowerCase();
                    const nameB = (b.name[currentLang] || b.name.de).toLowerCase();
                    return nameA.localeCompare(nameB);
                    
                case 'name-desc':
                    const nameA2 = (a.name[currentLang] || a.name.de).toLowerCase();
                    const nameB2 = (b.name[currentLang] || b.name.de).toLowerCase();
                    return nameB2.localeCompare(nameA2);
                    
                case 'category-asc':
                    return a.category.localeCompare(b.category);
                    
                case 'category-desc':
                    return b.category.localeCompare(a.category);
                    
                case 'price-asc':
                    const priceA = a.price || 0;
                    const priceB = b.price || 0;
                    return priceA - priceB;
                    
                case 'price-desc':
                    const priceA2 = a.price || 0;
                    const priceB2 = b.price || 0;
                    return priceB2 - priceA2;
                    
                case 'ingredients-asc':
                    const ingredientsA = (a.ingredients[currentLang] || a.ingredients.de).length;
                    const ingredientsB = (b.ingredients[currentLang] || b.ingredients.de).length;
                    return ingredientsA - ingredientsB;
                    
                case 'ingredients-desc':
                    const ingredientsA2 = (a.ingredients[currentLang] || a.ingredients.de).length;
                    const ingredientsB2 = (b.ingredients[currentLang] || b.ingredients.de).length;
                    return ingredientsB2 - ingredientsA2;
                    
                default:
                    return 0;
            }
        });
    }
}

// ============================================
// FILTER TOGGLE FUNCTIONALITY  
// ============================================
class FilterToggle {
    constructor(languageManager) {
        this.languageManager = languageManager;
        this.isExpanded = localStorage.getItem('filterExpanded') === 'true';
        this.initializeToggle();
    }

    initializeToggle() {
        const toggleBtn = document.getElementById('filter-toggle');
        const filterContent = document.getElementById('filter-content');
        
        if (!toggleBtn || !filterContent) {
            console.warn('Filter toggle elements not found');
            return;
        }

        // Set initial state
        this.updateToggleState();

        // Add click listener
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFilter();
        });

        // Allow clicking on the entire header
        const filterHeader = document.querySelector('.filter-header');
        if (filterHeader) {
            filterHeader.addEventListener('click', () => {
                this.toggleFilter();
            });
        }

        // Listen for language changes
        document.addEventListener('languageChanged', () => {
            this.updateToggleState();
        });
    }

    toggleFilter() {
        this.isExpanded = !this.isExpanded;
        localStorage.setItem('filterExpanded', this.isExpanded.toString());
        this.updateToggleState();
    }

    updateToggleState() {
        const toggleBtn = document.getElementById('filter-toggle');
        const filterContent = document.getElementById('filter-content');
        
        if (!toggleBtn || !filterContent) return;

        const toggleText = toggleBtn.querySelector('.toggle-text');
        const currentLang = this.languageManager.getCurrentLanguage();
        
        // Multi-language toggle text
        const toggleTexts = {
            'de': {
                'show': 'Einblenden',
                'hide': 'Ausblenden'
            },
            'it': {
                'show': 'Mostra',
                'hide': 'Nascondi'
            },
            'en': {
                'show': 'Show',
                'hide': 'Hide'
            }
        };
        
        const texts = toggleTexts[currentLang] || toggleTexts['en'];
        
        if (this.isExpanded) {
            toggleBtn.classList.add('expanded');
            filterContent.classList.add('expanded');
            if (toggleText) toggleText.textContent = texts.hide;
        } else {
            toggleBtn.classList.remove('expanded');
            filterContent.classList.remove('expanded');
            if (toggleText) toggleText.textContent = texts.show;
        }
    }
}
