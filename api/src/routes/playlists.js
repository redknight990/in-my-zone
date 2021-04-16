const express = require('express');
const YoutubeMusicAPI = require('../../yt-music/YoutubeMusicAPI.js');

const router = express();

router.get('/:playlist_id', async (req, res) => {
    const data = await YoutubeMusicAPI.getPlaylist(req.params.playlist_id);
    res.json(data);
});

module.exports = router;
