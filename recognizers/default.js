const builder = require('botbuilder');

var recognizer = {
    recognize: function (context, done) {
    var intent = { score: 0.0 };
  
          if (context.message.text) {
              switch (context.message.text.toLowerCase()) {
                  case 'howdoi':
                      intent = { score: 1.0, intent: 'google' };
                      break;
                  case 'issue':
                      intent = { score: 1.0, intent: 'Ticket' };
                      break;
                  case 'see you':
                  case 'see you later':
                        intent = { score: 1.0, intent: 'SeeYou' };
                        break;                
                  case 'help':
                      intent = { score: 1.0, intent: 'Help' };
                      break;
                  case 'goodbye':
                      intent = { score: 1.0, intent: 'Goodbye' };
                      break;
                  case 'showcard':
                      intent = { score: 1.0, intent: 'ShowCard' };
                      break;
              }
          }
          done(null, intent);
      }
  };

module.exports = {
    name : 'default',
    recognizer : recognizer,
    intentDialogMap : [] //@todo ...triggerActions instead
}