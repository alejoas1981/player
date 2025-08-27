/**
 * MP4 Source - Progressive video playback implementation
 */
class Mp4Source extends VideoSource {
    constructor({ url, config }) {
        super({ url, config });
        this.qualities = ['auto'];
        this.currentQuality = 'auto';
    }

    /**
     * Load MP4 source
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
                reject(new Error(`MP4 load error: ${e.message}`));
            }, { once: true });
        });
    }


    setQuality(quality) {
        // Для совместимости с API
        console.log(`MP4 source doesn't support quality switching. Requested: ${quality}`);
    }

    /**
     * Get available qualities
     */
    getQualities() {
        return this.qualities;
    }

    /**
     * Get current quality
     */
    getCurrentQuality() {
        return this.currentQuality;
    }

    /**
     * Destroy MP4 source
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
        this.qualities = ['auto'];
        this.currentQuality = 'auto';
    }
}