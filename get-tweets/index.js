const fs = require('fs');
const co = require('co');
const Twitter = require('twitter');
require('dotenv').config({path: '../.env'});

let client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_API_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_API_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const SOURCES = [
  // "thewaybot",
  // "_ireallyneedto",
  // "MagicRealismBot",
  // "sixworderbot",
  // "BitOfEntropy",
  // "EuphemismBot",
  // "TheStrangeLog",
  // "HNTitles",
  // "TwoHeadlines",
  "UnitOfSelection",
];

function getTweets(userName, max_id) {
  console.log("fetching tweets", {
    screen_name: userName,
    max_id: max_id,
  });

  return new Promise(function (resolve, reject) {
    client.get('statuses/user_timeline', {
      screen_name: userName,
      exclude_replies: true,
      include_rts: true,
      contributor_details: false,
      trim_user: true,
      count: 200,
      max_id: max_id,
    }, function (error, tweets) {
      if (error) { return reject(error); }

      const texts = (tweets || []).map(function (tweet) {
        return tweet.text;
      });

      console.log("got", tweets.length, "tweets");

      return resolve({
        text: texts.join('\n'),
        max_id: tweets.reduce(function (acc, tweet) {
          if (!tweet.id) { return acc; }
          if (!acc || !acc.lessThan || acc.lessThan(tweet.id)) {
            return tweet.id;
          }
        }, undefined)
      });
    });
  });
}

function getAllTweetTexts(userName) {
  console.log("fetch tweets for", userName);
  return co(function* () {
    let answer = "";
    let max_id;

    // Twitter currently (2016-07-25) gives us at most 3200 tweets in chunks of
    // 200. Since the chunks _always_ include RTs, we can in theory get an empty
    // chunk that is not the last chunk. So, let's just do a fixed count of
    // requests to always get the maximum number of tweets.
    const REQUEST_COUNT = 3200 / 200;

    for (var i = 0; i <= REQUEST_COUNT; i++) {
      let res = yield getTweets(userName, max_id);
      answer += res.text;
      max_id = res.max_id || max_id;

      console.log("texts of length", res.text.length, "with max_id", max_id);
    }

    return answer;
  });
}


Promise.all(SOURCES.map(function (source) {
  return getAllTweetTexts(source)
  .then(function name(text) {
    return new Promise(function (resolve, reject) {
      fs.writeFile("../data/bots/" + source + ".txt", text, function (err) {
        if (err) { return reject(err); }
        resolve(source);
      });
    })
  });
}))
.then(function () {
  console.log("Done.")
}, console.error.bind(console));
