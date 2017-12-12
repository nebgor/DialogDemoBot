var restify = require('restify');
var builder = require('botbuilder');
var BotGraphDialog = require('bot-graph-dialog');
var moment = require('moment');
var ticketCard = require('./cards/ticketCard.js');
let appInsights = require('applicationinsights');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata     
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

appInsights.setup(process.env.BotDevAppInsightsKey)
.setAutoDependencyCorrelation(true)
.setAutoCollectRequests(true)
.setAutoCollectPerformance(true)
.setAutoCollectExceptions(true)
.setAutoCollectDependencies(true)
.setAutoCollectConsole(true,true)
.setUseDiskRetryCaching(true)
.start();

appInsights.defaultClient.context.tags["ai.cloud.role"] = "DialogDemoBot" //name this app


// consider bot state storage setup here.
var bot = new builder.UniversalBot(connector);

// Make sure you add code to validate these fields
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;
const LuisModelUrlWorkFlows = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + process.env.LuisAppIdWF + '&subscription-key=' + process.env.LuisAPIKeyWF;


// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var recognizers = [recognizer];
// var recognizers = [];

var recognizerWF = new builder.LuisRecognizer(LuisModelUrlWorkFlows)
.onFilter(function(context, result, callback) {
    if (result.score <= 0.7) {
        // not confident, log it but don't use the intents.
        appInsights.defaultClient.trackEvent({
            name: "Unrecognized utterance",
            properties :
                {
                    message: "no scores above 70%",
                    context: context,
                    result: result
                }
        });
        
        callback(null, { score: 0.7, intent: 'Root.NotSure' });
    } else
    // Otherwise we pass through the result from LUIS 
        callback(null, result);
    }
);
// https://github.com/Microsoft/BotBuilder/blob/master/Node/examples/feature-onFilter/app.js
recognizers.push(recognizerWF)

var intents = new builder.IntentDialog({ recognizers: recognizers })
.matches('Bot.Greeting', 'greetings' )
.matches('Helpdesk.NewTicket', 'ticketDialog' ) //See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
.matches('Helpdesk.CloseTicket', 'ticketCloseDialog')
.matches('Helpdesk.ViewTicket', 'ticketViewDialog')
.matches('Helpdesk.ListAllTickets', 'ticketListDialog')

.matches('Root.Malware', 'MalwareDialog')
.matches('Root.Wifi.How.To', 'WifiDialog')
.matches('Root.NotSure', 'NotSureDialog')

.onDefault((session, args) => {
    
    // Check for card submit actions
    if (session.message && session.message.value) {
        processSubmitAction(session, session.message.value);
        return;
    }
    else {
        console.log(args)
        console.log(args.intent)
        session.send("Top Intent ->" + args.intent)
        session.send("Intent Score ->" + args.score)
        if (process.env.DEBUG_LUIS) args.entities.forEach(entity => {
            session.send("View -> Entity:" + entity.entity + ", Type: " + entity.type);
        });    
    }

    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);

bot.on('conversationUpdate', function (message) {
    console.log(message)
    //https://github.com/Microsoft/BotFramework-Emulator/issues/99
    // https://github.com/Microsoft/BotBuilder/issues/159
    if (message.membersAdded && message.membersAdded.length > 0) {
        // Say hello
        // var isGroup = message.address.conversation.isGroup;
        // var txt = isGroup ? "Hello everyone!" : "Hello, i'm DialogBot.";
        message.membersAdded.forEach( (identity) => {
            var txt = "Hello, i'm DialogDemobot.";
            if (identity.id === message.address.bot.id) {
                var reply = new builder.Message()
                        .address(message.address)
                        .text(txt);
                bot.send(reply);
                bot.send(reply.text('How can i help you?'))
            }
        });
    } else if (message.membersRemoved) {
        // See if bot was removed
        var botId = message.address.bot.id;
        for (var i = 0; i < message.membersRemoved.length; i++) {
            if (message.membersRemoved[i].id === botId) {
                // Say goodbye
                var reply = new builder.Message()
                        .address(message.address)
                        .text("Goodbye");
                bot.send(reply);
                break;
            }
        }
    }
});

// @todo unused
bot.dialog('welcome', [
    // Step 1
    function (session, args, next) {
        if (!session.userData.firstRun) {
            session.userData.firstRun = true;
            session.send(session, 'Hi! I am DialogDemoBot, at your service!');
            session.endDialog(session, 'How can i help you?');
        }
    }
]).triggerAction( {
//     onFindAction: (context, callback) => {
//         if (!context.userData.firstRun) {
//             callback(null, 1.1);
//         } else {
//             callback(null, 0.0);
//         }
//     }
});

//Speech https://github.com/Microsoft/BotBuilder-Samples/tree/master/Node/intelligence-SpeechToText
function processSubmitAction(session, value) {
    var defaultErrorMessage = 'I am an error message';
    switch (value.type) {
        case 'editEventDate':
            var dateTimeObj = moment(value.date + " " + value.time + "Z");

            let foundTickets = session.userData.tickets.filter((ticket, index) => ticket.id == value.ticketId )
            if (foundTickets.length > 0) {
                let ticket = foundTickets[0];
                ticket.eventTime = dateTimeObj.format();
                showTicket(session, ticket);
            }
            break;

        default:
            // A form data was received, invalid or incomplete since the previous validation did not pass
            session.send(defaultErrorMessage);
    }
}

// Install a custom recognizer to look for user saying 'help' or 'goodbye'.
bot.recognizer({
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
                case 'help':
                    intent = { score: 1.0, intent: 'Help' };
                    break;
                case 'goodbye':
                    intent = { score: 1.0, intent: 'Goodbye' };
                    break;
            }
        }
        done(null, intent);
    }
});

