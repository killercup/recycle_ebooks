extern crate markov;

use markov::Chain;

const BOTS: &'static [&'static str; 9] = &[
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

const ENGLISH: &'static [&'static str; 3] = &[
    "conquest_of_bread",
    "structure-and-interpretation-of-computer-programs",
    "alice_oz",
];

fn main() {
    let mut chain = Chain::new();
    chain.order(4);

    for file in BOTS {
        chain.feed_file(format!("data/bots/{}.txt", file));
    }
    // for file in ENGLISH {
    //     chain.feed_file(format!("data/english/{}.txt", file));
    // }

    use std::io;
    use std::io::Write;

    let mut input = String::new();
    loop {
        writeln!(io::stdout(), "{}", chain.generate_str()).unwrap();
        io::stdin().read_line(&mut input).unwrap();
    }
}
