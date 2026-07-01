import { el } from './dom.js';
import { getText } from './i18n.js';
import { setState, onState } from './state.js';
import { getSteps } from './recipes.js';

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
var nextStepSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';

var chevronDownSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

var brewPlaySvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6v4l4 10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2l4-10V3z"/><line x1="5" y1="3" x2="19" y2="3"/></svg>';

var checkSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

function TimerBar(container, recipe, getLang, getActiveStepIndex, setActiveStepIndex, getActiveStepIndices, _getTotalSteps, onPrevStep, onNextStep, onToggleMode, showTimedOnly, autoAdvance) {
    var timer = null;
    var lang = getLang();
    var cachedSteps = getSteps(recipe.id);
    var timerFinished = false;

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

    var progressRow = el('div', { class: 'timer-progress-row' }, modeSegment, progressLabelEl);

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
    var primaryBtn = el('button', {
        class: 'timer-action-primary',
        onClick: function (e) { e.stopPropagation(); handlePrimaryClick(e); }
    });
    var resetBtn = el('button', {
        class: 'timer-action-reset',
        onClick: function (e) { e.stopPropagation(); handleReset(); }
    });

    var actionRow = el('div', { class: 'timer-action-row' }, prevBtn, primaryBtn, resetBtn);

    var barEl = el('div', { class: 'timer-bar' }, progressRow, stepRow, progressTrack, actionRow);

    var headerIconEl = el('span', { class: 'timer-header-icon', html: brewPlaySvg });
    var headerLabelEl = el('span', { class: 'timer-header-label' }, getText('timer.brewModeOpen'));
    var headerChevronEl = el('span', { class: 'timer-header-chevron', html: chevronDownSvg });

    var timerOpen = false;

    var timerHeader = el('div', {
        class: 'timer-header',
        onClick: function (e) { e.stopPropagation(); toggleTimerBody(); },
    }, headerIconEl, headerLabelEl, headerChevronEl);

    var timerBody = el('div', { class: 'timer-body hidden' }, barEl);

    container.appendChild(timerHeader);
    container.appendChild(timerBody);
    timerBody.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

    updateModeSegment();
    showReadyState();

    function toggleTimerBody() {
        timerOpen = !timerOpen;
        if (timerOpen) {
            timerBody.classList.remove('hidden');
            headerChevronEl.classList.add('open');
            headerLabelEl.textContent = getText('timer.brewMode');
        } else {
            timerBody.classList.add('hidden');
            headerChevronEl.classList.remove('open');
            headerLabelEl.textContent = getText('timer.brewModeOpen');
        }
    }

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
        if (idx < 0 || indices.length === 0) return;
        var pos = indices.indexOf(idx);
        if (pos < 0) return;
        var x = pos + 1;
        var y = indices.length;
        progressLabelEl.textContent = getText('timer.stepXofY').replace('{0}', x).replace('{1}', y);
    }

    function updateNavButtons() {
        var indices = getActiveStepIndices();
        var idx = getActiveStepIndex();
        if (indices.length <= 1) {
            prevBtn.disabled = true;
            return;
        }
        prevBtn.disabled = (idx === indices[0]);
    }

    function handlePrimaryClick(e) {
        var idx = getActiveStepIndex();
        if (idx < 0) return;
        var step = cachedSteps[idx];
        if (!step) return;

        var indices = getActiveStepIndices();
        var pos = indices.indexOf(idx);
        var isLast = pos >= 0 && pos === indices.length - 1;

        if (isLast) {
            setActiveStepIndex(0);
            timerFinished = false;
            return;
        }

        if (timerFinished) {
            timerFinished = false;
            onNextStep();
            return;
        }

        if (!(step.duration > 0)) {
            onNextStep();
            return;
        }
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
        timerFinished = false;
        var idx = getActiveStepIndex();
        if (idx < 0) return;
        if (!cachedSteps[idx] || !(cachedSteps[idx].duration > 0)) return;
        var dur = cachedSteps[idx].duration;

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
        timer = null;
        setState('activeTimer', null);

        var indices = getActiveStepIndices();
        var idx = getActiveStepIndex();
        var pos = indices.indexOf(idx);
        var hasNext = pos >= 0 && pos < indices.length - 1;

        if (autoAdvance && hasNext) {
            onNextStep();
        } else {
            timerFinished = true;
            if (hasNext) {
                showNextStepState();
            } else {
                showReadyState();
            }
        }
    }

    function updateTickDisplay(remaining) {
        var idx = getActiveStepIndex();
        if (idx < 0) return;
        var step = cachedSteps[idx];
        if (!step) return;
        if (!(cachedSteps[idx].duration > 0)) return;
        stepLabelEl.textContent = step.description;
        countdownEl.textContent = formatTime(remaining);
        countdownEl.classList.remove('timer-countdown--disabled');
        var pct;
        if (timer && timer.running) {
            var elapsedMs = Date.now() - timer.startedAt;
            pct = (elapsedMs / (timer.duration * 1000)) * 100;
        } else if (timer && timer.pausedRemaining !== null) {
            pct = ((cachedSteps[idx].duration - timer.pausedRemaining) / cachedSteps[idx].duration) * 100;
        } else {
            pct = ((cachedSteps[idx].duration - remaining) / cachedSteps[idx].duration) * 100;
        }
        progressFill.style.width = Math.min(100, Math.max(0, pct)) + '%';
    }

    function showReadyState() {
        var idx = getActiveStepIndex();
        if (idx < 0) return;
        var step = cachedSteps[idx];
        if (!step) return;
        var isTimed = step.duration > 0;
        var indices = getActiveStepIndices();
        var pos = indices.indexOf(idx);
        var isLast = pos >= 0 && pos === indices.length - 1;
        stepLabelEl.textContent = step.description;
        progressFill.style.width = '0%';

        if (isLast) {
            countdownEl.textContent = '\u2014';
            countdownEl.classList.add('timer-countdown--disabled');
            primaryBtn.innerHTML = checkSvg + ' ' + getText('timer.brewComplete');
            primaryBtn.disabled = false;
            resetBtn.innerHTML = resetSvg + ' ' + getText('timer.reset');
            resetBtn.disabled = true;
        } else if (isTimed) {
            countdownEl.textContent = step.duration + 's';
            countdownEl.classList.remove('timer-countdown--disabled');
            primaryBtn.innerHTML = playSvg + ' ' + getText('timer.start');
            primaryBtn.disabled = false;
            resetBtn.innerHTML = resetSvg + ' ' + getText('timer.reset');
            resetBtn.disabled = false;
        } else {
            countdownEl.textContent = '\u2014';
            countdownEl.classList.add('timer-countdown--disabled');
            primaryBtn.innerHTML = nextStepSvg + ' ' + getText('timer.nextStep');
            primaryBtn.disabled = false;
            resetBtn.innerHTML = resetSvg + ' ' + getText('timer.reset');
            resetBtn.disabled = true;
        }

        primaryBtn.classList.remove('timer-action-primary--running');
        updateNavButtons();
        updateProgressLabel();
    }

    function showNextStepState() {
        var idx = getActiveStepIndex();
        if (idx < 0) return;
        var step = cachedSteps[idx];
        if (!step) return;
        stepLabelEl.textContent = step.description;
        countdownEl.textContent = '\u2014';
        countdownEl.classList.add('timer-countdown--disabled');
        progressFill.style.width = '0%';
        primaryBtn.innerHTML = nextStepSvg + ' ' + getText('timer.nextStep');
        primaryBtn.disabled = false;
        resetBtn.innerHTML = resetSvg + ' ' + getText('timer.reset');
        resetBtn.disabled = true;
        primaryBtn.classList.remove('timer-action-primary--running');
        updateNavButtons();
        updateProgressLabel();
    }

    function showRunningState() {
        primaryBtn.classList.add('timer-action-primary--running');
        var idx = getActiveStepIndex();
        if (idx >= 0) {
            var step = cachedSteps[idx];
            if (step) stepLabelEl.textContent = step.description;
        }
        primaryBtn.innerHTML = pauseSvg + ' ' + getText('timer.pause');
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
        var idx = getActiveStepIndex();
        if (idx >= 0) {
            var step = cachedSteps[idx];
            if (step) stepLabelEl.textContent = step.description;
        }
        resetBtn.innerHTML = resetSvg + ' ' + getText('timer.reset');
        resetBtn.disabled = false;
        updateNavButtons();
        updateProgressLabel();
    }

    function formatTime(totalSeconds) {
        totalSeconds = Math.max(0, totalSeconds);
        return Math.floor(totalSeconds) + 's';
    }

    var api = {
        setMode: function (timed) {
            showTimedOnly = timed;
            updateModeSegment();
            updateProgressLabel();
            updateNavButtons();
            showReadyState();
        },
        setStep: function (idx) {
            if (timer) {
                timer.destroy();
                timer = null;
                setState('activeTimer', null);
            }
            timerFinished = false;
            showReadyState();
        },
        updateLanguage: function (newLang) {
            lang = newLang;
            cachedSteps = getSteps(recipe.id);
            headerLabelEl.textContent = timerOpen ? getText('timer.brewMode') : getText('timer.brewModeOpen');
            if (!timer) {
                var idx = getActiveStepIndex();
                if (idx >= 0) {
                    var step = cachedSteps[idx];
                    if (step) stepLabelEl.textContent = step.description;
                }
                showReadyState();
            } else if (timer.running) {
                var idx = getActiveStepIndex();
                if (idx >= 0) {
                    var step = cachedSteps[idx];
                    if (step) stepLabelEl.textContent = step.description;
                }
                showRunningState();
            } else {
                var idx = getActiveStepIndex();
                if (idx >= 0) {
                    var step = cachedSteps[idx];
                    if (step) stepLabelEl.textContent = step.description;
                }
                showPausedState();
            }
        },
        destroy: function () {
            if (timer) {
                timer.destroy();
                timer = null;
            }
            globalUnsub();
            if (timerHeader.parentNode) timerHeader.parentNode.removeChild(timerHeader);
            if (timerBody.parentNode) timerBody.parentNode.removeChild(timerBody);
        }
    };

    return api;
}

export { Timer, TimerBar };
