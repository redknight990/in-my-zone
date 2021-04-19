<template>
    <div class="player-modal" :style="artStyle">
        <div class="header">
            <v-menu offset-y v-if="isDesktop">
                <template #activator="{ on, attrs }">
                    <div class="d-flex justify-center align-center" style="position: absolute; left: 0; top: 0; bottom: 0; z-index: 5">
                        <v-btn fab icon small v-bind="attrs" v-on="on">
                            <v-icon>volume_up</v-icon>
                        </v-btn>
                    </div>
                </template>
                <v-card class="py-2 overflow-hidden">
                    <v-slider v-model="volume" vertical :min="0" :max="1" :step="0.01" hide-details></v-slider>
                </v-card>
            </v-menu>
            <div class="title overflow-hidden">
                <div>
                    <div class="title-top text-ellipsis">PLAYING FROM PLAYLIST</div>
                    <div class="title-bottom text-ellipsis" v-if="currentPlaylist">{{currentPlaylist.name}}</div>
                </div>
            </div>
            <v-menu offset-y :close-on-content-click="false">
                <template #activator="{ on, attrs }">
                    <div class="d-flex justify-center align-center" style="position: absolute; right: 0; top: 0; bottom: 0; z-index: 5">
                        <v-btn fab icon small v-bind="attrs" v-on="on">
                            <v-icon>timer</v-icon>
                        </v-btn>
                    </div>
                </template>
                <v-card class="py-2 overflow-hidden">
                    <v-time-picker v-model="timer" format="24hr" scrollable @input="onTimeOut"></v-time-picker>
                </v-card>
            </v-menu>
        </div>
        <div class="song-container">
            <v-text-field v-model="keyword" class="flex-0" dense placeholder="Enter a keyword (ex: study, relax)" @keydown.enter="fetchRecommendationsAndPlay(), $event.target.blur()">
                <template #append>
                    <v-btn fab icon small @click.stop="fetchRecommendationsAndPlay">
                        <v-icon>search</v-icon>
                    </v-btn>
                </template>
            </v-text-field>
            <v-img :src="song | thumbnailHD" :lazy-src="song | thumbnail" :aspect-ratio="1" class="mx-auto elevation-3 rounded" style="background-color: black;" @load="loadGradient(thumbnailHD(song))" contain></v-img>
            <div class="name-container">
                <div class="name">
                    <text-scroller ref="textScroller">
                        <div class="track-name" v-if="song">{{ song.name }}</div>
                    </text-scroller>
                    <div class="artist-name text-ellipsis">{{ song | artist }}</div>
                </div>
            </div>
        </div>
        <div class="seek">
            <v-slider class="seek-slider"
                      color="white"
                      :value="seekWidth" :min="0" :max="100" :disabled="loading"
                      @input="seekTime = $event"
                      @start="seekBarIsMoving = true"
                      @change="onSliderChange(seekTime * duration / 100000)"/>
            <div class="slider-hints">
                <span>{{ songTime }}</span>
                <span>{{ songTotalTime }}</span>
            </div>
        </div>
        <div class="controls">
            <v-btn fab text small @click.stop="playPreviousPlaylist" :disabled="loading">
                <v-icon>fast_rewind</v-icon>
            </v-btn>
            <v-btn fab text small @click.stop="playPrevious" :disabled="loading">
                <v-icon>skip_previous</v-icon>
            </v-btn>
            <v-btn fab :disabled="loading || !song" color="white" class="black--text" @click.stop="resume" v-if="loading || !playing">
                <v-icon large>play_arrow</v-icon>
                <v-progress-circular v-if="loading" style="position: absolute; opacity: 0.8;" color="white" :size="60" indeterminate></v-progress-circular>
            </v-btn>
            <v-btn fab color="white" class="black--text" @click.stop="pause" v-else>
                <v-icon large>pause</v-icon>
            </v-btn>
            <v-btn fab text small @click.stop="playNext" :disabled="loading">
                <v-icon>skip_next</v-icon>
            </v-btn>
            <v-btn fab text small @click.stop="playNextPlaylist" :disabled="loading">
                <v-icon>fast_forward</v-icon>
            </v-btn>
        </div>
    </div>
</template>

<script>
import moment from 'moment';
import gradient from '../mixins/gradient.js';
import Network from '../helpers/Network.js';
import { getVideoFormat } from '../helpers/YoutubePlugin.js';
import AudioPluginWeb from '../helpers/AudioPlugin.js';

