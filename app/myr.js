var Formatters = require("./formatters.js");

module.exports = class Myr {

  constructor(name, scryfall, facebook, converter, hp7) {
    this.name = name;
    this.scryfall = scryfall;
    this.facebook = facebook;
    this.currencyConverter = converter;
    this.hp7 = hp7;
    this.legalityFormats = [ "standard", "modern", "legacy", "vintage", "commander", "pauper", "7PH"]
  }

  parse(message, threadID) {
    var myr = this;

    var helpString = 'Help me ' + myr.name + '!';
    var randomString = 'OK ' + myr.name + ', what\'s spicy\\?';
    var searchRegex = /\(\((.+)\)\)/;


    if (searchRegex.test(message)) {
      var searchString = searchRegex.exec(message)[1];
      var options = myr.parseOptions(searchString)
      switch(options.searchType){
          case 'fuzzy':
            myr.searchFuzzy(options)
              .then(formatters => myr.respondFormat(formatters, threadID))
              .catch(err => myr.respondError(err, threadID));
            break;
          case 'fullText':
            myr.searchText(options)
              .then(formatters => myr.respondFormat(formatters, threadID))
              .catch(err => myr.respondError(err, threadID));
            break;
          case 'random':
            myr.searchRandom(options)
              .then(formatters => myr.respondFormat(formatters, threadID))
              .catch(err => myr.respondError(err, threadID));
            break;
          case 'help':
            myr.respondFormat([Formatters.getHelpMessage()], threadID);
            break;
      }
    }
  }

  respond(message, threadID){
    if((message.attachment || message.body )) {
      this.facebook.sendMessage(message, threadID, function(err, msg){
        console.log(err)
        console.log(msg)
      });
    }
  }

  respondError(error, threadID){
    var ret = error.details + "\n"
    if (error.warnings){
      ret += error.warnings.join("\n")
    }
    this.respond(ret, threadID);
  }

  respondFormat(formatters, threadID){
    var responseMessage = { body: "", attachment:[]};
    this.getResponse(responseMessage, formatters, threadID); //TODO: rename
  }

  getResponse(responseMessage, formatters, threadID){
    var myr = this
    var formatter = formatters.shift()
    if(formatter){
      formatter.then(function(cardMessage){
        if (cardMessage.attachment) {
          responseMessage.attachment = responseMessage.attachment.concat(cardMessage.attachment)
        }
        responseMessage.body += cardMessage.body  + '\n';
        myr.getResponse(responseMessage, formatters, threadID);
      });
    } else {
      myr.respond(responseMessage, threadID);
    }
  }

  searchText(options) {
    return new Promise((resolve, reject) => {
      var myr = this
      var cardArray = []
      myr.scryfall.Cards.search(options.searchString).cancelAfterPage()
      .on("data", function(result){
        if(cardArray.length > options.max){
          this.cancel();
          return;
        }
        cardArray.push(options.formatter(result));
      }).on("end", function(){
        if (myr.scryfall.error()){
          reject(myr.scryfall.error());
        } else {
          resolve(cardArray);
        }
      }).on("cancel", ()=> cardArray.push(Formatters.getMoreCardsMessage()));
    });
  }

  searchFuzzy(options) {
    return new Promise((resolve, reject) => {
      var myr = this;
      myr.scryfall.Cards.byName(options.searchString, true).then(function(result){
        if (myr.scryfall.error()){
          reject(myr.scryfall.error());
        } else {
          resolve([options.formatter(result)]);
        }
      })
    })
  }
  //function Card[] searchText(options) {}
  searchRandom(options) {
    return new Promise((resolve, reject) => {
      var myr = this;
      myr.scryfall.Cards.random().then(function(result){
        if (myr.scryfall.error()){
          reject(myr.scryfall.error());
        } else {
          resolve([options.formatter(result)]);
        }
      })
    })
  }

  parseOptions(searchString){
    var options = {};
    var formatSpecifier = searchString.charAt(0);
    options.searchString = searchString.substring(1);
    options.searchType = "fuzzy"
    switch(formatSpecifier){
      case '$':
        options.formatter = Formatters.getPriceFormatter(this.currencyConverter);
        break;
      case '+':
        options.formatter = Formatters.getNameFormatter();
        options.searchType = "fullText";
        options.max = 5;
        break;
      case '|':
        formatSpecifier = searchString.charAt(1);
        options.searchString = searchString.substring(2);
        options.searchType = "random";
        switch(formatSpecifier){
          case '&':
            options.formatter = Formatters.getCardTextFormatter();
            break;
          case '$':
            options.formatter = Formatters.getPriceFormatter(this.currencyConverter);
            break;
          case '?':
            options.searchType = "help"
            break;
          case '#':
            options.formatter = Formatters.getLegalitiesFormatter(this.legalityFormats, this.hp7);
            break;
          default:
            options.searchString = searchString.substring(1);
            options.formatter = Formatters.getNameFormatter();
            break;
        }
        break;
      case '#':
        options.formatter = Formatters.getLegalitiesFormatter(this.legalityFormats, this.hp7);
        break;
      case '!':
        options.formatter = Formatters.getImageFormatter('normal');
        break;
      case '@':
        options.formatter = Formatters.getImageFormatter('art_crop');
        break;
      case '&':
        options.formatter = Formatters.getCardTextFormatter();
        break;
      default: ''
        options.searchString = searchString;
        options.formatter = Formatters.getCardTextFormatter();
        break;
      }
      return options;
    }
    //returns {
    // searchString:
    // searchType:
    //  fuzzy
    //  full text
    // set:
    // max:
    // format:
        // name defaultMax:5
        // price defaultMax:5
        // image defaultMax:1
        // art defaultMax:1
        // text defaultMax:3
        // legality defaultMax:1
        // help
        // EOL
        //}


}
