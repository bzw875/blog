var mongodb = require('./db');
var crypto = require('crypto');
var async = require('async');

function User(user) {
    this.name = user.name;
    this.password = user.password;
    this.email = user.email;
};

module.exports = User;

User.prototype.save = function(callback) {
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(this.email.toLowerCase()).digest('hex');
        
    var user = {
        name: this.name,
        password: this.password,
        email: this.email
    };
    async.waterfall([
        function(cb) {
            mongodb.open(function(err, db) {
                cb(err, db);
            });
        },
        function(db, cb) {
            db.collection('users', function(err, collection) {
                cb(err, collection);
            });
        },
        function(collection, cb) {
            collection.insert(user, {
                safe: true
            }, function(err, user) {
                cb(err, user);
            });
        }
    ], function(err, user) {
        mongodb.close();
        callback(err, user[0]);
    });
};

User.get = function(name, callback) {
    async.waterfall([
        function(cb) {
            mongodb.open(function(err, db) {
                cb(err, db);
            });
        },
        function(db, cb) {
            db.collection('users', function(err, collection) {
                cb(err, collection);
            });
        },
        function(collection, cb) {
            collection.findOne({
                name: name
            }, function(err, user) {
                cb(err, user);
            });
        }
    ], function(err, user) {
        mongodb.close();
        callback(err, user);
    });
};