/*
 * generator.js — Clulee Workout Generator
 * ─────────────────────────────────────────────────────────────────
 * Takes quiz answers and generates a personalized workout program.
 * Handles pain point exclusions, prenatal, and postpartum tracks.
 * ─────────────────────────────────────────────────────────────────
 */

(function () {

  var exerciseDb = null;

  // ── LOAD EXERCISE DATABASE ───────────────────────────────────────
  async function loadExercises() {
    if (exerciseDb) return exerciseDb;
    try {
      var response = await fetch('/data/exercises.json');
      var data = await response.json();
      exerciseDb = data.exercises;
      return exerciseDb;
    } catch (err) {
      console.error('Failed to load exercises:', err);
      return [];
    }
  }

  // ── EQUIPMENT FILTER ─────────────────────────────────────────────
  var EQUIPMENT_MAP = {
    gym: ['barbell', 'dumbbell', 'cable', 'machine', 'bench', 'bodyweight', 'resistance_band'],
    home: ['dumbbell', 'resistance_band', 'bench', 'bodyweight'],
    bodyweight: ['bodyweight']
  };

  function equipmentAllowed(exercise, equipmentLevel) {
    var allowed = EQUIPMENT_MAP[equipmentLevel] || EQUIPMENT_MAP.gym;
    return exercise.equipment.some(function (eq) {
      return allowed.indexOf(eq) !== -1;
    });
  }

  // ── PAIN POINT EXCLUSION ─────────────────────────────────────────
  function isExcluded(exercise, limitations) {
    if (!limitations || limitations.length === 0) return false;
    if (limitations.indexOf('none') !== -1) return false;
    return exercise.excludeIf.some(function (tag) {
      return limitations.indexOf(tag) !== -1;
    });
  }

  // ── GENDER FILTER ────────────────────────────────────────────────
  function genderAllowed(exercise, gender) {
    if (exercise.gender === 'both') return true;
    if (gender === 'both') return exercise.gender === 'both';
    return exercise.gender === gender || exercise.gender === 'both';
  }

  // ── PRENATAL FILTER ──────────────────────────────────────────────
  function prenatalAllowed(exercise, trimester) {
    if (!trimester) return true;
    return exercise.prenatalSafe.indexOf(parseInt(trimester)) !== -1;
  }

  // ── POSTPARTUM FILTER ────────────────────────────────────────────
  function postpartumAllowed(exercise, stage) {
    if (!stage) return true;
    return exercise.postpartumSafe.indexOf(parseInt(stage)) !== -1;
  }

  // ── FILTER POOL ──────────────────────────────────────────────────
  function filterPool(exercises, answers) {
    return exercises.filter(function (ex) {
      // Equipment
      if (!equipmentAllowed(ex, answers.equipment)) return false;
      // Gender
      if (!genderAllowed(ex, answers.gender)) return false;
      // Pain exclusions
      if (isExcluded(ex, answers.limitations)) return false;
      // Prenatal
      if (answers.goal === 'prenatal' && !prenatalAllowed(ex, answers.trimester)) return false;
      // Postpartum
      if (answers.goal === 'postpartum' && !postpartumAllowed(ex, answers.postpartumStage)) return false;
      return true;
    });
  }

  // ── VOLUME SETTINGS ──────────────────────────────────────────────
  function getVolume(answers) {
    // Base exercise count per session
    var count = { beginner: 5, intermediate: 7, advanced: 9 };
    var base = count[answers.experience] || 6;

    // Energy multiplier
    var mult = { high: 1.0, moderate: 0.85, low: 0.70 };
    var factor = mult[answers.energy] || 1.0;

    // Prenatal/postpartum always beginner volume
    if (answers.goal === 'prenatal') base = 5;
    if (answers.goal === 'postpartum' && parseInt(answers.postpartumStage) <= 2) base = 4;

    return Math.max(4, Math.round(base * factor));
  }

  // ── REP/REST SETTINGS ────────────────────────────────────────────
  function getPrescription(answers) {
    var presets = {
      strength:     { sets: 4, reps: '5-8',   rest: 120 },
      performance:  { sets: 4, reps: '6-8',   rest: 120 },
      energy:       { sets: 3, reps: '15-20', rest: 45  },
      feel_stronger:{ sets: 3, reps: '10-12', rest: 75  },
      prenatal:     { sets: 3, reps: '12-15', rest: 60  },
      postpartum:   { sets: 2, reps: '12-15', rest: 60  },
      general:      { sets: 3, reps: '10-12', rest: 60  }
    };
    return presets[answers.goal] || presets.general;
  }

  // ── TRAINING SPLIT ───────────────────────────────────────────────
  var SPLITS = {
    2: {
      name: 'Full Body',
      days: [
        { label: 'Full Body A', muscles: ['glutes', 'hamstrings', 'back', 'core', 'shoulders'] },
        { label: 'Full Body B', muscles: ['quads', 'hamstrings', 'chest', 'back', 'core'] }
      ]
    },
    4: {
      name: 'Upper / Lower',
      days: [
        { label: 'Lower Body',       muscles: ['glutes', 'hamstrings', 'quads', 'core'] },
        { label: 'Upper Body',       muscles: ['back', 'chest', 'shoulders', 'biceps', 'triceps'] },
        { label: 'Lower Body Power', muscles: ['glutes', 'quads', 'hamstrings', 'core'] },
        { label: 'Upper Body Strength', muscles: ['back', 'chest', 'shoulders', 'biceps'] }
      ]
    },
    5: {
      name: 'Push / Pull / Legs',
      days: [
        { label: 'Push',       muscles: ['chest', 'shoulders', 'triceps'] },
        { label: 'Pull',       muscles: ['back', 'biceps'] },
        { label: 'Legs',       muscles: ['glutes', 'hamstrings', 'quads', 'core'] },
        { label: 'Push',       muscles: ['chest', 'shoulders', 'triceps'] },
        { label: 'Pull and Core', muscles: ['back', 'biceps', 'core'] }
      ]
    }
  };

  var PRENATAL_SPLITS = {
    1: {
      name: 'Prenatal Safe — First Trimester',
      days: [
        { label: 'Full Body Strength', muscles: ['glutes', 'back', 'shoulders', 'core'] },
        { label: 'Lower Body and Mobility', muscles: ['quads', 'glutes', 'hamstrings', 'mobility'] },
        { label: 'Upper Body and Breathing', muscles: ['back', 'shoulders', 'biceps', 'core'] }
      ]
    },
    2: {
      name: 'Prenatal Safe — Second Trimester',
      days: [
        { label: 'Supported Lower Body', muscles: ['glutes', 'quads', 'hamstrings', 'mobility'] },
        { label: 'Upper Body Strength', muscles: ['back', 'shoulders', 'biceps', 'core'] },
        { label: 'Full Body Movement', muscles: ['glutes', 'back', 'shoulders', 'mobility'] }
      ]
    },
    3: {
      name: 'Prenatal Safe — Third Trimester',
      days: [
        { label: 'Gentle Movement and Mobility', muscles: ['mobility', 'core', 'glutes'] },
        { label: 'Breathing and Pelvic Floor', muscles: ['core', 'mobility'] },
        { label: 'Supported Strength', muscles: ['glutes', 'back', 'shoulders'] }
      ]
    }
  };

  var POSTPARTUM_SPLITS = {
    1: {
      name: 'Early Recovery — Under 6 Weeks',
      days: [
        { label: 'Breathing and Pelvic Floor', muscles: ['core', 'mobility'] },
        { label: 'Gentle Walking and Recovery', muscles: ['cardio', 'mobility'] }
      ]
    },
    2: {
      name: 'Gentle Return — 6 Weeks to 3 Months',
      days: [
        { label: 'Pelvic Floor and Core', muscles: ['core', 'mobility'] },
        { label: 'Gentle Lower Body', muscles: ['glutes', 'quads', 'mobility'] },
        { label: 'Upper Body and Breathing', muscles: ['back', 'shoulders', 'core'] }
      ]
    },
    3: {
      name: 'Rebuilding — 3 to 6 Months',
      days: [
        { label: 'Lower Body Strength', muscles: ['glutes', 'hamstrings', 'quads', 'core'] },
        { label: 'Upper Body and Core', muscles: ['back', 'shoulders', 'biceps', 'core'] },
        { label: 'Full Body Movement', muscles: ['glutes', 'back', 'shoulders', 'mobility'] }
      ]
    },
    4: {
      name: 'Full Strength Return — 6 Months Plus',
      days: [
        { label: 'Lower Body Power', muscles: ['glutes', 'hamstrings', 'quads', 'core'] },
        { label: 'Upper Body Strength', muscles: ['back', 'chest', 'shoulders', 'biceps'] },
        { label: 'Full Body', muscles: ['glutes', 'back', 'shoulders', 'core'] },
        { label: 'Lower Body and Core', muscles: ['glutes', 'quads', 'hamstrings', 'core'] }
      ]
    }
  };

  function getSplit(answers) {
    if (answers.goal === 'prenatal') {
      return PRENATAL_SPLITS[parseInt(answers.trimester)] || PRENATAL_SPLITS[1];
    }
    if (answers.goal === 'postpartum') {
      return POSTPARTUM_SPLITS[parseInt(answers.postpartumStage)] || POSTPARTUM_SPLITS[1];
    }
    var days = parseInt(answers.days) || 3;
    if (days >= 5) return SPLITS[5];
    if (days === 4) return SPLITS[4];
    return SPLITS[2];
  }

  // ── PICK EXERCISES FOR A DAY ─────────────────────────────────────
  function pickExercisesForDay(pool, muscles, count, usedIds) {
    var selected = [];
    var lastMuscle = null;

    // Build prioritized list: compound first, then isolation
    var compounds = pool.filter(function (ex) {
      return ex.secondaryMuscles && ex.secondaryMuscles.length >= 2;
    });
    var isolations = pool.filter(function (ex) {
      return !ex.secondaryMuscles || ex.secondaryMuscles.length < 2;
    });

    var attempts = 0;
    var maxAttempts = count * 20;

    while (selected.length < count && attempts < maxAttempts) {
      attempts++;

      // Prioritize muscles in the day's target list
      var targetMuscle = muscles[selected.length % muscles.length];
      var candidates = pool.filter(function (ex) {
        return ex.muscleGroup === targetMuscle &&
               usedIds.indexOf(ex.id) === -1 &&
               ex.muscleGroup !== lastMuscle;
      });

      // Fallback: any muscle in the day's list
      if (candidates.length === 0) {
        candidates = pool.filter(function (ex) {
          return muscles.indexOf(ex.muscleGroup) !== -1 &&
                 usedIds.indexOf(ex.id) === -1 &&
                 ex.muscleGroup !== lastMuscle;
        });
      }

      // Fallback: any exercise not used
      if (candidates.length === 0) {
        candidates = pool.filter(function (ex) {
          return usedIds.indexOf(ex.id) === -1;
        });
      }

      if (candidates.length === 0) break;

      // Shuffle candidates and pick first
      candidates = shuffleArray(candidates);
      var pick = candidates[0];

      selected.push(pick);
      usedIds.push(pick.id);
      lastMuscle = pick.muscleGroup;
    }

    return selected;
  }

  // ── SHUFFLE ARRAY ────────────────────────────────────────────────
  function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  // ── BUILD EXERCISE ENTRY ─────────────────────────────────────────
  function buildExerciseEntry(ex, prescription) {
    return {
      id: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      secondaryMuscles: ex.secondaryMuscles || [],
      difficulty: ex.difficulty,
      equipment: ex.equipment,
      sets: prescription.sets,
      reps: ex.reps || prescription.reps,
      rest: ex.rest || prescription.rest,
      coachingCue: ex.coachingCue,
      mediaUrl: ex.mediaUrl,
      excludeIf: ex.excludeIf || []
    };
  }

  // ── GENERATE PROGRAM ─────────────────────────────────────────────
  async function generate(answers, callback) {
    var exercises = await loadExercises();
    if (!exercises || exercises.length === 0) {
      console.error('No exercises loaded');
      if (callback) callback(null);
      return;
    }

    // Filter pool based on all constraints
    var pool = filterPool(exercises, answers);

    if (pool.length < 8) {
      console.warn('Pool too small after filtering:', pool.length, '— relaxing constraints');
      // Relax: use full exercise db with only equipment filter
      pool = exercises.filter(function (ex) {
        return equipmentAllowed(ex, answers.equipment);
      });
    }

    var split = getSplit(answers);
    var prescription = getPrescription(answers);
    var volumePerDay = getVolume(answers);

    var programDays = [];
    var usedIds = [];

    split.days.forEach(function (day) {
      var dayExercises = pickExercisesForDay(pool, day.muscles, volumePerDay, usedIds);
      programDays.push({
        label: day.label,
        exercises: dayExercises.map(function (ex) {
          return buildExerciseEntry(ex, prescription);
        })
      });
    });

    var program = {
      generatedAt: new Date().toISOString(),
      splitName: split.name,
      goal: answers.goal,
      gender: answers.gender,
      experience: answers.experience,
      equipment: answers.equipment,
      limitations: answers.limitations || [],
      energy: answers.energy,
      trimester: answers.trimester || null,
      postpartumStage: answers.postpartumStage || null,
      days: programDays,
      isModified: (answers.limitations && answers.limitations.length > 0 && answers.limitations[0] !== 'none'),
      isPrenatal: answers.goal === 'prenatal',
      isPostpartum: answers.goal === 'postpartum'
    };

    // Save to Supabase
    await saveProgram(program);

    if (callback) callback(program);
    return program;
  }

  // ── SAVE PROGRAM TO SUPABASE ─────────────────────────────────────
  async function saveProgram(program) {
    try {
      var profileId = localStorage.getItem('profile_id');
      if (!profileId || !window.supabaseHelper) return;
      await window.supabaseHelper.client
        .from('profiles')
        .update({ workout_program: program })
        .eq('id', profileId);
    } catch (err) {
      console.error('Failed to save program:', err);
    }
  }

  // ── LOAD SAVED PROGRAM ───────────────────────────────────────────
  async function loadProgram() {
    try {
      var profileId = localStorage.getItem('profile_id');
      if (!profileId || !window.supabaseHelper) return null;
      var result = await window.supabaseHelper.client
        .from('profiles')
        .select('workout_program')
        .eq('id', profileId)
        .single();
      return result.data ? result.data.workout_program : null;
    } catch (err) {
      console.error('Failed to load program:', err);
      return null;
    }
  }

  // ── EXPOSE ───────────────────────────────────────────────────────
  window.quizGenerator = {
    generate: generate,
    loadProgram: loadProgram,
    saveProgram: saveProgram,
    filterPool: filterPool
  };

})();
