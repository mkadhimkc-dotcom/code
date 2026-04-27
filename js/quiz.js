/*
 * quiz.js — Clulee Onboarding Quiz
 * ─────────────────────────────────────────────────────────────────
 * Branching 8-question quiz that collects user preferences
 * and triggers workout program generation.
 * ─────────────────────────────────────────────────────────────────
 */

(function () {

  // ── STATE ────────────────────────────────────────────────────────
  var answers = {
    gender: null,
    goal: null,
    experience: null,
    days: null,
    equipment: null,
    limitations: [],
    trimester: null,
    postpartumStage: null,
    energy: null
  };

  var stepHistory = [];
  var isRetake = false;
  var currentProgram = null;

  // ── STEP SEQUENCE (branching) ────────────────────────────────────
  function getNextStep(current) {
    if (current === '1') return answers.gender === 'her' ? '2a' : '2b';
    if (current === '2a' || current === '2b') return '3';
    if (current === '3') return '4';
    if (current === '4') return '5';
    if (current === '5') return '6';
    if (current === '6') {
      if (answers.goal === 'prenatal') return '7a';
      if (answers.goal === 'postpartum') return '7b';
      return '8';
    }
    if (current === '7a' || current === '7b') return '8';
    if (current === '8') return 'done';
    return 'done';
  }

  function getTotalSteps() {
    return (answers.goal === 'prenatal' || answers.goal === 'postpartum') ? 8 : 7;
  }

  function getStepNumber(stepId) {
    if (stepId === '1') return 1;
    if (stepId === '2a' || stepId === '2b') return 2;
    if (stepId === '3') return 3;
    if (stepId === '4') return 4;
    if (stepId === '5') return 5;
    if (stepId === '6') return 6;
    if (stepId === '7a' || stepId === '7b') return 7;
    if (stepId === '8') return getTotalSteps();
    return 1;
  }

  // ── SHOW STEP ────────────────────────────────────────────────────
  function showStep(stepId) {
    document.querySelectorAll('.quiz-step').forEach(function (s) {
      s.classList.remove('active');
    });
    var target = document.querySelector('[data-step="' + stepId + '"]');
    if (target) target.classList.add('active');

    var num = getStepNumber(stepId);
    var total = getTotalSteps();
    var pct = Math.round((num / total) * 100);
    var fill = document.getElementById('quizProgressFill');
    var text = document.getElementById('quizProgressText');
    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = 'Step ' + num + ' of ' + total;

    var backBtn = document.getElementById('quizBackBtn');
    if (backBtn) backBtn.style.display = stepHistory.length > 0 ? 'block' : 'none';
  }

  // ── OPEN QUIZ ────────────────────────────────────────────────────
  function openQuiz(retake) {
    isRetake = !!retake;
    currentProgram = null;
    answers = { gender: null, goal: null, experience: null, days: null, equipment: null, limitations: [], trimester: null, postpartumStage: null, energy: null };
    stepHistory = [];

    // Hide preview if visible
    hidePreview();

    var overlay = document.getElementById('quiz-overlay');
    if (overlay) overlay.style.display = 'flex';

    var closeBtn = document.getElementById('quizCloseBtn');
    if (closeBtn) closeBtn.style.display = isRetake ? 'flex' : 'none';

    // Reset selections
    document.querySelectorAll('.quiz-option').forEach(function (btn) {
      btn.classList.remove('selected');
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
    });
    document.querySelectorAll('.quiz-disclaimer-confirm input').forEach(function (cb) {
      cb.checked = false;
    });

    // Restore quiz steps HTML if it was replaced by generating state
    restoreQuizSteps();

    showStep('1');
    document.body.style.overflow = 'hidden';
  }

  // ── CLOSE QUIZ ───────────────────────────────────────────────────
  function closeQuiz() {
    var overlay = document.getElementById('quiz-overlay');
    if (overlay) overlay.style.display = 'none';
    hidePreview();
    document.body.style.overflow = '';
  }

  // ── RESTORE STEPS HTML ───────────────────────────────────────────
  var stepsHTML = null;
  function restoreQuizSteps() {
    var stepsEl = document.getElementById('quizSteps');
    if (!stepsEl) return;
    if (!stepsHTML) {
      stepsHTML = stepsEl.innerHTML;
    } else {
      stepsEl.innerHTML = stepsHTML;
      // Re-setup disclaimer locks
      setupDisclaimerLocks();
    }
  }

  // ── HANDLE SINGLE-SELECT ─────────────────────────────────────────
  function handleOptionClick(btn) {
    var step = btn.closest('.quiz-step');
    var stepId = step ? step.dataset.step : null;
    var question = btn.dataset.q;
    var value = btn.dataset.v;

    step.querySelectorAll('[data-q="' + question + '"]').forEach(function (b) {
      b.classList.remove('selected');
    });
    btn.classList.add('selected');
    answers[question] = value;

    if (question === 'gender' && window.themeManager) {
      window.themeManager.apply(value === 'her' ? 'her' : 'him');
    }

    // Disclaimer validation
    if (stepId === '7a') {
      var cb = document.getElementById('prenatalConfirm');
      if (!cb || !cb.checked) {
        if (window.appMain) window.appMain.showToast('Please confirm the disclaimer first');
        return;
      }
    }
    if (stepId === '7b') {
      var cb2 = document.getElementById('postpartumConfirm');
      if (!cb2 || !cb2.checked) {
        if (window.appMain) window.appMain.showToast('Please confirm the disclaimer first');
        return;
      }
    }

    setTimeout(function () { advanceQuiz(stepId); }, 280);
  }

  // ── ADVANCE ──────────────────────────────────────────────────────
  function advanceQuiz(currentStepId) {
    var next = getNextStep(currentStepId);
    if (next === 'done') { finishQuiz(); return; }
    stepHistory.push(currentStepId);
    showStep(next);
  }

  // ── MULTI-SELECT ─────────────────────────────────────────────────
  function handleMultiSelect(btn) {
    var value = btn.dataset.v;
    var isNone = btn.classList.contains('quiz-option-none');

    if (isNone) {
      document.querySelectorAll('.quiz-option-multi').forEach(function (b) {
        b.classList.remove('selected');
      });
      btn.classList.add('selected');
      answers.limitations = ['none'];
    } else {
      var noneBtn = document.querySelector('.quiz-option-none');
      if (noneBtn) noneBtn.classList.remove('selected');
      answers.limitations = answers.limitations.filter(function (v) { return v !== 'none'; });

      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        answers.limitations = answers.limitations.filter(function (v) { return v !== value; });
      } else {
        btn.classList.add('selected');
        if (answers.limitations.indexOf(value) === -1) answers.limitations.push(value);
      }
    }
  }

  // ── FINISH QUIZ → GENERATE ───────────────────────────────────────
  function finishQuiz() {
    var steps = document.getElementById('quizSteps');
    var backBtn = document.getElementById('quizBackBtn');
    if (steps) steps.innerHTML = '<div class="quiz-generating"><div class="quiz-generating-spinner"></div><div class="quiz-generating-text">Building your program...</div><div class="quiz-generating-sub">This only takes a moment</div></div>';
    if (backBtn) backBtn.style.display = 'none';

    var fill = document.getElementById('quizProgressFill');
    var text = document.getElementById('quizProgressText');
    if (fill) fill.style.width = '100%';
    if (text) text.textContent = 'Almost there...';

    saveQuizAnswers(answers).then(function () {
      if (window.quizGenerator) {
        window.quizGenerator.generate(answers, function (program) {
          currentProgram = program;
          // Hide quiz overlay and show preview
          var overlay = document.getElementById('quiz-overlay');
          if (overlay) overlay.style.display = 'none';
          document.body.style.overflow = '';
          showPreview(program);
        });
      } else {
        setTimeout(function () {
          closeQuiz();
          if (window.appMain) window.appMain.showToast('Program saved!');
        }, 1500);
      }
    });
  }

  // ── SAVE QUIZ ANSWERS ────────────────────────────────────────────
  async function saveQuizAnswers(data) {
    try {
      var profileId = localStorage.getItem('profile_id');
      if (!profileId || !window.supabaseHelper) return;
      await window.supabaseHelper.client
        .from('profiles')
        .update({
          quiz_gender: data.gender,
          quiz_goal: data.goal,
          quiz_experience: data.experience,
          quiz_days: data.days,
          quiz_equipment: data.equipment,
          quiz_limitations: data.limitations,
          quiz_trimester: data.trimester,
          quiz_postpartum_stage: data.postpartumStage,
          quiz_energy: data.energy,
          quiz_completed: true
        })
        .eq('id', profileId);
    } catch (err) {
      console.error('Failed to save quiz answers:', err);
    }
  }

  // ── CHECK IF QUIZ NEEDED ─────────────────────────────────────────
  async function checkAndShowQuiz() {
    try {
      var profileId = localStorage.getItem('profile_id');
      if (!profileId || !window.supabaseHelper) return;
      var result = await window.supabaseHelper.client
        .from('profiles')
        .select('quiz_completed')
        .eq('id', profileId)
        .single();
      if (result.data && !result.data.quiz_completed) {
        setTimeout(function () { openQuiz(false); }, 800);
      }
    } catch (err) {
      console.error('Quiz check error:', err);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // PREVIEW SCREEN — US-9.7
  // ══════════════════════════════════════════════════════════════

  function showPreview(program) {
    if (!program) return;

    var preview = document.getElementById('program-preview');
    if (!preview) return;

    // Populate header
    var nameEl = document.getElementById('previewProgramName');
    var badgesEl = document.getElementById('previewBadges');
    if (nameEl) nameEl.textContent = program.splitName;
    if (badgesEl) {
      badgesEl.innerHTML = '';
      if (program.isModified) {
        var b1 = document.createElement('span');
        b1.className = 'preview-badge preview-badge-modified';
        b1.textContent = 'Modified for your limitations';
        badgesEl.appendChild(b1);
      }
      if (program.isPrenatal) {
        var b2 = document.createElement('span');
        b2.className = 'preview-badge preview-badge-prenatal';
        b2.textContent = 'Prenatal Program';
        badgesEl.appendChild(b2);
      }
      if (program.isPostpartum) {
        var b3 = document.createElement('span');
        b3.className = 'preview-badge preview-badge-postpartum';
        b3.textContent = 'Recovery Training';
        badgesEl.appendChild(b3);
      }
    }

    // Populate days
    var daysEl = document.getElementById('previewDays');
    if (daysEl) {
      daysEl.innerHTML = '';
      program.days.forEach(function (day, dayIdx) {
        var dayDiv = document.createElement('div');
        dayDiv.className = 'preview-day';

        var dayHeader = document.createElement('div');
        dayHeader.className = 'preview-day-header';
        dayHeader.textContent = 'Day ' + (dayIdx + 1) + ': ' + day.label;
        dayDiv.appendChild(dayHeader);

        var exList = document.createElement('div');
        exList.className = 'preview-exercise-list';

        day.exercises.forEach(function (ex, exIdx) {
          var exRow = document.createElement('div');
          exRow.className = 'preview-exercise-row';

          var exInfo = document.createElement('div');
          exInfo.className = 'preview-exercise-info';

          var exName = document.createElement('div');
          exName.className = 'preview-exercise-name';
          exName.textContent = ex.name;

          var exMeta = document.createElement('div');
          exMeta.className = 'preview-exercise-meta';
          exMeta.textContent = ex.sets + ' sets x ' + ex.reps + ' | Rest: ' + ex.rest + 's';

          var exMuscle = document.createElement('span');
          exMuscle.className = 'preview-exercise-muscle';
          exMuscle.textContent = ex.muscleGroup;

          exInfo.appendChild(exName);
          exInfo.appendChild(exMeta);
          exInfo.appendChild(exMuscle);
          exRow.appendChild(exInfo);
          exList.appendChild(exRow);
        });

        dayDiv.appendChild(exList);
        daysEl.appendChild(dayDiv);
      });
    }

    preview.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function hidePreview() {
    var preview = document.getElementById('program-preview');
    if (preview) preview.style.display = 'none';
  }

  // ── SETUP DISCLAIMER LOCKS ───────────────────────────────────────
  function setupDisclaimerLocks() {
    function lockStep(stepSelector, checkboxId) {
      var step = document.querySelector(stepSelector);
      var cb = document.getElementById(checkboxId);
      if (!step || !cb) return;
      step.querySelectorAll('.quiz-option').forEach(function (btn) {
        btn.style.opacity = '0.5';
        btn.style.pointerEvents = 'none';
      });
      cb.addEventListener('change', function () {
        step.querySelectorAll('.quiz-option').forEach(function (btn) {
          btn.style.opacity = cb.checked ? '1' : '0.5';
          btn.style.pointerEvents = cb.checked ? 'auto' : 'none';
        });
      });
    }
    lockStep('[data-step="7a"]', 'prenatalConfirm');
    lockStep('[data-step="7b"]', 'postpartumConfirm');
  }

  // ── SETUP EVENT LISTENERS ────────────────────────────────────────
  function setup() {
    var overlay = document.getElementById('quiz-overlay');
    if (!overlay) return;

    // Cache the steps HTML on first load
    var stepsEl = document.getElementById('quizSteps');
    if (stepsEl) stepsHTML = stepsEl.innerHTML;

    // Single/multi select
    overlay.addEventListener('click', function (e) {
      var btn = e.target.closest('.quiz-option');
      if (!btn) return;
      if (btn.classList.contains('quiz-option-multi')) {
        handleMultiSelect(btn);
        return;
      }
      handleOptionClick(btn);
    });

    // Limitations continue
    var limitationsNext = document.getElementById('limitationsNext');
    if (limitationsNext) {
      limitationsNext.addEventListener('click', function () {
        if (answers.limitations.length === 0) {
          if (window.appMain) window.appMain.showToast('Please select at least one option');
          return;
        }
        advanceQuiz('6');
      });
    }

    // Back button
    var backBtn = document.getElementById('quizBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        if (stepHistory.length > 0) showStep(stepHistory.pop());
      });
    }

    // Close button
    var closeBtn = document.getElementById('quizCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        if (isRetake) closeQuiz();
      });
    }

    // Disclaimer locks
    setupDisclaimerLocks();

    // Preview — Accept button
    var acceptBtn = document.getElementById('previewAcceptBtn');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', function () {
        hidePreview();
        if (window.appMain) {
          window.appMain.showToast('Your program is ready!');
          window.appMain.setupDashboard();
          window.appMain.loadWorkoutsTab();
        }
      });
    }

    // Preview — Regenerate button
    var regenBtn = document.getElementById('previewRegenBtn');
    if (regenBtn) {
      regenBtn.addEventListener('click', function () {
        hidePreview();
        // Show quiz overlay with generating state
        var overlay2 = document.getElementById('quiz-overlay');
        if (overlay2) overlay2.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        var steps2 = document.getElementById('quizSteps');
        if (steps2) steps2.innerHTML = '<div class="quiz-generating"><div class="quiz-generating-spinner"></div><div class="quiz-generating-text">Generating a new program...</div><div class="quiz-generating-sub">This only takes a moment</div></div>';
        var fill = document.getElementById('quizProgressFill');
        if (fill) fill.style.width = '100%';

        // Re-run generator with same answers
        if (window.quizGenerator) {
          window.quizGenerator.generate(answers, function (program) {
            currentProgram = program;
            var overlay3 = document.getElementById('quiz-overlay');
            if (overlay3) overlay3.style.display = 'none';
            document.body.style.overflow = '';
            showPreview(program);
          });
        }
      });
    }
  }

  // ── INIT ─────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    setup();
  });

  // ── EXPOSE ───────────────────────────────────────────────────────
  window.cluleeQuiz = {
    open: openQuiz,
    close: closeQuiz,
    check: checkAndShowQuiz,
    getAnswers: function () { return answers; },
    showPreview: showPreview
  };

})();