// Add a help dialog with a trigger action that is bound to the 'Help' intent
bot.dialog('helpDialog', function (session) {
    session.endDialog("This bot will echo back anything you say.Say 'issue' to mock up a ticket. Say 'goodbye' to quit. Say 'help' to get this.");
}).triggerAction({ matches: 'Help' });

bot.dialog('google', function (session) {
    session.endDialog("Here is a link about that: " + 'http://google.com/' );
});

bot.dialog('NotSureDialog', function (session) {
    session.endDialog("I'm not very (>70%) sure what to do. The 'notsure' dialog here is to be cont'd ...");
});

bot.dialog('WifiDialog', function (session) {
    session.endDialog("The 'wifi' dialog here is to be cont'd ..." );
});

bot.dialog('MalwareDialog', function (session) {
    session.endDialog("The 'malware' dialog here is to be cont'd ..." );
});

bot.dialog('greetings', [
    // Step 1
    function (session, args, next) {
        if (!session.userData.userID) {
            builder.Prompts.text(session, 'Hi! What is your Employee ID number?');
        } else {
            next()         
        }
    },
    // Step 2
    function (session, results) {
        if (!session.userData.userID) { 
            session.userData.userID = results.response;
        }
        session.endDialog(`Hello ${session.userData.userID}!`);
    }
]);

bot.dialog('ticketCloseDialog', [
    function (session, args) {
        console.log(args)
        var intent = args.intent;

        if (process.env.DEBUG_LUIS) args.entities.forEach(entity => {
            session.send("Close -> Entity:" + entity.entity + ", Type: " + entity.type);
        });

        let ticketNumber = args.entities.filter( (entity) => entity.type == "IssueTicketNumber")[0].entity
        // let ticketNumber = builder.EntityRecognizer.findEntity(intent.entities, 'IssueTicketNumber');

        let ticketSessionIndex = null        
        let foundTickets = session.userData.tickets.filter( (ticket, index) => {
                                                ticketSessionIndex = index  
                                                return ticket.id == ticketNumber 
                                            })

        if (foundTickets) {
            session.userData.tickets = session.userData.tickets.splice(ticketSessionIndex, 1)
            showTicket(session,foundTickets[0])
            session.send("Ok, ticket is closed and archived in an Egyptian tomb.");
        } else {
            session.send("sorry, no such ticket.");
        }
        session.endDialog();
    },
]);
bot.dialog('ticketViewDialog', [
    function (session, args) {
        console.log(args)
        var intent = args.intent;
        
        if (process.env.DEBUG_LUIS) args.entities.forEach(entity => {
            session.send("View -> Entity:" + entity.entity + ", Type: " + entity.type);
        });

        let ticketNumber = args.entities.filter( (entity) => entity.type == "IssueTicketNumber")[0].entity
        // let ticketNumber = builder.EntityRecognizer.findEntity(intent.entities, 'IssueTicketNumber');

        let foundTickets = session.userData.tickets.filter( (ticket, index) => ticket.id == ticketNumber )
        if (foundTickets) {
            // session.userData.tickets = session.userData.tickets.splice(ticketSessionIndex, 1)
            showTicket(session,foundTickets[0])
        } else {
            session.send("sorry, no such ticket.");
        }
        session.endDialog();
    },
]);
bot.dialog('ticketListDialog', [
    function (session, args) {
        console.log(args)
        var intent = args.intent;
        
        session.send("Listing all tickets");

        session.userData.tickets.forEach( (ticket) => {
            showTicket(session,ticket) //@todo change to better summary card?

        })
        session.endDialog();
    },
]);
// Add a help dialog with a trigger action that is bound to the 'Help' intent
bot.dialog('ticketDialog', [
    function (session) {
        session.send("Let start creating a ticket for you.");
        builder.Prompts.time(session, "When did the problem happen?");
    },
    function (session, results) {
        session.dialogData.eventTime = builder.EntityRecognizer.resolveTime([results.response]);
        builder.Prompts.time(session, "When is a convenient time to contact you?");
    },    
    function (session, results) {
        session.dialogData.contactTime = builder.EntityRecognizer.resolveTime([results.response]);
        builder.Prompts.text(session, "What is your contact phone number to call you on?");
    },
    function (session, results) {
        session.dialogData.contactNumber = results.response;
        builder.Prompts.text(session, "What is the problem?");
    },    
    function (session, results) {
        session.dialogData.description = results.response;        
        var ticketData = {
            id :  Math.floor((Math.random() * 100) + 1),
            eventTime: session.dialogData.eventTime,
            contactTime: session.dialogData.contactTime,
            contactNumber: session.dialogData.contactNumber,
            description: session.dialogData.description,
            userID: session.userData.userID,
            created: moment().format()
        }

        // Process request and display details
        session.sendTyping();

        //@Todo immediately send .then() show response (simulated with a timeout for now)
        // https://developers.freshdesk.com/api/#tickets

        setTimeout(function () {
            if (!session.userData.tickets) session.userData.tickets = [];
            session.userData.tickets.push(ticketData)
            showTicket(session,ticketData)
            session.endDialog();
        }, 3000);
    }

]).triggerAction({ matches: 'Ticket' });

// Add a global endConversation() action that is bound to the 'Goodbye' intent
bot.endConversationAction('goodbyeAction', "Ok... See you later.", { matches: 'Goodbye' });
// bot.beginDialog('greetings');

function showTicket (session, ticketData) {
    // Confirm
    session.send('Here is your ticket.');
    // session.send(JSON.stringify(ticketData));
    var cardMessage = new builder.Message(session)
                        .addAttachment(ticketCard.create(ticketData));
    session.send(cardMessage);    
}