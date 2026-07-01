export async function fetchRecipes(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to load recipes: ' + response.status);
    }
    const data = await response.json();
    return data;
}

export function filterRecipes(recipes, filters) {
    if (!recipes) return [];
    return recipes.filter(function (recipe) {
        if (filters.category !== 'all' && recipe.category !== filters.category) {
            return false;
        }

        if (filters.search) {
            var q = filters.search.toLowerCase();
            var nameMatch = recipe.name.de.toLowerCase().indexOf(q) !== -1
                || recipe.name.it.toLowerCase().indexOf(q) !== -1
                || recipe.name.en.toLowerCase().indexOf(q) !== -1;
            var effectMatch = recipe.effect_description.de.toLowerCase().indexOf(q) !== -1
                || recipe.effect_description.it.toLowerCase().indexOf(q) !== -1
                || recipe.effect_description.en.toLowerCase().indexOf(q) !== -1;
            if (!nameMatch && !effectMatch) return false;
        }

        if (filters.ingredients && filters.ingredients.size > 0) {
            var recipeIngredientIds = recipe.ingredients.de.map(function (ing) {
                return ing.replace(/^\d+\s*x\s*/, '');
            });
            var allMatch = true;
            filters.ingredients.forEach(function (id) {
                if (recipeIngredientIds.indexOf(id) === -1) allMatch = false;
            });
            if (!allMatch) return false;
        }

        return true;
    });
}

export function getBaseLiquid(recipe, lang) {
    var steps = recipe.recipe_steps[lang] || recipe.recipe_steps.de;
    if (!steps || steps.length === 0) return '';
    return steps[0].description;
}

export function sortRecipes(recipes, sortKey) {
    var categoryOrder = ['Heiltrank', 'Kampf-Buff', 'Gift', 'Handwerk', 'Utility', 'DLC'];

    var sorted = recipes.slice();

    sorted.sort(function (a, b) {
        var result = 0;
        switch (sortKey) {
            case 'name-asc':
                result = a.name.de.localeCompare(b.name.de, 'de');
                break;
            case 'name-desc':
                result = b.name.de.localeCompare(a.name.de, 'de');
                break;
            case 'category-asc':
                var aIdx = categoryOrder.indexOf(a.category);
                var bIdx = categoryOrder.indexOf(b.category);
                if (aIdx === -1 && bIdx === -1) {
                    result = a.category.localeCompare(b.category);
                } else if (aIdx === -1) {
                    result = 1;
                } else if (bIdx === -1) {
                    result = -1;
                } else {
                    result = aIdx - bIdx;
                }
                if (result === 0) result = a.name.de.localeCompare(b.name.de, 'de');
                break;
            case 'category-desc':
                var aIdxD = categoryOrder.indexOf(a.category);
                var bIdxD = categoryOrder.indexOf(b.category);
                if (aIdxD === -1 && bIdxD === -1) {
                    result = b.category.localeCompare(a.category);
                } else if (aIdxD === -1) {
                    result = 1;
                } else if (bIdxD === -1) {
                    result = -1;
                } else {
                    result = bIdxD - aIdxD;
                }
                if (result === 0) result = a.name.de.localeCompare(b.name.de, 'de');
                break;
            case 'price-asc':
                result = a.price - b.price;
                if (result === 0) result = a.name.de.localeCompare(b.name.de, 'de');
                break;
            case 'price-desc':
                result = b.price - a.price;
                if (result === 0) result = a.name.de.localeCompare(b.name.de, 'de');
                break;
            case 'ingredients-asc':
                result = a.ingredients.de.length - b.ingredients.de.length;
                if (result === 0) result = a.name.de.localeCompare(b.name.de, 'de');
                break;
            case 'ingredients-desc':
                result = b.ingredients.de.length - a.ingredients.de.length;
                if (result === 0) result = a.name.de.localeCompare(b.name.de, 'de');
                break;
        }
        return result;
    });

    return sorted;
}

export function getAllIngredients(recipes) {
    var map = new Map();
    recipes.forEach(function (recipe) {
        recipe.ingredients.de.forEach(function (deIng, i) {
            var id = deIng.replace(/^\d+\s*x\s*/, '');
            if (!map.has(id)) {
                map.set(id, {
                    de: id,
                    it: (recipe.ingredients.it[i] || '').replace(/^\d+\s*x\s*/, ''),
                    en: (recipe.ingredients.en[i] || '').replace(/^\d+\s*x\s*/, ''),
                });
            }
        });
    });
    return map;
}

export function getAvailableIngredients(recipes, filteredRecipes) {
    var available = new Set();
    filteredRecipes.forEach(function (recipe) {
        recipe.ingredients.de.forEach(function (ing) {
            var id = ing.replace(/^\d+\s*x\s*/, '');
            available.add(id);
        });
    });
    return available;
}

var stepKeywords = {
    de: {
        base: ['wasser', 'wein', 'öl', 'alkohol', 'spirituosen'],
        cooking: ['kochen', 'köcheln', 'ziehen', 'blasebalg'],
        finishing: ['destillieren', 'einschenken', 'abfüllen'],
    },
    it: {
        base: ['acqua', 'vino', 'olio', 'alcol', 'spirito'],
        cooking: ['bollire', 'sobbollire', 'infusione', 'mantice'],
        finishing: ['distillare', 'versare'],
    },
    en: {
        base: ['water', 'wine', 'oil', 'spirits'],
        cooking: ['boil', 'simmer', 'infuse', 'bellows'],
        finishing: ['distill', 'pour'],
    },
};

export function categorizeStep(stepText, lang) {
    var lower = stepText.toLowerCase();
    var kw = stepKeywords[lang] || stepKeywords.en;

    var isIngredient = /^\d+\s*x\s*/.test(lower);
    if (isIngredient) return 'ingredient';

    var isCooking = kw.cooking.some(function (w) { return keywordMatch(lower, w); });
    if (isCooking) return 'cooking';

    var isFinishing = kw.finishing.some(function (w) { return keywordMatch(lower, w); });
    if (isFinishing) return 'finishing';

    var isBase = kw.base.some(function (w) { return keywordMatch(lower, w); });
    if (isBase) return 'base';

    return 'ingredient';
}

function keywordMatch(text, keyword) {
    var idx = text.indexOf(keyword);
    if (idx === -1) return false;
    var before = idx > 0 ? text.charAt(idx - 1) : ' ';
    var after = idx + keyword.length < text.length ? text.charAt(idx + keyword.length) : ' ';
    return (before === ' ' || before === '-' || before === '(') && (after === ' ' || after === '-' || after === ')' || after === '\n');
}
