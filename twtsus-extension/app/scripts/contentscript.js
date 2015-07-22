'use strict';

(function($) {
  // These are classes and ID names from Twitter. Highly likely to change over time so I put
  // them in a dict by themselves for readability
  var TWITTER_NAMINGS = {
    TWEET_FORM: '.tweet-form',
    TWEET_BOX_HOME_TIMELINE: '#tweet-box-home-timeline',
    TWEET_BOX: '.tweet-box',
    GLOBAL_NEW_TWEET_BUTTON: '#global-new-tweet-button',
    ORIGINAL_TWEET_BUTTON: '.tweet-btn:not(#global-new-tweet-button)',
    TWEET_BUTTON_CONTAINER: '.tweet-button',
    TWEET_TEXTAREA_SHADOW: 'textarea.tweet-box-shadow'
  };


  var $tweetForm,
    $tweetBoxEditable,
    $tweetContentTextarea,
    $originalTweetButton,
    $originalTweetButtons = $(TWITTER_NAMINGS.ORIGINAL_TWEET_BUTTON),
    $newTweetButton = $('<button/>', {
      html: 'Tweet',
      class: 'btn primary-btn'
    }),
    $tweetButtonContainer,
    $tweetButtonContainers = $(TWITTER_NAMINGS.TWEET_BUTTON_CONTAINER),
    FIREBASE_URL = 'https://twtsus.firebaseio.com/tweets',
    APP_URL_HOST = 'twts.us',
    APP_URL = 'https://twtsus.herokuapp.com',
    TRANSLATE_TWEETS_EVERY = 1500, // Translate tweets every 1.5s
    MAX_CHARS_LIMIT = 140,
    notWorkingFirebaseKeys = {}, // Caching firebase keys that don't work so we don't make extra calls on these again
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
    return fetch(APP_URL, {
      method: 'post',
      body: JSON.stringify(tweet),
      data: tweet
    });
  }



  /**
   * MAIN
   */

  function _attachNewTweetButtonEventHandlers() {

    // Attach event handlers for this new button
    $newTweetButton.on('click', function(evt) {
      var $this = $(this),
        originalTweet,
        modifiedTweet,
        tweet;

      $tweetForm = $this.parents(TWITTER_NAMINGS.TWEET_FORM);
      $tweetBoxEditable = $tweetForm.find(TWITTER_NAMINGS.TWEET_BOX);
      $tweetContentTextarea = $tweetForm.find(TWITTER_NAMINGS.TWEET_TEXTAREA_SHADOW);
      $originalTweetButton = $tweetForm.find(TWITTER_NAMINGS.ORIGINAL_TWEET_BUTTON);
      $tweetButtonContainer = $tweetForm.find(TWITTER_NAMINGS.TWEET_BUTTON_CONTAINER);

      originalTweet = $tweetContentTextarea.val();
      modifiedTweet = originalTweet;
      tweet = {
        twitterUserId: 1234,
        content: originalTweet
      };

      // If the tweet is longer than MAX_CHARS_LIMIT chars, do the magic
      if (originalTweet.length > MAX_CHARS_LIMIT) {

        $.ajax({
          url: APP_URL,
          method: 'POST',
          data: tweet,
          cache: true,
          crossDomain: true,
          dataType: 'json',
        }).done(function(returnedTweetObj) {
          var prefix;

          if (returnedTweetObj && returnedTweetObj.name) {

            prefix = [' ', APP_URL_HOST, '/', returnedTweetObj.name].join('');

            // Truncate and add '...' and short link
            modifiedTweet = [truncate(originalTweet, 140 - prefix.length, true), prefix].join('');

            // Update the content of tweetbox
            $tweetBoxEditable.html(modifiedTweet);

            // Focus and blur to force revalidation of MAX_CHARS_LIMIT chars
            $tweetBoxEditable.focus().blur();

            // Update the val for hidden textarea tweet-shadow
            $tweetContentTextarea.val(modifiedTweet);

            // Manually trigger a click event
            // TODO high: find a more reliable way to do this
            $this.trigger('click');

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
    $originalTweetButtons.css('display', 'none');
  }

  function _attachEventHandlers() {

    _attachNewTweetButtonEventHandlers();
  }

  function _generateNewUIComponents() {
    var requestHeaders = new Headers();
    requestHeaders.append("X-Requested-With", "XMLHttpRequest");

    // Add the new Tweet button to the DOM
    $tweetButtonContainers.append($newTweetButton);

    // Check to see if there's new tweets that need to be translated every <TRANSLATE_TWEETS_EVERY>
    tweetsTranslateInterval = setInterval(function() {
      $specialLinks = $('a[data-expanded-url*="twts.us"]');
      $specialLinks.each(function(idx) {
        var $this = $(this),
          $tweetText = $this.parents('.tweet-text'),
          url = $this.data('expanded-url'),
          urlTokens = url.split('/'),
          fireBaseKey = urlTokens[urlTokens.length - 1],
          isBrokenKey = notWorkingFirebaseKeys[fireBaseKey];

        if (!isBrokenKey) {
          fetch([APP_URL, '/', fireBaseKey].join(''), {
            headers: requestHeaders
          })
            .then(JSONResponse)
            .then(function(originalTweet) {
              if (originalTweet && originalTweet.content) {
                $tweetText.html(originalTweet.content);
              } else {
                // Cache this keys that don't work
                notWorkingFirebaseKeys[fireBaseKey] = true;
              }
            });
        } else {
          // Cache this keys that don't work
          notWorkingFirebaseKeys[fireBaseKey] = true;
        }

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
