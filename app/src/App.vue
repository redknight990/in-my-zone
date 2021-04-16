<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
    >
    </v-app-bar>

    <v-main>
      <MusicPlayer/>
    </v-main>
  </v-app>
</template>

<script>
import MusicPlayer from './components/MusicPlayer';

export default {
  name: 'App',

  components: {
    MusicPlayer,
  },

  data: () => ({
    //
  }),
};
</script>
