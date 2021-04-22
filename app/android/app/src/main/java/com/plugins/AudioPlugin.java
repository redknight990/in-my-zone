package com.plugins;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.util.Log;
import android.util.Pair;

import com.audio.PlayerNotification;
import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.DefaultLoadControl;
import com.google.android.exoplayer2.MediaItem;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.SimpleExoPlayer;

import java.util.HashMap;
import java.util.Map;

@NativePlugin
@SuppressWarnings("unused")
public class AudioPlugin extends Plugin implements Player.EventListener {

    // Plugin events
    private static final String EVENT_COMPLETE = "onComplete";
    private static final String EVENT_LOAD = "onLoad";
    private static final String EVENT_READY = "onReady";
    private static final String EVENT_PLAY = "onPlay";
    private static final String EVENT_PAUSE = "onPause";

    // Plugin call keys
    private static final String KEY_PLAY_URI = "uri";
    private static final String KEY_PLAY_TITLE = "title";
    private static final String KEY_PLAY_ARTIST = "artist";
    private static final String KEY_PLAY_DURATION = "duration";
    private static final String KEY_SEEK_TO = "to";
    private static final String KEY_VOLUME_VALUE = "volume";

    // Media session tag
    private static final String MEDIA_SESSION_TAG = "zikmu";

    private static final int DEFAULT_BUFFER_MS = 60000; // <--- Increase for less rebuffering, but higher demand in terms of resources
    private static final int DEFAULT_BUFFER_PLAYBACK_MS = 1000; // <--- Lower values decrease the startup time but increase rebuffering
    private static final int DEFAULT_BUFFER_PLAYBACK_AFTER_REBUFFER_MS = 2000;

    // Log related variables
    private static final String AUDIO_PLUGIN_TAG = "Capacitor/AudioPlugin";
    private long mStartTime;

    // Song metadata
    private static final Map<String, Pair<String, Class<?>>> METADATA_KEYS = new HashMap<String, Pair<String, Class<?>>>() {{
        put(MediaMetadataCompat.METADATA_KEY_TITLE, new Pair<>(KEY_PLAY_TITLE, String.class));
        put(MediaMetadataCompat.METADATA_KEY_ARTIST, new Pair<>(KEY_PLAY_ARTIST, String.class));
        put(MediaMetadataCompat.METADATA_KEY_DURATION, new Pair<>(KEY_PLAY_DURATION, Long.class));
    }};

    private PlayerNotification notification;

    // Media player and session
    private SimpleExoPlayer player;
    private MediaSessionCompat session;
    private float volume = 1.0f;
    private boolean playing = false;
    private Handler mainThreadHandler;

    private static AudioPlugin plugin;

    @Override
    public void load() {
        plugin = this;

        notification = new PlayerNotification(getContext());
        notification.bindReceiver(PlayerNotificationReceiver.class);

        session = new MediaSessionCompat(getContext(), MEDIA_SESSION_TAG);
        session.setFlags(MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS | MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS);
        session.setActive(true);

        DefaultLoadControl.Builder loadControlBuilder = new DefaultLoadControl.Builder();

        /*
         * To increase startup, decrease the buffer playback value (increases rebuffering events)
         * To decrease rebuffering events, increase the max buffer value
         * To reduce rebuffering metrics make sure min and max buffer values are the same
         */
        loadControlBuilder.setBufferDurationsMs(
                DEFAULT_BUFFER_MS,
                DEFAULT_BUFFER_MS,
                DEFAULT_BUFFER_PLAYBACK_MS,
                DEFAULT_BUFFER_PLAYBACK_AFTER_REBUFFER_MS);

        player = new SimpleExoPlayer.Builder(getContext())
                                    .setLoadControl(loadControlBuilder.build())
                                    .build();

//        player.setSeekParameters(SeekParameters.CLOSEST_SYNC);

        player.setWakeMode(C.WAKE_MODE_NETWORK);

        mainThreadHandler = new Handler(getContext().getMainLooper());
        player.addListener(this);
    }

