
var restify = require('restify');
var builder = require('botbuilder');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata     
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());
// consider bot state storage setup here.
var bot = new builder.UniversalBot(connector);

// Make sure you add code to validate these fields
var luisAppId = process.env.LuisAppId;
var luisAPIKey = process.env.LuisAPIKey;
var luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

// Main dialog with LUIS
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })

.matches('NewIssueTicket', 'ticketDialog' ) //See details at http://docs.botframework.com/builder/node/guides/understanding-natural-language/
.matches('CloseTicket', 'ticketCloseDialog')
.matches('ViewIssuedTicket', 'ticketViewDialog')
.onDefault((session, args) => {
    console.log(args)
    session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);

// Install a custom recognizer to look for user saying 'help' or 'goodbye'.
bot.recognizer({
  recognize: function (context, done) {
  var intent = { score: 0.0 };

        if (context.message.text) {
            switch (context.message.text.toLowerCase()) {
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

bot.dialog('greetings', [
    // Step 1
    function (session) {
        builder.Prompts.text(session, 'Hi! What is your Employee ID number?');
    },
    // Step 2
    function (session, results) {
        session.endDialog(`Hello ${results.response}!`);
    }
]);

bot.dialog('ticketCloseDialog', [
    function (session, args) {
        console.log(args)
        args.entities.forEach(entity => {
            session.send("Close -> Entity:" + entity.entity + ", Type: " + entity.type);
        });
        let ticketNumber = args.entities.entities.filter( (entity) => entity.type == "IssueTicketNumber")[0].entity

        let ticketSessionIndex = null        
        let foundTickets = session.userData.tickets.filter( (ticket, index) => {
                                                ticketSessionIndex = index  
                                                return ticket.id == ticketNumber 
                                            })

        if (foundTickets) {
            session.userData.tickets = session.userData.tickets.splice(ticketSessionIndex, 1)
            showTicket(session,foundTickets[0])
            session.send("Ok, ticket is closed");
        }
        session.endDialog();
    },
]);
bot.dialog('ticketViewDialog', [
    function (session, args) {
        console.log(args)
        args.entities.forEach(entity => {
            session.send("View -> Entity:" + entity.entity + ", Type: " + entity.type);
        });
        let ticketNumber = args.entities.filter( (entity) => entity.type == "IssueTicketNumber")[0].entity
        let foundTickets = session.userData.tickets.filter( (ticket, index) => ticket.id == ticketNumber )
        showTicket(session,foundTickets[0])
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

function showTicket (session, ticketData) {
    // Confirm
    session.send('Here is your ticket.');
    // session.send(JSON.stringify(ticketData));
    var ticketCard = new builder.Message(session)
                        .addAttachment({
                            contentType: "application/vnd.microsoft.card.adaptive",
                            content: {
                                type: "AdaptiveCard",
                                speak: "<s>Your ticket about the issue \"Global warming\" <break strength='weak'/> has been created</s><s>The helpdesk will look into it and contact you.</s>",
                                    body: [
                                        {
                                            "type": "TextBlock",
                                            "text": "Ticket " + ticketData.id,
                                            "size": "large",
                                            "weight": "bolder"
                                        },
                                        {
                                            "type": "TextBlock",
                                            "text": "Issue occurred"
                                        },
                                        {
                                            "type": "TextBlock",
                                            "text": ticketData.eventTime.toString()
                                        },
                                        {
                                            "type": "TextBlock",
                                            "text": "We'll call you around"
                                        },
                                        {
                                            "type": "TextBlock",
                                            "text": ticketData.contactTime.toString()
                                        },                                                
                                    ],
                                    "actions": [
                                        {
                                            "type": "Action.Http",
                                            "method": "POST",
                                            "url": "http://foo.com",
                                            "title": "View"
                                        }
                                    ]
                            }
                        });
    session.send(ticketCard);    
}