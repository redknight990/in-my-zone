const express = require('express');
require('express-async-errors');

const cors = require('cors');

const logger = require('./helpers/logger.js');
const errorHandler = require('./helpers/error.js');

const indexRoutes = require('./routes/index.js');
const corsRoutes = require('./routes/cors.js');
const recommendRoutes = require('./routes/recommend.js');
const songsRoutes = require('./routes/songs.js');
const playlistsRoutes = require('./routes/playlists.js');

require('./helpers/constants.js');
const env = require('../config/environment.js');

// App and port
const app = express();
const port = process.env.PORT || 3001;

// CORS middleware
app.use(cors());

// Logger only in local environments
if (env.isLocal()) {
    app.use(logger);
}

// Use routes
app.use('/', indexRoutes);
app.use('/cors', corsRoutes);
app.use('/recommend', recommendRoutes);
app.use('/songs', songsRoutes);
app.use('/playlists', playlistsRoutes);
app.use(errorHandler);

// Start server
app.listen(port, _ => console.log(`Server started on port ${port}\n`));
