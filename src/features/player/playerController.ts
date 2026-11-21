import { fullLoop, shouldWrap, type Loop } from './loopLogic';

export interface PlayerState {
  isReady: boolean;
  isPlaying: boolean;
  /** Best known length of the video in seconds, or null until something reports it. */
  duration: number | null;
  loop: Loop;
  /** Playback speed, 1 being normal. */
  playbackRate: number;
  /** False while the loop is still the default whole-video span. */
  hasCustomLoop: boolean;
  /**
   * The saved loop the current selection started from, by id, so dragging a
   * saved loop's edges can offer to update it. Null for a fresh selection.
   */
  loopOrigin: string | null;
  /**
   * Bumped whenever playback should be brought back into view: play, restart,
   * jumping to a saved loop. The timeline resumes following the playhead.
   */
  followRequest: number;
}

type Listener = () => void;
type TimeListener = (time: number) => void;

// How often playback time is read and the loop end checked. YouTube's
// getCurrentTime is a cached value, so this is cheap.
const TICK_MS = 50;

/**
 * The single owner of the YouTube player, the current loop and loop
 * enforcement. Playback time is published on its own channel so that only the
 * parts that draw it (the timeline) update on every tick; everything else
 * subscribes to state, which changes only on play, pause and loop edits.
 */
export class PlayerController {
  private state: PlayerState = {
    isReady: false,
    isPlaying: false,
    duration: null,
    loop: { start: 0, end: 0 },
    playbackRate: 1,
    hasCustomLoop: false,
    loopOrigin: null,
    followRequest: 0,
  };
  private time = 0;
  private player: YT.Player | null = null;
  private hasExactDuration = false;
  private isScrubbing = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<Listener>();
  private timeListeners = new Set<TimeListener>();

  // Arrow functions so they can be passed to useSyncExternalStore unbound.
  getState = (): PlayerState => this.state;
  getTime = (): number => this.time;
  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  subscribeTime = (listener: TimeListener) => {
    this.timeListeners.add(listener);
    return () => {
      this.timeListeners.delete(listener);
    };
  };

  /** Called from the YouTube player's onReady. */
  attach(player: YT.Player) {
    this.player = player;
    const duration = player.getDuration?.();
    if (duration !== undefined && Number.isFinite(duration) && duration > 0) this.setDuration(duration, true);
    // A speed picked before the player loaded still applies.
    if (this.state.playbackRate !== 1) player.setPlaybackRate(this.state.playbackRate);
    this.update({ isReady: true });
    this.startTicking();
  }

  /** Called from the YouTube player's onStateChange. */
  handlePlayerState(playerState: number) {
    // Buffering keeps whatever the last real state was.
    if (playerState === 3) return;
    this.update({ isPlaying: playerState === 1 });
  }

  /**
   * The Data API reports whole seconds, the player the exact length. Once the
   * player's figure is known, a later API response must not overwrite it,
   * because every region on the timeline maps through this value.
   */
  setDuration(duration: number, exact: boolean) {
    if (!(duration > 0) || (this.hasExactDuration && !exact)) return;
    if (exact) this.hasExactDuration = true;
    this.update({
      duration,
      // Until someone picks a loop, it spans the whole video.
      ...(this.state.hasCustomLoop ? {} : { loop: fullLoop(duration) }),
    });
  }

  play() {
    this.player?.playVideo();
    this.requestFollow();
  }

  pause() {
    this.player?.pauseVideo();
  }

  togglePlay() {
    if (this.state.isPlaying) this.pause();
    else this.play();
  }

  seek(time: number) {
    this.player?.seekTo(time, true);
    this.publishTime(time);
  }

  restartLoop() {
    this.seek(this.state.loop.start);
    this.requestFollow();
  }

  /** Live updates while a loop region is dragged. Muted so the scrub doesn't stutter. */
  previewLoop(start: number, end: number) {
    if (!this.isScrubbing) {
      this.isScrubbing = true;
      this.player?.mute();
    }
    this.setLoop({ start, end });
  }

  /** A loop drawn fresh on the track, not derived from a saved one. */
  startNewLoop(start: number, end: number) {
    this.setLoop({ start, end });
    this.update({ loopOrigin: null });
  }

  /** Drops the selection: the loop goes back to spanning the whole video. */
  clearLoop() {
    const { duration } = this.state;
    this.update({
      loop: duration ? fullLoop(duration) : { start: 0, end: 0 },
      hasCustomLoop: false,
      loopOrigin: null,
    });
  }

  /** Records that the current selection is now stored as a saved loop. */
  setLoopOrigin(origin: string | null) {
    this.update({ loopOrigin: origin });
  }

  /** The end of a drag started with previewLoop. */
  endLoopPreview() {
    if (!this.isScrubbing) return;
    this.isScrubbing = false;
    this.player?.unMute();
  }

  /** Makes a saved loop the current one and starts it from the top. */
  jumpToLoop(start: number, end: number, origin: string | null = null) {
    this.setLoop({ start, end });
    this.update({ loopOrigin: origin });
    this.seek(start);
    this.requestFollow();
  }

  setPlaybackRate(rate: number) {
    this.player?.setPlaybackRate(rate);
    this.update({ playbackRate: rate });
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.player = null;
    this.listeners.clear();
    this.timeListeners.clear();
  }

  /** Reads the player's position, wraps at the loop end and publishes the time. Public for tests. */
  tick() {
    const player = this.player;
    if (!player) return;
    let time: number;
    try {
      time = player.getCurrentTime();
    } catch (error) {
      console.error('Error reading the playback position:', error);
      return;
    }
    if (typeof time !== 'number' || Number.isNaN(time)) return;
    if (shouldWrap(time, this.state.loop)) {
      player.seekTo(this.state.loop.start, true);
      time = this.state.loop.start;
    }
    this.publishTime(time);
  }

  private setLoop(loop: Loop) {
    this.update({ loop, hasCustomLoop: true });
  }

  private requestFollow() {
    this.update({ followRequest: this.state.followRequest + 1 });
  }

  private startTicking() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), TICK_MS);
    this.tick();
  }

  private publishTime(time: number) {
    if (time === this.time) return;
    this.time = time;
    this.timeListeners.forEach((listener) => listener(time));
  }

  private update(patch: Partial<PlayerState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((listener) => listener());
  }
}
