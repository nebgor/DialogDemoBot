var moment = require('moment');

var exports = module.exports = {};

exports.create = function(ticketData) {
    return {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
            type: "AdaptiveCard",
            speak: "The helpdesk will look into it and contact you.",
                body: [
                    {
                        "type": "ColumnSet",
                        "columns": [
                            {
                                "type": "Column",
                                "width": "stretch",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "text": "Ticket " + ticketData.id,
                                        "size": "large",
                                        "weight": "bolder"
                                    }
                                ]
                            },
                            {
                                "type": "Column",
                                "width": "auto",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "text": "Active",
                                        "size": "small",
                                        "weight": "lighter",
                                        "color": "accent",
                                        "horizontalAlignment": "right"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "ColumnSet",
                        "columns": [
                            {
                                "type": "Column",
                                "width": "auto",
                                "spacing": "none",
                                "items": [
                                    {
                                        "type": "Image",
                                        "url": "https://pbs.twimg.com/profile_images/3647943215/d7f12830b3c17a5a9e4afcc370e3a37e_400x400.jpeg",
                                        "size": "small",
                                        "style": "person",
                                        "horizontalAlignment": "left",
                                        "spacing": "none"
                                    }
                                ]
                            },
                            {
                                "type": "Column",
                                "width": "stretch",
                                "spacing": "none",
                                "items": [
                                    {
                                        "type": "TextBlock",
                                        "text": "Employee: " + ticketData.userID,
                                        "weight": "bolder",
                                        "wrap": false,
                                        "spacing": "none"
                                    },
                                    {
                                        "type": "TextBlock",
                                        "spacing": "none",
                                        "text": "Created " + moment(ticketData.created).format('h:mm A d/MM/YYYY'),
                                        "isSubtle": true,
                                        "wrap": false
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "TextBlock",
                        "text": "\"" + ticketData.description + "\"",
                        "size": "large",
                        "weight": "light",
                        "wrap": true,
                        "separator": true,
                        "spacing": "none"
                    }, 
                    {
                        "type": "Container",
                        "items": [
                            {
                                "type": "FactSet",
                                "facts": [
                                    {
                                        "title": "Event Occurred:",
                                        "value": moment(ticketData.eventTime).format('h:mm A d/MM/YYYY')
                                    },
                                    {
                                        "title": "Best Time To Call:",
                                        "value": moment(ticketData.contactTime).format('h:mm A d/MM/YYYY')
                                    },
                                    {
                                        "title": "Phone Number:",
                                        "value": ticketData.contactNumber
                                    },
                                    {
                                        "title": "Assigned to:",
                                        "value": "Matt Hidinger"
                                    }
                                ]
                            }
                        ]
                    }                                             
                ],
                "actions": [
                    {
                        "type": "Action.ShowCard",
                        "title": "Change event date",
                        "card": {
                            "type": "AdaptiveCard",
                            "body": [
                                {
                                    "type": "Input.Date",
                                    "id": "date",
                                    "title": "Select new date",
                                    "value": moment(ticketData.eventTime).format('YYYY-MM-DD')
                                },
                                {
                                    "type": "Input.Time",
                                    "id": "time",
                                    "title": "Select new time",
                                    "value": moment(ticketData.eventTime).format('HH:mm')
                                }
                            ],
                            "actions": [
                                {
                                    "type": "Action.Submit",
                                    "title": "Save",
                                    "data": { 
                                        "type": "editEventDate", 
                                        "ticketId": ticketData.id
                                    }
                                }
                            ]
                        }
                    }
                ]
        }
    };
};