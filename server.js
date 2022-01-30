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
// app.post('/mms', (req, res) => {
//     const twiml = new MessagingResponse();
//     let message = req.body.Body;
//     axios.get(`https://api.ocr.space/parse/imageurl?apikey=${process.env.OCR_API_KEY}&url=${mediaUrl}`)
//     .then(response => {
//         console.log(response.data);
//         twiml.message(response.data)
//     })
//     .catch(error => {
//         console.log(error);
//     });
//     res.send(response.toString()).status(200);


//   res.writeHead(200, {'Content-Type': 'text/xml'});
//   res.end(twiml.toString());
// });
app.post('/sms', (req, res) => {
    const twiml = new MessagingResponse();
    let message = req.body.Body;
    let regex = new RegExp('[a-zA-Z0-9]');
    if (!regex.test(message)) {
        twiml.message('Please send your first and last name');
    } else {
        let name = message;
        twiml.message('Name successfully verified');
    }
    res.writeHead(200, {'Content-Type': 'text/xml'});
    res.end(twiml.toString());
});

http.createServer(app).listen(PORT, () => {
  console.log('Express server listening on port 1337');
});