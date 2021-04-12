<template>
    <v-container>
        <v-row>
            <v-col cols="12">
                <div class="text-main">
                    This is the music player component.
                </div>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    export default {
        name: 'MusicPlayer'
    }
</script>


<style lang="scss" scoped>
    .text-main {
        color: rgb(var(--v-theme-secondary));
        font-weight: bold;
        text-align: center;
    }
</style>
