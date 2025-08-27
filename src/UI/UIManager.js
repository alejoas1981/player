/**
 * UI Manager - Handles player interface and controls
 */
class UIManager extends EventManager {
    constructor({ container, config, playerId }) {
        super();

        this.container = container;
        this.config = config;
        this.playerId = playerId;

        // UI elements
        this.playerElement = null;
        this.videoElement = null;
        this.controlsElement = null;
        this.playButton = null;
        this.progressBar = null;
        this.volumeSlider = null;
        this.timeDisplay = null;

        // UI state
        this.controlsVisible = true;
        this.isFullscreen = false;
        this.hideTimeout = null;

        // Mobile detection
        this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Build player UI
     */
    async build() {
        this.createPlayerStructure();
        this.createControls();
        this.applyTheme();
        this.setupEventListeners();
        this.setupControlsAutoHide();
    }

    /**
     * Create main player structure
     */
    createPlayerStructure() {
        // Clear container
        this.container.innerHTML = '';
        this.container.className = 'universal-player-container';

        // Create player wrapper
        this.playerElement = document.createElement('div');
        this.playerElement.className = 'up-player';
        this.playerElement.setAttribute('data-player-id', this.playerId);

        // Create video element
        this.videoElement = document.createElement('video');
        this.videoElement.className = 'up-video';

        if (this.config.poster) {
            this.videoElement.poster = this.config.poster;
        }

        // Set video attributes
        this.videoElement.preload = 'metadata';
        this.videoElement.playsinline = true;

        if (this.config.vertical) {
            this.playerElement.classList.add('up-vertical');
        }

        this.playerElement.appendChild(this.videoElement);
        this.container.appendChild(this.playerElement);
    }

    /**
     * Create control elements
     */
    createControls() {
        // Main controls container
        this.controlsElement = document.createElement('div');
        this.controlsElement.className = 'up-controls';

        // Progress bar
        this.createProgressBar();

        // Control bar
        const controlBar = document.createElement('div');
        controlBar.className = 'up-control-bar';

        // Left controls
        const leftControls = document.createElement('div');
        leftControls.className = 'up-controls-left';

        this.createPlayButton(leftControls);
        this.createVolumeControls(leftControls);
        this.createTimeDisplay(leftControls);

        // Center controls (for mobile)
        const centerControls = document.createElement('div');
        centerControls.className = 'up-controls-center';

        // Right controls
        const rightControls = document.createElement('div');
        rightControls.className = 'up-controls-right';

        this.createQualityButton(rightControls);
        this.createSpeedButton(rightControls);
        this.createPipButton(rightControls);
        this.createFullscreenButton(rightControls);

        controlBar.appendChild(leftControls);
        controlBar.appendChild(centerControls);
        controlBar.appendChild(rightControls);

        this.controlsElement.appendChild(this.progressBar);
        this.controlsElement.appendChild(controlBar);

        // Top bar (optional)
        if (this.config.features.topBar) {
            this.createTopBar();
        }

        // Overlay elements
        this.createOverlayElements();

        this.playerElement.appendChild(this.controlsElement);
    }

    /**
     * Create progress bar
     */
    createProgressBar() {
        this.progressBar = document.createElement('div');
        this.progressBar.className = 'up-progress-container';

        const progressTrack = document.createElement('div');
        progressTrack.className = 'up-progress-track';

        const progressBuffer = document.createElement('div');
        progressBuffer.className = 'up-progress-buffer';

        const progressFill = document.createElement('div');
        progressFill.className = 'up-progress-fill';

        const progressHandle = document.createElement('div');
        progressHandle.className = 'up-progress-handle';

        progressTrack.appendChild(progressBuffer);
        progressTrack.appendChild(progressFill);
        progressTrack.appendChild(progressHandle);
        this.progressBar.appendChild(progressTrack);

        // Progress interaction
        let isDragging = false;

        const handleSeek = (e) => {
            const rect = progressTrack.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const time = percent * (this.videoElement.duration || 0);
            this.emit('ui:seek', { time });
        };

        progressTrack.addEventListener('mousedown', (e) => {
            isDragging = true;
            handleSeek(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                handleSeek(e);
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        // Touch events for mobile
        progressTrack.addEventListener('touchstart', (e) => {
            isDragging = true;
            const touch = e.touches[0];
            handleSeek(touch);
        });

        progressTrack.addEventListener('touchmove', (e) => {
            if (isDragging) {
                e.preventDefault();
                const touch = e.touches[0];
                handleSeek(touch);
            }
        });

        progressTrack.addEventListener('touchend', () => {
            isDragging = false;
        });
    }

    /**
     * Create play/pause button
     */
    createPlayButton(container) {
        this.playButton = document.createElement('button');
        this.playButton.className = 'up-btn up-play-btn';
        this.playButton.innerHTML = this.getPlayIcon();
        this.playButton.setAttribute('aria-label', 'Play');

        this.playButton.addEventListener('click', () => {
            if (this.videoElement.paused) {
                this.emit('ui:play');
            } else {
                this.emit('ui:pause');
            }
        });

        container.appendChild(this.playButton);
    }

    /**
     * Create volume controls
     */
    createVolumeControls(container) {
        if (!this.config.features.volume) return;

        const volumeContainer = document.createElement('div');
        volumeContainer.className = 'up-volume-container';

        const volumeButton = document.createElement('button');
        volumeButton.className = 'up-btn up-volume-btn';
        volumeButton.innerHTML = this.getVolumeIcon(1, false);
        volumeButton.setAttribute('aria-label', 'Mute');

        volumeButton.addEventListener('click', () => {
            this.emit('ui:mute');
        });

        this.volumeSlider = document.createElement('input');
        this.volumeSlider.type = 'range';
        this.volumeSlider.className = 'up-volume-slider';
        this.volumeSlider.min = '0';
        this.volumeSlider.max = '1';
        this.volumeSlider.step = '0.1';
        this.volumeSlider.value = '1';

        this.volumeSlider.addEventListener('input', (e) => {
            this.emit('ui:volume', { volume: parseFloat(e.target.value) });
        });

        volumeContainer.appendChild(volumeButton);
        volumeContainer.appendChild(this.volumeSlider);
        container.appendChild(volumeContainer);
    }

    /**
     * Create time display
     */
    createTimeDisplay(container) {
        if (!this.config.ui.showCurrentTime && !this.config.ui.showDuration) return;

        this.timeDisplay = document.createElement('div');
        this.timeDisplay.className = 'up-time-display';
        this.timeDisplay.textContent = '0:00 / 0:00';

        container.appendChild(this.timeDisplay);
    }

    /**
     * Create quality button
     */
    createQualityButton(container) {
        if (!this.config.features.qualityInControlBar) return;

        const qualityButton = document.createElement('button');
        qualityButton.className = 'up-btn up-quality-btn';
        qualityButton.innerHTML = 'HD';
        qualityButton.setAttribute('aria-label', 'Quality');

        // Quality menu would be implemented here
        qualityButton.addEventListener('click', () => {
            this.showQualityMenu();
        });

        container.appendChild(qualityButton);
    }

    /**
     * Create speed button
     */
    createSpeedButton(container) {
        if (!this.config.features.speed) return;

        const speedButton = document.createElement('button');
        speedButton.className = 'up-btn up-speed-btn';
        speedButton.innerHTML = '1x';
        speedButton.setAttribute('aria-label', 'Playback Speed');

        speedButton.addEventListener('click', () => {
            this.showSpeedMenu();
        });

        container.appendChild(speedButton);
    }

    /**
     * Create PiP button
     */
    createPipButton(container) {
        if (!this.config.features.pip) return;

        const pipButton = document.createElement('button');
        pipButton.className = 'up-btn up-pip-btn';
        pipButton.innerHTML = this.getPipIcon();
        pipButton.setAttribute('aria-label', 'Picture in Picture');

        pipButton.addEventListener('click', () => {
            this.emit('ui:pip');
        });

        container.appendChild(pipButton);
    }

    /**
     * Create fullscreen button
     */
    createFullscreenButton(container) {
        const fullscreenButton = document.createElement('button');
        fullscreenButton.className = 'up-btn up-fullscreen-btn';
        fullscreenButton.innerHTML = this.getFullscreenIcon(false);
        fullscreenButton.setAttribute('aria-label', 'Fullscreen');

        fullscreenButton.addEventListener('click', () => {
            this.emit('ui:fullscreen');
        });

        container.appendChild(fullscreenButton);
    }

    /**
     * Create top bar
     */
    createTopBar() {
        const topBar = document.createElement('div');
        topBar.className = 'up-top-bar';

        if (this.config.theme.customLogo) {
            const logo = document.createElement('img');
            logo.src = this.config.theme.customLogo;
            logo.className = 'up-logo';
            topBar.appendChild(logo);
        }

        this.controlsElement.appendChild(topBar);
    }

    /**
     * Create overlay elements
     */
    createOverlayElements() {
        // Loading spinner
        const spinner = document.createElement('div');
        spinner.className = 'up-spinner';
        spinner.innerHTML = this.getSpinnerIcon();
        this.playerElement.appendChild(spinner);

        // Big play button
        const bigPlayButton = document.createElement('button');
        bigPlayButton.className = 'up-big-play-btn';
        bigPlayButton.innerHTML = this.getPlayIcon();
        bigPlayButton.addEventListener('click', () => {
            this.emit('ui:play');
        });
        this.playerElement.appendChild(bigPlayButton);
    }

    /**
     * Apply theme styling
     */
    applyTheme() {
        const { customColor } = this.config.theme;

        if (customColor) {
            this.playerElement.style.setProperty('--up-primary-color', customColor);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Player click for play/pause
        this.playerElement.addEventListener('click', (e) => {
            if (e.target === this.videoElement || e.target === this.playerElement) {
                if (this.videoElement.paused) {
                    this.emit('ui:play');
                } else {
                    this.emit('ui:pause');
                }
            }
        });

        // Keyboard controls
        this.playerElement.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // Mouse movement for controls
        this.playerElement.addEventListener('mousemove', () => {
            this.showControls();
        });

        this.playerElement.addEventListener('mouseleave', () => {
            this.hideControls();
        });
    }

    /**
     * Setup auto-hide controls
     */
    setupControlsAutoHide() {
        if (this.config.ui.controlsAlwaysVisible) {
            return;
        }

        const autoHide = () => {
            if (this.hideTimeout) {
                clearTimeout(this.hideTimeout);
            }

            this.hideTimeout = setTimeout(() => {
                if (!this.videoElement.paused) {
                    this.hideControls();
                }
            }, this.config.ui.hideControlsTimeout);
        };

        this.playerElement.addEventListener('mousemove', autoHide);
        this.playerElement.addEventListener('touchstart', autoHide);
    }

    /**
     * Handle keyboard controls
     */
    handleKeyboard(e) {
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                if (this.videoElement.paused) {
                    this.emit('ui:play');
                } else {
                    this.emit('ui:pause');
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.emit('ui:seek', { time: Math.max(0, this.videoElement.currentTime - 10) });
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.emit('ui:seek', { time: Math.min(this.videoElement.duration, this.videoElement.currentTime + 10) });
                break;
            case 'KeyF':
                e.preventDefault();
                this.emit('ui:fullscreen');
                break;
            case 'KeyM':
                e.preventDefault();
                this.emit('ui:mute');
                break;
        }
    }

    // Public API methods
    updatePlayButton(isPlaying) {
        // Big play button
        const bigPlayButton = this.config.container.querySelector('.up-big-play-btn');
        if (this.playButton) {
            this.playButton.innerHTML = isPlaying ? this.getPauseIcon() : this.getPlayIcon();
            this.playButton.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
        }

        if (bigPlayButton) {
            bigPlayButton.style.display = isPlaying ? 'none' : 'block';
            bigPlayButton.innerHTML = isPlaying ? this.getPauseIcon() : this.getPlayIcon();
        }
    }

    updateProgress(currentTime, duration) {
        if (!this.progressBar || !duration) return;

        const percent = (currentTime / duration) * 100;
        const progressFill = this.progressBar.querySelector('.up-progress-fill');

        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }

        if (this.timeDisplay) {
            this.timeDisplay.textContent = `${this.formatTime(currentTime)} / ${this.formatTime(duration)}`;
        }
    }

    updateVolume(volume, muted) {
        if (this.volumeSlider) {
            this.volumeSlider.value = volume;
        }

        const volumeButton = this.playerElement.querySelector('.up-volume-btn');
        if (volumeButton) {
            volumeButton.innerHTML = this.getVolumeIcon(volume, muted);
        }
    }

    showBuffering(show) {
        const spinner = this.playerElement.querySelector('.up-spinner');
        if (spinner) {
            spinner.style.display = show ? 'block' : 'none';
        }
    }

    showControls() {
        this.controlsElement.classList.add('up-controls-visible');
        this.controlsVisible = true;
    }

    hideControls() {
        if (!this.videoElement.paused) {
            this.controlsElement.classList.remove('up-controls-visible');
            this.controlsVisible = false;
        }
    }

    // Quality and speed menus (simplified)
    showQualityMenu() {
        console.log('Quality menu would appear here');
    }

    showSpeedMenu() {
        console.log('Speed menu would appear here');
    }

    // Icon methods (using simple text for now, would use SVG icons in production)
    getPlayIcon() {
        return '▶';
    }

    getPauseIcon() {
        return '⏸';
    }

    getVolumeIcon(volume, muted) {
        if (muted || volume === 0) return '🔇';
        if (volume < 0.5) return '🔉';
        return '🔊';
    }

    getFullscreenIcon(isFullscreen) {
        return isFullscreen ? '⏷' : '⛶';
    }

    getPipIcon() {
        return '⧉';
    }

    getSpinnerIcon() {
        return '⟳';
    }

    // Utility methods
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    destroy() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }

        this.clearAll();

        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}