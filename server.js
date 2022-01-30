const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const extName = require('ext-name');
const urlUtil = require('url');
const axios = require('axios');

const {TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_NUMBER} = process.env;
const MessagingResponse = require('twilio').twiml.MessagingResponse;
const twiml = new MessagingResponse();
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

const supportedContent = ['image/jpeg','image/jpg','image/gif','image/png'];
async function handleIncomingMMS(req, res){
    if (req.Body != null) {
        twiml.message('Send us an image!');
        return;
    }
    const { body } = req;
    const mediaUrl = body['MediaUrl0'];
    const contentType = body['MediaContentType0'];
    let messageBody;
    if (supportedContent.includes(contentType)) {
        console.log(contentType);
        messageBody = `Identification received`;
    }
    axios.get(`https://api.ocr.space/parse/imageurl?apikey=${process.env.OCR_API_KEY}&url=${mediaUrl}`)
    .then(response => {
        console.log(response.data);
        twiml.message(response.data)
    })
    .catch(error => {
        console.log(error);
    });
    res.send(response.toString()).status(200);
}
async function handleIncomingSMS(req, res) {
    let message = req.body.Body;
    let regex = new RegExp('[a-zA-Z0-9]');
    if (!regex.test(message)) {
        twiml.message(req.body['MediaUrl0']);
    } else {
        twiml.message("Please send an image.")
    }
    
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
}

app.post('/mms', handleIncomingMMS);
app.post('/sms', handleIncomingMMS);

http.createServer(app).listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});