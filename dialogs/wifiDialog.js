const builder = require('botbuilder');

const formflowbotbuilder = require('formflowbotbuilder');

module.exports = {
    "formflow" :  [
        {
            "id": "firstname",
            "prompt": "please enter a name",
            "response": "Your name is %s",
            "errorPrompt": "please enter a string of > 0 characters",
            "type": "text"
        },
        {
            "id": "language",
            "prompt": "please select a language",
            "response": "Your favorite programming language is %s",
            "errorPrompt": "please select one of the choices",
            "type": "choice",
            "choices": "JavaScript|TypeScript|CoffeeScript"
        },
        {
            "id": "email",
            "prompt": "please enter an email",
            "response": "Your email is %s",
            "errorPrompt": "please enter a valid email",
            "type": "email"
        },
        {
            "id": "url",
            "prompt": "please enter a website (starting with http:// or https://)",
            "response": "Your url is %s",
            "errorPrompt": "please enter a valid website",
            "type": "url"
        }
    ]
}