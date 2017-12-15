const builder = require('botbuilder');

const luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';
const luisAppId = process.env.LuisAppId;
const luisAPIKey = process.env.LuisAPIKey;

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;
var recognizer = new builder.LuisRecognizer(LuisModelUrl);

var intentDialogMap = [
    { intent: 'Bot.Greeting', dialog: 'greetings'},
    { intent: 'Helpdesk.NewTicket', dialog: 'ticketDialog'},
    { intent: 'Helpdesk.CloseTicket', dialog:  'ticketCloseDialog'},
    { intent: 'Helpdesk.ViewTicket', dialog:  'ticketViewDialog'},
    { intent: 'Helpdesk.ListAllTickets', dialog:  'ticketListDialog'},
]


module.exports = {
    name : 'ticket',
    recognizer : recognizer,
    intentDialogMap : intentDialogMap
}