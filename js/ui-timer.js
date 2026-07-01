import { el } from './dom.js';
import { getText } from './i18n.js';
import { setState, onState } from './state.js';

var Timer = function (recipeId, stepIndex, duration) {
    this.recipeId = recipeId;
    this.stepIndex = stepIndex;
    this.duration = duration;
    this.startedAt = null;
    this.running = false;
    this.pausedRemaining = null;
    this.intervalId = null;
    this._tickCb = null;
    this._finishCb = null;
};

Timer.prototype.start = function (duration) {
    if (duration != null) this.duration = duration;
    this.startedAt = Date.now();
    this.running = true;
    this.pausedRemaining = null;
    var self = this;
    this.intervalId = setInterval(function () {
        var remaining = self.getRemaining();
        if (self._tickCb) self._tickCb(remaining);
        if (remaining <= 0) {
            self._onFinish();
        }
    }, 250);
};

Timer.prototype.pause = function () {
    this.pausedRemaining = this.getRemaining();
    this.running = false;
    if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }
};

Timer.prototype.resume = function () {
    var elapsed = this.duration - this.pausedRemaining;
    this.startedAt = Date.now() - (elapsed * 1000);
    this.pausedRemaining = null;
    this.running = true;
    var self = this;
    this.intervalId = setInterval(function () {
        var remaining = self.getRemaining();
        if (self._tickCb) self._tickCb(remaining);
        if (remaining <= 0) {
            self._onFinish();
        }
    }, 250);
};

Timer.prototype.getRemaining = function () {
    if (!this.running) {
        return this.pausedRemaining !== null ? this.pausedRemaining : this.duration;
    }
    var elapsed = Math.floor((Date.now() - this.startedAt) / 1000);
    return Math.max(0, this.duration - elapsed);
};

Timer.prototype._onFinish = function () {
    this.running = false;
    if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }
    this.pausedRemaining = null;
    if (this._finishCb) this._finishCb();
};

Timer.prototype.onTick = function (cb) {
    this._tickCb = cb;
};

Timer.prototype.onFinish = function (cb) {
    this._finishCb = cb;
};

Timer.prototype.destroy = function () {
    if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }
    this.running = false;
    this._tickCb = null;
    this._finishCb = null;
};

