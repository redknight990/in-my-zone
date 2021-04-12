const express = require('express');
require('express-async-errors');

const logger = require('./helpers/logger.js');
const errorHandler = require('./helpers/error.js');

const index = require('./routes/index.js');
const recommend = require('./routes/recommend.js');
const songs = require('./routes/songs.js');

require('./helpers/constants.js');
const env = require('../config/environment.js');

// App and port
const app = express();
const port = process.env.PORT || 3001;

// Logger only in local environments
if (env.isLocal()) {
    app.use(logger);
}

// Use routes
app.use('/', index);
app.use('/recommend', recommend);
app.use('/songs', songs);
app.use(errorHandler);

// Start server
app.listen(port, _ => console.log(`Server started on port ${port}\n`));
