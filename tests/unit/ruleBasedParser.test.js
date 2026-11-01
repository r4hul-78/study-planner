import { describe, it, expect } from 'vitest';
import { parseSyllabusRules } from '../../src/js/services/ruleBasedParser.js';

describe('Heuristic Rule-Based Syllabus Parser', () => {
  it('correctly extracts units, chapters, and topics from formatted text', () => {
    const rawSyllabus = `Subject: Applied Physics

Unit 1: Wave Optics
- Interference Patterns
- Diffraction Grating
- Polarization of Light

Unit 2: Modern Quantum Physics
- Photoelectric effect
- de Broglie wavelength
- Schrödinger wave equation`;

    const result = parseSyllabusRules(rawSyllabus);
    expect(result.units.length).toBe(2);

    expect(result.units[0].title).toContain('Unit 1');
    expect(result.units[0].topics.length).toBe(3);
    expect(result.units[0].topics[0].title).toBe('Interference Patterns');

    expect(result.units[1].title).toContain('Unit 2');
    expect(result.units[1].topics.length).toBe(3);
    expect(result.units[1].topics[2].title).toBe('Schrödinger wave equation');
  });

  it('infers realistic difficulty based on terminology', () => {
    const text = `Unit 1: General
- Basic Concepts
- Advanced Wave Equation Derivations`;

    const result = parseSyllabusRules(text);
    const topics = result.units[0].topics;

    expect(topics[0].difficulty).toBe('easy');
    expect(topics[1].difficulty).toBe('hard');
  });

  it('handles empty or malformed input without throwing an exception', () => {
    expect(parseSyllabusRules('').units).toEqual([]);
    expect(parseSyllabusRules(null).units).toEqual([]);
    expect(parseSyllabusRules('   \n  \n').units).toEqual([]);
  });
});