function TimerBar(container, recipe, getLang, getActiveStepIndex, setActiveStepIndex, getTimedStepIndices) {
    var timer = null;
    var lang = getLang();
    var pulseTimeout = null;

    var stepLabelEl = el('span', { class: 'timer-bar-step-label' });
    var timeEl = el('span', { class: 'timer-bar-time' });

    var startBtn = el('button', {
        class: 'timer-bar-btn timer-bar-btn-start',
        onClick: function (e) { e.stopPropagation(); handleStart(); }
    });
    var pauseBtn = el('button', {
        class: 'timer-bar-btn timer-bar-btn-pause',
        onClick: function (e) { e.stopPropagation(); handlePause(); }
    });
    var resumeBtn = el('button', {
        class: 'timer-bar-btn timer-bar-btn-resume',
        onClick: function (e) { e.stopPropagation(); handleResume(); }
    });
    var resetBtn = el('button', {
        class: 'timer-bar-btn timer-bar-btn-reset',
        onClick: function (e) { e.stopPropagation(); handleReset(); }
    });

    var buttonRow = el('div', { class: 'timer-bar-buttons' }, startBtn);
    var progressFill = el('div', { class: 'timer-bar-progress-fill' });
    var progressTrack = el('div', { class: 'timer-bar-progress-track' }, progressFill);

    var row1 = el('div', { class: 'timer-bar-row' }, stepLabelEl, timeEl);
    var row2 = el('div', { class: 'timer-bar-row' }, buttonRow);

    var barEl = el('div', { class: 'timer-bar' }, row1, row2, progressTrack);

    container.appendChild(barEl);

    showReadyState();

    var globalUnsub = onState('activeTimer', function (value) {
        if (!timer) return;
        if (!value || value.recipeId !== timer.recipeId || value.stepIndex !== timer.stepIndex) {
            if (timer.running || timer.pausedRemaining !== null) {
                timer.destroy();
                timer = null;
                showReadyState();
            }
        }
    });

    function handleStart() {
        var idx = getActiveStepIndex();
        if (idx < 0) return;
        var steps = recipe.recipe_steps.de;
        if (!steps[idx] || steps[idx].duration <= 0) return;
        var dur = steps[idx].duration;

        if (timer) timer.destroy();

        timer = new Timer(recipe.id, idx, dur);
        timer.onTick(function (remaining) {
            updateTickDisplay(remaining);
        });
        timer.onFinish(function () {
            handleFinish();
        });
        timer.start();
        setState('activeTimer', { recipeId: recipe.id, stepIndex: idx });
        showRunningState();
    }

    function handlePause() {
        if (!timer || !timer.running) return;
        timer.pause();
        updateTickDisplay(timer.pausedRemaining);
        showPausedState();
    }

    function handleResume() {
        if (!timer) return;
        timer.resume();
        showRunningState();
    }

    function handleReset() {
        if (!timer) return;
        timer.destroy();
        timer = null;
        setState('activeTimer', null);
        showReadyState();
    }

    function handleFinish() {
        if (pulseTimeout) clearTimeout(pulseTimeout);
        barEl.classList.add('timer-pulse');
        pulseTimeout = setTimeout(function () {
            barEl.classList.remove('timer-pulse');
        }, 1800);
        timer = null;
        setState('activeTimer', null);
        showReadyState();
    }

    function updateTickDisplay(remaining) {
        var idx = getActiveStepIndex();
        if (idx < 0) return;
        var steps = recipe.recipe_steps.de;
        var step = (recipe.recipe_steps[lang] || recipe.recipe_steps.de)[idx];
        if (steps[idx].duration <= 0) return;
        stepLabelEl.textContent = step.description;
        timeEl.textContent = formatTime(remaining);
        timeEl.classList.remove('timer-bar-time--disabled');
        var pct = ((steps[idx].duration - remaining) / steps[idx].duration) * 100;
        progressFill.style.width = Math.min(100, Math.max(0, pct)) + '%';
    }

    function showReadyState() {
        var idx = getActiveStepIndex();
        if (idx < 0) return;
        var steps = recipe.recipe_steps[lang] || recipe.recipe_steps.de;
        if (!steps[idx]) return;
        var step = steps[idx];
        var isTimed = step.duration > 0;
        stepLabelEl.textContent = step.description;
        progressTrack.style.display = 'none';
        progressFill.style.width = '0%';

        if (isTimed) {
            timeEl.textContent = step.duration + 's';
            timeEl.classList.remove('timer-bar-time--disabled');
            buttonRow.innerHTML = '';
            buttonRow.appendChild(startBtn);
            startBtn.disabled = false;
            startBtn.textContent = getText('timer.start');
            resetBtn.disabled = false;
            resetBtn.textContent = getText('timer.reset');
        } else {
            timeEl.textContent = '\u2014';
            timeEl.classList.add('timer-bar-time--disabled');
            buttonRow.innerHTML = '';
            buttonRow.appendChild(startBtn);
            buttonRow.appendChild(resetBtn);
            startBtn.disabled = true;
            startBtn.textContent = getText('timer.start');
            resetBtn.disabled = true;
            resetBtn.textContent = getText('timer.reset');
        }
    }

    function showRunningState() {
        progressTrack.style.display = '';
        buttonRow.innerHTML = '';
        buttonRow.appendChild(pauseBtn);
        buttonRow.appendChild(resetBtn);
        pauseBtn.textContent = getText('timer.pause');
        resetBtn.textContent = getText('timer.reset');
    }

    function showPausedState() {
        buttonRow.innerHTML = '';
        buttonRow.appendChild(resumeBtn);
        buttonRow.appendChild(resetBtn);
        resumeBtn.textContent = getText('timer.resume');
        resetBtn.textContent = getText('timer.reset');
    }

    function formatTime(totalSeconds) {
        totalSeconds = Math.max(0, totalSeconds);
        var m = Math.floor(totalSeconds / 60);
        var s = totalSeconds % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    var api = {
        setStep: function (idx) {
            if (timer) {
                timer.destroy();
                timer = null;
                setState('activeTimer', null);
            }
            showReadyState();
        },
        updateLanguage: function (newLang) {
            lang = newLang;
            if (!timer || !timer.running) {
                showReadyState();
            } else if (timer.running) {
                showRunningState();
            } else if (timer.pausedRemaining !== null) {
                showPausedState();
            }
        },
        destroy: function () {
            if (timer) {
                timer.destroy();
                timer = null;
            }
            if (pulseTimeout) clearTimeout(pulseTimeout);
            globalUnsub();
            if (barEl.parentNode) barEl.parentNode.removeChild(barEl);
        }
    };

    return api;
}

export { Timer, TimerBar };
