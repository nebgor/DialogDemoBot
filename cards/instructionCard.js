var exports = module.exports = {};

// Step Obj:
// {
//     int stepNumber
//     string description
// }

exports.create = function(stepsArray) {

    let stepCards = new Array();

    stepCards.push({
        "contentType": "application/vnd.microsoft.card.hero",
        "content": {
            "title": "Step 1",
            "text": "Select the network you want to connect to.",
            "images": [
                {
                  "url": "https://www.techbout.com/wp-content/uploads/2016/05/connect-to-wifi-network-windows.png"
                }
            ],
            "buttons": [
                {
                    "type": "openUrl",
                    "value": "http://lmgtfy.com/?q=connect+to+wifi",
                    "title": "Help"
                }
            ]
        }
    });

    stepCards.push({
        "contentType": "application/vnd.microsoft.card.hero",
        "content": {
            "title": "Step 2",
            "text": "Enter your password",
            "images": [
                {
                  "url": "http://assets.virginmedia.com/help/assets/images/win10_wifi_password.jpg"
                }
              ],
              "buttons": [
                  {
                      "type": "openUrl",
                      "value": "http://lmgtfy.com/?q=connect+to+wifi",
                      "title": "Help"
                  }
              ]
        }
    });
    
    stepCards.push({
        "contentType": "application/vnd.microsoft.card.hero",
        "content": {
            "title": "Step 3",
            "text": "You should now be connected.",
            "images": [
                {
                    "url": "https://quickfever.com/wp-content/uploads/2017/02/windows_10_wifi_connected.jpg"
                }
            ],
            "buttons": [
                {
                    "type": "openUrl",
                    "value": "http://lmgtfy.com/?q=connect+to+wifi",
                    "title": "Help"
                }
            ]
        }
    });

    return stepCards;
    
};