import { Plugins } from '@capacitor/core';
import { artist, thumbnailHD } from '../filters.js';
import TextScroller from './TextScroller.vue';

const { AudioPlugin: AudioPluginNative } = Plugins;

let AudioPlugin;

export default {
    name: 'MusicPlayer',
    components: { TextScroller },
    data() {
        return {
            loading: false,
            playing: false,
            song: null,

            playlists: [],
            currentPlaylist: null,
            songHistory: [],
            trackNumber: -1,

            seekTime: 0,
            seekBarIsMoving: false,
            apiUrl: null,
            time: 0,
            timeout: null,
            timer: null,
            duration: 0,

            keyword: '',
            keywordRules: [
                v => !!v || 'Keyword is required'
            ],

            thumbnailHD
        }
    },
    async created() {
        this.apiUrl = process.env.VUE_APP_API_URL;
        AudioPlugin = this.isDesktop ? AudioPluginWeb : AudioPluginNative;

        // Audio plugin listeners
        AudioPlugin.addListener('onLoad', () => this.loading = true);
        AudioPlugin.addListener('onReady', ({ duration }) => {
            this.loading = false;
            this.duration = duration;
        });
        AudioPlugin.addListener('onComplete', () => this.playNext());
        AudioPlugin.addListener('onPlay', () => this.resume());
        AudioPlugin.addListener('onPause', () => this.pause());

        if (!this.isDesktop) {
            AudioPlugin.addListener('onSkipNext', () => this.playNext());
            AudioPlugin.addListener('onSkipPrev', () => this.playPrevious());
        }

        setInterval(async () => {
            if (!this.seekBarIsMoving && this.playing) {
                this.time = (await AudioPlugin.getCurrentTime()).time;
                this.$forceUpdate();
            }
        }, 1000);

        if (this.isDesktop) {
            AudioPlugin.setVolume({
                value: 0.1
            });
        }

        await this.fetchRecommendationsAndPlay(false);
    },
    methods: {
        async fetchRecommendationsAndPlay(force = true) {
            this.loading = true;
            this.pause();
            this.trackNumber = -1;
            await this.getRecommendations();
            this.currentPlaylist = this.playlists.shift();
            await this.getCurrentPlaylist();
            await this.playNext(force);
            this.loading = false;
        },
        getRecommendations() {
            return Network.get(`/recommend/${this.keyword || 'study'}`)
                .then(res => this.playlists = res.data);
        },
        getCurrentPlaylist() {
            return Network.get(`/playlists/${this.currentPlaylist.id}`)
                .then(res => {
                    this.currentPlaylist = res.data;
                    this.currentPlaylist.songs.sort(() => (Math.random() > .5) ? 1 : -1);
                });
        },
        getCurrentSong() {
            return Network.get(`/songs/${this.song.id}`)
                .then(res => Object.assign(this.song, res.data));
        },
        async init() {
            if (!this.song)
                return;

            this.loading = true;
            this.playing = false;
            await this.pause();

            let url;

            if (this.isDesktop) {
                url = `${this.apiUrl}/songs/listen/${this.song.id}`;
            } else {
                const format = await getVideoFormat(this.song.id);
                url = format.url;
            }

            if (url) {
                await AudioPlugin.prepare({
                    uri: url,
                    title: this.song.name,
                    artist: artist(this.song),
                    image_url: thumbnailHD(this.song)
                });
                this.loading = false;
                this.time = 0;
                document.title = `${this.song.name} • ${artist(this.song)}`;
            }
        },
        async play(force = true) {
            await this.init();
            if (force) {
                await AudioPlugin.play();
                this.playing = true;
            }
        },
        resume() {
            AudioPlugin.play();
            this.playing = true;
        },
        pause() {
            AudioPlugin.pause();
            this.playing = false;
        },
        async playNext(force = true) {
            if (this.song)
                this.songHistory.unshift(this.song);
            if (!this.currentPlaylist) {
                this.currentPlaylist = this.playlists.shift();
            }
            if (!this.currentPlaylist.songs)
                await this.getCurrentPlaylist();
            if (this.trackNumber + 1 < this.currentPlaylist.songs.length) {
                this.trackNumber++;
            } else {
                this.playlists.push(this.currentPlaylist);
                this.currentPlaylist = this.playlists.shift();
                this.trackNumber = 0;
            }
            this.song = this.currentPlaylist.songs[this.trackNumber];
            this.getCurrentSong();
            await this.play(force);
        },
        playPrevious() {
            if (this.songHistory.length > 0) {
                this.song = this.songHistory.shift();
                this.play();
            }
        },
        playPreviousPlaylist() {
            this.loading = true;
            this.pause();
            if (this.currentPlaylist)
                this.playlists.unshift(this.currentPlaylist);
            this.currentPlaylist = this.playlists.pop();
            this.trackNumber = -1;
            this.playNext();
        },
        playNextPlaylist() {
            this.loading = true;
            this.pause();
            if (this.currentPlaylist)
                this.playlists.push(this.currentPlaylist);
            this.currentPlaylist = this.playlists.shift();
            this.trackNumber = -1;
            this.playNext();
        },
        seek(time) {
            this.time = time;
            AudioPlugin.seek({ to: time });
        },
        onSliderChange(time) {
            this.seekBarIsMoving = false;
            this.seek(time);
        },
        onTimeOut(newValue) {
            let momentObject = moment(newValue, "HH:mm");
            let diff = momentObject.diff(moment(), "milliseconds");
            if (diff < 0) {
                momentObject = momentObject.add(1, "days");
            }
            diff = momentObject.diff(moment(), "milliseconds");
            if (this.timeout) clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                this.pause();
                this.timer = null;
            }, diff);
        }
    },
    computed: {
        seekWidth() {
            return this.time * 100000 / this.duration;
        },
        songTime() {
            if (this.seekBarIsMoving) {
                let t = moment().startOf('day').seconds(this.seekTime * this.duration / 100000);
                if (t.hour() === 0)
                    return t.format('m:ss');
                else
                    return t.format('hh:mm:ss');
            }

            let t = moment().startOf('day').seconds(this.time);
            if (t.hour() === 0)
                return t.format('m:ss');
            else
                return t.format('hh:mm:ss');
        },
        songTotalTime() {
            const t = moment().startOf('day').seconds(this.duration / 1000 || 0);
            if (t.hour() === 0)
                return t.format('m:ss');
            else
                return t.format('hh:mm:ss');
        },
        volume: {
            get() {
                return AudioPlugin ? AudioPlugin.getVolume() : 0.1;
            },
            set(value) {
                if (AudioPlugin) {
                    AudioPlugin.setVolume({
                        value
                    });
                }
            }
        }
    },
    watch: {
        song(value) {
              if (value) {
                    this.$nextTick(() => {
                        if (this.$refs.textScroller)
                            this.$refs.textScroller.update();
                    });
                }
        }
    },
    mixins: [gradient]
}
</script>

