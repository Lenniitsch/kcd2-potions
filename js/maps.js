// Maps Management - Vereinfacht wie alte Version
class MapsManager {
    constructor() {
        this.zoomistInstances = {};
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;
        
        try {
            this.initializeUndergroundMap();
            this.initializeDistrictsMap();
            this.initialized = true;
            console.log('✅ Maps initialized successfully');
        } catch (error) {
            console.warn('❌ Maps initialization failed:', error);
        }
    }

    initializeUndergroundMap() {
        if (this.zoomistInstances.underground) return;

        try {
            this.zoomistInstances.underground = new Zoomist("#zoomist-underground", {
                slider: true,
                zoomer: true,
                draggable: true
            });
        } catch (error) {
            console.error('Failed to initialize underground map:', error);
        }
    }

    initializeDistrictsMap() {
        if (this.zoomistInstances.districts) return;

        try {
            this.zoomistInstances.districts = new Zoomist("#zoomist-districts", {
                slider: true,
                zoomer: true,
                draggable: true
            });
        } catch (error) {
            console.error('Failed to initialize districts map:', error);
        }
    }

    destroy() {
        Object.values(this.zoomistInstances).forEach(instance => {
            if (instance && typeof instance.destroy === 'function') {
                instance.destroy();
            }
        });
        this.zoomistInstances = {};
        this.initialized = false;
    }

    resetZoom() {
        Object.values(this.zoomistInstances).forEach(instance => {
            if (instance && typeof instance.reset === 'function') {
                instance.reset();
            }
        });
    }
}
