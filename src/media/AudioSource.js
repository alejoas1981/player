/**
 * Audio Source - Audio media source implementation
 */
class AudioSource extends VideoSource {
    constructor({ url, config }) {
        super({ url, config });
        this.mediaType = 'audio';
    }

    /**
     * Load audio source
     */
    async load() {
        return new Promise((resolve, reject) => {
            // For audio, we create an audio element instead of using video
            this.audioElement = document.createElement('audio');
            this.audioElement.className = 'up-audio';
            this.audioElement.preload = 'metadata';

            // Replace video element in container
            const container = this.config.container.querySelector('.up-player');
            const videoElement = container.querySelector('.up-video');

            if (videoElement) {
                container.replaceChild(this.audioElement, videoElement);
                this.videoElement = this.audioElement; // Keep compatibility with parent class
            }

            this.setupEventListeners();

            this.audioElement.src = this.url;

            this.audioElement.addEventListener('loadeddata', () => {
                this.isLoaded = true;
                resolve();
            }, { once: true });

            this.audioElement.addEventListener('error', (e) => {
                reject(new Error(`Audio load error: ${e.message}`));
            }, { once: true });
        });
    }

    /**
     * Audio sources don't support PiP
     */
    supportsPiP() {
        return false;
    }

    async togglePictureInPicture() {
        throw new Error('Picture-in-Picture not supported for audio');
    }

    /**
     * Audio sources don't support quality switching
     */
    setQuality(quality) {
        console.log(`Audio source doesn't support quality switching to ${quality}`);
    }
}