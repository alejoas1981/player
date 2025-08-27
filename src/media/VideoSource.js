/**
 * Video Source - Basic video media source implementation
 */

class VideoSource extends EventManager {
    constructor({ url, config }) {
        super();

        this.url = url;
        this.config = config;
        this.videoElement = null;
        this.isLoaded = false;
    }

    /**
     * Load video source
     */
    async load() {
        return new Promise((resolve, reject) => {
            this.videoElement = this.config.container.querySelector('.up-video');

            if (!this.videoElement) {
                reject(new Error('Video element not found'));
                return;
            }

            this.setupEventListeners();

            this.videoElement.src = this.url;

            this.videoElement.addEventListener('loadeddata', () => {
                this.isLoaded = true;
                resolve();
            }, { once: true });

            this.videoElement.addEventListener('error', (e) => {
                reject(new Error(`Video load error: ${e.message}`));
            }, { once: true });
        });
    }

    /**
     * Setup video element event listeners
     */
    setupEventListeners() {
        const events = [
            'loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough',
            'play', 'pause', 'ended', 'timeupdate', 'volumechange', 'seeking', 'seeked',
            'waiting', 'playing', 'progress', 'error'
        ];

        events.forEach(eventName => {
            this.videoElement.addEventListener(eventName, (e) => {
                this.handleVideoEvent(eventName, e);
            });
        });
    }

    /**
     * Handle video element events
     */
    handleVideoEvent(eventName, event) {
        const data = this.extractEventData(eventName, event);
        this.emit(eventName, data);
    }

    /**
     * Extract relevant data from video events
     */
    extractEventData(eventName, event) {
        const baseData = {
            currentTime: this.videoElement.currentTime,
            duration: this.videoElement.duration,
            volume: this.videoElement.volume,
            muted: this.videoElement.muted,
            paused: this.videoElement.paused,
            ended: this.videoElement.ended,
            buffered: this.getBufferedRanges()
        };

        switch (eventName) {
            case 'error':
                return {
                    ...baseData,
                    error: event.target.error
                };
            case 'progress':
                return {
                    ...baseData,
                    loaded: this.getLoadedRanges()
                };
            default:
                return baseData;
        }
    }

    /**
     * Get buffered time ranges
     */
    getBufferedRanges() {
        const buffered = this.videoElement.buffered;
        const ranges = [];

        for (let i = 0; i < buffered.length; i++) {
            ranges.push({
                start: buffered.start(i),
                end: buffered.end(i)
            });
        }

        return ranges;
    }

    /**
     * Get loaded time ranges
     */
    getLoadedRanges() {
        return this.getBufferedRanges();
    }

    // Media control methods
    async play() {
        if (!this.videoElement) {
            throw new Error('Video not loaded');
        }

        return this.videoElement.play();
    }

    pause() {
        if (this.videoElement) {
            this.videoElement.pause();
        }
    }

    seek(time) {
        if (this.videoElement) {
            this.videoElement.currentTime = time;
        }
    }

    setVolume(volume) {
        if (this.videoElement) {
            this.videoElement.volume = Math.max(0, Math.min(1, volume));
        }
    }

    setMuted(muted) {
        if (this.videoElement) {
            this.videoElement.muted = muted;
        }
    }

    setPlaybackRate(rate) {
        if (this.videoElement) {
            this.videoElement.playbackRate = rate;
        }
    }

    setQuality(quality) {
        // Basic video sources don't support quality switching
        console.log(`Basic video source doesn't support quality switching to ${quality}`);
    }

    /**
     * Load new URL
     */
    loadUrl(url) {
        this.url = url;
        if (this.videoElement) {
            this.videoElement.src = url;
        }
    }

    /**
     * Check if Picture-in-Picture is supported
     */
    supportsPiP() {
        return 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled;
    }

    /**
     * Toggle Picture-in-Picture mode
     */
    async togglePictureInPicture() {
        if (!this.supportsPiP() || !this.videoElement) {
            throw new Error('Picture-in-Picture not supported');
        }

        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
        } else {
            await this.videoElement.requestPictureInPicture();
        }
    }

    /**
     * Get current state
     */
    getState() {
        if (!this.videoElement) {
            return null;
        }

        return {
            currentTime: this.videoElement.currentTime,
            duration: this.videoElement.duration,
            volume: this.videoElement.volume,
            muted: this.videoElement.muted,
            paused: this.videoElement.paused,
            ended: this.videoElement.ended,
            playbackRate: this.videoElement.playbackRate,
            readyState: this.videoElement.readyState,
            networkState: this.videoElement.networkState
        };
    }

    /**
     * Destroy video source
     */
    destroy() {
        if (this.videoElement) {
            this.videoElement.pause();
            this.videoElement.src = '';
            this.videoElement.load();
        }

        this.clearAll();
        this.videoElement = null;
        this.isLoaded = false;
    }
}