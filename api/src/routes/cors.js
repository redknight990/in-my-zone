const express = require('express');
const https = require('https');
const http = require('http');
const env = require('../../config/environment.js');

const router = express.Router();

router.get('/:url(*)', async (req, res) => {
    req.params.url = req.params.url.replace(`${env.config.api.url}/api/cors/`, '');
    const client = req.params.url.includes('https') ? https : http;

    res.set('Cache-control', `public, max-age=${60 * 60 * 24 * 7}`); // 1 week cache duration

    const connector = client.request(req.params.url, {}, response => response.pipe(res));
    req.pipe(connector);
});

module.exports = router;
