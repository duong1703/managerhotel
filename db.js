const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'hotelmanage',
  password: 'Duonghk123@',
  database: 'hotelmanage',
});

db.connect((err) => {
  if (err) {
    console.error('Could not connect to MySQL:', err);
  } else {
    console.log('Connected to MySQL database');
  }
});

module.exports = db;