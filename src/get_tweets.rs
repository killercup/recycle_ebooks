extern crate dotenv;
extern crate tweetust;

use std::env;

use dotenv::dotenv;

use tweetust::TwitterClient;
use tweetust::TwitterResult;
use tweetust::models::tweets::Tweet;
use tweetust::conn::Authenticator;
use tweetust::conn::oauth_authenticator::OAuthAuthenticator;

const SOURCES: &'static [&'static str; 9] = &[
    "_ireallyneedto",
    "MagicRealismBot",
    "sixworderbot",
    "BitOfEntropy",
    "EuphemismBot",
    "TheStrangeLog",
    "HNTitles",
    "TwoHeadlines",
    "thewaybot",
];

fn main() {
    dotenv().ok();

    let auth = OAuthAuthenticator::new(
        &env::var("TWITTER_CONSUMER_API_KEY").unwrap(),
        &env::var("TWITTER_CONSUMER_API_SECRET").unwrap(),
        &env::var("TWITTER_ACCESS_TOKEN").unwrap(),
        &env::var("TWITTER_ACCESS_TOKEN_SECRET").unwrap()
    );
}

fn get_tweet_texts<T: Authenticator>(user_name: &str, auth: T) -> TwitterResult<Vec<String>> {
    let get_statuses = TwitterClient::new(auth)
        .statuses()
        .user_timeline()
        .screen_name(user_name)
        .exclude_replies(true)
        .include_trs(false)
        .contributor_details(false)
        .trim_user(true)
        .count(200);

    let mut statuses = Vec::with_capacity(2000);
    let mut max_id: Option<i64> = None;

    // Twitter currently (2016-07-25) gives us at most 3200 tweets in chunks of
    // 200. Since the chunks _always_ include RTs, we can in theory get an empty
    // chunk that is not the last chunk. So, let's just do a fixed count of
    // requests to always get the maximum number of tweets.
    let requests = 3_200 / 200;

    for i in 0..requests {
        let get_statuses = get_statuses.clone();
        if let Some(max_id) = max_id {
            get_statuses = get_statuses.max_id(max_id);
        }

        let tweets = try!(get_statuses.execute());

        max_id = tweets.iter().max_by_key(|tweet| tweet.id);
        statuses.extend(tweets.into_iter().map(|tweet| tweet.text));
    }

    Ok(statuses)
}
