/**
 * Universal Player - Singleton implementation
 */
class UniversalPlayer {
    constructor() {
        if (UniversalPlayer.instance) {
            return UniversalPlayer.instance;
        }

        this.version = '1.0.0';
        this.instances = new Map();
        this.activePlayerId = null;

        // Core managers
        this.eventManager = new EventManager();
        this.mediaFactory = new MediaFactory();
        this.configManager = new ConfigManager();
        this.analyticsManager = new AnalyticsManager();
        this.adManager = new AdManager();

        UniversalPlayer.instance = this;
        return this;
    }

    /**
     * Initialize player instance
     * @param {string|HTMLElement} container - Container selector or element
     * @param {Object} config - Player configuration
     * @returns {PlayerInstance}
     */
    init(container, config = {}) {
        const containerElement = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!containerElement) {
            throw new Error(`Container not found: ${container}`);
        }

        const playerId = this.generatePlayerId();
        config['container'] = containerElement;
        const playerConfig = this.configManager.createConfig(config);

        // Create player instance
        const playerInstance = new PlayerInstance({
            id: playerId,
            container: containerElement,
            config: playerConfig,
            eventManager: this.eventManager,
            mediaFactory: this.mediaFactory,
            analyticsManager: this.analyticsManager,
            adManager: this.adManager
        });

        this.instances.set(playerId, playerInstance);
        this.activePlayerId = playerId;