<style lang="scss" scoped>
    .player-modal {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 100% !important;
        height: 100% !important;
        padding: 0 1.75em;
        background-color: #1e1e1e;

        .header {
            position: relative;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            margin: 0.5em -1em 0 -1em;
            padding: 0.8em 0 0.5em 0;

            .title {
                flex: 1;
                font-size: 9pt !important;
                line-height: 18px;
                text-align: center;

                .title-top {
                    font-weight: 100;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    opacity: 0.9;
                }

                .title-bottom {
                    font-weight: 500;
                    letter-spacing: 0.5px;
                }
            }
        }

        .song-container {
            flex: 5;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: stretch;

            .v-image {
                width: calc(100vw - 2 * 1.75em);
                max-height: calc(100vw - 2 * 1.75em);
            }

            .name-container {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: flex-start;

                .name {
                    flex: 1;
                    font-size: 11pt;
                    line-height: 24px;
                    padding: 1em 0.25em;
                    overflow-x: hidden;

                    .track-name {
                        font-size: 13pt;
                        letter-spacing: 1px;
                    }

                    .artist-name {
                        font-weight: 100;
                        letter-spacing: 0.5px;
                        opacity: 0.7;
                    }
                }

                .favorite {
                    font-size: 20pt;
                    color: rgba(255, 255, 255, 0.5);
                    padding-top: 0.7em;
                }
            }

        }

        .seek .slider-hints {
            font-size: 9pt;
            line-height: 10px;
            position: relative;
            top: -20px;
            display: flex;
            justify-content: space-between;
            opacity: 0.7;
        }

        .controls {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }

        .queue {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
        }

    }
</style>
