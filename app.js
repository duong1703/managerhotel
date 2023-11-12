var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mysql = require('mysql2');
const bodyParser = require('body-parser');



var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// --------------------------------------

// Tạo kết nối cơ sở dữ liệu
const db = mysql.createConnection({
  host: 'localhost',
  user: 'hotelmanage',
  password: 'Duonghk123@', // Thay 'your-password' bằng mật khẩu MySQL của bạn
  database: 'hotelmanage'
});

db.connect((connectError) => {
  if (connectError) {
    console.error('Error connecting to database:', connectError);
  } else {
    console.log('Connected to database');
  }
});

db.connect();


// Tuyến đường cho trang đăng ký
app.get('/register', (req, res) => {
    res.render('register');
});

// Tuyến đường xử lý đăng ký
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  // Thực hiện câu lệnh SQL để thêm người dùng mới vào cơ sở dữ liệu
  const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error('Lỗi khi đăng ký:', err);
      res.redirect('/register'); // Chuyển hướng trở lại trang đăng ký nếu có lỗi
    } else {
      console.log('Đăng ký thành công.');
      res.redirect('/login'); // Chuyển hướng về trang đăng nhập sau khi đăng ký
    }
  });
});

// Tuyến đường cho trang đăng nhập
app.get('/login', (req, res) => {
    res.render('login');
});

// Tuyến đường xử lý đăng nhập
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Thực hiện câu lệnh SQL để kiểm tra thông tin đăng nhập
  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(sql, [username, password], (err, results) => {
    if (err) {
      console.error('Lỗi khi đăng nhập:', err);
      res.redirect('/login'); // Chuyển hướng trở lại trang đăng nhập nếu có lỗi
    } else if (results.length > 0) {
      console.log('Đăng nhập thành công.');
      res.redirect('/home'); // Chuyển hướng đến trang chủ sau khi đăng nhập thành công
    } else {
      console.log('Đăng nhập không thành công.');
      res.redirect('/login'); // Chuyển hướng trở lại trang đăng nhập nếu đăng nhập không thành công
    }
  });
});

app.get('/logout', (req, res) => {
  //req.logout();
  res.redirect('/login');
});

// Tuyến đường cho trang chủ
app.get('/home', (req, res) => {
  // Thực hiện các tác vụ trang chủ ở đây
  res.render('home', { availableRoomsCount: res.locals.availableRoomsCount, unavailableRoomsCount: res.locals.occupiedRoomsCount });
});

// Thêm middleware để chia sẻ dữ liệu trên tất cả các trang
app.use((req, res, next) => {
  // Lấy số lượng phòng trống và phòng không trống từ cơ sở dữ liệu
  const countAvailableRoomsQuery = 'SELECT COUNT(*) AS count FROM rooms WHERE status = "available"';
  const countunavailableRoomsQuery = 'SELECT COUNT(*) AS count FROM rooms WHERE status = "unavailable"';

  db.query(countAvailableRoomsQuery, (availableError, availableResults) => {
    if (availableError) throw availableError;

    db.query(countunavailableRoomsQuery, (unavailableError, unavailableResults) => {
      if (unavailableError) throw unavailableError;

      // Gán giá trị vào biến res.locals để chia sẻ với tất cả các trang
      res.locals.availableRoomsCount = availableResults[0].count;
      res.locals.unavailableRoomsCount = unavailableResults[0].count;

      next();
    });
  });
});


// Route để hiển thị trang home
app.get('/', (req, res) => {
  // Kiểm tra trạng thái người dùng (đã đăng nhập hay chưa)
  if (req.isAuthenticated()) {
    // Người dùng đã đăng nhập
    res.render('home', { user: req.user });
  } else {
    // Người dùng chưa đăng nhập
    res.render('home');
  }
});



// Tuyến đường cho footer
app.get('/footer', (req, res) => {
  res.render('footer');
});


// Phòng
// Hiển thị danh sách phòng
app.get('/index', (req, res) => {
  db.query('SELECT * FROM rooms', (err, results) => {
    if (err) throw err;
    res.render('index', { rooms: results });
  });
});

// Form thêm phòng
app.get('/add', (req, res) => {
  res.render('add');
});

