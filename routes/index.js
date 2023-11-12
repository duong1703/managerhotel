var express = require('express');
var router = express.Router();

/* GET home page. */
//router.get('/', function(req, res, next) {
//  res.render('index', { title: 'Express' });
//});

router.get('/views', function(req, res, next) {
  res.render('login');
});

router.get('/views', function(req, res, next) {
  res.render('register');
});

router.get('/views', function(req, res, next) {
  res.render('logout');
});

router.get('/views', function(req, res, next) {
  res.render('home');
});

router.get('/views', function(req, res, next) {
  res.render('contact');
});

router.get('/views', function(req, res, next) {
  res.render('footer');
});

router.get('/views', function(req, res, next) {
  res.render('index');
});

router.get('/views', function(req, res, next) {
  res.render('add');
});

router.get('/views', function(req, res, next) {
  res.render('edit');
});

router.get('/views', function(req, res, next) {
  res.render('delete');
});

router.get('/views', function(req, res, next) {
  res.render('book');
});





module.exports = router;
