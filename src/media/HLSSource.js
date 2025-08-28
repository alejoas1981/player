/**
 * HLS Source - HTTP Live Streaming implementation
 */
class HLSSource extends VideoSource {
    constructor({ url, config }) {
        super({ url, config });
        this.hls = null;
        this.qualities = [];
        this.currentQuality = 'auto';
        this.videoElement = this.config.container.querySelector('.up-video');
    }

    /**
     * Load HLS source
     */
    async load() {
        // Check for native HLS support
        if (this.videoElement && this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            return this.loadNativeHLS();
        }

        // Use HLS.js for browsers without native support
        return this.loadHLSjs();
    }

    /**
     * Load using native HLS support (Safari)
     */
    async loadNativeHLS() {
        return new Promise((resolve, reject) => {

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
                reject(new Error(`HLS load error: ${e.message}`));
            }, { once: true });
        });
    }

    /**
     * Load using HLS.js library
     */
    async loadHLSjs() {
        return new Promise(async (resolve, reject) => {
            try {
                this.hls = await this.createHLSInstance();

                this.videoElement = this.config.container.querySelector('.up-video');
                if (!this.videoElement) {
                    reject(new Error('Video element not found'));
                    return;
                }

                this.setupEventListeners();
                this.setupHLSEvents();

                this.hls.loadSource(this.url);
                this.hls.attachMedia(this.videoElement);

                this.hls.on('MANIFEST_PARSED', () => {
                    this.extractQualities();
                    this.isLoaded = true;
                    resolve();
                });

                this.hls.on('ERROR', (event, data) => {
                    if (data.fatal) {
                        reject(new Error(`HLS fatal error: ${data.type} - ${data.details}`));
                    }
                });

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Create HLS instance (simulated)
     */
    async createHLSInstance() {
        if (typeof Hls === 'undefined') {
            throw new Error('Hls.js library is not loaded');
        }

        const hls = new Hls();
        hls.loadSource(this.url);
        hls.attachMedia(this.videoElement);
        return hls;
    }

    /**
     * Setup HLS-specific event listeners
     */
    setupHLSEvents() {
        if (!this.hls) return;

        this.hls.on('LEVEL_SWITCHED', (event, data) => {
            console.log(`Quality switched to level ${data.level}`);
            this.currentQuality = this.qualities[data.level]?.name || 'auto';
            this.emit('quality_changed', { quality: this.currentQuality });
        });

        this.hls.on('BUFFER_APPENDING', () => {
            this.emit('buffering', { buffering: true });
        });

        this.hls.on('BUFFER_APPENDED', () => {
            this.emit('buffering', { buffering: false });
        });
    }

    /**
     * Extract available quality levels
     */
    extractQualities() {
        if (!this.hls || !this.hls.levels) return;

        this.qualities = [
            { name: 'auto', level: -1 },
            ...this.hls.levels.map((level, index) => ({
                name: level.name || `${level.height}p`,
                level: index,
                height: level.height,
                bitrate: level.bitrate
            }))
        ];
    }

    /**
     * Set quality level
     */
    setQuality(quality) {
        if (!this.hls) {
            console.log('HLS not initialized');
            return;
        }

        const qualityLevel = this.qualities.find(q => q.name === quality);

        if (!qualityLevel) {
            console.log(`Quality ${quality} not found`);
            return;
        }

        this.hls.currentLevel = qualityLevel.level;
        this.currentQuality = quality;

        console.log(`Quality set to ${quality}`);
        this.emit('quality_changed', { quality });
    }

    /**
     * Get available qualities
     */
    getQualities() {
        return this.qualities.map(q => q.name);
    }

    /**
     * Get current quality
     */
    getCurrentQuality() {
        return this.currentQuality;
    }

    /**
     * Destroy HLS source
     */
    destroy() {
        if (this.hls) {
            this.hls.destroy();
            this.hls = null;
        }

        super.destroy();
        this.qualities = [];
        this.currentQuality = 'auto';
    }
}