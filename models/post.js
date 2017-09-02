const mongodb  = require('./db');
const markdown = require('markdown').markdown;
const ObjectID = require('mongodb').ObjectID;
const async    = require('async');

class Post {

    constructor(name, title, tags, post, contentType) {
        this.name = name;
        this.title = title;
        this.contentType = contentType;
        this.tags = tags;
        this.post = post;
    }

    // 存储一篇文章及其相关信息
    save(callback) {
        const date = new Date();
        // 存储各种时间格式，方便以后扩展
        const time = {
            date: date,
            year: date.getFullYear(),
            month: date.getFullYear() + '-' + (date.getMonth() + 1),
            day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(),
            minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' +
                date.getHours() + ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
        };
        // 要存入数据库的文档
        const post = {
            name: this.name,
            time: time,
            title: this.title,
            contentType: this.contentType,
            tags: this.tags.filter(tag => tag !== ''),
            post: this.post,
            pv: 0
        };
        async.waterfall([
            cb => {
                mongodb.open((err, db) => cb(err, db));
            },
            (db, cb) => {
                db.collection('posts', (err, collection) => cb(err, collection));
            },
            (collection, cb) => {
                collection.insert(post, {
                    safe: true
                }, err => cb(err));
            }
        ], (err) => {
            mongodb.close();
            callback(err);
        });
    }

    // 一次获取十篇文章
    static getTen(name, page, callback) {
        async.waterfall([
            cb => {
                mongodb.open((err, db) => cb(err, db));
            },
            (db, cb) => {
                db.collection('posts', (err, collection) => cb(err, collection));
            },
            (collection, cb) => {
                const query = {};
                if (name) {
                    query.name = name;
                }
                collection.count(query, (err, total) => cb(err, collection, query, total));
            },
            (collection, query, total, cb) => {
                collection.find(query, {
                    skip: (page - 1) * 10,
                    limit: 10
                }).sort({
                    time: -1
                }).toArray((err, docs) => {
                    docs.forEach(doc => {
                        let post = doc.post;
                        if (post.length > 200) {
                            post = post.slice(0, 400) + '......';
                        }
                        doc.post = markdown.toHTML(post);
                    });
                    cb(err, docs, total);
                });
            }
        ], (err, docs, total) => {
            mongodb.close();
            callback(err, docs, total);
        });
    }

    // 获取一篇文章
    static getOne(_id, callback) {
        // 打开数据库
        async.waterfall([
            cb => {
                mongodb.open((err, db) => cb(err, db));
            },
            (db, cb) => {
                db.collection('posts', (err, collection) => cb(err, collection));
            },
            (collection, cb) => {
                collection.findOne({
                    '_id': new ObjectID(_id)
                }, (err, doc) => cb(err, collection, doc));
            },
            (collection, doc, cb) => {
                if (cb) {
                    collection.update({
                        '_id': new ObjectID(_id)
                    }, {
                        $inc: {
                            pv: 1
                        }
                    }, err => {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null, doc);
                        }
                    });
                }
            }
        ], (err, doc) => {
            mongodb.close();
            const post = doc.post;

            if (doc.contentType !== 'HTML') {
                doc.post = markdown.toHTML(post);
            }
            callback(err, doc);
        });
    }

    // 返回原始发表的内容（markdown 格式）
    static edit(_id, callback) {
        // 打开数据库
        async.waterfall([
            cb => {
                mongodb.open((err, db) => cb(err, db));
            },
            (db, cb) => {
                db.collection('posts', (err, collection) => cb(err, collection));
            },
            (collection, cb) => {
                collection.findOne({
                    '_id': new ObjectID(_id)
                }, (err, doc) => cb(err, doc));
            }
        ], (err, doc) => {
            mongodb.close();
            callback(err, doc);
        });
    }

    // 更新一篇文章及其相关信息
    static update(_id, post, callback) {
        async.waterfall([
            cb => {
                mongodb.open((err, db) => cb(err, db));
            },
            (db, cb) => {
                db.collection('posts', (err, collection) => cb(err, collection));
            },
            (collection, cb) => {
                collection.update({
                    '_id': new ObjectID(_id)
                }, {
                    $set: {
                        post: post
                    }
                }, (err) => cb(err));
            }
        ], (err) => {
            mongodb.close();
            callback(err);
        });
    }

    // 删除一篇文章
    static remove(_id, callback) {
        async.waterfall([
            cb => {
                mongodb.open((err, db) => cb(err, db));
            },
            (db, cb) => {
                db.collection('posts', (err, collection) => cb(err, collection));
            },
            (collection, cb) => {
                collection.findOne({
                    '_id': new ObjectID(_id)
                }, (err, doc) => cb(err, collection, doc));
            },
            (collection, doc, cb) => {
                collection.remove({
                    '_id': new ObjectID(_id)
                }, {
                    w: 1
                }, err => cb(err));
            }
        ], (err) => {
            mongodb.close();
            callback(err);
        });
    }

    // 返回所有文章存档信息
    static getArchive(callback) {
        async.waterfall([
            cb => {
                mongodb.open((err, db) => cb(err, db));
            },
            (db, cb) => {
                db.collection('posts', (err, collection) => cb(err, collection));
            },
            (collection, cb) => {
                collection.find({}, {
                    'name': 1,
                    'time': 1,
                    'title': 1
                }).sort({
                    time: -1
                }).toArray((err, docs) => cb(err, docs));
            }
        ], (err, docs) => {
            mongodb.close();
            callback(err, docs);
        });
    }

    // 返回所有标签
    static getTags(callback) {
        async.waterfall([
            cb => {
                mongodb.open((err, db) => cb(err, db));
            },
            (db, cb) => {
                db.collection('posts', (err, collection) => cb(err, collection));
            },
            (collection, cb) => {
                collection.distinct('tags', (err, docs) => cb(err, docs));
            }
        ], (err, docs) => {
            mongodb.close();
            callback(err, docs);
        });

    }

    // 返回含有特定标签的所有文章
    static getTag(tag, callback) {
        async.waterfall([
            cb => {
                mongodb.open((err, db) => cb(err, db));
            },
            (db, cb) => {
                db.collection('posts', (err, collection) => cb(err, collection));
            },
            (collection, cb) => {
                collection.find({
                    'tags': tag
                }, {
                    'name': 1,
                    'time': 1,
                    'title': 1
                }).sort({
                    time: -1
                }).toArray((err, docs) => cb(err, docs));
            }
        ], (err, docs) => {
            mongodb.close();
            callback(err, docs);
        });
    }

    //  返回通过标题关键字查询的所有文章信息
    static search(keyword, callback) {
        async.waterfall([
            cb => {
                mongodb.open((err, db) => cb(err, db));
            },
            (db, cb) => {
                db.collection('posts', (err, collection) => cb(err, collection));
            },
            (collection, cb) => {
                const pattern = new RegExp(keyword, 'i');
                collection.find({
                    'title': pattern
                }, {
                    'name': 1,
                    'time': 1,
                    'title': 1
                }).sort({
                    time: -1
                }).toArray((err, docs) => cb(err, docs));
            }
        ], (err, docs) => {
            mongodb.close();
            callback(err, docs);
        });
    }
}

module.exports = Post;