const { isLocal } = require('../../config/environment.js');

module.exports = async (err, req, res, next) => {
    let stack = Array.isArray(err.stack) ? err.stack.split('\n').map(line => line.trim()) : [];
    stack.shift();

    if (isLocal()) {
        res.status(HTTP_INTERNAL_SERVER_ERROR)
            .json({
                error: err.message,
                stack
            });
    } else {
        res.sendStatus(HTTP_INTERNAL_SERVER_ERROR);
    }

    next(err);
};
