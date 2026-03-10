/**
 * Unit tests for the accountability engine logic.
 * Tests the variance/reason enforcement rules that would be applied in
 * the Convex mutation before sending to the server.
 */

/** Mirrors the validation logic in convex/items.ts */
function validateItemInput(
  planned: number,
  actual: number,
  reason?: string
): { valid: boolean; error?: string } {
  if (actual > planned) {
    if (!reason || reason.trim().length < 10) {
      return {
        valid: false,
        error: 'A reason of at least 10 characters is required when actual exceeds planned.',
      };
    }
  }
  return { valid: true };
}

describe('Accountability Engine', () => {
  describe('validateItemInput', () => {
    it('passes when actual equals planned (no reason needed)', () => {
      expect(validateItemInput(100, 100)).toEqual({ valid: true });
    });

    it('passes when actual is less than planned (no reason needed)', () => {
      expect(validateItemInput(200, 150)).toEqual({ valid: true });
    });

    it('fails when actual exceeds planned with no reason', () => {
      const result = validateItemInput(100, 150);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/reason/i);
    });

    it('fails when actual exceeds planned with reason that is too short', () => {
      const result = validateItemInput(100, 150, 'Too short');
      expect(result.valid).toBe(false);
    });

    it('fails when actual exceeds planned with reason that is exactly 9 chars', () => {
      const result = validateItemInput(100, 150, '123456789');
      expect(result.valid).toBe(false);
    });

    it('passes when actual exceeds planned with reason of exactly 10 chars', () => {
      const result = validateItemInput(100, 150, '1234567890');
      expect(result.valid).toBe(true);
    });

    it('passes when actual exceeds planned with a valid reason', () => {
      const result = validateItemInput(100, 150, 'Prices went up this month due to inflation');
      expect(result.valid).toBe(true);
    });

    it('fails when reason is provided but only whitespace', () => {
      const result = validateItemInput(100, 150, '          ');
      expect(result.valid).toBe(false);
    });

    it('passes when actual is zero and planned is positive (under budget)', () => {
      expect(validateItemInput(100, 0)).toEqual({ valid: true });
    });

    it('passes with large over-budget amount when reason is valid', () => {
      const result = validateItemInput(100, 9999, 'Emergency purchase required for project deadline');
      expect(result.valid).toBe(true);
    });
  });
});

describe('Wish list priority sorting', () => {
  type Wish = { title: string; priority: number; amount: number };

  function sortWishes(wishes: Wish[]): Wish[] {
    return [...wishes].sort((a, b) => {
      if (a.priority === 1 && b.priority !== 1) return -1;
      if (b.priority === 1 && a.priority !== 1) return 1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.amount - a.amount;
    });
  }

  it('pins critical (priority 1) items to top', () => {
    const wishes: Wish[] = [
      { title: 'Low item', priority: 4, amount: 100 },
      { title: 'Critical item', priority: 1, amount: 50 },
      { title: 'Medium item', priority: 3, amount: 200 },
    ];
    const sorted = sortWishes(wishes);
    expect(sorted[0].title).toBe('Critical item');
  });

  it('sorts non-critical items by priority ascending', () => {
    const wishes: Wish[] = [
      { title: 'Low', priority: 4, amount: 100 },
      { title: 'High', priority: 2, amount: 100 },
      { title: 'Medium', priority: 3, amount: 100 },
    ];
    const sorted = sortWishes(wishes);
    expect(sorted[0].title).toBe('High');
    expect(sorted[1].title).toBe('Medium');
    expect(sorted[2].title).toBe('Low');
  });

  it('breaks ties by amount descending', () => {
    const wishes: Wish[] = [
      { title: 'Cheap', priority: 3, amount: 50 },
      { title: 'Expensive', priority: 3, amount: 500 },
    ];
    const sorted = sortWishes(wishes);
    expect(sorted[0].title).toBe('Expensive');
  });

  it('multiple critical items all stay at top', () => {
    const wishes: Wish[] = [
      { title: 'Low', priority: 4, amount: 1000 },
      { title: 'Critical A', priority: 1, amount: 100 },
      { title: 'Critical B', priority: 1, amount: 200 },
    ];
    const sorted = sortWishes(wishes);
    expect(sorted[0].priority).toBe(1);
    expect(sorted[1].priority).toBe(1);
    expect(sorted[2].title).toBe('Low');
  });

  it('returns empty array for empty input', () => {
    expect(sortWishes([])).toEqual([]);
  });
});
