import type { Section } from '../sections/types';
import type { Loop } from './loopLogic';

// Loops are stored to the millisecond; the selection is a raw float.
const SAME_EPSILON = 0.01;

const matches = (section: Section, loop: Loop) =>
  Math.abs(section.start_time - loop.start) < SAME_EPSILON && Math.abs(section.end_time - loop.end) < SAME_EPSILON;

/** What the current selection is, relative to the saved loops. */
export type SelectionStatus =
  /** Still the default whole-video loop: nothing selected yet. */
  | { kind: 'none' }
  /** Exactly a saved loop. */
  | { kind: 'saved'; section: Section }
  /** Started from a saved loop whose edges have since moved. */
  | { kind: 'modified'; section: Section }
  /** A fresh selection, not tied to any saved loop. */
  | { kind: 'new' };

export function selectionStatus({
  loop,
  hasCustomLoop,
  loopOrigin,
  sections,
}: {
  loop: Loop;
  hasCustomLoop: boolean;
  loopOrigin: string | null;
  sections: Section[];
}): SelectionStatus {
  if (!hasCustomLoop) return { kind: 'none' };
  const exact = sections.find((section) => matches(section, loop));
  if (exact) return { kind: 'saved', section: exact };
  const origin = loopOrigin ? sections.find((section) => section.id === loopOrigin) : undefined;
  if (origin) return { kind: 'modified', section: origin };
  return { kind: 'new' };
}
