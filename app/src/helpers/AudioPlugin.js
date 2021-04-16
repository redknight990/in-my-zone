export default class AudioPlugin {

    static listenerMap = {
        onComplete: 'ended',
        onLoad: 'waiting',
        onReady: 'canplay',
        onPlay: 'play',
        onPause: 'pause'
    };

    static player = new Audio();
    static listeners = [];

    static possibleListeners = ['onComplete', 'onLoad', 'onReady', 'onPlay', 'onPause'];
    static onComplete;
    static onLoad;
    static onReady;
    static onPlay;
    static onPause;

    static prepare({ uri }) {
        return new Promise((resolve, reject) => {
            this.removeAllListeners();

            this.player.preload = 'auto';
            this.player.src = uri + '?html5=1';
            this.player.currentTime = 0;
            this.player.pause();
            this.player.load();

            this.possibleListeners.forEach(l => this.addRemovableListener(this.listenerMap[l], () => {
                if (this[l] !== undefined && typeof this[l] === 'function')
                    this[l]();
            }));

            this.addRemovableListener('canplay', resolve);
            this.addRemovableListener('abort', reject);
            this.addRemovableListener('error', reject);
        });
    }

    static play() {
        return this.player?.play();
    }

    static pause() {
        this.player?.pause();
    }

    static stop() {
        this.player.src = null;
    }

    static seek({ to }) {
        this.player.currentTime = to;
    }

    static setVolume({ value }) {
        this.player.volume = value;
    }

    static getVolume() {
        return this.player.volume;
    }

    static getCurrentTime() {
        return { time: this.player.currentTime };
    }

    static setMuted({ value }) {
        this.player.muted = value;
    }

    static isMuted() {
        return this.player.muted;
    }

    static getDuration() {
        return this.player.duration * 1000;
    }

    static addRemovableListener(event, callback) {
        this.listeners.push({
            event,
            callback
        });
        this.player.addEventListener(event, callback);
    }

    static addListener(event, callback) {
        this[event] = event === 'onReady' ? () => callback({ duration: this.player.duration * 1000 }) : callback;
    }

    static removeAllListeners() {
        this.listeners.forEach(l => {
            this.player.removeEventListener(l.event, l.callback);
        });
        this.listeners = [];
    }

}
