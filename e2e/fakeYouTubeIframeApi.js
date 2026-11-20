// Served in place of https://www.youtube.com/iframe_api during e2e tests. A
// YT.Player that plays on a simulated clock, so playback, seeking and looping
// can be tested without YouTube. window.__fakeYt exposes it to tests.
(() => {
  const PlayerState = { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };
  const fake = (window.__fakeYt = { player: null, seeks: [], duration: 210.5 });

  class Player {
    constructor(_element, options) {
      this.options = options;
      this.time = 0;
      this.rate = 1;
      this.playing = false;
      this.muted = false;
      this.since = performance.now();
      fake.player = this;
      setTimeout(() => options.events?.onReady?.({ target: this }), 0);
    }
    now() {
      if (!this.playing) return this.time;
      return Math.min(fake.duration, this.time + ((performance.now() - this.since) / 1000) * this.rate);
    }
    rebase() {
      this.time = this.now();
      this.since = performance.now();
    }
    emit(state) {
      setTimeout(() => this.options.events?.onStateChange?.({ target: this, data: state }), 0);
    }
    getCurrentTime() {
      return this.now();
    }
    getDuration() {
      return fake.duration;
    }
    getPlayerState() {
      return this.playing ? PlayerState.PLAYING : PlayerState.PAUSED;
    }
    playVideo() {
      if (this.playing) return;
      this.since = performance.now();
      this.playing = true;
      this.emit(PlayerState.PLAYING);
    }
    pauseVideo() {
      this.rebase();
      this.playing = false;
      this.emit(PlayerState.PAUSED);
    }
    seekTo(time) {
      fake.seeks.push(time);
      this.time = time;
      this.since = performance.now();
    }
    setPlaybackRate(rate) {
      this.rebase();
      this.rate = rate;
    }
    mute() {
      this.muted = true;
    }
    unMute() {
      this.muted = false;
    }
    destroy() {
      this.playing = false;
    }
  }

  window.YT = { Player, PlayerState };
  window.onYouTubeIframeAPIReady?.();
})();
