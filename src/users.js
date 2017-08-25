var express = require('express');
var router = express.Router();
const queryBuilder = require('mysql-qb');
const config = require('./config');

const mqb = new queryBuilder(config);

router.get('/', (req, res, next) =>{
  // return all users
  const query = mqb.select('*')
                .from('users')
                .exec();
  query.then(result => {
    console.log('db result: ', result);
    return res.json({ users: result });
  }).catch(error => {
    console.log('db error: ', error);
    return res.json({ error: error });
  });

});

router.post('/', (req, res, next) => {
  // create a new user.
  req.checkBody('username', 'username is required').notEmpty();
  req.checkBody('email', 'email is required').notEmpty().isEmail();

  req.getValidationResult().then((result) => {
    const errors = result.array();
    if (errors.length !== 0) {
      res.json({ errors: errors });
    }
  });
  
  username = req.body.username;
  email = req.body.email;

  const response = {};
  response.url = req.url;
  response.data = {
    username: username,
    email: email
  };

  const query = mqb.insert(
    'users',
    {username: username, email: email }
  ).exec();

  query.then(result => {
    response.id = result.insertId;
    response.errors = null;
    res.json({ response });
  })
  .catch(error => {
    response.errors = error;
    res.json({ response });
  });

});

module.exports = router;
