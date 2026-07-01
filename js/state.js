const state = {
    language: 'de',
    theme: 'dark',
    recipes: [],
    filters: {
        search: '',
        category: 'all',
        ingredients: new Set(),
        sort: 'name-asc',
        layout: 'grid',
        filterExpanded: false,
    },
    activeTab: 'recipes',
    activeTimer: null,
    settings: {
        mediaControls: false,
        autoAdvance: false,
        timedStepsOnly: true,
    },
};

const subscribers = {};

export function setState(key, value) {
    state[key] = value;
    if (subscribers[key]) {
        subscribers[key].forEach(function (fn) {
            try { fn(value); } catch (e) {}
        });
    }
}

export function onState(key, callback) {
    if (!subscribers[key]) {
        subscribers[key] = [];
    }
    subscribers[key].push(callback);
    return function unsubscribe() {
        var list = subscribers[key];
        if (list) {
            var idx = list.indexOf(callback);
            if (idx !== -1) list.splice(idx, 1);
        }
    };
}

export { state };