    @PluginMethod
    public void prepare(PluginCall call) {
        // Check URI in call
        if (!call.hasOption(KEY_PLAY_URI)) {
            call.reject("Audio source URI missing");
            return;
        }

        try {
            notification.updateNotification(call.getString("artist"), call.getString("title"), call.getString("image_url"), playing);
            notification.buildNotification();
        } catch(Exception e) {
            e.printStackTrace();
        }

        // Metadata builder
        MediaMetadataCompat.Builder metadataBuilder = new MediaMetadataCompat.Builder();

        // Add keys that are present in plugin call
        for (Map.Entry<String, Pair<String, Class<?>>> entry: METADATA_KEYS.entrySet()) {
            if (!call.hasOption(entry.getValue().first))
                continue;
            if (entry.getValue().second == String.class)
                metadataBuilder = metadataBuilder.putString(entry.getKey(), call.getString(entry.getValue().first, "Song Title"));
            else if (entry.getValue().second == Long.class)
                metadataBuilder = metadataBuilder.putLong(entry.getKey(), call.getInt(entry.getValue().first, 0));
        }

        // Build metadata
        session.setMetadata(metadataBuilder.build());

        try {

            // Get audio URI
            String uri = call.getString(KEY_PLAY_URI);

            mainThreadHandler.post(() -> {
                // Set player options
                player.setMediaItem(MediaItem.fromUri(uri));

                player.setVolume(volume);
                player.prepare();
                call.resolve();
            });

        } catch (Exception e) {
            e.printStackTrace();
            call.reject(e.getMessage());
        }
    }

    @PluginMethod
    public void pause(PluginCall call) {
        mainThreadHandler.post(() -> {
            player.pause();
            call.resolve();
        });
    }

    @PluginMethod
    public void play(PluginCall call) {
        mainThreadHandler.post(() -> {
            player.play();
            call.resolve();
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        mainThreadHandler.post(() -> {
            if (player.getPlaybackState() != Player.STATE_IDLE)
                player.stop();
            call.resolve();
        });
    }

    @PluginMethod
    public void seek(PluginCall call) {
        mainThreadHandler.post(() -> {
            player.seekTo((long) (call.getFloat(KEY_SEEK_TO, 0.0f) * 1000));
            call.resolve();
        });
    }

    @PluginMethod
    public void setVolume(PluginCall call) {
        mainThreadHandler.post(() -> {
            if (call.hasOption(KEY_VOLUME_VALUE))
                volume = call.getFloat(KEY_VOLUME_VALUE);
            player.setVolume(volume);
            call.resolve();
        });
    }

    @PluginMethod
    public void getCurrentTime(PluginCall call) {
        mainThreadHandler.post(() -> {
            long time = player.getCurrentPosition();
            JSObject data = new JSObject();
            data.put("time", time / 1000);
            call.resolve(data);
        });
    }

    @Override
    public void onIsPlayingChanged(boolean isPlaying) {
        playing = isPlaying;

        notification.setPlaying(isPlaying);
        try {
            notification.buildNotification();
        } catch(Exception e) {
            e.printStackTrace();
        }

        if (playing)
            notifyListeners(EVENT_PLAY, new JSObject());
    }

    @Override
    public void onIsLoadingChanged(boolean isLoading) {
        if (isLoading && !playing)
            notifyListeners(EVENT_LOAD, new JSObject());
        else if (!isLoading) {
            long duration = player.getDuration();
            JSObject data = new JSObject();
            data.put("duration", duration);
            notifyListeners(EVENT_READY, data);
        }
    }

    @Override
    public void onPlaybackStateChanged(int playbackState) {
        switch (playbackState) {
            case Player.STATE_IDLE:
                player.prepare();
                break;
            case Player.STATE_BUFFERING:
                Log.d(AUDIO_PLUGIN_TAG, "onPlayerStateChanged: BUFFERING");
                mStartTime = System.currentTimeMillis();
                notifyListeners(EVENT_LOAD, new JSObject());
                break;
            case Player.STATE_ENDED:
                notifyListeners(EVENT_COMPLETE, new JSObject());
                break;
            case Player.STATE_READY:
                mainThreadHandler.post(() -> {
                    long duration = player.getDuration();
                    JSObject data = new JSObject();
                    data.put("duration", duration);
                    notifyListeners(EVENT_READY, data);
                });

                Log.d(AUDIO_PLUGIN_TAG, "onPlayerStateChanged: READY");
                Log.d(AUDIO_PLUGIN_TAG, "onPlayerStateChanged: TIME ELAPSED: " + (System.currentTimeMillis() - mStartTime));
                break;
        }
    }

    /**
     * Personalized BroadcastReceiver that allows us to pass an event back to capacitor
     */
    public static class PlayerNotificationReceiver extends BroadcastReceiver {

        @Override
        public void onReceive(Context context, Intent intent) {
            switch(intent.getAction()) {
                case PlayerNotification.EVENT_PAUSE:
                    plugin.player.pause();
                    plugin.notifyListeners(EVENT_PAUSE, new JSObject());
                    break;
                case PlayerNotification.EVENT_PLAY:
                    plugin.player.play();
                    break;
                case PlayerNotification.EVENT_SKIP_NEXT:
                case PlayerNotification.EVENT_SKIP_PREV:
                    plugin.notifyListeners(intent.getAction(), new JSObject());
                    break;

            }
        }
    }

}
