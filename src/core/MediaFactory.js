/**
 * Media Factory - Factory Pattern for different media sources
 */
class MediaFactory {
    constructor() {
        this.sourceTypes = new Map([
            ['video', VideoSource],
            ['audio', AudioSource],
            ['hls', HLSSource],
            ['mp4', Mp4Source],
            ['dash', DASHSource]
        ]);
    }

    /**
     * Create media source based on URL and configuration
     * @param {Object} options - Media options
     * @returns {MediaSource}
     */
    createMediaSource({ url, type, config }) {
        const detectedType = type || this.detectMediaType(url, config);
        const SourceClass = this.sourceTypes.get(detectedType);

        if (!SourceClass) {
            throw new Error(`Unsupported media type: ${detectedType}`);
        }

        return new SourceClass({ url, config });
    }

    /**
     * Detect media type from URL and config
     * @param {string} url
     * @param {Object} config
     * @returns {string}
     */
    detectMediaType(url, config) {
        // Priority-based detection
        if (config.priority) {
            return config.priority;
        }

        // URL-based detection
        const urlLower = url.toLowerCase();

        if (urlLower.includes('.m3u8') || urlLower.includes('hls')) {
            return 'hls';
        }

        if (urlLower.includes('.mpd') || urlLower.includes('dash')) {
            return 'dash';
        }

        if (urlLower.match(/\.(mp3|wav|aac|ogg)(\?|$)/)) {
            return 'audio';
        }

        if (urlLower.match(/\.(mp4|webm|flv|avi|mov)(\?|$)/)) {
            return 'video';
        }

        // Default to video
        return 'video';
    }

    /**
     * Register new media source type
     * @param {string} type
     * @param {Class} SourceClass
     */
    registerSourceType(type, SourceClass) {
        this.sourceTypes.set(type, SourceClass);
    }

    /**
     * Get supported media types
     * @returns {Array}
     */
    getSupportedTypes() {
        return Array.from(this.sourceTypes.keys());
    }
}