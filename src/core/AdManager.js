/**
 * Ad Manager - Handles pre-roll, post-roll, and pause-roll advertisements
 */
class AdManager {
    constructor() {
        this.container = null;
        this.config = null;
        this.currentAd = null;
        this.adQueue = [];
        this.isPlayingAd = false;
        this.adElement = null;
        this.skipButton = null;
    }

    /**
     * Initialize ad manager
     * @param {HTMLElement} container
     * @param {Object} config
     */
    init(container, config) {
        this.container = container;
        this.config = config;
        this.createAdContainer();
    }

    /**
     * Create ad container element
     */
    createAdContainer() {
        this.adContainer = document.createElement('div');
        this.adContainer.className = 'up-ad-container';
        this.adContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000;
      display: none;
      z-index: 1000;
    `;
        this.container.appendChild(this.adContainer);
    }

    /**
     * Play pre-roll ad
     * @returns {Promise}
     */
    async playPreRoll() {
        if (!this.config.preRoll) {
            return Promise.resolve();
        }

        return this.playAd(this.config.preRoll, 'preroll');
    }

    /**
     * Play post-roll ad
     * @returns {Promise}
     */
    async playPostRoll() {
        if (!this.config.postRoll) {
            return Promise.resolve();
        }

        return this.playAd(this.config.postRoll, 'postroll');
    }

    /**
     * Play pause-roll ad
     * @returns {Promise}
     */
    async playPauseRoll() {
        if (!this.config.pauseRoll) {
            return Promise.resolve();
        }

        return this.playAd(this.config.pauseRoll, 'pauseroll');
    }

    /**
     * Play advertisement
     * @param {Object} adConfig
     * @param {string} adType
     * @returns {Promise}
     */
    async playAd(adConfig, adType) {
        return new Promise((resolve, reject) => {
            try {
                this.currentAd = {
                    config: adConfig,
                    type: adType,
                    startTime: Date.now(),
                    resolve,
                    reject
                };

                this.isPlayingAd = true;
                this.showAdContainer();
                this.createAdElement(adConfig);
                this.createSkipButton(adConfig);

                // Track ad start
                this.trackAdEvent('ad_start', {
                    adType,
                    adUrl: adConfig.url,
                    duration: adConfig.duration
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Create ad video element
     * @param {Object} adConfig
     */
    createAdElement(adConfig) {
        this.adElement = document.createElement('video');
        this.adElement.className = 'up-ad-video';
        this.adElement.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: contain;
    `;

        this.adElement.src = adConfig.url;
        this.adElement.muted = false;
        this.adElement.controls = false;

        // Ad event listeners
        this.adElement.addEventListener('loadeddata', () => {
            this.adElement.play();
        });

        this.adElement.addEventListener('ended', () => {
            this.onAdEnded();
        });

        this.adElement.addEventListener('error', (error) => {
            this.onAdError(error);
        });

        this.adElement.addEventListener('timeupdate', () => {
            this.updateSkipButton();
        });

        this.adContainer.appendChild(this.adElement);
    }

    /**
     * Create skip button
     * @param {Object} adConfig
     */
    createSkipButton(adConfig) {
        if (adConfig.skippable === false) {
            return;
        }

        this.skipButton = document.createElement('button');
        this.skipButton.className = 'up-ad-skip';
        this.skipButton.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border: 1px solid #ccc;
      padding: 8px 16px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 14px;
      display: none;
    `;

        this.skipButton.addEventListener('click', () => {
            this.skipAd();
        });

        this.adContainer.appendChild(this.skipButton);
    }

    /**
     * Update skip button visibility and text
     */
    updateSkipButton() {
        if (!this.skipButton || !this.adElement || !this.currentAd) {
            return;
        }

        const skipAfter = this.currentAd.config.skipAfter || 5;
        const currentTime = this.adElement.currentTime;

        if (currentTime >= skipAfter) {
            this.skipButton.style.display = 'block';
            this.skipButton.textContent = 'Skip Ad';
        } else {
            this.skipButton.style.display = 'block';
            this.skipButton.textContent = `Skip in ${Math.ceil(skipAfter - currentTime)}s`;
        }
    }

    /**
     * Skip current ad
     */
    skipAd() {
        if (!this.currentAd) {
            return;
        }

        this.trackAdEvent('ad_skip', {
            adType: this.currentAd.type,
            skipTime: this.adElement?.currentTime || 0,
            duration: this.currentAd.config.duration
        });

        this.onAdEnded();
    }

    /**
     * Handle ad ended
     */
    onAdEnded() {
        if (!this.currentAd) {
            return;
        }

        this.trackAdEvent('ad_complete', {
            adType: this.currentAd.type,
            playTime: this.adElement?.currentTime || 0,
            duration: this.currentAd.config.duration
        });

        this.cleanupAd();
        this.currentAd.resolve();
        this.currentAd = null;
    }

    /**
     * Handle ad error
     * @param {Error} error
     */
    onAdError(error) {
        if (!this.currentAd) {
            return;
        }

        this.trackAdEvent('ad_error', {
            adType: this.currentAd.type,
            error: error.message
        });

        this.cleanupAd();
        this.currentAd.reject(error);
        this.currentAd = null;
    }

    /**
     * Show ad container
     */
    showAdContainer() {
        if (this.adContainer) {
            this.adContainer.style.display = 'block';
        }
    }

    /**
     * Hide ad container
     */
    hideAdContainer() {
        if (this.adContainer) {
            this.adContainer.style.display = 'none';
        }
    }

    /**
     * Clean up ad elements
     */
    cleanupAd() {
        this.isPlayingAd = false;
        this.hideAdContainer();

        if (this.adElement) {
            this.adElement.pause();
            this.adElement.remove();
            this.adElement = null;
        }

        if (this.skipButton) {
            this.skipButton.remove();
            this.skipButton = null;
        }
    }

    /**
     * Track ad event
     * @param {string} eventType
     * @param {Object} data
     */
    trackAdEvent(eventType, data) {
        console.log(`Ad Event: ${eventType}`, data);

        // Integration with analytics manager would go here
        if (window.UniversalPlayer?.analyticsManager) {
            window.UniversalPlayer.analyticsManager.track(eventType, data);
        }
    }

    /**
     * Check if currently playing ad
     * @returns {boolean}
     */
    isAdPlaying() {
        return this.isPlayingAd;
    }

    /**
     * Destroy ad manager
     */
    destroy() {
        this.cleanupAd();

        if (this.adContainer) {
            this.adContainer.remove();
            this.adContainer = null;
        }

        this.container = null;
        this.config = null;
    }
}