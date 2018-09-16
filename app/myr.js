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
    var randomString = 'OK ' + myr.name + ', what\'s spicy?';

    if(message === helpString) {
      message = "((??))";
    } else if(message === randomString){
      message = "((?!))"
    }

    var options = myr.parseOptions(message)
    if (options) {
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
    console.log(message)
    this.facebook.sendMessage(message, threadID, function(err, msg){
      console.log(err)
      console.log(msg)
    });
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
        if(cardArray.length == options.max){
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
      myr.scryfall.Cards.byName(options.searchString, true, options.searchOptions.set).then(function(result){
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

  parseOptions(message){
    var searchRegex = /\(\(([&!@$#+?]?)([^|]*)[|]?(.*)\)\)/;
    if(!searchRegex.test(message)){
      return false;
    }

    var options = {};
    var regexResult = searchRegex.exec(message);

    var formatSpecifier = regexResult[1];
    options.searchString = regexResult[2];
    var optionsString = regexResult[3];
    options.searchType = "fuzzy"
    options.max = 5;

    if (formatSpecifier == '?'){
      options.searchType = "random";
      formatSpecifier = options.searchString = regexResult[2];
    } else if (formatSpecifier == '+') {
      options.searchType = "fullText";
      formatSpecifier = optionsString.charAt(0);
    } else {
      options.searchOptions = {
        "set": optionsString
      }
    }
    switch(formatSpecifier){
      case '$':
        options.formatter = Formatters.getPriceFormatter(this.currencyConverter);
        options.max = 5;
        break;
      case '#':
        options.formatter = Formatters.getLegalitiesFormatter(this.legalityFormats, this.hp7);
        options.max = 1;
        break;
      case '!':
        options.formatter = Formatters.getImageFormatter('normal');
        options.max = 1;
        break;
      case '@':
        options.formatter = Formatters.getImageFormatter('art_crop');
        options.max = 2;
        break;
      case '&':
        options.formatter = Formatters.getCardTextFormatter();
        options.max = 3;
        break;
      case '?':
        options.searchType = "help"
        break;
      default:
        if(options.searchType == "fuzzy"){
          options.formatter = Formatters.getCardTextFormatter();
        } else {
          options.formatter = Formatters.getNameFormatter();
          options.max = 5;
        }
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
