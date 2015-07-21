var express = require('express');
var router = express.Router();
var fetch = require('node-fetch');
fetch.Promise = require('bluebird');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Twts.us - Tweet as long as you like'
  });
});

// Post a tweet to firebase
router.post('/', function(req, res, next) {
  console.log(req);
  var tweet = {
    "twitterUserId": req.body.twitterUserId,
    "content": req.body.content
  };

  console.log(tweet);

  fetch('https://twtsus.firebaseio.com/tweets.json', {
      method: 'post',
      body: JSON.stringify(tweet)
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(newTweet) {
      console.log(newTweet);
      res.json(newTweet);
    });
});

// Retreive a tweet from firebase
router.get('/:id', function(req, res, next) {
  var tweetId = req.params.id;
  fetch('https://twtsus.firebaseio.com/tweets/' + tweetId + '.json')
    .then(function(response) {
      return response.json();
    })
    .then(function(tweet) {
      if (tweet && tweet.content) {
        res.json({
          content: tweet.content
        });
      }
      else {
        res.json(null);
      }
    });
});

module.exports = router;
