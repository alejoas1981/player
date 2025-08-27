/**
 * Analytics Manager - Handles event tracking and analytics
 */
class AnalyticsManager {
    constructor() {
        this.config = null;
        this.viewedThresholds = new Map();
        this.sessionData = new Map();
        this.trackingQueue = [];
        this.isTracking = false;
    }

    /**
     * Initialize analytics
     * @param {string} playerId
     * @param {Object} config
     */
    init(playerId, config) {
        this.config = config;

        if (!config.enabled) {
            return;
        }

        // Initialize session data
        this.sessionData.set(playerId, {
            sessionId: this.generateSessionId(),
            startTime: Date.now(),
            totalPlayTime: 0,
            seekCount: 0,
            qualityChanges: 0,
            maxProgress: 0,
            events: []
        });

        // Start tracking queue processor
        this.startTrackingProcessor();
    }

    /**
     * Track player event
     * @param {string} eventType
     * @param {Object} data
     */
    track(eventType, data) {
        if (!this.config?.enabled) {
            return;
        }

        const eventData = {
            eventType,
            playerId: data.playerId,
            timestamp: Date.now(),
            sessionId: this.sessionData.get(data.playerId)?.sessionId,
            ...data,
            ...this.getContextData()
        };

        // Add to session events
        const session = this.sessionData.get(data.playerId);
        if (session) {
            session.events.push(eventData);
            this.updateSessionStats(eventType, data, session);
        }

        // Queue for sending
        this.trackingQueue.push(eventData);

        console.log(`Analytics: ${eventType}`, eventData);
    }

    /**
     * Track video progress for viewed threshold
     * @param {string} playerId
     * @param {number} currentTime
     * @param {number} duration
     */
    trackProgress(playerId, currentTime, duration) {
        if (!this.config?.enabled || !duration) {
            return;
        }

        const progress = currentTime / duration;
        const session = this.sessionData.get(playerId);

        if (session) {
            session.maxProgress = Math.max(session.maxProgress, progress);

            // Check viewed threshold
            if (progress >= this.config.viewedThreshold && !this.viewedThresholds.has(playerId)) {
                this.viewedThresholds.set(playerId, true);
                this.track('viewed_threshold_reached', {
                    playerId,
                    threshold: this.config.viewedThreshold,
                    progress,
                    currentTime,
                    duration
                });
            }
        }
    }

    /**
     * Update session statistics
     * @param {string} eventType
     * @param {Object} data
     * @param {Object} session
     */
    updateSessionStats(eventType, data, session) {
        switch (eventType) {
            case 'seek':
                session.seekCount++;
                break;
            case 'quality_change':
                session.qualityChanges++;
                break;
            case 'play':
                session.lastPlayTime = Date.now();
                break;
            case 'pause':
                if (session.lastPlayTime) {
                    session.totalPlayTime += Date.now() - session.lastPlayTime;
                }
                break;
        }
    }

    /**
     * Get context data (CDN, ISP, GEO, etc.)
     * @returns {Object}
     */
    getContextData() {
        return {
            cdn: this.config.cdn,
            isp: this.config.isp,
            geo: this.config.geo,
            videoId: this.config.videoId,
            playerSource: this.config.playerSource,
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            connection: this.getConnectionInfo()
        };
    }

    /**
     * Get connection information
     * @returns {Object}
     */
    getConnectionInfo() {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            return {
                effectiveType: conn.effectiveType,
                downlink: conn.downlink,
                rtt: conn.rtt,
                saveData: conn.saveData
            };
        }
        return {};
    }

    /**
     * Start tracking queue processor
     */
    startTrackingProcessor() {
        if (this.isTracking) {
            return;
        }

        this.isTracking = true;
        this.processTrackingQueue();
    }

    /**
     * Process tracking queue
     */
    async processTrackingQueue() {
        while (this.isTracking) {
            if (this.trackingQueue.length > 0) {
                const events = this.trackingQueue.splice(0, 10); // Process in batches
                await this.sendEvents(events);
            }

            // Wait before next batch
            await this.sleep(1000);
        }
    }

    /**
     * Send events to tracking endpoint
     * @param {Array} events
     */
    async sendEvents(events) {
        if (!this.config.trackingUrl) {
            return;
        }

        try {
            const response = await fetch(this.config.trackingUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    events,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                console.warn('Analytics tracking failed:', response.status);
            }
        } catch (error) {
            console.error('Analytics tracking error:', error);
            // Re-queue events for retry
            this.trackingQueue.unshift(...events);
        }
    }

    /**
     * Generate unique session ID
     * @returns {string}
     */
    generateSessionId() {
        return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get session data for player
     * @param {string} playerId
     * @returns {Object}
     */
    getSessionData(playerId) {
        return this.sessionData.get(playerId);
    }

    /**
     * Sleep utility
     * @param {number} ms
     * @returns {Promise}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Stop tracking
     */
    stopTracking() {
        this.isTracking = false;
    }

    /**
     * Clean up analytics for player
     * @param {string} playerId
     */
    cleanup(playerId) {
        this.sessionData.delete(playerId);
        this.viewedThresholds.delete(playerId);
    }
}