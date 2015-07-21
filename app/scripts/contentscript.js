'use strict';

(function($) {
	var $tweetForm = $('form.tweet-form'),
		$tweetBoxEditable = $('#tweet-box-home-timeline'),
		$tweetContentTextarea = $tweetForm.find('textarea.tweet-box-shadow'),
		$originalTweetButton = $tweetForm.find('.js-tweet-btn, .tweet-btn'),
		$newTweetButton = $('<button/>', {
			html: 'TwtsUs',
			class: 'btn primary-btn'
		}),
		$specialLinks,
		fireBaseUrl = 'https://twtsus.firebaseio.com/tweets';

	// Hide the original tweet button
	$originalTweetButton.css('display', 'none');

	// Attach event handlers for this new button
	$newTweetButton.on('click', function(evt) {
		var originalTweet = $tweetContentTextarea.val(),
			toTweet = originalTweet;
		
		if (originalTweet.length > 140) {

			// Add to firebase first
			fetch(fireBaseUrl + '.json', {
				method: 'post',
				body: JSON.stringify({
					"twitterUserId": "1234",
					"content": originalTweet
				})
			})
				.then(function(response) {
					return response.json();
				})
				.then(function(tweet) {
					if (tweet && tweet.name) {
						// Truncate and add '...' and short link
						toTweet = [].slice.call(originalTweet, 0, 100).join('') + '... ' + 'twts.us/' + tweet.name;

						// Update the content of tweetbox
						$tweetBoxEditable.html(toTweet);

						// Focus and blur to force revalidation of 140 chars
						$tweetBoxEditable.focus().blur();

						$tweetContentTextarea.val(toTweet);
						
						// Manually trigger a click event
						$newTweetButton.trigger('click');
					}
				});
		}
		else {
			$originalTweetButton.trigger('click');
		}
		evt.preventDefault();
		evt.stopPropagation();
	})

	// Add this new button to the form
	$('.tweet-button').append($newTweetButton);


	/**
	* Stream items
	*/
	setInterval(function() {
		$specialLinks = $('a[data-expanded-url*="twts.us"]');
		$specialLinks.each(function(idx) {
			var $this = $(this),
				$tweetText = $this.parents('.tweet-text'),
				url = $this.data('expanded-url'),
				urlTokens = url.split('/'),
				fireBaseKey = urlTokens[urlTokens.length - 1];

			console.log(fireBaseKey);
			fetch([fireBaseUrl, '/', fireBaseKey, '.json'].join(''))
				.then(function(response) {
					return response.json();
				})
				.then(function(originalTweet) {
					$tweetText.html(originalTweet.content);
				});
		});
	},1000);

})($);