require("dotenv").config(); // load env before other imports that use it
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require("cors");
const helmet = require('helmet');
const { validateEnv } = require('./config/env');

validateEnv();

const db = require('./database/db')

var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
var usersRouter = require('./routes/users');

const expressLayouts = require('express-ejs-layouts');

var app = express();

app.set('trust proxy', 1);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main-layout');

//layout setup
app.use(expressLayouts);

// basic security headers; keep CSP off until page assets are audited
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

//cors
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true
  })
);


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, filePath) => {
      if (path.extname(filePath).toLowerCase() === '.avif') {
        res.type('image/avif');
      }
    }
  })
);





app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/users', usersRouter);

app.use(function(err, req, res, next) {
  if (err.code !== 'EBADCSRFTOKEN') {
    return next(err);
  }

  res.status(403);
  return res.render('error', {
    message: 'Invalid or expired form token. Please refresh the page and try again.',
    error: { status: 403 }
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
