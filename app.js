var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();


// DB 설정
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;

// 세션 설정
var session = require('express-session');
var fileStore = require('session-file-store')(session);

// DB 연결
async function connectDB() {
  var databaseURL = process.env.MONGODB_URI;

  try {
    const database = await MongoClient.connect(databaseURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("DB 연결 완료: " + databaseURL);
    app.set('database', database.db('GomokuProject'));

   // 연결 종료 처리
    process.on("SIGINT", async () => {
      await database.close();
      console.log("DB 연결 종료");
      process.exit(0);
    });
  } catch (err) {
  console.error("DB 연결 실패: " + err);
  process.exit(1);
  }
}

connectDB().catch(err => {
  console.error("초기 DB 연결 실패: " + err);
  process.exit(1);
});



app.get("/ping", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});


//로그인 API
app.use(session({
  secret: process.env.SESSION_SECRET || 'session-login', // 보안을 위해 환경변수 사용 권장
  resave: false,
  saveUninitialized: false, // 세션이 필요할 때만 저장하도록 false로 설정
  store: new fileStore({
  path: './sessions', // 세션 파일 저장 경로 지정
  ttl: 24 * 60 * 60, // 세션 유효기간 설정 (1일)
  reapInterval: 60 * 60 // 만료된 세션 정리 간격 (1시간)
}),
cookie: {
  httpOnly: true, // XSS 공격 방지
  secure: process.env.NODE_ENV === 'production', // HTTPS 환경에서만 쿠키 전송
  maxAge: 24 * 60 * 60 * 1000 // 쿠키 유효기간 1일
  }
}));



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

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
