# UniversalPlayer.js

**UniversalPlayer.js** is a lightweight, high-performance, fully universal media player written in pure JavaScript (ES6+), with no external dependencies. It supports video, audio, HLS/DASH, advanced customization, and analytics.

The player can be embedded on any web page and initialized via a simple configuration object.

**Screenshots:**

---

## Key Features

- **Media support:** Video (MP4, WebM, FLV, HLS/DASH), Audio (MP3, WAV, AAC)
- **Source prioritization:** Automatically picks the preferred source (`hls` by default)
- **Playback controls:** Play, Pause, Stop, seek forward/backward, hold-to-FFD
- **Volume controls:** Adjust volume, mute/unmute
- **Fullscreen:** Fullscreen mode with automatic fullscreen on mobile
- **Picture-in-Picture (PiP):** Mini-player mode with enable/disable
- **Autoplay & start offset:** Option to autoplay and set initial playback time
- **Subtitles:** Closed captions or custom subtitles
- **Playback speed control**
- **UI/UX:** Customizable buttons, control panels, auto-hide controls, video thumbnails, sprites
- **Theming:** Colors, logos, and full interface customization via config
- **Interactive points:** Hotspots and related videos display
- **Event tracking & analytics:** play, pause, seek, end, fullscreen, quality changes, with data reporting (videoId, geo, CDN, ISP, view thresholds)
- **Ad support:** Pre-roll, pause-roll, post-roll ads
- **Performance:** Minimal JS/CSS size, fast loading, smooth playback on pages with multiple media elements
- **Compatibility:** Desktop (Chrome, Firefox, Edge, Safari) and Mobile (Chrome, Safari, Android WebView)
- **Extensibility:** Add new media formats, integrate analytics, VR, or ads, dynamically replace player on page

---

## Installation

Include the script on your page:

```html
<script src="path/to/universalplayer.js"></script>

<script>
UniversalPlayer.init('#container', {
  videoUrl: 'https://example.com/video.mp4',
  poster: 'https://example.com/poster.jpg',
  autoplay: true,
  startOffset: 10,
  vertical: false,
  locale: 'en',
  features: {
    speed: true,
    nextVideo: true,
    volume: true,
    pip: true,
    chromecast: false,
    qualityInControlBar: true,
    topBar: true,
    share: true,
    oneHand: false,
    cinema: false,
    ccVisible: true
  },
  hlsConfig: {
    maxBufferLength: 30,
    maxInitialBufferLength: 10,
    prebufferGoal: 5
  },
  hotspots: [],
  menu: { relatedVideos: [], showOnPause: true, slideout: true },
  theme: { customColor: '#ff0000', customLogo: 'logo.png', themeCode: 'dark' },
  pip: { enabled: true },
  eventTracking: { cdn: 'cdn1', isp: 'isp1', geo: 'US', videoId: '1234', playerSource: 'site', viewedThreshold: 50 },
  flashSettings: { postRoll: null, pauseRoll: null, extraFlashvars: {} },
  nextVideo: { enabled: true },
  adRolls: { preRoll: true, postRoll: true }
});
</script>
```
## Architecture

- **Singleton:** One centralized player instance per page
- **Factory:** Create different media types (video, audio, HLS, DASH)
- **Observer/Publisher-Subscriber:** Player events (play, pause, seek, end, fullscreen, quality change)
- **Strategy:** Multiple playback modes and interfaces (portrait, landscape, mini-player, PiP)
- **Facade:** Simplified API for embedding and configuration
- **Module pattern:** Modular code for UI, media control, events, analytics, ads

## Testing

- **Desktop:** Chrome, Firefox, Edge, Safari
- **Mobile:** Chrome, Safari, Android WebView
- **Functionality:** autoplay, fullscreen, PiP, seeking, hotspots, next video, subtitles, ads
- **Performance:** load time, memory usage, video FPS  