# blog
node.js编写的个人博客网站
需要安装node.js，mongodb

    module.exports = {
        cookieSecret: 'cookie密匙',
        db: 'mongodb数据库名',
        host: 'localhost',
        port: 27017,
        name: '发表博文的用户名',
        email: '登录用户名',
        password: '登陆密码'
    };
    
把以上文件添加到根目录命名为settings.js

    npm install
    npm start

确定启动了mongodb,打开[http://localhost:9000/](http://localhost:9000/)就可以访问了
