const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const MessagingResponse = require('twilio').twiml.MessagingResponse;
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
const PORT = process.env.PORT || 1337;
let frontendPath = path.join(__dirname, 'frontend');

app.use(express.static(frontendPath));
app.post('/sms', (req, res) => {
    const twiml = new MessagingResponse();
    let message = req.body.Body;
    let regex = new RegExp('[a-zA-Z0-9]');
    if (regex.test(message)) {
        twiml.message('Emojis only please 😎');
    } else {
        axios.get(`https://api.ocr.space/parse/imageurl?apikey=${process.env.OCR_API_KEY}&url=${mediaUrl}`)
        .then(response => {
            console.log(response.data);
            twiml.message(response.data)
        })
        .catch(error => {
            console.log(error);
        });
        res.send(response.toString()).status(200);
        let randomNum = Math.round(Math.random());
        let recipeName;
        let recipeUrl;

        if (randomNum == 1) {
            recipeName = foodRecipes(message)[2];
            recipeUrl = foodRecipes(message)[3];
        } else {
            recipeName = foodRecipes(message)[0];
            recipeUrl = foodRecipes(message)[1];
        }

        if ((recipeName == undefined) || (recipeName == '')) {
            twiml.message('Hi 😃! Thanks for using the demo version of EmojiRecipes! Contact Brenton to learn more about our full version!')
        } else {
            let convertedEmojis = [];
            [...message].forEach(char => convertedEmojis.push(emojiDesc[char]))
            twiml.message(`Grabbing your ${convertedEmojis.join(' ')} recipe!`);
            twiml.message(recipeName)
            twiml.message(recipeUrl)
        }
        
    }



  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

http.createServer(app).listen(PORT, () => {
  console.log('Express server listening on port 1337');
});


