var exports = module.exports = {};

exports.create = function(instructions) {
    
    return {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.0",
            "speak": "Your  meeting about \"Adaptive Card design session\" is starting at 12:30pmDo you want to snooze  or do you want to send a late notification to the attendees?",
            "body": [
            {
                "type": "TextBlock",
                "text": "Adaptive Card design session",
                "size": "large",
                "weight": "bolder"
            },
            {
                "type": "TextBlock",
                "text": "Conf Room 112/3377 (10)",
                "isSubtle":true
            },
            {
                "type": "TextBlock",
                "text": "12:30 PM - 1:30 PM",
                "isSubtle":true,
                "spacing":"none"
            },
            {
                "type": "TextBlock",
                "text": "Snooze for"
            },
            {
                "type": "Input.ChoiceSet",
                "id": "snooze",
                "style":"compact",
                "value": "5",
                "choices": [
                {
                    "title": "5 minutes",
                    "value": "5",
                    "isSelected": true
                },
                {
                    "title": "15 minutes",
                    "value": "15"
                },
                {
                    "title": "30 minutes",
                    "value": "30"
                }
                ]
            }
            ],
            "actions": [
            {
                "type": "Action.Submit",
                "title": "Snooze",
                "data": { "x": "snooze" }
            },
            {
                "type": "Action.Submit",
                "title": "I'll be late",
                "data": { "x": "late" }
            }
            ]
        }
    };
};