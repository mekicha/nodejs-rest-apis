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


  makeResponse(query, res);

});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!isNumeric(id)) {
    return res.json({
      data: [],
      error: 'id must be numeric'
    });
  }

  const query = mqb.select('*')
    .from('users')
    .where('id', id)
    .exec();

  makeResponse(query, res);
});


router.post('/', (req, res) => {
  // create a new user.
  req.checkBody('username', 'username is required').notEmpty();
  req.checkBody('email', 'email is required').isEmail();

  req.getValidationResult().then((result) => {
    const errors = result.array();
    if (errors.length > 0) {
     return res.status(400).end();
    }
  });

  username = req.body.username;
  email = req.body.email;

  const query = mqb.insert(
    'users', {
      username: username,
      email: email
    }
  ).exec();

  query.then(result => {

      return res.json({
        data: [{
          username,
          email
        }],
        id: result.insertId,
        errors: null
      });
    })
    .catch(error => {
      response.errors = error;
      return res.json({
        data:[],
        error:'error saving data'
      });
    });

});

router.put('/:id', (req, res) => {
  id = parseInt(req.params.id, 10);

  let payload = {
    id
  };

  if (!isNumeric(id)) {
    return res.json({
      data: [],
      error: 'id must be numeric'
    });
  }

  if (req.body.username) {
    payload.username = req.body.username;
  }

  if (req.body.email) {
    payload.email = req.body.email;
  }

  const query = mqb.update(
    'users',
    payload
  ).exec();

  query.then(result =>
      res.json({
        data: [{
          payload
        }],
        error: null
      }))
    .catch(error => (res.json({
      data: [],
      error: error
    })));
});

function makeResponse(query, res) {
  let response = {};
  response.data = [];
  response.errors = null;
  return query.then(result => {
    response.data = result;
    res.json(response);
  }).catch(error => {
    response.errors = error;
    res.json(response);
  });
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

module.exports = router;