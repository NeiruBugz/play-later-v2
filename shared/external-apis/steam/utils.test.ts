import { describe, it, expect } from 'vitest';
import { areGamesRelated } from './utils';

describe('Steam utils', () => {
  describe('areGamesRelated', () => {
    // Should group (same game, different modes)
    it('should group different modes of the same game', () => {
      expect(
        areGamesRelated(
          'Call of Duty: Black Ops',
          'Call of Duty: Black Ops - Multiplayer',
        ),
      ).toBe(true);
      expect(
        areGamesRelated(
          'Call of Duty: Modern Warfare 2 (2009)',
          'Call of Duty: Modern Warfare 2 (2009) - Multiplayer',
        ),
      ).toBe(true);
      expect(
        areGamesRelated(
          'DARK SOULS™ II',
          'DARK SOULS™ II - Scholar of the First Sin',
        ),
      ).toBe(true);
    });

    // Should NOT group (different games in same series)
    it('should not group different games in the same series', () => {
      expect(
        areGamesRelated(
          'Call of Duty: Black Ops',
          'Call of Duty: Black Ops II',
        ),
      ).toBe(false);
      expect(
        areGamesRelated(
          'Call of Duty: Modern Warfare',
          'Call of Duty: Modern Warfare 2',
        ),
      ).toBe(false);
      expect(
        areGamesRelated(
          'Call of Duty: Black Ops',
          'Call of Duty: Modern Warfare',
        ),
      ).toBe(false);
    });

    // Should NOT group (remasters)
    it('should not group original games with their remasters', () => {
      expect(
        areGamesRelated(
          'Call of Duty: Modern Warfare 2',
          'Call of Duty: Modern Warfare 2 Remastered',
        ),
      ).toBe(false);
      expect(areGamesRelated('Dark Souls', 'Dark Souls Remastered')).toBe(
        false,
      );
    });

    // Should NOT group (different years)
    it('should not group games with different years', () => {
      expect(
        areGamesRelated(
          'Call of Duty: Modern Warfare 2 (2009)',
          'Call of Duty: Modern Warfare 2 (2022)',
        ),
      ).toBe(false);
    });
  });
});
