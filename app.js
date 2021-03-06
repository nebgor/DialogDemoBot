var restify = require('restify');
var builder = require('botbuilder');
// var BotGraphDialog = require('bot-graph-dialog'); -- this was very bad...
var moment = require('moment');
let appInsights = require('applicationinsights');

var ticketCard = require('./cards/ticketCard.js');
var instructionCard = require('./cards/instructionCard.js');

//@todo make loop from recognizer directory (index.js). also make dialogs referenced from recogs.
var recogs = require('./recognizers');

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
server.get('/', (req, res) => {
    var fs = require('fs');
    fs.readFile('./DialogDemoBotIframe.html' , (err, body) => {
        if (!err) {
            res.writeHead(200, {
                'Content-Length': Buffer.byteLength(body),
                'Content-Type': 'text/html'
              });
              res.write(body);
              res.end(); 
        }
    });
});

server.on('uncaughtException', function (req, res, err, cb) {
    console.log(err);
    return cb();
});
server.on('InternalServerError', function (req, res, err, cb) {
    console.log(err);
    return cb();
});
server.on('restifyError', function(req, res, err, cb) {
    console.log(err);
    return cb();
});

appInsights.setup(process.env.BotDevAppInsightsKey)
.setAutoDependencyCorrelation(true)
.setAutoCollectRequests(true)
.setAutoCollectPerformance(true)
.setAutoCollectExceptions(true)
.setAutoCollectDependencies(true)
.setAutoCollectConsole(true,true)
.setUseDiskRetryCaching(true)
// .start();

appInsights.defaultClient.context.tags["ai.cloud.role"] = "DialogDemoBot" //name this app

// consider bot state storage setup here.
var bot = new builder.UniversalBot(connector);
var defaultRecog = recogs.filter( (r) => r.name == 'default')[0].recognizer;
bot.recognizer(defaultRecog);

var LUISrecogs = recogs
    .filter ((r) => 
        r.recognizer instanceof builder.LuisRecognizer
    );
//add LUIS recognizers
var intents = new builder.IntentDialog({ 
    recognizers: LUISrecogs
        .map( (r) => r.recognizer)
})
//@todo refactor handlers?
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


// map Luis intents to our dialogs
LUISrecogs.map( (r) => {
    r.intentDialogMap.forEach( (map) => {
        intents.matches(map.intent, '/' + r.name + '/' + map.dialog)
    })
})

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

// Add a help dialog with a trigger action that is bound to the 'Help' intent
bot.dialog('helpDialog', function (session) {
    session.endDialog("This bot will echo back anything you say.Say 'issue' to mock up a ticket. Say 'goodbye' to quit. Say 'help' to get this.");
}).triggerAction({ matches: 'Help' });

bot.dialog('google', function (session) {
    session.endDialog("Here is a link about that: " + 'http://google.com/' );
});

bot.dialog('/helpdesk/NotSureDialog', function (session) {
    session.endDialog("I am not sure what you mean but i am still learning. Would you like me to escalate a ticket to level 2 support for you?");
});

bot.dialog('/helpdesk/WifiDialog', function (session) {
        session.send("Here's how connect to Wi-Fi:");
    
        session.beginDialog('showCard');
    
        session.endDialog();
});

bot.dialog('/helpdesk/MalwareDialog', function (session) {
    session.endDialog("I have identified that you have a malware or virus issue. Would you like me to help you with this?");
});

bot.dialog('/ticket/greetings', [
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

bot.dialog('/ticket/ticketCloseDialog', [
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
bot.dialog('/ticket/ticketViewDialog', [
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
bot.dialog('/ticket/ticketListDialog', [
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
bot.dialog('/ticket/ticketDialog', [
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

]).triggerAction({ matches: 'Ticket' })

// Shortcut for developing cards
bot.dialog('showCard', [
    function (session, args) {

        var cardMessage = new builder.Message(session);

        var cardAttachment = instructionCard.create();

        cardMessage.addAttachment(cardAttachment);

        cardMessage.speak("Check out this guide to connect to Wi-Fi in a jiffy!");

        session.send(cardMessage);
        // session.say("session.say()", "Check out this guide to connect to Wi-Fi in a jiffy.", cardMessage);
        
        // session.say("Hi how are you", "Hi how are you", { inputHint: builder.InputHint.ignoringInput });

        session.endDialog();

    },
]).triggerAction({ matches: 'ShowCard' });

bot.dialog('seeYou', (session) => {
    session.endConversation(
        {
            text: 'Have a merry christmas and a happy new year!',
            speak: '<s>Have a <prosody contour="(0%,+20Hz) (10%,+30%) (40%,+10Hz)">merry christmas</prosody> and a <prosody range="x-low" rate="x-slow" volume="+3dB">happy new year!</prosody></s>'
        }
    )
}).triggerAction({ matches: 'SeeYou' });

// Add a global endConversation() action that is bound to the 'Goodbye' intent
bot.endConversationAction('goodbyeAction', 
    {
        text: 'Have a merry christmas and a happy new year!',
        speak: '<s>Have a <prosody contour="(0%,+20Hz) (10%,+30%) (40%,+10Hz)">merry christmas</prosody> and a <prosody range="x-low" rate="x-slow" volume="+3dB">happy new year!</prosody></s>'
    },
    {
        matches: 'Goodbye'
    }
);

// speechOptions.speechSynthesizer.speak('<s>Have a <prosody contour="(0%,+20Hz) (10%,+30%) (40%,+10Hz)">merry christmas</prosody> and a <prosody range="x-low" rate="x-slow" volume="+3dB">happy new year!</prosody></s>' , "en-IT");
// session.say('Have a merry christmas and a happy new year!',
//     '<s>Have a <prosody contour="(0%,+20Hz) (10%,+30%) (40%,+10Hz)">merry christmas</prosody> and a <prosody range="x-low" rate="x-slow" volume="+3dB">happy new year!</prosody></s>',
//     { inputHint : builder.InputHint.ignoringInput}
// );
// bot.beginDialog('greetings');

function showTicket (session, ticketData) {
    // Confirm
    session.send('Here is your ticket.');
    // session.send(JSON.stringify(ticketData));
    var cardMessage = new builder.Message(session)
                        .addAttachment(ticketCard.create(ticketData));
    session.send(cardMessage);    
}

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