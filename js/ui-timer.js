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

var prevSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
var nextSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
var playSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
var pauseSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
var resetSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>';

function TimerBar(container, recipe, getLang, getActiveStepIndex, setActiveStepIndex, getActiveStepIndices, getTotalSteps, onPrevStep, onNextStep, onToggleMode, showTimedOnly) {
    var timer = null;
    var lang = getLang();
    var pulseTimeout = null;
    var barAnimInterval = null;

    var progressLabelEl = el('span', { class: 'timer-progress-label' });

    var timedSegBtn = el('button', {
        class: 'timer-mode-seg-btn active',
        onClick: function (e) { e.stopPropagation(); onToggleMode(); }
    });
    var allSegBtn = el('button', {
        class: 'timer-mode-seg-btn',
        onClick: function (e) { e.stopPropagation(); onToggleMode(); }
    });
    var modeSegment = el('div', { class: 'timer-mode-segment' }, timedSegBtn, allSegBtn);

    var progressRow = el('div', { class: 'timer-progress-row' }, progressLabelEl, modeSegment);

    var stepLabelEl = el('span', { class: 'timer-bar-step-label' });
    var countdownEl = el('span', { class: 'timer-countdown' });

    var stepRow = el('div', { class: 'timer-step-row' }, stepLabelEl, countdownEl);

    var progressFill = el('div', { class: 'timer-bar-progress-fill' });
    var progressTrack = el('div', { class: 'timer-bar-progress-track' }, progressFill);

    var prevBtn = el('button', {
        class: 'timer-nav-btn',
        html: prevSvg,
        'aria-label': getText('timer.prevStep'),
        onClick: function (e) { e.stopPropagation(); onPrevStep(); }
    });
    var nextBtn = el('button', {
        class: 'timer-nav-btn',
        html: nextSvg,
        'aria-label': getText('timer.nextStep'),
        onClick: function (e) { e.stopPropagation(); onNextStep(); }
    });
    var primaryBtn = el('button', {
        class: 'timer-action-primary',
        onClick: function (e) { e.stopPropagation(); handlePrimaryClick(e); }
    });
    var resetBtn = el('button', {
        class: 'timer-action-reset',
        onClick: function (e) { e.stopPropagation(); handleReset(); }
    });

    var actionRow = el('div', { class: 'timer-action-row' }, prevBtn, nextBtn, primaryBtn, resetBtn);

    var barEl = el('div', { class: 'timer-bar' }, progressRow, stepRow, progressTrack, actionRow);

    container.appendChild(barEl);
    barEl.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

    updateModeSegment();
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

    function updateModeSegment() {
        timedSegBtn.textContent = getText('timer.modeTimed');
        allSegBtn.textContent = getText('timer.modeAll');
        if (showTimedOnly) {
            timedSegBtn.classList.add('active');
            allSegBtn.classList.remove('active');
        } else {
            allSegBtn.classList.add('active');
            timedSegBtn.classList.remove('active');
        }
    }

    function updateProgressLabel() {
        var indices = getActiveStepIndices();
        var idx = getActiveStepIndex();
        var pos = indices.indexOf(idx);
        var x = pos >= 0 ? pos + 1 : 0;
        var y = indices.length;
        progressLabelEl.textContent = getText('timer.stepXofY').replace('{0}', x).replace('{1}', y);
    }

    function updateNavButtons() {
        var indices = getActiveStepIndices();
        var idx = getActiveStepIndex();
        if (indices.length <= 1) {
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            return;
        }
        prevBtn.disabled = (idx === indices[0]);
        nextBtn.disabled = (idx === indices[indices.length - 1]);
    }

    function handlePrimaryClick(e) {
        if (!timer || !timer.running) {
            if (timer && timer.pausedRemaining !== null) {
                handleResume();
            } else {
                handleStart();
            }
        } else {
            handlePause();
        }
    }

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
        startBarAnimation(idx, dur);
    }

    function handlePause() {
        if (!timer || !timer.running) return;
        timer.pause();
        updateTickDisplay(timer.pausedRemaining);
        showPausedState();
        stopBarAnimation();
    }

    function handleResume() {
        if (!timer) return;
        timer.resume();
        showRunningState();
        startBarAnimation(timer.stepIndex, timer.duration);
    }

    function handleReset() {
        if (!timer) return;
        timer.destroy();
        timer = null;
        setState('activeTimer', null);
        stopBarAnimation();
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
        stopBarAnimation();
        showReadyState();
    }

    function startBarAnimation(stepIdx, totalDur) {
        stopBarAnimation();
        var startTime = Date.now();
        barAnimInterval = setInterval(function () {
            var elapsed = (Date.now() - startTime) / 1000;
            var pct = Math.min(100, (elapsed / totalDur) * 100);
            progressFill.style.width = Math.max(0, pct) + '%';
        }, 100);
    }

    function stopBarAnimation() {
        if (barAnimInterval) {
            clearInterval(barAnimInterval);
            barAnimInterval = null;
        }
    }

    function updateTickDisplay(remaining) {
        var idx = getActiveStepIndex();
        if (idx < 0) return;
        var steps = recipe.recipe_steps.de;
        var step = (recipe.recipe_steps[lang] || recipe.recipe_steps.de)[idx];
        if (steps[idx].duration <= 0) return;
        stepLabelEl.textContent = step.description;
        countdownEl.textContent = formatTime(remaining);
        countdownEl.classList.remove('timer-countdown--disabled');
        var pct = ((steps[idx].duration - remaining) / steps[idx].duration) * 100;
        progressFill.style.width = Math.min(100, Math.max(0, pct)) + '%';
    }

    function showReadyState() {
        var idx = getActiveStepIndex();
        if (idx < 0) return;
        var step = (recipe.recipe_steps[lang] || recipe.recipe_steps.de)[idx];
        if (!step) return;
        var isTimed = step.duration > 0;
        stepLabelEl.textContent = step.description;
        progressFill.style.width = '0%';

        if (isTimed) {
            countdownEl.textContent = step.duration + 's';
            countdownEl.classList.remove('timer-countdown--disabled');
            primaryBtn.innerHTML = playSvg + ' ' + getText('timer.start');
            primaryBtn.disabled = false;
            resetBtn.innerHTML = resetSvg + ' ' + getText('timer.reset');
            resetBtn.disabled = false;
        } else {
            countdownEl.textContent = '\u2014';
            countdownEl.classList.add('timer-countdown--disabled');
            primaryBtn.innerHTML = playSvg + ' ' + getText('timer.start');
            primaryBtn.disabled = true;
            resetBtn.innerHTML = resetSvg + ' ' + getText('timer.reset');
            resetBtn.disabled = true;
        }

        primaryBtn.classList.remove('timer-action-primary--running');
        updateNavButtons();
        updateProgressLabel();
    }

    function showRunningState() {
        primaryBtn.classList.add('timer-action-primary--running');
        primaryBtn.disabled = false;
        resetBtn.innerHTML = resetSvg + ' ' + getText('timer.reset');
        resetBtn.disabled = false;
        updateNavButtons();
        updateProgressLabel();
    }

    function showPausedState() {
        primaryBtn.innerHTML = playSvg + ' ' + getText('timer.resume');
        primaryBtn.classList.remove('timer-action-primary--running');
        primaryBtn.disabled = false;
        resetBtn.innerHTML = resetSvg + ' ' + getText('timer.reset');
        resetBtn.disabled = false;
        updateNavButtons();
        updateProgressLabel();
    }

    function formatTime(totalSeconds) {
        totalSeconds = Math.max(0, totalSeconds);
        var m = Math.floor(totalSeconds / 60);
        var s = totalSeconds % 60;
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    var api = {
        setMode: function (timed) {
            showTimedOnly = timed;
            updateModeSegment();
            updateProgressLabel();
        },
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
            stopBarAnimation();
            globalUnsub();
            if (barEl.parentNode) barEl.parentNode.removeChild(barEl);
        }
    };

    return api;
}

export { Timer, TimerBar };
