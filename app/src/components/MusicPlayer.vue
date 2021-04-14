<template>
    <v-container class="text-main">
        <v-card max-width="800" class="mx-auto d-flex flex-column">
            <v-card-title>In My Zone</v-card-title>
            <v-form
                ref="musicForm"
                v-model="valid"
                lazy-validation
            >
                <v-row>
                    <v-col>
                        <v-input
                            v-model="keyword"
                            :rules="keywordRules"
                            label="Keyword"
                            required
                            @change="validateKeyword"
                        ></v-input>
                    </v-col>
                </v-row>
                        <v-btn
                            :disabled="!valid"
                            color="success"
                            @click="submit"
                        >
                            <v-icon>
                                mdi-magnify
                            </v-icon>
                        </v-btn>
            </v-form>
            <v-card-text>Now playing:</v-card-text>
            <div>
                <v-btn elevation="2"
                       color="secondary"
                       @click="onTogglePlay">
                    <template v-if="playing">
                        <v-icon>mdi-pause</v-icon>
                    </template>
                    <template v-else>
                        <v-icon>mdi-play</v-icon>
                    </template>
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
