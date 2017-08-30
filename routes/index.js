const crypto = require('crypto');
const Post = require('../models/post.js');
const multer = require('multer');
const setting = require('../settings.js');
const fs = require('fs');

module.exports = function (app) {
    app.get('/', function (req, res) {
        // 判断是否是第一页，并把请求的页数转换成 number 类型
        const page = parseInt(req.query.p, 10) || 1;
        // 查询并返回第 page 页的 10 篇文章
        Post.getTen(null, page, function (err, posts, total) {
            let list = posts;
            if (err) {
                list = [];
            }
            res.render('index', {
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
    app.get('/login', function (req, res) {
        res.render('login', {
            title: '登录',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/login', checkNotLogin);
    app.post('/login', function (req, res) {
        const md5 = crypto.createHash('md5');
        const password = md5.update(req.body.password).digest('hex');

        if (req.body.name === setting.email && password === setting.password) {
            req.session.user = {
                name: setting.name,
                email: setting.email
            };
            req.flash('success', '登陆成功!');
            res.redirect('/');
        } else {
            req.flash('error', '用户或密码错误!');
            return res.redirect('/login');
        }
    });

    app.get('/post', checkLogin);
    app.get('/post', function (req, res) {
        res.render('post', {
            title: '发表',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        const currentUser = req.session.user;
        const tags = [req.body.tag1, req.body.tag2, req.body.tag3];
        const post = new Post(currentUser.name, req.body.title, tags, req.body.post, req.body.contentType);

        post.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发布成功！');
            res.redirect('/');
        });
    });

    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功!');
        res.redirect('/');
    });

    app.get('/upload', checkLogin);
    app.get('/upload', function (req, res) {
        res.render('upload', {
            title: '文件上传',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/upload', checkLogin);
    app.post('/upload', upload.array('field1', 5), function (req, res) {
        req.flash('success', '文件上传成功！');
        res.redirect('/upload');
    });

    app.post('/post/upload/:_id', checkLogin);
    app.post('/post/upload/:_id', postUpload.array('file', 5), function (req, res) {
        res.json({
            'status': '成功'
        });
    });

    app.get('/post/image/remove/:_id/:url', checkLogin);
    app.get('/post/image/remove/:_id/:url', function (req, res) {
        const dir = './public/images/upload/' + req.params._id + '/' + req.params.url;
        if (fs.existsSync(dir)) {
            fs.unlinkSync(dir);
            res.send('删除成功');
        } else {
            res.send('文件找不到');
        }
    });

    app.get('/archive', function (req, res) {
        Post.getArchive(function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('archive', {
                title: '存档',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/tags', function (req, res) {
        Post.getTags(function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tags', {
                title: '标签',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/tags/:tag', function (req, res) {
        Post.getTag(req.params.tag, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tag', {
                title: 'TAG:' + req.params.tag,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/about', function (req, res) {
        res.render('about', {
            title: '关于我',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.get('/search', function (req, res) {
        Post.search(req.query.keyword, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('search', {
                title: 'SEARCH:' + req.query.keyword,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/p/:_id', function (req, res) {
        Post.getOne(req.params._id, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('article', {
                title: post.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/edit/:_id', checkLogin);
    app.get('/edit/:_id', function (req, res) {
        Post.edit(req.params._id, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }

            res.render('edit', {
                title: '编辑',
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/post/images/:_id', checkLogin);
    app.get('/post/images/:_id', function (req, res) {
        const images_url = [];
        const dir = './public/images/upload/' + req.params._id;
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            files.forEach(function (item) {
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
    app.post('/edit/:_id', function (req, res) {
        Post.update(req.params._id, req.body.post, function (err) {
            const url = encodeURI('/p/' + req.params._id);
            if (err) {
                req.flash('error', err);
                return res.redirect(url); // 出错！返回文章页
            }
            req.flash('success', '修改成功!');
            res.redirect(url); // 成功！返回文章页
        });
    });

    app.get('/remove/:_id', checkLogin);
    app.get('/remove/:_id', function (req, res) {
        const id = req.params._id;
        Post.remove(id, function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            deleteFolderRecursive('./public/images/upload/' + id);
            req.flash('succss', '删除成功！');
            res.redirect('/');
        });
    });

    app.use(function (req, res) {
        res.render('404');
    });

    function checkLogin(req, res, next) {
        if (!req.session.user) {
            req.flash('error', '未登录!');
            res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req, res, next) {
        if (req.session.user) {
            req.flash('error', '已登录!');
            res.redirect('back');
        }
        next();
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/upload/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({
    storage: storage
});


const postStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './public/images/upload/' + req.params._id;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, 0755);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        let ext = file.originalname.split(/\./g);
        ext = ext[ext.length - 1];
        cb(null, req.params._id + Date.now() + '.' + ext);
    }
});
const postUpload = multer({
    storage: postStorage
});

const deleteFolderRecursive = function (path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(function (file, index) {
            const curPath = path + '/' + file;
            if (fs.lstatSync(curPath).isDirectory()) {
                console.log('folder: ' + curPath);
                deleteFolderRecursive(curPath);
            } else {
                console.log('file: ' + curPath);
                fs.unlinkSync(curPath);
            }
        });
        console.log(path);
        fs.rmdirSync(path);
    }
};