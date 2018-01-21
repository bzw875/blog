const crypto  = require('crypto');
const Post    = require('../models/post.js');
const multer  = require('multer');
const setting = require('../settings.js');
const fs      = require('fs');
const os      = require('os');
const jwt = require('jwt-simple');

module.exports = function (app) {
    app.get('/home', (req, res) => {
        // 判断是否是第一页，并把请求的页数转换成 number 类型
        const page = parseInt(req.query.p, 10) || 1;
        // 查询并返回第 page 页的 10 篇文章
        Post.getTen(null, page, (err, posts, total) => {
            let list = posts;
            if (err) {
                list = [];
            }
            res.json({
                title: 'Blog',
                posts: list,
                page: page,
                isFirstPage: (page - 1) === 0,
                isLastPage: ((page - 1) * 10 + list.length) === total,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/login', checkNotLogin);
    app.get('/login', (req, res) => {
        res.json({
            title: '登录',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/login', checkNotLogin);
    app.post('/login', (req, res) => {
        const md5 = crypto.createHash('md5');
        const password = md5.update(req.body.password).digest('hex');

        if (req.body.name === setting.email && password === setting.password) {
            app.set('user', {
                name: setting.name,
                email: setting.email
            });
            let expires = new Date().getTime() + 30 * 24 * 60 * 60 * 1000;
            let token = jwt.encode({
                iss: setting.name,
                exp: expires
            }, app.get('jwtTokenSecret'));

            res.json({
                status: 'success',
                token: token,
                expires: expires,
                user: setting.name
            });
        } else {
            res.json({ status: 'error', message: '用户或密码错误!' });
        }
    });

    app.get('/post', checkLogin);
    app.get('/post', (req, res) => {
        res.json({
            title: '发表',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/post', checkLogin);
    app.post('/post', (req, res) => {
        const tags = [req.body.tag1, req.body.tag2, req.body.tag3];
        const post = new Post(
            setting.name,
            req.body.title,
            tags,
            req.body.post,
            req.body.contentType);

        post.save(err => {
            if (err) {
                res.json({
                    status: 'error',
                    message: err.message
                });
                return;
            }
            res.json({
                status: 'success',
                message: '发布成功！'
            });
        });
    });

    app.get('/logout', checkLogin);
    app.get('/logout', (req, res) => {
        req.session.user = null;
        req.flash('success', '登出成功!');
        res.redirect('/');
    });

    app.get('/upload', checkLogin);
    app.get('/upload', (req, res) => {
        res.json({
            title: '文件上传',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/upload', checkLogin);
    app.post('/upload', upload.array('field1', 5), (req, res) => {
        req.flash('success', '文件上传成功！');
        res.redirect('/upload');
    });

    app.post('/post/upload/:_id', checkLogin);
    app.post('/post/upload/:_id', postUpload.array('file', 5), (req, res) => {
        res.json({
            'status': '成功'
        });
    });

    app.get('/post/image/remove/:_id/:url', checkLogin);
    app.get('/post/image/remove/:_id/:url', (req, res) => {
        const dir = './public/images/upload/' + req.params._id + '/' + req.params.url;
        if (fs.existsSync(dir)) {
            fs.unlinkSync(dir);
            res.json({
                status: 'success',
                message: '删除成功'
            });
        } else {
            res.json({
                status: 'success',
                message: '文件找不到'
            });
        }
    });

    app.get('/archive', (req, res) => {
        Post.getArchive((err, posts) => {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.json({
                title: '存档',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/tags', (req, res) => {
        Post.getTags((err, posts) => {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.json({
                title: '标签',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/tags/:tag', (req, res) => {
        Post.getTag(req.params.tag, (err, posts) => {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.json({
                title: 'TAG:' + req.params.tag,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/about', (req, res) => {
        res.json({
            title: '关于我',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.get('/search', (req, res) => {
        Post.search(req.query.keyword, (err, posts) => {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.json({
                title: 'SEARCH:' + req.query.keyword,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/p/:_id', (req, res) => {
        Post.getOne(req.params._id, (err, post) => {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.json({
                title: post.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/edit/:_id', checkLogin);
    app.get('/edit/:_id', (req, res) => {
        Post.edit(req.params._id, (err, post) => {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }

            res.json({
                title: '编辑',
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/post/images/:_id', checkLogin);
    app.get('/post/images/:_id', (req, res) => {
        const images_url = [];
        const dir = './public/images/upload/' + req.params._id;
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            files.forEach(item => {
                const imgPath = dir + '/' + item;
                const stats = fs.statSync(imgPath);
                if (!stats.isDirectory()) {
                    images_url.push(imgPath.replace('./public', ''));
                }
            });
        }
        res.json({
            'images_url': images_url
        });
    });

    app.post('/edit/:_id', checkLogin);
    app.post('/edit/:_id', (req, res) => {
        Post.update(req.params._id, req.body.post, err => {
            if (err) {
                req.flash('error', err);
                res.json({
                    status: 'error',
                    message: err.message
                });
                return false;
            }
            req.flash('success', '修改成功!');
            res.json({
                status: 'success'
            });
        });
    });

    app.get('/remove/:_id', checkLogin);
    app.get('/remove/:_id', (req, res) => {
        const id = req.params._id;
        Post.remove(id, err => {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            deleteFolderRecursive('./public/images/upload/' + id);
            res.json({
                status: 'success',
                message: '删除成功'
            });
        });
    });

    app.get('/monitoring', checkLogin);
    app.get('/monitoring', (req, res) => {
        const cpus = os.cpus();
        const arch = os.arch();
        const loadavg = os.loadavg();
        const freemem = os.freemem();
        const totalmem = os.totalmem();
        const usage = totalmem - freemem;
        res.json({
            title: '系统监控',
            cpus: cpus,
            arch: arch,
            systemTime: new Date(),
            loadavg: loadavg,
            freemem: freemem,
            totalmem: totalmem,
            usage: usage,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    function checkLogin(req, res, next) {
        const token = (req.body && req.body.access_token) ||
            (req.query && req.query.access_token) ||
            req.headers['x-access-token'];
        if (token) {
            try {
                let decoded = jwt.decode(token, app.get('jwtTokenSecret'));
                if (decoded.exp <= Date.now()) {
                    res.json({
                        status: 'error',
                        message: '没有登录'
                    });
                } else {
                    req.user = decoded.iss;
                    next();
                }
            } catch (err) {
                res.json({
                    status: 'error',
                    message: '没有登录'
                });
            }
        } else {
            res.json({
                status: 'error',
                message: '没有登录'
            });
        }
    }

    function checkNotLogin(req, res, next) {
        const token = (req.body && req.body.access_token) ||
            (req.query && req.query.access_token) ||
            req.headers['x-access-token'];
        if (!token) {
            next();
        } else {
            try {
                let decoded = jwt.decode(token, app.get('jwtTokenSecret'));
                if (decoded.exp <= Date.now()) {
                    res.end('Access token has expired', 400);
                }
                res.json({
                    status: 'error',
                    message: '已经登录'
                });
            } catch (err) {
                return next();
            }
        }
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images/upload/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({
    storage: storage
});


const postStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './public/images/upload/' + req.params._id;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, 0o755);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        let ext = file.originalname.split(/\./g);
        ext = ext[ext.length - 1];
        cb(null, req.params._id + Date.now() + '.' + ext);
    }
});
const postUpload = multer({
    storage: postStorage
});

const deleteFolderRecursive = (path) => {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file, index) => {
            const curPath = path + '/' + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};