        return playerInstance;
    }

    /**
     * Get player instance by ID
     */
    getInstance(playerId) {
        return this.instances.get(playerId);
    }

    /**
     * Get active player instance
     */
    getActiveInstance() {
        return this.instances.get(this.activePlayerId);
    }

    /**
     * Destroy player instance
     */
    destroy(playerId) {
        const instance = this.instances.get(playerId);
        if (instance) {
            instance.destroy();
            this.instances.delete(playerId);

            if (this.activePlayerId === playerId) {
                this.activePlayerId = this.instances.keys().next().value || null;
            }
        }
    }

    /**
     * Generate unique player ID
     */
    generatePlayerId() {
        return `up_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Individual Player Instance
 */
class PlayerInstance {
    constructor({ id, container, config, eventManager, mediaFactory, analyticsManager, adManager }) {
        this.id = id;
        this.container = container;
        this.config = config;
        this.eventManager = eventManager;
        this.mediaFactory = mediaFactory;
        this.analyticsManager = analyticsManager;
        this.adManager = adManager;

        // Player state
        this.state = {
            currentTime: 0,
            duration: 0,
            volume: 1,
            muted: false,
            playing: false,
            buffering: false,
            fullscreen: false,
            pip: false,
            quality: 'auto',
            playbackRate: 1,
            seeking: false
        };

        this.init();
    }

    async init() {
        try {
            // Initialize UI
            this.uiManager = new UIManager({
                container: this.container,
                config: this.config,
                playerId: this.id
            });

            // Create media source
            this.mediaSource = this.mediaFactory.createMediaSource({
                url: this.config.videoUrl,
                type: this.config.mediaType,
                config: this.config
            });

            // Setup event listeners
            this.setupEventListeners();

            // Initialize analytics
            this.analyticsManager.init(this.id, this.config.eventTracking);

            // Initialize ads if configured
            if (this.config.adRolls) {
                this.adManager.init(this.container, this.config.adRolls);
            }

            // Build UI
            await this.uiManager.build();

            // Load media
            await this.mediaSource.load();

            // Setup initial state
            this.applyInitialSettings();

            // Fire ready event
            this.eventManager.emit('player:ready', { playerId: this.id });

        } catch (error) {
            console.error('Player initialization failed:', error);
            this.eventManager.emit('player:error', { playerId: this.id, error });
        }
    }

    setupEventListeners() {
        // Media events
        this.mediaSource.on('loadstart', () => this.eventManager.emit('media:loadstart', { playerId: this.id }));
        this.mediaSource.on('canplay', () => this.eventManager.emit('media:canplay', { playerId: this.id }));
        this.mediaSource.on('play', () => this.handlePlay());
        this.mediaSource.on('pause', () => this.handlePause());
        this.mediaSource.on('ended', () => this.handleEnded());
        this.mediaSource.on('timeupdate', (data) => this.handleTimeUpdate(data));
        this.mediaSource.on('volumechange', (data) => this.handleVolumeChange(data));
        this.mediaSource.on('seeking', () => this.handleSeeking());
        this.mediaSource.on('seeked', () => this.handleSeeked());
        this.mediaSource.on('error', (error) => this.handleError(error));

        // UI events
        this.uiManager.on('ui:play', () => this.play());
        this.uiManager.on('ui:pause', () => this.pause());
        this.uiManager.on('ui:seek', (data) => this.seek(data.time));
        this.uiManager.on('ui:volume', (data) => this.setVolume(data.volume));
        this.uiManager.on('ui:mute', () => this.toggleMute());
        this.uiManager.on('ui:fullscreen', () => this.toggleFullscreen());
        this.uiManager.on('ui:pip', () => this.togglePictureInPicture());
        this.uiManager.on('ui:speed', (data) => this.setPlaybackRate(data.rate));
        this.uiManager.on('ui:quality', (data) => this.setQuality(data.quality));
    }

    applyInitialSettings() {
        if (this.config.startOffset) {
            this.seek(this.config.startOffset);
        }

        if (this.config.autoplay) {
            this.play();
        }

        if (this.config.volume !== undefined) {
            this.setVolume(this.config.volume);
        }
    }

    // Public API Methods
    async play() {
        try {
            await this.mediaSource.play();
            this.state.playing = true;
            this.analyticsManager.track('play', { playerId: this.id, currentTime: this.state.currentTime });
        } catch (error) {
            console.error('Play failed:', error);
            this.eventManager.emit('player:error', { playerId: this.id, error });
        }
    }

    pause() {
        this.mediaSource.pause();
        this.state.playing = false;
        this.analyticsManager.track('pause', { playerId: this.id, currentTime: this.state.currentTime });
    }

    seek(time) {
        this.mediaSource.seek(time);
        this.analyticsManager.track('seek', { playerId: this.id, from: this.state.currentTime, to: time });
    }

    setVolume(volume) {
        this.mediaSource.setVolume(volume);
        this.state.volume = volume;
        this.state.muted = volume === 0;
    }

    toggleMute() {
        const newMuted = !this.state.muted;
        this.mediaSource.setMuted(newMuted);
        this.state.muted = newMuted;
    }

    setPlaybackRate(rate) {
        this.mediaSource.setPlaybackRate(rate);
        this.state.playbackRate = rate;
    }

    setQuality(quality) {
        this.mediaSource.setQuality(quality);
        this.state.quality = quality;
        this.analyticsManager.track('quality_change', { playerId: this.id, quality });
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.container.requestFullscreen();
            this.state.fullscreen = true;
        } else {
            document.exitFullscreen();
            this.state.fullscreen = false;
        }
        this.analyticsManager.track('fullscreen', { playerId: this.id, fullscreen: this.state.fullscreen });
    }

    togglePictureInPicture() {
        if (this.config.pip.enabled && this.mediaSource.supportsPiP()) {
            this.mediaSource.togglePictureInPicture();
            this.state.pip = !this.state.pip;
        }
    }

    // Event handlers
    handlePlay() {
        this.state.playing = true;
        this.uiManager.updatePlayButton(true);
        this.eventManager.emit('player:play', { playerId: this.id });
    }

    handlePause() {
        this.state.playing = false;
        this.uiManager.updatePlayButton(false);
        this.eventManager.emit('player:pause', { playerId: this.id });
    }

    handleEnded() {
        this.state.playing = false;
        this.uiManager.updatePlayButton(false);
        this.eventManager.emit('player:ended', { playerId: this.id });
        this.analyticsManager.track('ended', { playerId: this.id });

        // Handle next video
        if (this.config.nextVideo && this.config.nextVideo.url) {
            this.loadVideo(this.config.nextVideo.url);
        }
    }

    handleTimeUpdate({ currentTime, duration }) {
        this.state.currentTime = currentTime;
        this.state.duration = duration;
        this.uiManager.updateProgress(currentTime, duration);
        this.analyticsManager.trackProgress(this.id, currentTime, duration);
    }

    handleVolumeChange({ volume, muted }) {
        this.state.volume = volume;
        this.state.muted = muted;
        this.uiManager.updateVolume(volume, muted);
    }

    handleSeeking() {
        this.state.seeking = true;
        this.uiManager.showBuffering(true);
    }

    handleSeeked() {
        this.state.seeking = false;
        this.uiManager.showBuffering(false);
    }

    handleError(error) {
        console.error('Media error:', error);
        this.eventManager.emit('player:error', { playerId: this.id, error });
    }

    // Utility methods
    loadVideo(url) {
        this.mediaSource.loadUrl(url);
    }

    getState() {
        return { ...this.state };
    }

    destroy() {
        this.mediaSource?.destroy();
        this.uiManager?.destroy();
        this.adManager?.destroy();
        this.container.innerHTML = '';
    }
}

// Create singleton instance
const universalPlayer = new UniversalPlayer();
// Global window object for script tag usage
if (typeof window !== 'undefined') {
    window.UniversalPlayer = universalPlayer;
}