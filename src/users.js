var express = require('express');
var router = express.Router();
const queryBuilder = require('mysql-qb');
const config = require('./config');

const mqb = new queryBuilder(config);

router.get('/', (req, res) => {
  // return all users
  const query = mqb.select('*')
                .from('users')
                .exec();

  const response = {};
  res.json(makeResponse(query, response));

});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  const query = mqb.select('*')
                .from('users')
                .where('id', id)
                .exec();
  response = {};
  res,json(makeResponse(query, response));
});

router.post('/', (req, res) => {
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
  response.data = [{
    username: username,
    email: email
  }];

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


function makeResponse(query, response) {
  return query.then(result => {
    response.errors = null;
    if (result.insertId) {
      response.id = result.insertId;
    } else {
      response.data = [];
      result.forEach(res =>(response.data.push(res)));
    }
    console.log(response);
    return response;
  }).catch(error => {
    response.errors = error;
    return response;
  });
}