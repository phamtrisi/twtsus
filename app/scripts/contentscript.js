'use strict';

(function($) {
  // These are classes and ID names from Twitter. Highly likely to change over time so I put
  // them in a dict by themselves for readability
  var TWITTER_NAMINGS = {
    TWEET_FORM: '.tweet-form',
    TWEET_BOX_HOME_TIMELINE: '#tweet-box-home-timeline',
    GLOBAL_NEW_TWEET_BUTTON: '#global-new-tweet-button',
    ORIGINAL_TWEET_BUTTON: '.tweet-btn:not(#global-new-tweet-button)',
    TWEET_BUTTON_CONTAINER: '.tweet-button',
    TWEET_TEXTAREA_SHADOW: 'textarea.tweet-box-shadow'
  };


  var $tweetForm = $(TWITTER_NAMINGS.TWEET_FORM),
    $tweetBoxEditable = $(TWITTER_NAMINGS.TWEET_BOX_HOME_TIMELINE),
    $tweetContentTextarea = $(TWITTER_NAMINGS.TWEET_TEXTAREA_SHADOW),
    $originalTweetButton = $(TWITTER_NAMINGS.ORIGINAL_TWEET_BUTTON),
    $newTweetButton = $('<button/>', {
      html: 'Tweet',
      class: 'btn primary-btn'
    }),
    $tweetButtonContainer = $(TWITTER_NAMINGS.TWEET_BUTTON_CONTAINER),
    FIREBASE_URL = 'https://twtsus.firebaseio.com/tweets',
    APP_URL_HOST = 'twts.us',
    TRANSLATE_TWEETS_EVERY = 1000, // Translate tweets every 1s
    MAX_CHARS_LIMIT = 140,
    tweetsTranslateInterval,
    $specialLinks;


  /**
   * UTILS
   */


  /**
   * Turn response into valid JSON
   */
  function JSONResponse(response) {
    return response.json();
  }


  /**
   * Truncate a given input to <desiredLength> characters, with optional ellipsis
   */
  function truncate(input, desiredLength, withEllipsis) {
    return [].slice.call(input, 0, withEllipsis ? desiredLength - 3 : desiredLength).join('') + (withEllipsis ? '...' : '');
  }

  /**
   * Post original tweet to our own service, return a promise
   */
  function postOriginalTweet(tweet) {
    return fetch(FIREBASE_URL + '.json', {
      method: 'post',
      body: JSON.stringify({
        "twitterUserId": tweet.twitterUserId,
        "content": tweet.content
      })
    });
  }



  /**
   * MAIN
   */

  function _attachNewTweetButtonEventHandlers() {

    // Attach event handlers for this new button
    $newTweetButton.on('click', function(evt) {
      var originalTweet = $tweetContentTextarea.val(),
        modifiedTweet = originalTweet,
        tweet = {
          twitterUserId: 1234,
          content: originalTweet
        };

      // If the tweet is longer than MAX_CHARS_LIMIT chars, do the magic
      if (originalTweet.length > MAX_CHARS_LIMIT) {

        // Add to firebase first
        postOriginalTweet(tweet)
          .then(JSONResponse)
          .then(function(returnedTweetObj) {
            if (returnedTweetObj && returnedTweetObj.name) {

              // Truncate and add '...' and short link
              modifiedTweet = [truncate(originalTweet, 100, true), ' ', APP_URL_HOST, '/', returnedTweetObj.name].join('');

              // Update the content of tweetbox
              $tweetBoxEditable.html(modifiedTweet);

              // Focus and blur to force revalidation of MAX_CHARS_LIMIT chars
              $tweetBoxEditable.focus().blur();

              // Update the val for hidden textarea tweet-shadow
              $tweetContentTextarea.val(modifiedTweet);

              // Manually trigger a click event
              // TODO high: find a more reliable way to do this
              $newTweetButton.trigger('click');

            } else {
              alert('Service not working, please try again.');
            }
          });
      }
      // If not, just trigger the original tweet button
      else {
        $originalTweetButton.trigger('click');
      }

      // Extra safety stuff
      evt.preventDefault();
      evt.stopPropagation();
    });
  }


  function _cleanUpOriginalUI() {

    // Hide the original Tweet button
    $originalTweetButton.css('display', 'none');
  }

  function _attachEventHandlers() {

    _attachNewTweetButtonEventHandlers();
  }

  function _generateNewUIComponents() {

    // Add the new Tweet button to the DOM
    $tweetButtonContainer.append($newTweetButton);

    // Check to see if there's new tweets that need to be translated every <TRANSLATE_TWEETS_EVERY>
    tweetsTranslateInterval = setInterval(function() {
      $specialLinks = $('a[data-expanded-url*="twts.us"]');
      $specialLinks.each(function(idx) {
        var $this = $(this),
          $tweetText = $this.parents('.tweet-text'),
          url = $this.data('expanded-url'),
          urlTokens = url.split('/'),
          fireBaseKey = urlTokens[urlTokens.length - 1];

        fetch([FIREBASE_URL, '/', fireBaseKey, '.json'].join(''))
          .then(JSONResponse)
          .then(function(originalTweet) {
            $tweetText.html(originalTweet.content);
          });
      });
    }, TRANSLATE_TWEETS_EVERY);
  }

  function _init() {
    _cleanUpOriginalUI();
    _attachEventHandlers();
    _generateNewUIComponents();
  }


  /**
   * START
   */

  _init();

})($);
