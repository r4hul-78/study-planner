import { storageService } from '../services/storageService.js';
import { generateId } from '../utils/idGenerator.js';

class Store {
  constructor() {
    this.state = storageService.loadData();
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    storageService.saveData(this.state);
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('[Store.notify] Listener error:', err);
      }
    }
  }

  // Profile Actions
  updateProfile(updates) {
    this.state.profile = {
      ...this.state.profile,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.notify();
  }

  updatePreferences(prefs) {
    this.state.profile.preferences = {
      ...this.state.profile.preferences,
      ...prefs
    };
    this.state.profile.updatedAt = new Date().toISOString();
    this.notify();
  }

  // Subject Actions
  addSubject(subjectData) {
    const newSubject = {
      id: generateId(),
      name: subjectData.name.trim(),
      description: (subjectData.description || '').trim(),
      color: subjectData.color || '#10b981',
      examDate: subjectData.examDate || '',
      importance: Number(subjectData.importance) || 3,
      preparationLevel: Number(subjectData.preparationLevel) || 1,
      archived: false,
      notes: subjectData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.state.subjects.push(newSubject);
    this.notify();
    return newSubject;
  }

  updateSubject(id, updates) {
    const index = this.state.subjects.findIndex(s => s.id === id);
    if (index !== -1) {
      this.state.subjects[index] = {
        ...this.state.subjects[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.notify();
      return this.state.subjects[index];
    }
    return null;
  }

  deleteSubject(id) {
    const subjectIndex = this.state.subjects.findIndex(s => s.id === id);
    if (subjectIndex === -1) return null;

    const removedSubject = this.state.subjects[subjectIndex];
    // Associated topics count
    const associatedTopics = this.state.topics.filter(t => t.subjectId === id);
    // Associated sessions count
    const associatedSessions = this.state.sessions.filter(s => s.subjectId === id);

    // Remove subject, its topics, and future scheduled sessions
    this.state.subjects.splice(subjectIndex, 1);
    this.state.topics = this.state.topics.filter(t => t.subjectId !== id);
    this.state.sessions = this.state.sessions.filter(s => s.subjectId !== id || s.status === 'completed');

    this.notify();
    return {
      subject: removedSubject,
      topicsDeleted: associatedTopics.length,
      sessionsDeleted: associatedSessions.length
    };
  }

  // Topic Actions
  addTopic(topicData) {
    const newTopic = {
      id: generateId(),
      subjectId: topicData.subjectId,
      unitTitle: (topicData.unitTitle || 'General Topics').trim(),
      title: topicData.title.trim(),
      description: (topicData.description || '').trim(),
      difficulty: topicData.difficulty || 'medium',
      importance: Number(topicData.importance) || 3,
      estimatedMinutes: Number(topicData.estimatedMinutes) || 45,
      status: topicData.status || 'not_started',
      confidence: Number(topicData.confidence) || 3,
      dependencies: Array.isArray(topicData.dependencies) ? topicData.dependencies : [],
      order: this.state.topics.filter(t => t.subjectId === topicData.subjectId).length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.state.topics.push(newTopic);
    this.notify();
    return newTopic;
  }

  addTopicsBatch(subjectId, units) {
    const newTopics = [];
    let orderIndex = this.state.topics.filter(t => t.subjectId === subjectId).length + 1;

    for (const unit of units) {
      const unitTitle = unit.title || 'General';
      for (const t of (unit.topics || [])) {
        newTopics.push({
          id: generateId(),
          subjectId,
          unitTitle,
          title: t.title.trim(),
          description: t.description || '',
          difficulty: t.difficulty || 'medium',
          importance: Number(t.importance) || 3,
          estimatedMinutes: Number(t.estimatedMinutes) || 45,
          status: 'not_started',
          confidence: 3,
          dependencies: [],
          order: orderIndex++,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    this.state.topics.push(...newTopics);
    this.notify();
    return newTopics;
  }

  updateTopic(id, updates) {
    const index = this.state.topics.findIndex(t => t.id === id);
    if (index !== -1) {
      this.state.topics[index] = {
        ...this.state.topics[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.notify();
      return this.state.topics[index];
    }
    return null;
  }

  deleteTopic(id) {
    const index = this.state.topics.findIndex(t => t.id === id);
    if (index !== -1) {
      const removed = this.state.topics.splice(index, 1)[0];
      // Remove future scheduled sessions for this topic
      this.state.sessions = this.state.sessions.filter(s => s.topicId !== id || s.status === 'completed');
      this.notify();
      return removed;
    }
    return null;
  }

  // Study Plan & Sessions
  commitNewPlan(plan, newSessions, replaceExisting = true) {
    if (replaceExisting) {
      // Retain completed sessions, replace scheduled ones
      const completedSessions = this.state.sessions.filter(s => s.status === 'completed' || s.locked);
      this.state.sessions = [...completedSessions, ...newSessions];
    } else {
      this.state.sessions.push(...newSessions);
    }

    this.state.studyPlans = [plan, ...this.state.studyPlans.filter(p => p.id !== plan.id)];
    this.notify();
  }

  updateSession(id, updates) {
    const index = this.state.sessions.findIndex(s => s.id === id);
    if (index !== -1) {
      this.state.sessions[index] = {
        ...this.state.sessions[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.notify();
      return this.state.sessions[index];
    }
    return null;
  }

  applyRescheduledSessions(updatedSessionsList) {
    this.state.sessions = updatedSessionsList;
    this.notify();
  }

  // Progress Logging
  recordSessionCompletion(sessionId, { actualMinutes, confidence, notes, completionStatus = 'completed' }) {
    const session = this.state.sessions.find(s => s.id === sessionId);
    if (!session) return null;

    session.status = completionStatus;
    session.notes = notes || session.notes;
    session.updatedAt = new Date().toISOString();

    // Update parent topic
    const topic = this.state.topics.find(t => t.id === session.topicId);
    if (topic) {
      if (completionStatus === 'completed') {
        topic.status = 'completed';
      } else if (completionStatus === 'partial') {
        topic.status = 'in_progress';
      }
      if (confidence) {
        topic.confidence = Number(confidence);
      }
      topic.updatedAt = new Date().toISOString();
    }

    // Append to progress records
    const progressRecord = {
      id: generateId(),
      sessionId: session.id,
      subjectId: session.subjectId,
      topicId: session.topicId,
      plannedMinutes: session.durationMinutes,
      actualMinutes: Number(actualMinutes) || session.durationMinutes,
      completionStatus,
      confidence: Number(confidence) || 3,
      notes: notes || '',
      completedAt: new Date().toISOString()
    };

    this.state.progress.push(progressRecord);
    this.notify();
    return progressRecord;
  }

  // Settings & Theme
  setTheme(theme) {
    this.state.settings.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this.notify();
  }

  updateSettings(settingsUpdates) {
    this.state.settings = {
      ...this.state.settings,
      ...settingsUpdates
    };
    this.notify();
  }

  // Backup & Reset
  importBackup(jsonString) {
    const validated = storageService.importBackup(jsonString);
    this.state = validated;
    this.notify();
    return validated;
  }

  resetAll() {
    this.state = storageService.resetData();
    this.notify();
  }
}

export const store = new Store();
