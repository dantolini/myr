# Myr
A Facebook Messenger chatbot that uses the ScryFall API

## Usage

## Chat API
When chatting with a myr bot, there are 3 main types of command they will recognise; single card search, ScryFall search and special command syntax


### Single Card Search Syntax
__((__[_format specifier_]__search__[|_SET_]__))__

|format specifier  |result   |  status |
|----|----|----|
|none or &| Text representation of the card| ✔️ |
|!| Full card image| ✔️ |
|@| Card art image (with artist)| ✔️ |
|$| Price (in USD and AUD)| ✔️ |
|#| Legality| ✔️ |

SET: 3(or more) character set code to select a particular printing of a card. ❌

### Scryfall Search Syntax
__((+search|__[_format specifier_][_options_]__))__

|format specifier  |result   |  status |
|----|----|----|
|none| Card name only| ✔️ |
|&| Text representation of the card| ❌ |
|!| Full card image| ❌ |
|@| Card art image (with artist)| ❌ |
|$| Price (in USD and AUD)| ❌ |
|#| Legality| ❌ |



|option|result|status|
|----|----|----|
|max|Sets the maximum number of returned cards| ❌ |
|unique|The unique parameter specifies if Scryfall should remove “duplicate” results in your query| ❌ |
|order|The order parameter determines how Scryfall should sort the returned cards| ❌ |
|dir|Then you can optionally specify a dir parameter to choose which direction the sorting should occur| ❌ |
More information on these options can be found [here](https://scryfall.com/docs/api/cards/search)

### Special Command Syntax
__((|__[_format specifier_]__))__

|format specifier  |result   |  status |
|----|----|----|
|none| Name of a random card| ✔️ |
|&| Text representation of a random card| ✔️ |
|!| Full card image of a random card| ✔️ |
|@| Card art image (with artist) of a random card| ✔️ |
|$| Price (in USD and AUD) of a random card| ✔️ |
|#| Legality of a random card| ✔️ |
|?| Sends a link to this page| ✔️ |

Certain exact messages may trigger other responses.
