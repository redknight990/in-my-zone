package com.audio;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Binder;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.imz.app.MainActivity;
import com.imz.app.R;

import java.io.IOException;
import java.net.URL;

public class PlayerNotification {

    // Unique IDs for the notification player
    public static final int PLAYER_NOTIFICATION_ID = 1;
    private static String PLAYER_CHANNEL_ID = "player_notification_channel";

    private NotificationManagerCompat notificationManager;

    // Events for the notification player
    public static final String EVENT_PLAY = "play";
    public static final String EVENT_PAUSE = "pause";
    public static final String EVENT_SKIP_PREV = "onSkipPrev";
    public static final String EVENT_SKIP_NEXT = "onSkipNext";

    // Notification info
    private String artist;
    private String name;
    private Bitmap image;
    private Boolean isPlaying;

    public Context context;

    private Class NotificationReceiver;

    public PlayerNotification(Context context) {
        this.context = context;

        notificationManager = NotificationManagerCompat.from(context);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            NotificationChannel notificationChannel = new NotificationChannel(PLAYER_CHANNEL_ID, "IMZ", NotificationManager.IMPORTANCE_LOW);
            notificationManager.createNotificationChannel(notificationChannel);
        }
    }

    public void buildNotification() throws Exception{
        if(artist == null || name == null || image == null || isPlaying == null || NotificationReceiver == null) {
            throw new Exception("One of the Notification parameters (artist, name, image, isPlaying, NotificationReceiver) is not set.");
        }

        int playIcon = isPlaying ? R.drawable.ic_pause : R.drawable.ic_play_arrow;

        Intent activityIntent = new Intent(context, MainActivity.class);
        PendingIntent contentIntent = PendingIntent.getActivity(context, 100, activityIntent, 0);

        Intent intentPrevious = new Intent(context, NotificationReceiver).setAction(EVENT_SKIP_PREV);
        PendingIntent pendingIntentPrevious = PendingIntent.getBroadcast(context, 101, intentPrevious, PendingIntent.FLAG_UPDATE_CURRENT);

        Intent intentNext = new Intent(context, NotificationReceiver).setAction(EVENT_SKIP_NEXT);
        PendingIntent pendingIntentNext = PendingIntent.getBroadcast(context, 102, intentNext, PendingIntent.FLAG_UPDATE_CURRENT);

        Intent intentPlay = new Intent(context, NotificationReceiver).setAction(isPlaying ? EVENT_PAUSE : EVENT_PLAY);
        PendingIntent pendingIntentPlay = PendingIntent.getBroadcast(context, 103, intentPlay, PendingIntent.FLAG_UPDATE_CURRENT);

        NotificationCompat.Builder builder =  new NotificationCompat.Builder(context, PLAYER_CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_music_note)
                .setContentTitle(name)
                .setContentText(artist)
                .setContentIntent(contentIntent)
                .setAutoCancel(true)
                .setOnlyAlertOnce(true)
                .setShowWhen(false)
                .setOngoing(true)
                .addAction(R.drawable.ic_skip_previous, "Previous", pendingIntentPrevious)
                .addAction(playIcon, "Play", pendingIntentPlay)
                .addAction(R.drawable.ic_skip_next, "Next", pendingIntentNext)
                .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                        .setShowActionsInCompactView(0, 1, 2))
                .setPriority(NotificationCompat.PRIORITY_LOW);

        if(image != null)
            builder.setLargeIcon(image);



        ServiceConnection mConnection = new ServiceConnection() {
            public void onServiceConnected(ComponentName className, IBinder binder) {
                ((KillNotificationsService.KillBinder) binder).service.startService(new Intent(context, KillNotificationsService.class));

                Notification notification = builder.build();
                notification.flags = Notification.FLAG_ONGOING_EVENT | Notification.FLAG_NO_CLEAR;
                notificationManager.notify(PLAYER_NOTIFICATION_ID, notification);
            }

            public void onServiceDisconnected(ComponentName className) { }
        };

        context.bindService(new Intent(context, KillNotificationsService.class), mConnection, Context.BIND_AUTO_CREATE);
    }

    public void bindReceiver(Class NotificationReceiver) {
        this.NotificationReceiver = NotificationReceiver;
    }

    public void setArtist(String artist) {
        this.artist = artist;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setImage(String imageUrl) throws IOException{
        this.image = getBitmap(imageUrl);
    }

    public void setPlaying(Boolean playing) {
        isPlaying = playing;
    }

    public void updateNotification(String artist, String name, String imageUrl, Boolean isPlaying) throws IOException{
        setArtist(artist);
        setName(name);
        setImage(imageUrl);
        setPlaying(isPlaying);
    }

    private Bitmap getBitmap(String imageUrl) throws IOException{
        return BitmapFactory.decodeStream(new URL(imageUrl).openConnection().getInputStream());
    }

    public static class KillNotificationsService extends Service {
        public class KillBinder extends Binder {
            public final Service service;

            public KillBinder(Service service) {
                this.service = service;
            }

        }

        private NotificationManager mNM;
        private final IBinder mBinder = new KillBinder(this);

        @Override
        public IBinder onBind(Intent intent) {
            return mBinder;
        }
        @Override
        public int onStartCommand(Intent intent, int flags, int startId) {
            return Service.START_STICKY;
        }
        @Override
        public void onCreate() {
            mNM = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            mNM.cancel(PLAYER_NOTIFICATION_ID);
        }
    }
}
