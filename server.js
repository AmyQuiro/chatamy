const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");

// enviar correo //////////////////////////////////////////////////////
var nodemailer = require("nodemailer");

// require('dotenv').config()
const { WebhookClient } = require("dialogflow-fulfillment");
// const port = process.env.PORT || 3000;

// for parsing json
// app.use(
//   bodyParser.json({
//     limit: "20mb",
//   })
// );
app.use(express.json());
// parse application/x-www-form-urlencoded
app.use(
  bodyParser.urlencoded({
    extended: false,
    limit: "20mb",
  })
);
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

const mongoAtlasUri =
  "mongodb+srv://amyqq:dialogflow2409@dialogflowclustera.a1m5vrz.mongodb.net/chatbotDB?retryWrites=true&w=majority";

try {
  mongoose.connect(
    mongoAtlasUri,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (err, res) => {
      if (err) {
        return console.log("Error al conectar a la base datos");
      }

      console.log(" Mongoose is connected");
    }
  );
} catch (e) {
  console.log("could not connect");
}

app.use("/messenger", require("./Facebook/facebookBot"));

app.use("/api", require("./routes/api"));

app.post("/webhook_dialog", (req, res) => {
  // get agent from request
  console.info("inicio");
  let agent = new WebhookClient({ request: req, response: res });
  // create intentMap for handle intent
  let intentMap = new Map();
  // add intent map 2nd parameter pass function
  console.log("req :>> ", req);
  console.log("res :>> ", res);
  console.info("entro");
  intentMap.set("webhook-demo", handleWebHookIntent);
  // now agent is handle request and pass intent map
  agent.handleRequest(intentMap);
});
function handleWebHookIntent(agent) {
  agent.add("Hello I am Webhook demo How are you...");
}

app.get("/", (req, res) => {
  const port = server.address().port;
  return res.send("Chatbot Funcionando 🤖🤖🤖" + port);
});

app.get("/prueba", (req, res) => {
  return res.send("prueba");
});

app.post("/enviarcorreo", (req, res) => {
  var transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    secureConnection: false,
    port: 587,
    tls: {
      ciphers: "SSLv3",
    },
    auth: {
      user: "quirogaamy@outlook.es",
      pass: "Outlook0924",
    },
  });

  var mailOptions = {
    from: '"Mensaje de Amy Company  " <quirogaamy@outlook.es>',
    to: req.body.correo,
    subject: "Mensaje",
    html: req.body.mensaje,
  };
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      return console.log(error);
    }
    res.send({ mensaje: "Message sent: " + info.response });
  });
});

const server = app.listen(process.env.PORT || 5000, () => {
  const port = server.address().port;
  console.log(`Express is working on port ${port}`);
});
