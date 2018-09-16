const login = require("facebook-chat-api");
var Myr = require('./app/myr.js');
const Scry = require("scryfall-sdk");
const request = require("request-promise");
const fs = require('fs');


var credentials = {
  email: process.env.EMAIL,
  password: process.env.PASSWORD
}



var hp7 = JSON.parse(fs.readFileSync('./7ph.json', 'utf8'));
// login({appState: JSON.parse(fs.readFileSync('appstate.json', 'utf8'))}, (err, api) => {
login(credentials, (err, api) => {
  if(err){
    return console.error(err);
  }
  //process.on('SIGINT', exitHandler.bind(null, {api: api}));
  api.setOptions({
    logLevel: "error"
  })
  let bot = new Myr("Jin-Gitaxias", Scry, api, getConverter(true), hp7)

  var stopListening = api.listen((err, event) => {
      if(err) return console.error(err);

      if(event.type == "message") {
        bot.parse(event.body, event.threadID);
      }
  });
});

// let bot = new Myr("Jin-Gitaxias", Scry, "", getConverter(false), hp7)
// bot.parse("((@opt))", 215) //Help
// bot.parse("((!fame))", 542);
// bot.parse("((?&))", 333)
// bot.parse('((+Blood Scriv))', 333)
// bot.parse('((who))', 32333)
// bot.parse('((#lim-dul vault))', 32333)
// bot.parse('((+golem ta))', 1234)
// bot.parse('((whohjhdsfjdsvhjfvsdhjfvds))')
// bot.parse("((who what))", 32442)

// bot.parse('((wheel of fate))', 342)
// bot.parse('((#dryad arbor))', 4444)
// bot.parse('((!nyx))', "result")
// bot.parse('(($tolaria west))', "result")
// bot.parse('((+is:fetchland))', "result:") //put max in?
// bot.parse('((+is:fetchland|@))', "result:") //put max in?
// bot.parse("((@huntmaster of))", 485)
// bot.parse("((@Akki Lavarunner))", 3424)
// bot.parse("((!Brisela, Voice of Nightmares))",123123)
// bot.parse("((!roken bla))", 12312);
// bot.parse("((!Hedron-Field Purists))", 234);
// bot.parse("((!flame of keld))", 231);
// bot.parse("((!beck))", 24);
// bot.parse("((!warhammer|MRD))")
// bot.parse("Help me Jin-Gitaxias!");

function getConverter(getRates){
  var fx = require("money");
  fx.rates =  {
      "AUD": 1.3,
      "USD": 1
    }
  fx.base = "USD"
  fx.settings = {
    from: "USD",
    to: "AUD"
  }
  if(getRates){
    request('https://openexchangerates.org/api/latest.json?app_id=18e01813d9694849a877e30fd1db3284')
      .then(function (resp){
        var data = JSON.parse(resp)
        fx.rates = data.rates
    })
  }
  return fx
}

function exitHandler(options, exitCode) {
  fs.writeFileSync('appstate.json', JSON.stringify(options.api.getAppState()));
  process.exit()
}
