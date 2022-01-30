const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const extName = require('ext-name');
const urlUtil = require('url');
const fs = require('fs');

const {TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_NUMBER} = process.env;
const MessagingResponse = require('twilio').twiml.MessagingResponse;
let images = [];
let twilioClient;

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
const PORT = process.env.PORT || 1337;
let frontendPath = path.join(__dirname, 'frontend');

app.use(express.static(frontendPath));

function getTwilioClient() {
    return twilioClient || new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

function deleteMediaItem(mediaItem) {
    const client = getTwilioClient();

    return client
        .api.accounts(TWILIO_ACCOUNT_SID)
        .messages(mediaItem.MessageSid)
        .media(mediaItem.mediaSid).remove();
}

async function handleIncomingMMS(req, res){
    const { body } = req;
    const { NumMedia, From: SenderNumber, MessageSid } = body;
    let saveOperation = [];
    const mediaUrl = body['MediaUrl0'];
    const contentType = body['MediaContentType0'];
    const extension = extName.mime(contentType)[0].ext;
    const mediaSid = path.basename(urlUtil.parse(mediaUrl).pathname);
    const filename = `${mediaSid}.${extension}`;
    const mediaItem = { mediaSid, MessageSid, mediaUrl, filename };
    saveOperation.push(saveMedia(mediaItem));
    
    // const mediaItems = [];
    // for (var i = 0; i < NumMedia; i++) {  // eslint-disable-line
    //   const mediaUrl = body[`MediaUrl${i}`];
    //   const contentType = body[`MediaContentType${i}`];
    //   const extension = extName.mime(contentType)[0].ext;
    //   const mediaSid = path.basename(urlUtil.parse(mediaUrl).pathname);
    //   const filename = `${mediaSid}.${extension}`;

    //   mediaItems.push({ mediaSid, MessageSid, mediaUrl, filename });
    //   saveOperations = mediaItems.map(mediaItem => saveMedia(mediaItem));
    // }
    // await Promise.all(saveOperations);

    const messageBody = NumMedia === 0 ?
    'Send us an image!' :
    `Identification received`;

    const response = new MessagingResponse();
    response.message({
      from: TWILIO_NUMBER,
      to: SenderNumber,
    }, messageBody);

    return res.send(response.toString()).status(200);
}
async function handleIncomingSMS(req, res) {
    const twiml = new MessagingResponse();
    let message = req.body.Body;
    let regex = new RegExp('[a-zA-Z0-9]');
    if (regex.test(message)) {
        twiml.message('Emojis only please 😎');
    } else {
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
    if (req.body.Body === '🍪') {
        twiml.message('That is a cookie!')
    }

    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
    
}
let getRecentImages = () => {return images;}
let clearRecentImages = () => {images = [];}
let fetchRecentImages = (req, res) => {
    res.status(200).send(getRecentImages());
    clearRecentImages();
}
app.post('/mms', handleIncomingMMS);
app.post('/sms', handleIncomingSMS);
app.get('/images', fetchRecentImages);

http.createServer(app).listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});


let foodRecipes = (food) => {
    if ((food == '🍎')|| (food == '🍏')) {
        return ['Old Fashioned Easy Apple Crisp','https://www.thechunkychef.com/old-fashioned-easy-apple-crisp/', 'French Apple Cake','https://www.onceuponachef.com/recipes/french-apple-cake.html']
    } else if (food == '🍍') {
        return ['Pineapple Crisp','https://www.allrecipes.com/recipe/19829/pineapple-crisp/', 'Pineapple Chicken','https://www.justataste.com/sticky-pineapple-chicken-recipe/']
    } else if (food == '🍇') {
        return ['5 Minute Grape Sorbet','https://www.liveeatlearn.com/5-minute-grape-sorbet/','Easy Grape Jam', 'https://www.fabfood4all.co.uk/easy-grape-jam/']
    } else if (food == '🍌') {
        return ['Banana Bread','https://www.simplyrecipes.com/recipes/banana_bread/','Frozen Banana Bites', 'https://www.allrecipes.com/recipe/232953/frozen-banana-bites/']
    } else if (food == '🍊') {
        return ['Asian Orange Chicken','https://www.allrecipes.com/recipe/61024/asian-orange-chicken/', 'Whole Orange Snack Cake', 'https://cooking.nytimes.com/recipes/1022002-whole-orange-snack-cake']
    } else return []
}