// Xử lý thêm phòng
app.post('/add', (req, res) => {
  const { room_number, room_type, price } = req.body;
  const sql = 'INSERT INTO rooms (room_number, room_type, price) VALUES (?, ?, ?)';
  db.query(sql, [room_number, room_type, price], (err, result) => {
    if (err) throw err;
    res.redirect('/');
  });
});

/// Route để hiển thị form chỉnh sửa phòng
app.get('/edit/:roomId', (req, res) => {
  const roomId = req.params.roomId;

  const sql = 'SELECT * FROM rooms WHERE id = ?';

  db.query(sql, [roomId], (selectError, selectResults, selectFields) => {
    if (selectError) {
      console.error('Error retrieving room:', selectError);
      res.status(500).send('Internal Server Error');
    } else {
      const room = selectResults[0]; // Giả sử chỉ lấy một phòng

      // Render trang chỉnh sửa phòng (edit-room.ejs)
      res.render('edit', { room });
    }
  });
});

// Route để xử lý yêu cầu POST khi người dùng gửi form chỉnh sửa phòng
app.post('/edit/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const roomNumber = req.body.roomNumber;
  const roomType = req.body.roomType;
  const status  = req.body.status;
  const price = req.body.price;

  //Tạo câu truy vấn UPDATE với điều kiện kiểm tra giá trị của status
  const updateRoomQuery = `UPDATE rooms SET room_number = ?, room_type = ?, price = ? ${req.body.status ? ', status = ?' : ''} WHERE id = ?`;

  // Tạo một mảng giá trị để truyền vào câu truy vấn
  const updateValues = [roomNumber, roomType, status, price];

  // Nếu giá trị status đã được nhập, thêm giá trị đó vào mảng
  if (req.body.status) {
    updateValues.push(req.body.status);
  }

  // Thêm id vào mảng giá trị
  updateValues.push(roomId);

  // Thực hiện câu truy vấn
  db.query(updateRoomQuery, updateValues, (updateError, updateResults) => {
    if (updateError) {
      console.error(`Error updating room: ${updateError.message}`);
      res.redirect('/index');  // Redirect về trang home trong trường hợp lỗi
    } else {
      console.log(`Room updated successfully!`);
      res.redirect('/index');  // Redirect về trang home sau khi cập nhật thành công
    }
  });
});

// Định nghĩa route xóa
app.get('/delete/:roomId', (req, res) => {
  const roomId = req.params.roomId;

  const deleteQuery = 'DELETE FROM rooms WHERE id = ?';

  db.query(deleteQuery, [roomId], (error, results, fields) => {
    if (error) {
      console.error('Error deleting room:', error);
      res.status(500).send('Internal Server Error');
    } else {
      console.log('Room deleted successfully');
      // Chuyển hướng về trang chủ hoặc trang danh sách phòng
      res.redirect('/index');
    }
  });
});


// Định nghĩa route đặt phòng
app.get('/book/:roomId', (req, res) => {
  const roomId = req.params.roomId;

  // Lấy thông tin phòng từ cơ sở dữ liệu
  const selectQuery = 'SELECT * FROM rooms WHERE id = ?';

  db.query(selectQuery, [roomId], (selectError, selectResults, selectFields) => {
    if (selectError) {
      console.error('Error fetching room details:', selectError);
      res.status(500).send('Internal Server Error');
    } else {
      const room = selectResults[0];

      // Render trang đặt phòng và truyền thông tin phòng vào đó
      res.render('book', { room, bookingSuccess: false, bookingError: false });
    }
  });
});

// Xử lý yêu cầu POST khi người dùng nhấn nút "Đặt phòng"
app.post('/book/:roomId', (req, res) => {
  const roomId = req.params.roomId;

  // Thực hiện các thao tác đặt phòng tại đây (ví dụ: cập nhật trạng thái)
  const updateRoomStatusQuery = `UPDATE rooms SET status = 'unavailable' WHERE room_number = ?`;
  
  // Nếu đặt phòng thành công
  const bookingSuccess = true;

  // Nếu xảy ra lỗi khi đặt phòng
  const bookingError = false;

  // Render lại trang đặt phòng với thông báo tương ứng
  res.render('book', { room: {}, bookingSuccess, bookingError }); 
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
