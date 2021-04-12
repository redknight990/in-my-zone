module.exports = {
    getRequestIP(req) {
        if (req.connection.remoteAddress)
            return req.connection.remoteAddress.replace('::ffff:', '').replace('::1', '127.0.0.1');
        return '';
    }
};
