const express = require('express');
const YoutubeMusicAPI = require('../../yt-music/YoutubeMusicAPI.js');

const router = express();

router.get('/:query', async (req, res) => {
    const data = await YoutubeMusicAPI.search(req.params.query, 'playlist');
    res.json(data);
});

module.exports = router;
