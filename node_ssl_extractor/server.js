const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const tls = require('tls');
const url = require('url');
const mongoose = require("mongoose");
const Certificate = require("./certificates");

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection URI
mongoose.set("strictQuery", true);
mongoose
  .connect('mongodb://127.0.0.1:27017/url')
  .then(() => {
    console.log("DB connected");
  })
  .catch((err) => {
    console.log(err);
  });

async function getCertificate(siteUrl) {
  const options = {
    host: url.parse(siteUrl).hostname,
    port: 443,
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = tls.connect(options, () => {
      const certificate = req.getPeerCertificate();
      if (!certificate || certificate === null) {
        reject('The website did not provide a certificate');
      } else {
        resolve(certificate);
      }
      req.end();
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
}

app.get('/fetch-certificate', async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug statement
    console.log(req.body); // Log the request body
    const siteUrl = req.body.url;
    
    if (!siteUrl) {
      return res.status(400).json({ message: 'URL is required' });
    }

    const certificate = await getCertificate(siteUrl);

    // Insert certificate into MongoDB
    const result = await Certificate.create({
      url: siteUrl,
      subject: certificate.subject,
      issuer: certificate.issuer,
      valid_from: certificate.valid_from,
      valid_to: certificate.valid_to,
      fingerprint: certificate.fingerprint
    });

    res.status(200).json({ message: 'Certificate inserted', id: result._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
