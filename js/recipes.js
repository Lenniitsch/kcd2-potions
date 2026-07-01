var store = {
    recipes: [],
    locales: { de: {}, it: {}, en: {} },
    lang: 'de',
};

var categoryOrder = ['Heiltrank', 'Kampf-Buff', 'Gift', 'Werken', 'Sonstiges', 'DLC/Quest'];

function findRecipe(recipeId) {
    for (var i = 0; i < store.recipes.length; i++) {
        if (store.recipes[i].id === recipeId) return store.recipes[i];
    }
    return null;
}

function renderStep(step) {
    var l = store.locales[store.lang].steps;
    var ing = store.locales[store.lang].ingredients;
    switch (step.type) {
        case 'base':           return l[step.key] || step.key || '';
        case 'ingredient':     return (step.qty || '?') + ' x ' + (ing[step.key] || step.key || '?');
        case 'grind':          return (step.qty || '?') + ' x ' + (ing[step.key] || step.key || '?') + ' ' + (l.grind || '');
        case 'boil':           return l.boil || '';
        case 'boil_bellows':   return l.boil_bellows || '';
        case 'distil':         return l.distil || '';
        case 'pour':           return l.pour || '';
        case 'cauldron_grind': return l.cauldron_grind || '';
        default:               return '';
    }
}

export function init(recipeUrl, localesDir) {
    return fetch(recipeUrl).then(function (r) { return r.json(); }).then(function (data) {
        store.recipes = data.recipes;
        return Promise.allSettled([
            fetch(localesDir + '/de.json').then(function (r) { return r.json(); }),
            fetch(localesDir + '/it.json').then(function (r) { return r.json(); }),
            fetch(localesDir + '/en.json').then(function (r) { return r.json(); }),
        ]);
    }).then(function (results) {
        if (results[0].status === 'fulfilled') store.locales.de = results[0].value;
        if (results[1].status === 'fulfilled') store.locales.it = results[1].value;
        if (results[2].status === 'fulfilled') store.locales.en = results[2].value;
    });
}

export function setLang(lang) {
    store.lang = lang;
}

export function getAll() {
    return store.recipes;
}

export function getName(recipeId) {
    var entry = store.locales[store.lang].recipes[recipeId];
    return entry ? entry.name : recipeId;
}

export function getEffect(recipeId) {
    var entry = store.locales[store.lang].recipes[recipeId];
    return entry && entry.effect ? entry.effect.henrys : '';
}

export function getIngredients(recipeId) {
    var recipe = findRecipe(recipeId);
    if (!recipe) return [];
    var ing = store.locales[store.lang].ingredients;
    return recipe.ingredients.map(function (item) {
        return item.qty + ' x ' + (ing[item.key] || item.key);
    });
}

export function getSteps(recipeId) {
    var recipe = findRecipe(recipeId);
    if (!recipe) return [];
    return recipe.steps.map(function (step) {
        return {
            description: renderStep(step),
            duration: step.duration,
            type: step.type,
        };
    });
}

export function getAllIngredients(recipes) {
    var map = new Map();
    (recipes || store.recipes).forEach(function (recipe) {
        recipe.ingredients.forEach(function (item) {
            if (!map.has(item.key)) {
                map.set(item.key, {
                    de: store.locales.de.ingredients[item.key],
                    it: store.locales.it.ingredients[item.key],
                    en: store.locales.en.ingredients[item.key],
                });
            }
        });
    });
    return map;
}

export function getAvailableIngredients(recipes, filtered) {
    var available = new Set();
    filtered.forEach(function (recipe) {
        recipe.ingredients.forEach(function (item) {
            available.add(item.key);
        });
    });
    return available;
}

export function filterRecipes(recipes, filters) {
    var source = recipes || store.recipes;
    if (!source) return [];
    return source.filter(function (recipe) {
        if (filters.category !== 'all' && recipe.category !== filters.category) {
            return false;
        }

        if (filters.search) {
            var q = filters.search.toLowerCase();
            var de = store.locales.de.recipes[recipe.id];
            var it = store.locales.it.recipes[recipe.id];
            var en = store.locales.en.recipes[recipe.id];
            var nameMatch = de.name.toLowerCase().indexOf(q) !== -1
                || it.name.toLowerCase().indexOf(q) !== -1
                || en.name.toLowerCase().indexOf(q) !== -1;
            var effectMatch = (de.effect && de.effect.henrys && de.effect.henrys.toLowerCase().indexOf(q) !== -1)
                || (it.effect && it.effect.henrys && it.effect.henrys.toLowerCase().indexOf(q) !== -1)
                || (en.effect && en.effect.henrys && en.effect.henrys.toLowerCase().indexOf(q) !== -1);
            if (!nameMatch && !effectMatch) return false;
        }

        if (filters.ingredients && filters.ingredients.size > 0) {
            var recipeKeys = recipe.ingredients.map(function (item) {
                return item.key;
            });
            var matchesAll = true;
            filters.ingredients.forEach(function (key) {
                if (recipeKeys.indexOf(key) === -1) matchesAll = false;
            });
            if (!matchesAll) return false;
        }

        return true;
    });
}

export function sortRecipes(recipes, sortKey) {
    var deRecipes = store.locales.de.recipes;

    function name(recipe) {
        return deRecipes[recipe.id].name;
    }

    var sorted = recipes.slice();

    sorted.sort(function (a, b) {
        var result = 0;
        switch (sortKey) {
            case 'name-asc':
                result = name(a).localeCompare(name(b), 'de');
                break;
            case 'name-desc':
                result = name(b).localeCompare(name(a), 'de');
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
                if (result === 0) result = name(a).localeCompare(name(b), 'de');
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
                if (result === 0) result = name(a).localeCompare(name(b), 'de');
                break;
            case 'price-asc':
                result = a.price - b.price;
                if (result === 0) result = name(a).localeCompare(name(b), 'de');
                break;
            case 'price-desc':
                result = b.price - a.price;
                if (result === 0) result = name(a).localeCompare(name(b), 'de');
                break;
            case 'ingredients-asc':
                result = a.ingredients.length - b.ingredients.length;
                if (result === 0) result = name(a).localeCompare(name(b), 'de');
                break;
            case 'ingredients-desc':
                result = b.ingredients.length - a.ingredients.length;
                if (result === 0) result = name(a).localeCompare(name(b), 'de');
                break;
        }
        return result;
    });

    return sorted;
}
