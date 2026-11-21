import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerController } from './playerController';
import { usePlayerState } from './usePlayer';

/** Just enough of YT.Player for the controller, with a settable clock. */
const fakePlayer = (duration = 200) => {
  const player = {
    time: 0,
    getCurrentTime: vi.fn(() => player.time),
    getDuration: vi.fn(() => duration),
    seekTo: vi.fn((time: number) => {
      player.time = time;
    }),
    playVideo: vi.fn(),
    pauseVideo: vi.fn(),
    mute: vi.fn(),
    unMute: vi.fn(),
    setPlaybackRate: vi.fn(),
  };
  return player;
};

let controller: PlayerController;
beforeEach(() => {
  vi.useFakeTimers();
  controller = new PlayerController();
});
afterEach(() => {
  controller.destroy();
  vi.useRealTimers();
});

const attach = (player = fakePlayer()) => {
  controller.attach(player as unknown as YT.Player);
  return player;
};

describe('PlayerController', () => {
  it('starts with a loop spanning the whole video once the player reports its length', () => {
    attach(fakePlayer(212.4));
    expect(controller.getState()).toMatchObject({ isReady: true, duration: 212.4, loop: { start: 0, end: 212.4 } });
  });

  it('prefers the player’s exact length over the API’s whole seconds, whichever arrives first', () => {
    controller.setDuration(212, false);
    expect(controller.getState().duration).toBe(212);
    attach(fakePlayer(212.4));
    controller.setDuration(212, false);
    expect(controller.getState().duration).toBe(212.4);
  });

  it('jumps back to the loop start when playback reaches the loop end', () => {
    const player = attach();
    controller.jumpToLoop(10, 20);
    player.time = 19.9;
    vi.advanceTimersByTime(50);
    expect(controller.getTime()).toBe(19.9);
    player.time = 20.02;
    vi.advanceTimersByTime(50);
    expect(player.seekTo).toHaveBeenLastCalledWith(10, true);
    expect(controller.getTime()).toBe(10);
  });

  it('never seeks for a zero-length loop', () => {
    const player = attach();
    controller.previewLoop(5, 5);
    player.seekTo.mockClear();
    player.time = 6;
    vi.advanceTimersByTime(200);
    expect(player.seekTo).not.toHaveBeenCalled();
  });

  it('mutes once while a loop is dragged and unmutes when the drag ends', () => {
    const player = attach();
    controller.previewLoop(1, 5);
    controller.previewLoop(1, 6);
    controller.previewLoop(1, 7);
    expect(player.mute).toHaveBeenCalledTimes(1);
    controller.endLoopPreview();
    expect(player.unMute).toHaveBeenCalledTimes(1);
    expect(controller.getState()).toMatchObject({ loop: { start: 1, end: 7 }, hasCustomLoop: true });
  });

  it('keeps a custom loop when the duration is refined later', () => {
    controller.setDuration(100, false);
    controller.previewLoop(3, 9);
    attach(fakePlayer(100.5));
    expect(controller.getState().loop).toEqual({ start: 3, end: 9 });
  });

  it('clears a selection back to the whole video', () => {
    attach(fakePlayer(100));
    controller.jumpToLoop(3, 9, 'saved-id');
    controller.clearLoop();
    expect(controller.getState()).toMatchObject({ loop: { start: 0, end: 100 }, hasCustomLoop: false, loopOrigin: null });
  });

  it('resets an edited saved loop to its saved edges without seeking', () => {
    const player = attach(fakePlayer(100));
    controller.jumpToLoop(3, 9, 'saved-id');
    controller.previewLoop(3, 12);
    player.seekTo.mockClear();
    controller.resetLoop(3, 9, 'saved-id');
    expect(controller.getState()).toMatchObject({ loop: { start: 3, end: 9 }, hasCustomLoop: true, loopOrigin: 'saved-id' });
    expect(player.seekTo).not.toHaveBeenCalled();
  });

  it('asks the timeline to follow the playhead on play, restart and jumping to a loop, not on pause', () => {
    attach();
    const before = controller.getState().followRequest;
    controller.play();
    controller.restartLoop();
    controller.jumpToLoop(1, 2);
    controller.pause();
    expect(controller.getState().followRequest).toBe(before + 3);
  });

  it('tracks the playback speed, and applies one picked before the player was ready', () => {
    controller.setPlaybackRate(1.5);
    expect(controller.getState().playbackRate).toBe(1.5);
    const player = attach();
    expect(player.setPlaybackRate).toHaveBeenCalledWith(1.5);
    controller.setPlaybackRate(0.75);
    expect(player.setPlaybackRate).toHaveBeenLastCalledWith(0.75);
    expect(controller.getState().playbackRate).toBe(0.75);
  });

  it('ignores buffering when tracking whether it is playing', () => {
    attach();
    controller.handlePlayerState(1);
    controller.handlePlayerState(3);
    expect(controller.getState().isPlaying).toBe(true);
    controller.handlePlayerState(2);
    expect(controller.getState().isPlaying).toBe(false);
  });
});

describe('usePlayerState', () => {
  it('does not re-render on playback time ticks', () => {
    const player = attach();
    let renders = 0;
    const Probe = () => {
      usePlayerState(controller);
      renders += 1;
      return null;
    };
    render(<Probe />);
    const afterMount = renders;

    act(() => {
      for (let i = 1; i <= 20; i++) {
        player.time = i;
        vi.advanceTimersByTime(50);
      }
    });
    expect(controller.getTime()).toBe(20);
    expect(renders).toBe(afterMount);

    act(() => controller.handlePlayerState(1));
    expect(renders).toBe(afterMount + 1);
  });
});
