## Simple REST API using Express and mySQL

This is a simple demo of building a REST API using Express and mySQL.

To make writing SQL query easier and more intuitive, I'm using a [mySQL query builder](https://github.com/niklucky/mysql-query-builder).

Add it to your dependency by running `npm i -S mysql-qb`.
Of course, you will need the mysql driver as well. That too is just `npm i -S mysql` away.
You can change the above commands to `npm install --save [module_name_here]` if you prefer. But remember the `save`.
It's what adds the module as a dependency to your project.

Next, lo and behold the user model we will be interacting with.

```javascript
CREATE TABLE `users` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(40) NOT NULL,
  `email` varchar(40) NOT NULL,
  `createdAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `role` enum('admin','moderator','member') NOT NULL DEFAULT 'member',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

```

Let's pretend we are trying to build some kind of a forum or maybe a user management system. Even though we are not.

What's next? After creating the above table in a database, it's time to write our API.

Create a `users.js` file and put let's put these things inside.

```javascript
var express = require('express');
var router = express.Router();
const queryBuilder = require('mysql-qb');
const config = require('./config');

const mqb = new queryBuilder(config);
``` 
We require express, query builder and the database configuration settings.
The configuration looks like this:

```javascript
module.exports = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  database: 'test'
}
```
It's all pretty simple. We are building a pretty simple REST API.

Why don't you just show us the first endpoint, and quit beating about the bush?

Well, my friend, here it is. A `GET` request handler.

```javascript
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
```
Everything makes sense right? All it knows to do is handle a request by  `Id`. 
If I give you an `Id` of 2 and ask you to go find me the user with that `Id`, you probably 
would not know what to do. But that block of code you are looking at knows what to do.
First, it will check that what is passed to it is truly an integer and nothing else.
It calls a helper function to help it do the checking, since that's not really it's area
of specialization.

```javascript
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
```
If the checking succeeds, that is to say, what you gave was really an integer, it will pass it on to 
the database, who checks to see if it has a user with that `Id`. If it does, it retrieves all the
information it has about that user and sends it to our request handler. Our request handler makes that
into a response using the makeResponse function and sends us the result.

Here's the makeResponse() function:

```javascript
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
```
The makeResponse function is actually the guy our request handler hired or begged to send the request to the
database. So if the database returns an error, makeResponse will return that to our request handler too.

Here is a sample response from the handler:

```json
{
    "data": [
        {
            "id": 1,
            "username": "agbo",
            "email": "eme@kachi.com",
            "createdAt": "2017-08-25T10:39:54.924Z",
            "updatedAt": "2017-08-25T10:39:54.924Z",
            "role": "admin"
        }
    ],
    "errors": null
}
```


Now, I must show you the `POST` request because it's really interesting to look at:

```javascript
router.post('/', (req, res) => {
  // create a new user.
  req.checkBody('username', 'username is required').notEmpty();
  req.checkBody('email', 'email is required').notEmpty().isEmail();

  req.getValidationResult().then((result) => {
    const errors = result.array();
    if (errors.length !== 0) {
      return res.json({
        data: [],
        errors: errors
      });
    }
  });

  username = req.body.username;
  email = req.body.email;

  const response = {};
  response.data = [{
    username: username,
    email: email
  }];

  const query = mqb.insert(
    'users', {
      username: username,
      email: email
    }
  ).exec();

  query.then(result => {
      response.id = result.insertId;
      response.errors = null;
      return res.json({
        response
      });
    })
    .catch(error => {
      response.errors = error;
      return res.json({
        response
      });
    });

});
```
The post request handler does not trust the user too. So it's checking what the user sent to make sure it's
what it's expecting. If all goes well, it takes what the user sends and hands it over to the database.
The database will save it, and will respond with an `insertId` among other things. That's like saying: Hey, I just
saved the data and here is the `Id` you should use if you want to `GET` the data from me.
Post handler takes that, mixes it with what the user sent and sends it back to the user.

Here is what we get if we don't supply the expected params:

```json
{
    "data": [],
    "errors": [
        {
            "param": "username",
            "msg": "username is required"
        },
        {
            "param": "email",
            "msg": "email is required"
        }
    ]
}
```

And when we supply the needed data:

```json
{
    "data": [
          {
            "username": "max"
          }
        ],
    "id": 1,
    "errors": null
}
```


