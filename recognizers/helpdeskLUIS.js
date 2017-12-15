const builder = require('botbuilder');
let appInsights = require('applicationinsights');

const luisAPIHostName = process.env.LuisAPIHostName || 'westus.api.cognitive.microsoft.com';
const luisAppId = process.env.LuisAppIdWF;
const luisAPIKey = process.env.LuisAPIKeyWF;

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v1/application?id=' + luisAppId + '&subscription-key=' + luisAPIKey;

var recognizer = new builder.LuisRecognizer(LuisModelUrl)

// .onFilter(function(context, result, callback) {
//     if (result.score <= 0.7) {
//         // not confident, log it but don't use the intents.
//         appInsights.defaultClient.trackEvent({
//             name: "Unrecognized utterance",
//             properties :
//                 {
//                     message: "no scores above 70%",
//                     context: JSON.stringify(context),
//                     result: JSON.stringify(result)
//                 }
//         });
//         //  appInsights.defaultClient.trackMetric({name: "Unrecognized utterance metric", value: 1});
//         callback(null, { score: 0.7, intent: 'Root.NotSure' });
//     } else
//     // Otherwise we pass through the result from LUIS 
//         callback(null, result);
//     }
// );

var intentDialogMap = [
    { intent: 'Root.Malware', dialog: 'MalwareDialog'},
    { intent: 'Root.Wifi.How.To', dialog:  'WifiDialog'},
    { intent: 'Root.NotSure', dialog:  'NotSureDialog'},
]
// .matches('Root.Malware', 'MalwareDialog')
// .matches('Root.Wifi.How.To', 'WifiDialog')
// .matches('Root.NotSure', 'NotSureDialog')


module.exports = {
    name : 'helpdesk',
    recognizer : recognizer,
    intentDialogMap : intentDialogMap    
}