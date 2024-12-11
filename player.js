// VideoPlayerInterface defining the contract for all video players
class VideoPlayerInterface {
    constructor(container, options) {
        if (new.target === VideoPlayerInterface) {
            throw new Error("Cannot instantiate an interface directly.");
        }
        this.container = container;
        this.options = options;
    }

    initialize() {
        throw new Error("Method 'initialize()' must be implemented.");
    }

    play() {
        throw new Error("Method 'play()' must be implemented.");
    }

    pause() {
        throw new Error("Method 'pause()' must be implemented.");
    }

    destroy(callback) {
        throw new Error("Method 'destroy(callback)' must be implemented.");
    }
}

// Base video player class with common functionality
class BaseVideoPlayer extends VideoPlayerInterface {
    static defaultOptions = {
        autoplay: false,
        muted: true,
        loop: false
    };

    constructor(container, options) {
        const mergedOptions = { ...BaseVideoPlayer.defaultOptions, ...options };
        super(container, mergedOptions);
    }

    addEventListeners() {
        this.videoElement.addEventListener('error', () => {
            console.error("Error: Unable to play video.");
        });

        this.videoElement.addEventListener('abort', () => {
            console.warn("Playback aborted.");
        });
    }

    destroy(callback) {
        this.videoElement.pause();
        this.container.innerHTML = '';
        if (typeof callback === 'function') {
            callback();
        }
    }
}

// Implementation of the Canvas-based player
class CanvasPlayer extends BaseVideoPlayer {
    initialize() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.container.appendChild(this.canvas);

        this.context = this.canvas.getContext('2d');
        this.videoElement = document.createElement('video');

        // Determine default quality or fallback to the first quality
        const defaultQuality = this.options[0]?.mediaDefinitions?.find(def => def.defaultQuality) || this.options[0]?.mediaDefinitions[0];
        if (!defaultQuality) {
            throw new Error("No mediaDefinitions found.");
        }
        this.videoElement.src = defaultQuality.url;

        this.videoElement.crossOrigin = 'anonymous';
        this.videoElement.muted = this.options.muted;
        this.videoElement.loop = this.options.loop;

        this.videoElement.addEventListener('play', () => {
            this.renderFrame();
        });

        this.addEventListeners();

        // Autoplay if the option is set
        if (this.options.autoplay) {
            this.videoElement.play();
        }
    }

    renderFrame() {
        if (!this.videoElement.paused && !this.videoElement.ended) {
            this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
            requestAnimationFrame(() => this.renderFrame());
        }
    }

    play() {
        this.videoElement.play();
    }

    pause() {
        this.videoElement.pause();
    }
}

// Implementation of the HLS-based player
class HlsPlayer extends BaseVideoPlayer {
    initialize() {
        if (!Hls.isSupported()) {
            throw new Error("HLS is not supported in this browser.");
        }

        this.videoElement = document.createElement('video');
        this.videoElement.controls = true;
        this.videoElement.style.width = '100%';
        this.videoElement.style.height = '100%';
        this.container.appendChild(this.videoElement);

        this.hls = new Hls();
        const defaultQuality = this.options[0]?.mediaDefinitions?.find(def => def.defaultQuality) || this.options[0]?.mediaDefinitions[0];
        if (!defaultQuality) {
            throw new Error("No mediaDefinitions found.");
        }
        this.hls.loadSource(defaultQuality.url);
        this.hls.attachMedia(this.videoElement);
    }

    play() {
        this.videoElement.play();
    }

    pause() {
        this.videoElement.pause();
    }

    destroy(callback) {
        this.hls.destroy();
        super.destroy(callback);
    }
}

// Implementation of the MP4-based player
class Mp4Player extends BaseVideoPlayer {
    initialize() {
        this.videoElement = document.createElement('video');
        this.videoElement.controls = true;
        this.videoElement.style.width = '100%';
        this.videoElement.style.height = '100%';
        this.container.appendChild(this.videoElement);

        const defaultQuality = this.options[0]?.mediaDefinitions?.find(def => def.defaultQuality) || this.options[0]?.mediaDefinitions[0];
        if (!defaultQuality) {
            throw new Error("No mediaDefinitions found.");
        }
        this.videoElement.src = defaultQuality.url;

        this.addEventListeners();

        // Autoplay if the option is set
        if (this.options.autoplay) {
            this.videoElement.play();
        }
    }

    play() {
        this.videoElement.play();
    }

    pause() {
        this.videoElement.pause();
    }
}

// Factory for creating players
class VideoPlayerFactory {
    static createPlayer(container, options, type = 'canvas') {
        switch (type) {
            case 'hls':
                return new HlsPlayer(container, options);
            case 'mp4':
                return new Mp4Player(container, options);
            case 'canvas':
                return new CanvasPlayer(container, options);
            default:
                throw new Error(`Unknown player type: ${type}`);
        }
    }
}

// Example usage
const container = document.getElementById('video-container');
const dataObject = [
    {
        mediaDefinitions: [
            { url: 'https://example.com/video_hd.mp4', quality: 'hd', defaultQuality: true },
            { url: 'https://example.com/video_sd.mp4', quality: 'sd', defaultQuality: false }
        ],
        idVideoPlayer: 'q_65ee91ea69b94_0',
        videoTitle: "They're growing",
        imageUrl: 'https://test.jpg'
    }
];

try {
    const player = VideoPlayerFactory.createPlayer(container, { autoplay: true, loop: true, ...dataObject });
    player.initialize();

    // Player controls
    document.getElementById('play-btn').addEventListener('click', () => player.play());
    document.getElementById('pause-btn').addEventListener('click', () => player.pause());

    // Destroy with callback
    document.getElementById('destroy-btn').addEventListener('click', () => {
        player.destroy(() => {
            console.log("Player has been destroyed.");
        });
    });
} catch (error) {
    console.error(error.message);
}
