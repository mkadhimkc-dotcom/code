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

  // ── STEP SEQUENCE (branching) ────────────────────────────────────
  function getNextStep(current) {
    if (current === '1') {
      return answers.gender === 'her' ? '2a' : '2b';
    }
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
    var base = 8;
    if (answers.goal !== 'prenatal' && answers.goal !== 'postpartum') {
      base = 7;
    }
    return base;
  }

  function getStepNumber(stepId) {
    var order = ['1', '2a', '2b', '3', '4', '5', '6', '7a', '7b', '8'];
    var idx = order.indexOf(stepId);
    if (idx === -1) return 1;
    // Collapse 2a/2b into step 2
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
    var allSteps = document.querySelectorAll('.quiz-step');
    allSteps.forEach(function (s) { s.classList.remove('active'); });

    var target = document.querySelector('[data-step="' + stepId + '"]');
    if (target) target.classList.add('active');

    // Update progress
    var num = getStepNumber(stepId);
    var total = getTotalSteps();
    var pct = Math.round((num / total) * 100);
    var fill = document.getElementById('quizProgressFill');
    var text = document.getElementById('quizProgressText');
    if (fill) fill.style.width = pct + '%';
    if (text) text.textContent = 'Step ' + num + ' of ' + total;

    // Back button
    var backBtn = document.getElementById('quizBackBtn');
    if (backBtn) {
      backBtn.style.display = stepHistory.length > 0 ? 'block' : 'none';
    }
  }

  // ── OPEN QUIZ ────────────────────────────────────────────────────
  function openQuiz(retake) {
    isRetake = !!retake;
    answers = { gender: null, goal: null, experience: null, days: null, equipment: null, limitations: [], trimester: null, postpartumStage: null, energy: null };
    stepHistory = [];

    var overlay = document.getElementById('quiz-overlay');
    if (overlay) overlay.style.display = 'flex';

    // Close button only visible when retaking
    var closeBtn = document.getElementById('quizCloseBtn');
    if (closeBtn) closeBtn.style.display = isRetake ? 'flex' : 'none';

    // Reset all option selections
    document.querySelectorAll('.quiz-option').forEach(function (btn) {
      btn.classList.remove('selected');
    });
    document.querySelectorAll('.quiz-disclaimer-confirm input').forEach(function (cb) {
      cb.checked = false;
    });

    showStep('1');
    document.body.style.overflow = 'hidden';
  }

  // ── CLOSE QUIZ ───────────────────────────────────────────────────
  function closeQuiz() {
    var overlay = document.getElementById('quiz-overlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  // ── HANDLE SINGLE-SELECT OPTION ──────────────────────────────────
  function handleOptionClick(btn) {
    var step = btn.closest('.quiz-step');
    var stepId = step ? step.dataset.step : null;
    var question = btn.dataset.q;
    var value = btn.dataset.v;

    // Mark selected
    step.querySelectorAll('[data-q="' + question + '"]').forEach(function (b) {
      b.classList.remove('selected');
    });
    btn.classList.add('selected');

    // Store answer
    answers[question] = value;

    // Special: apply theme immediately on gender selection
    if (question === 'gender') {
      if (window.themeManager) {
        window.themeManager.apply(value === 'her' ? 'her' : 'him');
      }
    }

    // Validation for steps with disclaimers
    if (stepId === '7a') {
      var cb = document.getElementById('prenatalConfirm');
      if (!cb || !cb.checked) {
        if (window.appMain) window.appMain.showToast('Please confirm the disclaimer to continue');
        return;
      }
    }
    if (stepId === '7b') {
      var cb2 = document.getElementById('postpartumConfirm');
      if (!cb2 || !cb2.checked) {
        if (window.appMain) window.appMain.showToast('Please confirm the disclaimer to continue');
        return;
      }
    }

    // Auto-advance after short delay
    setTimeout(function () {
      advanceQuiz(stepId);
    }, 280);
  }

  // ── ADVANCE TO NEXT STEP ─────────────────────────────────────────
  function advanceQuiz(currentStepId) {
    var next = getNextStep(currentStepId);
    if (next === 'done') {
      finishQuiz();
      return;
    }
    stepHistory.push(currentStepId);
    showStep(next);
  }

  // ── HANDLE MULTI-SELECT (Q6 limitations) ────────────────────────
  function handleMultiSelect(btn) {
    var value = btn.dataset.v;
    var isNoneOption = btn.classList.contains('quiz-option-none');

    if (isNoneOption) {
      // Deselect everything else and select only None
      document.querySelectorAll('.quiz-option-multi').forEach(function (b) {
        b.classList.remove('selected');
      });
      btn.classList.add('selected');
      answers.limitations = ['none'];
    } else {
      // Deselect None if it was selected
      var noneBtn = document.querySelector('.quiz-option-none');
      if (noneBtn) noneBtn.classList.remove('selected');
      answers.limitations = answers.limitations.filter(function (v) { return v !== 'none'; });

      // Toggle this option
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        answers.limitations = answers.limitations.filter(function (v) { return v !== value; });
      } else {
        btn.classList.add('selected');
        if (answers.limitations.indexOf(value) === -1) {
          answers.limitations.push(value);
        }
      }
    }
  }

  // ── FINISH QUIZ ──────────────────────────────────────────────────
  function finishQuiz() {
    // Show generating state
    var steps = document.getElementById('quizSteps');
    var backBtn = document.getElementById('quizBackBtn');
    if (steps) steps.innerHTML = '<div class="quiz-generating"><div class="quiz-generating-spinner"></div><div class="quiz-generating-text">Building your program...</div><div class="quiz-generating-sub">This only takes a moment</div></div>';
    if (backBtn) backBtn.style.display = 'none';

    // Update progress to 100%
    var fill = document.getElementById('quizProgressFill');
    var text = document.getElementById('quizProgressText');
    if (fill) fill.style.width = '100%';
    if (text) text.textContent = 'Almost there...';

    // Save quiz answers to Supabase profile
    saveQuizAnswers(answers).then(function () {
      // Trigger generator
      if (window.quizGenerator) {
        window.quizGenerator.generate(answers, function (program) {
          closeQuiz();
          if (window.appMain) {
            window.appMain.showToast('Your program is ready!');
            window.appMain.setupDashboard();
          }
        });
      } else {
        // Generator not loaded yet — just close and show toast
        setTimeout(function () {
          closeQuiz();
          if (window.appMain) window.appMain.showToast('Program saved! Generator coming soon.');
        }, 1500);
      }
    });
  }

  // ── SAVE ANSWERS TO SUPABASE ─────────────────────────────────────
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
        // New user — show quiz after short delay so page loads first
        setTimeout(function () { openQuiz(false); }, 800);
      }
    } catch (err) {
      console.error('Quiz check error:', err);
    }
  }

  // ── SETUP EVENT LISTENERS ────────────────────────────────────────
  function setup() {
    var overlay = document.getElementById('quiz-overlay');
    if (!overlay) return;

    // Single-select options
    overlay.addEventListener('click', function (e) {
      var btn = e.target.closest('.quiz-option');
      if (!btn) return;

      // Multi-select question
      if (btn.classList.contains('quiz-option-multi')) {
        handleMultiSelect(btn);
        return;
      }

      // Single select
      handleOptionClick(btn);
    });

    // Limitations continue button
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
        if (stepHistory.length > 0) {
          var prev = stepHistory.pop();
          showStep(prev);
        }
      });
    }

    // Close button (retake only)
    var closeBtn = document.getElementById('quizCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        if (isRetake) closeQuiz();
      });
    }

    // Prenatal disclaimer — allow selecting answer only after checkbox
    var prenatalConfirm = document.getElementById('prenatalConfirm');
    if (prenatalConfirm) {
      prenatalConfirm.addEventListener('change', function () {
        var step = document.querySelector('[data-step="7a"]');
        if (step) {
          step.querySelectorAll('.quiz-option').forEach(function (btn) {
            btn.style.opacity = prenatalConfirm.checked ? '1' : '0.5';
            btn.style.pointerEvents = prenatalConfirm.checked ? 'auto' : 'none';
          });
        }
      });
      // Start locked
      var step7a = document.querySelector('[data-step="7a"]');
      if (step7a) {
        step7a.querySelectorAll('.quiz-option').forEach(function (btn) {
          btn.style.opacity = '0.5';
          btn.style.pointerEvents = 'none';
        });
      }
    }

    // Postpartum disclaimer — same pattern
    var postpartumConfirm = document.getElementById('postpartumConfirm');
    if (postpartumConfirm) {
      postpartumConfirm.addEventListener('change', function () {
        var step = document.querySelector('[data-step="7b"]');
        if (step) {
          step.querySelectorAll('.quiz-option').forEach(function (btn) {
            btn.style.opacity = postpartumConfirm.checked ? '1' : '0.5';
            btn.style.pointerEvents = postpartumConfirm.checked ? 'auto' : 'none';
          });
        }
      });
      var step7b = document.querySelector('[data-step="7b"]');
      if (step7b) {
        step7b.querySelectorAll('.quiz-option').forEach(function (btn) {
          btn.style.opacity = '0.5';
          btn.style.pointerEvents = 'none';
        });
      }
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
    getAnswers: function () { return answers; }
  };

})();
