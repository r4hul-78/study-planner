import { describe, it, expect } from 'vitest';
import { StorageService, createDefaultSeedData } from '../../src/js/services/storageService.js';

describe('Storage & Backup Migration Service', () => {
  const service = new StorageService();

  it('creates valid default seed data with complete structure', () => {
    const seed = createDefaultSeedData();
    expect(seed.schemaVersion).toBe('1.0.0');
    expect(seed.subjects.length).toBeGreaterThan(0);
    expect(seed.topics.length).toBeGreaterThan(0);
    expect(seed.profile.preferences.dailyAvailability).toBeDefined();
  });

  it('rejects invalid or corrupted JSON during import atomically', () => {
    expect(() => service.importBackup('not a json')).toThrow('Invalid JSON format');
    expect(() => service.importBackup(JSON.stringify({ random: 123 }))).toThrow('Backup is missing required subjects or topics arrays');
    expect(() => service.importBackup(JSON.stringify({ subjects: [], topics: [] }))).toThrow('Backup is missing student profile data');
  });

  it('successfully validates and imports a valid backup payload', () => {
    const validSeed = createDefaultSeedData();
    const jsonStr = JSON.stringify(validSeed);
    const imported = service.importBackup(jsonStr);

    expect(imported.schemaVersion).toBe('1.0.0');
    expect(imported.subjects.length).toBe(validSeed.subjects.length);
  });
});
