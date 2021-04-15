<template>
    <v-container class="text-main">
        <v-card max-width="800" class="mx-auto d-flex flex-column">
            <v-card-title>In My Zone</v-card-title>
            <v-form
                ref="musicForm"
                v-model="valid"
                lazy-validation
            >
                <div class="mx-auto d-flex flex-row">
                    <v-row>
                        <v-col  cols="12">
                            <v-text-field
                                v-model="keyword"
                                :rules="keywordRules"
                                required
                                @change="validateKeyword"
                            ></v-text-field>
                        </v-col>
                    </v-row>
                    <v-btn
                        :disabled="!valid"
                        color="secondary"
                        @click="submit"
                    >
                        <v-icon>
                            mdi-magnify
                        </v-icon>
                    </v-btn>
                </div>

            </v-form>
            <v-card-text>Now playing: {{track}}</v-card-text>
            <div>
                <v-btn elevation="2"
                       color="success"
                       @click="onPreviousTrack">
                    <v-icon>
                        mdi-skip-previous
                    </v-icon>
                </v-btn>
                <v-btn elevation="2"
                       color="success"
                       @click="onTogglePlay">
                    <template v-if="playing">
                        <v-icon>mdi-pause</v-icon>
                    </template>
                    <template v-else>
                        <v-icon>mdi-play</v-icon>
                    </template>
                </v-btn>
                <v-btn elevation="2"
                       color="success"
                       @click="onNextTrack">
                    <v-icon>
                        mdi-skip-next
                    </v-icon>
                </v-btn>
            </div>
        </v-card>
    </v-container>
</template>

<script>
export default {
    name: 'MusicPlayer',
    data() {
        return {
            track: "",
            playing: false,
            valid: false,
            keyword: '',
            keywordRules: [
                v => !!v || 'Keyword is required',
                v => typeof v == "string" || 'Keyword should be string'
            ]
        }
    },
    methods: {
        onTogglePlay() {
            this.playing = !this.playing;
            //dispatch event?
        },
        onNextTrack() {
            //dispatch event?
        },
        onPreviousTrack() {
            //dispatch event?
        },
        validateKeyword() {
            this.$refs.musicForm.validate();
        },
        submit() {
            //dispatch event
        }
    }
}
</script>


<style lang="scss" scoped>
.text-main {
    color: rgb(var(--v-theme-secondary));
    font-weight: bold;
    text-align: center;
}
</style>
