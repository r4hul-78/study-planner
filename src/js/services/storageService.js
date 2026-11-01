import { generateId } from '../utils/idGenerator.js';
import { getTodayString, addDays } from '../utils/dateUtils.js';

export const CURRENT_SCHEMA_VERSION = '1.0.0';
export const STORAGE_KEY = 'studypilot_data_v1';

/**
 * Creates default seed data for immediate usability upon first run.
 */
export function createDefaultSeedData() {
  const today = getTodayString();
  const physExam = addDays(today, 12);
  const dsaExam = addDays(today, 20);

  const physicsId = generateId();
  const dsaId = generateId();

  const subjects = [
    {
      id: physicsId,
      name: 'Applied Physics',
      description: 'Optics, electromagnetic theory, and modern quantum mechanics.',
      color: '#10b981',
      examDate: physExam,
      importance: 5,
      preparationLevel: 2,
      archived: false,
      notes: 'Focus on derivations and numerical problems.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: dsaId,
      name: 'Data Structures & Algorithms',
      description: 'Advanced trees, graphs, dynamic programming, and complexity analysis.',
      color: '#3b82f6',
      examDate: dsaExam,
      importance: 4,
      preparationLevel: 3,
      archived: false,
      notes: 'Practice coding implementations and time complexity analysis.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const topics = [
    // Applied Physics Topics
    {
      id: generateId(),
      subjectId: physicsId,
      unitTitle: 'Unit 1: Wave Optics',
      title: 'Interference & Young\'s Double Slit',
      description: 'Coherent sources, path difference, and fringe width calculation.',
      difficulty: 'medium',
      importance: 4,
      estimatedMinutes: 45,
      status: 'completed',
      confidence: 4,
      dependencies: [],
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      subjectId: physicsId,
      unitTitle: 'Unit 1: Wave Optics',
      title: 'Diffraction & Resolving Power',
      description: 'Fraunhofer diffraction by single slit and diffraction grating.',
      difficulty: 'hard',
      importance: 5,
      estimatedMinutes: 60,
      status: 'in_progress',
      confidence: 2,
      dependencies: [],
      order: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      subjectId: physicsId,
      unitTitle: 'Unit 1: Wave Optics',
      title: 'Polarization & Brewster\'s Law',
      description: 'Linear, circular, and elliptical polarization and optical activity.',
      difficulty: 'easy',
      importance: 3,
      estimatedMinutes: 30,
      status: 'not_started',
      confidence: 3,
      dependencies: [],
      order: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      subjectId: physicsId,
      unitTitle: 'Unit 2: Quantum Physics',
      title: 'Photoelectric Effect & Compton Scattering',
      description: 'Photon theory of light and quantum energy transfer.',
      difficulty: 'medium',
      importance: 4,
      estimatedMinutes: 45,
      status: 'not_started',
      confidence: 3,
      dependencies: [],
      order: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      subjectId: physicsId,
      unitTitle: 'Unit 2: Quantum Physics',
      title: 'Schrödinger Wave Equation',
      description: 'Time-dependent and time-independent wave equations and particle in a box.',
      difficulty: 'hard',
      importance: 5,
      estimatedMinutes: 75,
      status: 'needs_revision',
      confidence: 1,
      dependencies: [],
      order: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },

    // DSA Topics
    {
      id: generateId(),
      subjectId: dsaId,
      unitTitle: 'Unit 1: Balanced Trees',
      title: 'Binary Search Trees & Rotations',
      description: 'BST invariants, search, insertion, and deletion algorithms.',
      difficulty: 'medium',
      importance: 4,
      estimatedMinutes: 45,
      status: 'completed',
      confidence: 5,
      dependencies: [],
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      subjectId: dsaId,
      unitTitle: 'Unit 1: Balanced Trees',
      title: 'AVL & Red-Black Trees',
      description: 'Self-balancing tree properties, balance factors, and rebalancing.',
      difficulty: 'hard',
      importance: 5,
      estimatedMinutes: 60,
      status: 'in_progress',
      confidence: 2,
      dependencies: [],
      order: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      subjectId: dsaId,
      unitTitle: 'Unit 2: Dynamic Programming',
      title: '0/1 Knapsack & Subset Sum',
      description: 'Optimal substructure, memoization tables, and space optimization.',
      difficulty: 'hard',
      importance: 5,
      estimatedMinutes: 60,
      status: 'not_started',
      confidence: 2,
      dependencies: [],
      order: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Default availability: Evening study slots Mon-Fri, Day+Evening on Sat-Sun
  const dailyAvailability = {
    0: [{ id: generateId(), startTime: '10:00', endTime: '13:00' }, { id: generateId(), startTime: '15:00', endTime: '18:00' }], // Sun
    1: [{ id: generateId(), startTime: '18:00', endTime: '21:00' }], // Mon
    2: [{ id: generateId(), startTime: '18:00', endTime: '21:00' }], // Tue
    3: [{ id: generateId(), startTime: '18:00', endTime: '21:00' }], // Wed
    4: [{ id: generateId(), startTime: '18:00', endTime: '21:00' }], // Thu
    5: [{ id: generateId(), startTime: '18:00', endTime: '21:00' }], // Fri
    6: [{ id: generateId(), startTime: '10:00', endTime: '13:00' }, { id: generateId(), startTime: '15:00', endTime: '18:00' }]  // Sat
  };

  const planId = generateId();
  const studyPlans = [
    {
      id: planId,
      name: 'Initial Sprint',
      startDate: today,
      endDate: addDays(today, 7),
      status: 'active',
      configuration: {
        selectedSubjectIds: [physicsId, dsaId],
        totalAvailableMinutes: 1260,
        totalAllocatedMinutes: 315,
        isOverCapacity: false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const sessions = [
    {
      id: generateId(),
      planId,
      subjectId: physicsId,
      topicId: topics[1].id, // Diffraction
      date: today,
      startTime: '18:00',
      endTime: '19:00',
      durationMinutes: 60,
      taskType: 'learning',
      priority: 85,
      objective: 'Master Fraunhofer single slit diffraction derivation.',
      suggestedActivities: ['Review lecture notes on wave fronts', 'Derive intensity formula', 'Solve 2 numericals'],
      completionCriteria: 'Explain condition for minima without looking at formula sheet.',
      status: 'scheduled',
      locked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: generateId(),
      planId,
      subjectId: dsaId,
      topicId: topics[6].id, // AVL Trees
      date: today,
      startTime: '19:15',
      endTime: '20:15',
      durationMinutes: 60,
      taskType: 'practice',
      priority: 80,
      objective: 'Practice LL, RR, LR, and RL tree rotation cases.',
      suggestedActivities: ['Draw rotation diagrams step-by-step', 'Trace balancing on 5 sample insertions'],
      completionCriteria: 'Correctly rebalance 3 unbalanced trees without mistakes.',
      status: 'scheduled',
      locked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: {
      id: generateId(),
      displayName: 'Aditya Raj',
      academicLevel: 'Undergraduate',
      course: 'Computer Science & Engineering',
      semesterOrYear: 'Semester 4',
      onboardingCompleted: true,
      preferences: {
        defaultSessionDuration: 45,
        defaultBreakDuration: 10,
        maxDailyHours: 5,
        preferredDays: [0, 1, 2, 3, 4, 5, 6],
        dailyAvailability,
        defaultPlanHorizonDays: 7,
        revisionRatio: 0.2
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    subjects,
    topics,
    studyPlans,
    sessions,
    progress: [
      {
        id: generateId(),
        subjectId: physicsId,
        topicId: topics[0].id,
        plannedMinutes: 45,
        actualMinutes: 50,
        completionStatus: 'completed',
        confidence: 4,
        notes: 'Understood fringe width derivation thoroughly.',
        completedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    settings: {
      theme: 'dark',
      geminiModel: 'gemini-2.5-flash',
      enableAiFeatures: true,
      storageSchemaVersion: CURRENT_SCHEMA_VERSION
    }
  };
}

export class StorageService {
  constructor() {
    this.storageKey = STORAGE_KEY;
  }

  loadData() {
    if (typeof localStorage === 'undefined') {
      return createDefaultSeedData();
    }

    try {
      const serialized = localStorage.getItem(this.storageKey);
      if (!serialized) {
        const seed = createDefaultSeedData();
        this.saveData(seed);
        return seed;
      }

      const parsed = JSON.parse(serialized);
      return this.migrateIfNeeded(parsed);
    } catch (err) {
      console.error('[StorageService] Error loading localStorage, falling back to seed:', err);
      return createDefaultSeedData();
    }
  }

  saveData(data) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (err) {
      console.error('[StorageService] Error saving to localStorage:', err);
      throw new Error('Local storage quota exceeded or storage disabled.');
    }
  }

  migrateIfNeeded(data) {
    if (!data.schemaVersion) {
      data.schemaVersion = CURRENT_SCHEMA_VERSION;
    }
    // Future migrations go here: if (data.schemaVersion === '1.0.0') { ... }
    return data;
  }

  exportBackup() {
    const data = this.loadData();
    return JSON.stringify({
      app: 'StudyPilot AI',
      exportedAt: new Date().toISOString(),
      ...data
    }, null, 2);
  }

  importBackup(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new Error('Invalid JSON format. Please upload a valid JSON backup file.');
    }

    // Atomic schema validation
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Backup data is empty or not an object.');
    }

    if (!Array.isArray(parsed.subjects) || !Array.isArray(parsed.topics)) {
      throw new Error('Backup is missing required subjects or topics arrays.');
    }

    if (!parsed.profile || typeof parsed.profile !== 'object') {
      throw new Error('Backup is missing student profile data.');
    }

    const validatedData = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      profile: parsed.profile,
      subjects: parsed.subjects,
      topics: parsed.topics,
      studyPlans: Array.isArray(parsed.studyPlans) ? parsed.studyPlans : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      progress: Array.isArray(parsed.progress) ? parsed.progress : [],
      settings: parsed.settings || { theme: 'dark', geminiModel: 'gemini-2.5-flash', enableAiFeatures: true }
    };

    this.saveData(validatedData);
    return validatedData;
  }

  resetData() {
    const seed = createDefaultSeedData();
    this.saveData(seed);
    return seed;
  }
}

export const storageService = new StorageService();
