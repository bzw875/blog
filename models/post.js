var mongodb = require('./db'),
    markdown = require('markdown').markdown,
    ObjectID = require('mongodb').ObjectID,
    async = require('async');

function Post(name, title, tags, post, contentType) {
    this.name = name;
    this.title = title;
    this.contentType = contentType;
    this.tags = tags;
    this.post = post;
}

module.exports = Post;

//存储一篇文章及其相关信息
Post.prototype.save = function(callback) {
    var date = new Date();
    //存储各种时间格式，方便以后扩展
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };
    //要存入数据库的文档
    var tags = this.tags;
    for (var i = 0; i < tags.length; i++) {
        if (tags[i] === '') {
            tags.splice(i, 1);
            i--;
        }
    }
    var post = {
        name: this.name,
        time: time,
        title: this.title,
        contentType: this.contentType,
        tags: tags,
        post: this.post,
        pv: 0
    };
    async.waterfall([
        function(cb) {
            mongodb.open(function(err, db) {
                cb(err, db);
            });
        },
        function(db, cb) {
            db.collection('posts', function(err, collection) {
                cb(err, collection);
            });
        },
        function(collection, cb) {
            collection.insert(post, {
                safe: true
            }, function(err) {
                cb(err);
            });
        }
    ], function(err) {
        mongodb.close();
        callback(err);
    });
};

//一次获取十篇文章
Post.getTen = function(name, page, callback) {
    async.waterfall([
        function(cb) {
            mongodb.open(function(err, db) {
                cb(err, db);
            });
        },
        function(db, cb) {
            db.collection('posts', function(err, collection) {
                cb(err, collection);
            });
        },
        function(collection, cb) {
            var query = {};
            if (name) {
                query.name = name;
            }
            collection.count(query, function(err, total) {
                cb(err, collection, query, total);
            });
        },
        function(collection, query, total, cb) {
            collection.find(query, {
                skip: (page - 1) * 10,
                limit: 10
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                docs.forEach(function(doc) {
                    var post = doc.post;
                    if (post.length > 200) {
                        post = post.slice(0, 400) + '......';
                    }
                    doc.post = markdown.toHTML(post);
                });
                cb(err, docs, total);
            });
        }
    ], function(err, docs, total) {
        mongodb.close();
        callback(err, docs, total);
    });
};

//获取一篇文章
Post.getOne = function(_id, callback) {
    //打开数据库
    async.waterfall([
        function(cb) {
            mongodb.open(function(err, db) {
                cb(err, db);
            });
        },
        function(db, cb) {
            db.collection('posts', function(err, collection) {
                cb(err, collection);
            });
        },
        function(collection, cb) {
            collection.findOne({
                "_id": new ObjectID(_id)
            }, function(err, doc) {
                cb(err, collection, doc);
            });
        },
        function(collection, doc, cb) {
            if (cb) {
                collection.update({
                    "_id": new ObjectID(_id)
                }, {
                    $inc: {
                        pv: 1
                    }
                }, function(err) {
                    if (err) {
                        cb(err);
                    } else {
                        cb(null, doc);
                    }
                });
            }
        }
    ], function(err, doc) {
        mongodb.close();
        var post = doc.post;

        if (doc.contentType !== 'HTML') {
            doc.post = markdown.toHTML(post);
        }
        callback(err, doc);
    });
};

//返回原始发表的内容（markdown 格式）
Post.edit = function(_id, callback) {
    //打开数据库
    async.waterfall([
        function(cb) {
            mongodb.open(function(err, db) {
                cb(err, db);
            });
        },
        function(db, cb) {
            db.collection('posts', function(err, collection) {
                cb(err, collection);
            });
        },
        function(collection, cb) {
            collection.findOne({
                "_id": new ObjectID(_id)
            }, function(err, doc) {
                cb(err, doc);
            });
        }
    ], function(err, doc) {
        mongodb.close();
        callback(err, doc);
    });
};

//更新一篇文章及其相关信息
Post.update = function(_id, post, callback) {
    async.waterfall([
        function(cb) {
            mongodb.open(function(err, db) {
                cb(err, db);
            });
        },
        function(db, cb) {
            db.collection('posts', function(err, collection) {
                cb(err, collection);
            });
        },
        function(collection, cb) {
            collection.update({
                "_id": new ObjectID(_id)
            }, {
                $set: {
                    post: post
                }
            }, function(err) {
                cb(err);
            });
        }
    ], function(err) {
        mongodb.close();
        callback(err);
    });
};

//删除一篇文章
Post.remove = function(_id, callback) {
    async.waterfall([
        function(cb) {
            mongodb.open(function(err, db) {
                cb(err, db);
            });
        },
        function(db, cb) {
            db.collection('posts', function(err, collection) {
                cb(err, collection);
            });
        },
        function(collection, cb) {
            collection.findOne({
                "_id": new ObjectID(_id)
            }, function(err, doc) {
                cb(err, collection, doc);
            });
        },
        function(collection, doc, cb) {
            collection.remove({
                "_id": new ObjectID(_id)
            }, {
                w: 1
            }, function(err) {
                cb(err);
            });
        }
    ], function(err) {
        mongodb.close();
        callback(err);
    });
};

//返回所有文章存档信息
Post.getArchive = function(callback) {
    async.waterfall([
        function(cb) {
            mongodb.open(function(err, db) {
                cb(err, db);
            });
        },
        function(db, cb) {
            db.collection('posts', function(err, collection) {
                cb(err, collection);
            });
        },
        function(collection, cb) {
            collection.find({}, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                cb(err, docs);
            });
        }
    ], function(err, docs) {
        mongodb.close();
        callback(err, docs);
    });
};

//返回所有标签
Post.getTags = function(callback) {
    async.waterfall([
        function(cb) {
            mongodb.open(function(err, db) {
                cb(err, db);
            });
        },
        function(db, cb) {
            db.collection('posts', function(err, collection) {
                cb(err, collection);
            });
        },
        function(collection, cb) {
            collection.distinct("tags", function(err, docs) {
                cb(err, docs);
            });
        }
    ], function(err, docs) {
        mongodb.close();
        callback(err, docs);
    });

};

//返回含有特定标签的所有文章
Post.getTag = function(tag, callback) {
    async.waterfall([
        function(cb) {
            mongodb.open(function(err, db) {
                cb(err, db);
            });
        },
        function(db, cb) {
            db.collection('posts', function(err, collection) {
                cb(err, collection);
            });
        },
        function(collection, cb) {
            collection.find({
                "tags": tag
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                cb(err, docs);
            });
        }
    ], function(err, docs) {
        mongodb.close();
        callback(err, docs);
    });
};

//返回通过标题关键字查询的所有文章信息
Post.search = function(keyword, callback) {
    async.waterfall([
        function(cb) {
            mongodb.open(function(err, db) {
                cb(err, db);
            });
        },
        function(db, cb) {
            db.collection('posts', function(err, collection) {
                cb(err, collection);
            });
        },
        function(collection, cb) {
            var pattern = new RegExp(keyword, "i");
            collection.find({
                "title": pattern
            }, {
                "name": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function(err, docs) {
                cb(err, docs);
            });
        }
    ], function(err, docs) {
        mongodb.close();
        callback(err, docs);
    });
};