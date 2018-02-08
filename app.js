const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const fs = require('fs');

const assessLog = fs.createWriteStream('access.log', {
    flags: 'a',
});
const errorLog = fs.createWriteStream('error.log', {
    flags: 'a',
});

const routes = require('./routes/index');

const settings = require('./settings');
const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const app = express();

app.set('jwtTokenSecret', 'shenJieLower');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(flash());

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(logger({
    stream: assessLog,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false,
}));
app.use(cookieParser());

app.all('*', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length, Authorization, Accept,X-Requested-With,x-access-token');
    res.header('Access-Control-Allow-Methods', 'PUT,POST,GET,DELETE,OPTIONS,HEAD,CONNECT,TRACE,PATCH');
    next();
});

app.use(express.static(path.join(__dirname, 'public'), {
    maxage: 86400 * 365,
}));
app.use((err, req, res, next) => {
    errorLog.write(`[${new Date()}]${req.url}\n${err.stack}\n`);
    next();
});


app.use(session({
    secret: settings.cookieSecret,
    key: settings.db,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30,
    },
    store: new MongoStore({
        url: `mongodb://${settings.host}:${settings.port}/${settings.db}`,
    }),
}));


routes(app);

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use((err, req, res, next) => {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {},
    });
});


module.exports = app;