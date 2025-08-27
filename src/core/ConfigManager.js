/**
 * Configuration Manager - Manages player configuration with defaults
 */
class ConfigManager {
    constructor() {
        this.defaultConfig = {
            // Media settings
            videoUrl: '',
            poster: '',
            autoplay: false,
            startOffset: 0,
            vertical: false,
            locale: 'en',
            priority: 'hls',
            container: null,

            // Features
            features: {
                speed: true,
                nextVideo: true,
                volume: true,
                pip: true,
                chromecast: false,
                qualityInControlBar: true,
                topBar: true,
                share: false,
                oneHand: false,
                cinema: true,
                ccVisible: true
            },

            // HLS Configuration
            hlsConfig: {
                maxBufferLength: 30,
                maxInitialBufferLength: 6,
                prebufferGoal: 3,
                enableWorker: true,
                lowLatencyMode: false
            },

            // Interactive hotspots
            hotspots: [],

            // Related videos menu
            menu: {
                related: [],
                showOnPause: true,
                slideout: false
            },

            // Theme configuration
            theme: {
                customColor: '#FF6B00',
                customLogo: '',
                themeCode: 'default'
            },

            // Picture-in-Picture
            pip: {
                enabled: true,
                position: 'bottom-right',
                size: { width: 320, height: 180 }
            },

            // Event tracking
            eventTracking: {
                enabled: false,
                cdn: 'unknown',
                isp: 'unknown',
                geo: 'unknown',
                videoId: '',
                playerSource: 'universal-player',
                viewedThreshold: 0.8,
                trackingUrl: ''
            },

            // Next video settings
            nextVideo: {
                enabled: true,
                url: '',
                title: '',
                poster: '',
                countdown: 10
            },

            // Ad configuration
            adRolls: {
                preRoll: null,
                postRoll: null,
                pauseRoll: null
            },

            // VR Support
            isVr: false,
            vrProps: {},

            // UI Settings
            ui: {
                hideControlsTimeout: 3000,
                showThumbnails: true,
                showDuration: true,
                showCurrentTime: true,
                controlsAlwaysVisible: false
            },

            // Quality settings
            quality: {
                default: 'auto',
                levels: ['auto', '1080p', '720p', '480p', '360p', '240p']
            },

            // Speed settings
            speed: {
                default: 1,
                options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
            },

            // Volume settings
            volume: 1,
            muted: false,

            // Subtitles
            subtitles: {
                enabled: false,
                tracks: [],
                defaultLanguage: 'en'
            }
        };
    }

    /**
     * Create configuration by merging user config with defaults
     * @param {Object} userConfig
     * @returns {Object}
     */
    createConfig(userConfig = {}) {
        return this.deepMerge(this.defaultConfig, userConfig);
    }

    /**
     * Deep merge objects
     * @param {Object} target
     * @param {Object} source
     * @returns {Object}
     */
    deepMerge(target, source) {
        const result = { ...target };

        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (this.isObject(source[key]) && this.isObject(result[key])) {
                    result[key] = this.deepMerge(result[key], source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }

        return result;
    }

    /**
     * Check if value is object
     * @param {*} item
     * @returns {boolean}
     */
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    /**
     * Validate configuration
     * @param {Object} config
     * @returns {Object}
     */
    validateConfig(config) {
        const errors = [];

        if (!config.videoUrl) {
            errors.push('videoUrl is required');
        }

        if (config.startOffset && (config.startOffset < 0 || !Number.isFinite(config.startOffset))) {
            errors.push('startOffset must be a positive number');
        }

        if (config.volume && (config.volume < 0 || config.volume > 1)) {
            errors.push('volume must be between 0 and 1');
        }

        if (errors.length > 0) {
            throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
        }

        return config;
    }

    /**
     * Get default configuration
     * @returns {Object}
     */
    getDefaultConfig() {
        return { ...this.defaultConfig };
    }
}