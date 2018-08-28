var request = require('request');
const fs = require('fs');

module.exports = class Formatters {

  static formatFace(face){
    var faceText = face.name + '\t' + face.mana_cost + '\n'
    if (face.color_indicator) {
      faceText += '(' + face.color_indicator.join() +') '
    }
    faceText += face.type_line + '\n'
    faceText += face.oracle_text
    if(face.power) {
      faceText += '\n[' + face.power + '/' + face.toughness + ']'
    }
    return faceText
  }

  static getCardTextFormatter(){
    return (card) => {
      return new Promise((resolve) => {
        var Formatters = require("./formatters.js")
        var responseBody
        if(card.name){
          switch(card.layout){
            case 'split': //A split-faced card
            case 'flip':  //Cards that invert vertically with the flip keyword
            case 'double_faced_token':  // Tokens with another token printed on the back
            case 'transform':  // Double-sided cards that transform
              var faces = [];
              card.card_faces.forEach(face =>
                faces.push(this.formatFace(face)));
              responseBody = faces.join('\n//\n');
              break;
            case 'meld':  // Cards with meld parts printed on the back
            case 'leveler':  // Cards with Level Up
            case 'saga':  // Saga-type cards
            case 'planar':  // Plane and Phenomenon-type cards
            case 'scheme':  // Scheme-type cards
            case 'vanguard':  // Vanguard-type cards
            case 'token':  // Token cards
            case 'emblem':  // Emblem cards
            case 'augment':  // Cards with Augment
            case 'host':  // Cards with Host
            case 'normal':  // A standard Magic card with one face
            default:
              responseBody = Formatters.formatFace(card);
          }
        } else {
          responseBody = "Sorry, no card was found";
        }
        resolve({ body: responseBody });
      });
     }
  }


  static getLegalitiesFormatter(legalityFormats, hp7){
    return (card) => {
      return new Promise((resolve) => { //TODO if card.name?
        var textBody = card.name + " is legal in the following formats:\n";
        for(var format of legalityFormats){
          if(format == "7PH"){
            var points = hp7[card.name] || "unpointed"
            textBody += format + ": " + points;
          } else
          textBody += format + ": " + card.legalities[format] + '\n';
        }
        resolve({ body:  textBody});
      });
    }
  }

  static getNameFormatter(){
    return (card) => {
      return new Promise((resolve) => {
        resolve({ body: card.name });
      });
    }
  }

  static getPriceFormatter(converter){
    return (card) => {
      return new Promise((resolve) => {//TODO only paper printings
        var responseBody
        if(card.name){
          responseBody = card.name + " - "
          if (card.usd){
            //TODO price convert
            responseBody += "$" + card.usd + " USD"
            responseBody += " approx. $" + converter(card.usd).convert().toFixed(2) + " AUD"
          } else {
            responseBody += "N/A"
          }
        } else {
          responseBody = "Sorry, no card was found"
        }
        resolve({ body: responseBody});
      });
    }
  }

  static getImageFormatter(imageType){
    return (card) => {
      return new Promise((resolve) => {
        var imageFormatterPromise = this
        var responseAttachment = []
        var responseBodyArr = []
        if(imageType === 'art_crop'){
          responseBodyArr.push('🖌️' + card.artist)
        }
        var cardFaces;
        if(card.layout === 'transform' || card.layout === 'double_faced_token'){
          cardFaces = card.card_faces;
        } else {
          cardFaces = [card];
        }
        this.addArt(cardFaces, imageType, responseAttachment, responseBodyArr)
          .then((response)=> resolve(response))
      });
    }
  }

  static addArt(faces, imageType, art, body){ //This neeeds to be a promise
    return new Promise((resolve) => {
      var artPromise = this
      var face = faces.shift()
      if(face){
        if (face.image_uris && face.image_uris[imageType]){
          var url = face.image_uris[imageType];
          var filename = __dirname + '/images/' + url.replace(/\//g, '_').replace(/\?.*$/, "");
          if(!fs.existsSync(filename)) {
            request.get(url)
              .on('response', function(resp) { //listen to finish write, not finish download
                var writeStream = fs.createWriteStream(filename);
                resp.pipe(writeStream);
                resp.on( 'end', function(){
                  art.push(fs.createReadStream(filename))
                  artPromise.addArt(faces, imageType, art, body)
                    .then((resp) => resolve(resp));
                });
            })
          } else {
            art.push(fs.createReadStream(filename));
            artPromise.addArt(faces, imageType, art, body)
              .then((resp) => resolve(resp));
          }
        } else {
          body.push("Card image not found for: " + face.name);
          artPromise.addArt(faces, imageType, art, body)
            .then((resp) => resolve(resp));
        }
      } else {
        resolve({
          body: body.join('\n'),
          attachment: art
        });
      }
    });
  }

  static getHelpMessage(){
    return new Promise((resolve) => {
      var helpText = "Syntax information can be found at: ";
      var helpURL = "https://github.com/dantolini/myr"
      resolve ({
        body: helpText + helpURL,
        url: helpURL
      });
    });
  }

  static getMoreCardsMessage(){
    return new Promise((resolve) => {
      resolve ({ body: "..." });
    });
  }

  static getAttachStream(url){
    var getAttachStream = this

  }
}
