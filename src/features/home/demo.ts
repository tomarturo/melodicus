import type { NewSection } from '../sections/types';
import { encodeShareFragment } from '../sharing/shareFormat';

/**
 * The song the homepage's demo opens, with its loops already marked. The
 * button opens it as a share link, so the loops arrive with it.
 */
export const DEMO_VIDEO_ID = 'b00h8iKaklQ';

const at = (minutes: number, seconds: number) => minutes * 60 + seconds;

export const DEMO_LOOPS: NewSection[] = [
  { name: 'Full guitar solo', start_time: at(2, 16), end_time: at(3, 0) },
  { name: 'Solo section 1', start_time: at(2, 16), end_time: at(2, 25) },
  { name: 'Solo section 2', start_time: at(2, 26), end_time: at(2, 32) },
  { name: 'Solo section 3', start_time: at(2, 33), end_time: at(2, 39) },
  { name: 'Solo section 4', start_time: at(2, 40), end_time: at(2, 47) },
  { name: 'Solo section 5', start_time: at(2, 48), end_time: at(2, 54) },
  { name: 'Solo section 6', start_time: at(2, 55), end_time: at(3, 0) },
  { name: 'Outro solo', start_time: at(3, 51), end_time: at(4, 25) },
];

/** The in-app path to the demo, loops included. */
export const demoPath = () =>
  DEMO_LOOPS.length > 0
    ? `/video/${DEMO_VIDEO_ID}#${encodeShareFragment(DEMO_LOOPS)}`
    : `/video/${DEMO_VIDEO_ID}`;
