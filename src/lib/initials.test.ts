import { describe, expect, it } from 'vitest';
import { getInitials } from './initials';

describe('getInitials', () => {
  it('uses the first letter when there is no dot', () => {
    expect(getInitials('anna@reutlingen-university.de')).toBe('A');
  });

  it('uses one letter per dot-separated segment', () => {
    expect(getInitials('max.mustermann@reutlingen-university.de')).toBe('MM');
  });

  it('handles more than one dot', () => {
    expect(getInitials('j.r.tolkien@reutlingen-university.de')).toBe('JRT');
  });

  it('uppercases the letters', () => {
    expect(getInitials('ben@reutlingen-university.de')).toBe('B');
  });

  it('skips a leading symbol in a segment to find the first non-symbol character', () => {
    expect(getInitials('_anna.-ben@reutlingen-university.de')).toBe('AB');
  });

  it('falls back to a placeholder when the local part has no letters at all', () => {
    expect(getInitials('...@reutlingen-university.de')).toBe('?');
  });

  it('ignores the domain entirely', () => {
    expect(getInitials('anna@sub.reutlingen-university.de')).toBe('A');
  });
});
