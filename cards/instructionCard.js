var exports = module.exports = {};

exports.create = function(instructions) {
    
    return {
        "contentType": "application/vnd.microsoft.card.video",
        "content": {
            "title": "How to connect to Wi-Fi",
            "speak": "My roflcopter goes soi soi soi soi soi soi.",
            "subtitle": "by Dialog IT",
            "text": "Quia officiis repudiandae accusantium quam ad enim amet. Ipsum laudantium tempora similique voluptatibus possimus voluptatem sint. Consequatur rerum occaecati error animi magnam facere optio optio. Et et voluptatem soluta error.",
            "image": {
                "url": "https://i.ytimg.com/vi/3cl4Kehhmu8/maxresdefault.jpg"
            },
            "media": [
                {
                    "url": "https://youtu.be/ScGFA7Ix6QY"
                }
            ],
            "buttons": [
                {
                    "type": "openUrl",
                    "value": "https://peach.blender.org/",
                    "title": "Learn More"
                }
            ]
        }
    };
};