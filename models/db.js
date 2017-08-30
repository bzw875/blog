const settings = require('../settings');
const Db = require('mongodb').Db;
const Server = require('mongodb').Server;

module.exports = new Db(
    settings.db,
    new Server(settings.host, settings.port),
    { safa: true }
);