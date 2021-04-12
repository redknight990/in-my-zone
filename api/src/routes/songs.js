const express = require('express');
const ytdl = require('ytdl-core');

const router = express();

router.get('/listen/:id', async (req, res) => {
    const url = 'http://youtube.com/watch?v=' + req.params.id;

    res.type('media');

    const info = await ytdl.getInfo(url);
    const format = info.formats.filter(f => f.mimeType.includes('audio'))
        .sort((a, b) => b.audioBitrate - a.audioBitrate)
        .shift();

    const contentLength = parseInt(format.contentLength);
    const opts = { format };

    // Content range specified, retrieve only the partial stream with code 206
    if (req.headers.range) {

        const regex = /^bytes=(.*)$/;
        const range = req.headers.range.match(regex)[1].split('-');
        const start = range[0] ? parseInt(range[0]) : 0;
        const end = range[1] ? parseInt(range[1]) : contentLength - 1;
        opts.range = { start, end };

        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader(`Content-Range`, `bytes ${opts.range.start}-${opts.range.end}/${contentLength}`);// start-end/length
        res.setHeader(`Content-Length`, opts.range.end - opts.range.start + 1);
        res.status(206);

    // No content range specified, simply return the full stream with code 200
    } else {

        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader(`Content-Length`, contentLength);
        res.status(200);

    }

    res.setHeader('Content-Type', 'audio/webm');

    const stream = ytdl(url, opts);

    stream.pipe(res);
});

module.exports = router;
