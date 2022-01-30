const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const extName = require('ext-name');
const urlUtil = require('url');

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

async function handleIncomingMMS(req, res){
    const { body } = req;
    const { NumMedia, From: SenderNumber, MessageSid } = body;
    const mediaUrl = body['MediaUrl0'];
    const contentType = body['MediaContentType0'];
    const extension = extName.mime(contentType)[0].ext;
    const mediaSid = path.basename(urlUtil.parse(mediaUrl).pathname);
    const filename = `${mediaSid}.${extension}`;
    const mediaItem = { mediaSid, MessageSid, mediaUrl, filename };

    const messageBody = NumMedia === 0 ?
    'Send us an image!' :
    `Identification received`;

    twiml.message(messageBody);

    res.writeHead(200, {'Content-Type': contentType});
    res.end(twiml.toString());
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
app.post('/sms', handleIncomingSMS);

http.createServer(app).listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});