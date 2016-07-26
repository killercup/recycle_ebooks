require('dotenv').config({path: '../.env'});
const Twitter = require('twitter');
const fs = require('fs');

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
  "TwoHeadlines",
];

function getTweetTexts(userName) {
  let requests = [];

  // Twitter currently (2016-07-25) gives us at most 3200 tweets in chunks of
  // 200. Since the chunks _always_ include RTs, we can in theory get an empty
  // chunk that is not the last chunk. So, let's just do a fixed count of
  // requests to always get the maximum number of tweets.
  const REQUEST_COUNT = 3200 / 200;

  for (var i = 0; i < REQUEST_COUNT; i++) {
    requests.push(new Promise(function (resolve, reject) {
      client.get('statuses/user_timeline', {
        screen_name: userName,
        exclude_replies: true,
        include_trs: false,
        contributor_details: false,
        trim_user: true,
        count: 200,
      }, function(error, tweets, response){
        if (error) { return reject(error); }

        const texts = (tweets || []).map(function (tweet) {
          return tweet.text;
        });

        return resolve(texts.join('\n'));
      });
    }));
  }

  return Promise.all(requests)
  .then(function (texts) {
    return texts.join('\n');
  });
}


Promise.all(SOURCES.map(function (source) {
  return getTweetTexts(source)
  .then(function name(text) {
    return new Promise(function (resolve, reject) {
      fs.writeFile("../data/" + source + ".txt", text, function (err) {
        if (err) { return reject(err); }
        resolve(source);
      });
    })
  });
}))
.then(function () {
  console.log("Done.")
}, console.error.bind(console));
