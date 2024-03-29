//libraries
const express = require("express");
const router = express.Router();
const request = require("request");
const uuid = require("uuid");
const axios = require("axios");
//files
const config = require("../config");
const dialogflow = require("../dialogflow");
const { structProtoToJson } = require("./helpers/structFunctions");
/// mongo db models
const client = require("../Models/client");
const Product = require("../Models/Products");
const Carrito = require("../Models/Carrito");
const CarritoDetalle = require("../Models/CarritosDetalle");
const Compra = require("../Models/Compra");
const CompraDetalle = require("../Models/CompraDetalle");

// logicas
const logicaCarrito = require("./logica/carritoLogica");
const metodosGenerales = require("./logica/metodosGeneralesLogica");
const productoLogica = require("./logica/productoLogica");

// actions;
const facebookAction = require("./actions/facebookAction");
const carritoLogica = require("./logica/carritoLogica");
const clienteLogica = require("./logica/clienteLogica");
const Cuenta = require("../Models/Cuenta");
const cuentaLogica = require("./logica/cuentaLogica");
const Pagos = require("../Models/Pagos");
const pagosLogica = require("./logica/pagosLogica");
const promocionLogica = require("./logica/promocionLogica");

// ChatbotUser.find({},(err,res)=>{
//   console.log(res);
// })

// Messenger API parameters
if (!config.FB_PAGE_TOKEN) {
  throw new Error("missing FB_PAGE_TOKEN");
}
if (!config.FB_VERIFY_TOKEN) {
  throw new Error("missing FB_VERIFY_TOKEN");
}
if (!config.GOOGLE_PROJECT_ID) {
  throw new Error("missing GOOGLE_PROJECT_ID");
}
if (!config.DF_LANGUAGE_CODE) {
  throw new Error("missing DF_LANGUAGE_CODE");
}
if (!config.GOOGLE_CLIENT_EMAIL) {
  throw new Error("missing GOOGLE_CLIENT_EMAIL");
}
if (!config.GOOGLE_PRIVATE_KEY) {
  throw new Error("missing GOOGLE_PRIVATE_KEY");
}
if (!config.FB_APP_SECRET) {
  throw new Error("missing FB_APP_SECRET");
}

const sessionIds = new Map();

// for Facebook verification
router.get("/webhook/", function (req, res) {
  if (
    req.query["hub.mode"] === "subscribe" &&
    req.query["hub.verify_token"] === config.FB_VERIFY_TOKEN
  ) {
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

//for webhook facebook
router.post("/webhook/", function (req, res) {
  console.info("inicio webhook facebook");
  var data = req.body;
  // Make sure this is a page subscription
  if (data.object == "page") {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function (pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function (messagingEvent) {
        if (messagingEvent.message) {
          receivedMessage(messagingEvent);
        } else if (messagingEvent.postback) {
          receivedPostback(messagingEvent);
        } else {
          console.log(
            "Webhook received unknown messagingEvent: ",
            messagingEvent
          );
        }
      });
    });

    // Assume all went well.
    // You must send back a 200, within 20 seconds
    res.sendStatus(200);
  }
});

//Enviar mensaje a facebook
router.get("/enviarMsgFacebook/:id", async (req, res) => {
  let idPromocion = req.params.id;
  console.log("idPromocion :>> ", idPromocion);
  let myPromocion = await promocionLogica.getPromocionById(idPromocion);
  console.log("myPromocion :>> ", myPromocion);

  let clientes = await clienteLogica.getclientesPorGrupo(myPromocion.grupo);

  console.log("clients :>> ", clientes);

  await Promise.all(
    clientes.map(async (myCliente) => {
      try {
        await sendTextMessage(
          myCliente.facebookId,
          "Hola " +
            myCliente.firstName +
            " tenemos esta promoción que no podes perderte."
        );

        await sendTextMessage(
          myCliente.facebookId,
          myPromocion.Name + " - " + myPromocion.message
        );
      } catch (error) {
        console.log("error :>> ", error);
      }
    })
  );
  // let listFacebookIds = req.body.facebookId;
  // let mensaje = req.body.mensaje;

  // for (const facebookIdCliente of listFacebookIds) {
  //   await sendTextMessage(facebookIdCliente, mensaje);
  // }

  res.sendStatus(200, "Datos enviados.");
});

async function receivedMessage(event) {
  var senderId = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  console.log(
    "Received message for user %d and page %d at %d with message:",
    senderId,
    recipientID,
    timeOfMessage
  );

  var isEcho = message.is_echo;
  var messageId = message.mid;
  var appId = message.app_id;
  var metadata = message.metadata;

  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  var quickReply = message.quick_reply;

  if (isEcho) {
    handleEcho(messageId, appId, metadata);
    return;
  } else if (quickReply) {
    handleQuickReply(senderId, quickReply, messageId);
    return;
  }
  saveUserData(senderId);

  if (messageText) {
    //send message to dialogflow
    console.log("MENSAJE DEL USUARIO: ", messageText);
    await sendToDialogFlow(senderId, messageText);
  } else if (messageAttachments) {
    handleMessageAttachments(messageAttachments, senderId);
  }
}

async function saveUserData(facebookId) {
  console.info("inicio saveUserData");
  let isRegistered = await client.findOne({ facebookId });
  console.info("isRegistered", isRegistered);
  if (isRegistered) return;
  console.info("antes de getUserData", facebookId);
  let userData = await getUserData(facebookId);
  let chatbotUser = new client({
    firstName: userData.first_name,
    lastName: userData.last_name,
    facebookId,
    profilePic: userData.profile_pic,
    status: 1, //prospecto
    phone: "",
    ci: "",
    email: "amygalaxies@gmail.com",
    //carrito:null // revisar si tiene que ir el carrito
  });
  chatbotUser.save((err, res) => {
    if (err) return console.log(err);
    console.log("Se creo un usuario:", res);
  });
}

function handleMessageAttachments(messageAttachments, senderId) {
  //for now just reply
  sendTextMessage(senderId, "Archivo adjunto recibido... gracias! .");
}

async function setSessionAndUser(senderId) {
  try {
    if (!sessionIds.has(senderId)) {
      sessionIds.set(senderId, uuid.v1());
    }
  } catch (error) {
    throw error;
  }
}

async function handleQuickReply(senderId, quickReply, messageId) {
  let quickReplyPayload = quickReply.payload;
  console.log(
    "Quick reply for message %s with payload %s",
    messageId,
    quickReplyPayload
  );
  this.elements = a;
  // send payload to api.ai
  sendToDialogFlow(senderId, quickReplyPayload);
}

async function handleDialogFlowAction(
  sender,
  action,
  messages,
  contexts,
  parameters,
  queryText
) {
  try {
    console.info("====================================================");
    switch (action) {
      case "pagoEspecifico.action": {
        await sendTextMessage(sender, "escribanos el monto a pagar");
        let monto = parameters.fields.monto.numberValue;
        console.log("monto :>> ", monto);
        break;
      }
      case "verPagos.action":
        {
          console.log("entro a  verPaagosAction :>> ", queryText);
          console.log("queryText :>> ", queryText);
          let ci = "";
          if (queryText.includes("ver_pagos_")) {
            ci = queryText.replace("ver_pagos_", "");
          }
          console.log("nuevoci :>> ", ci);
          let listaPagos = await pagosLogica.getListaPagos(ci);

          await Promise.all(
            listaPagos.map(async (element) => {
              await sendTextMessage(
                sender,
                "el concepto de pago es : " +
                element.concepto +
                " y el monto pagado es: " +
                element.monto
              );
            })
          );
        }
        break;
      case "pagarDeuda.action":
        {
          console.log("queryText :>> ", queryText);
          let ci = "";
          if (queryText.includes("pagar_deuda_")) {
            ci = queryText.replace("pagar_deuda_", "");
          }

          let deuda = await cuentaLogica.getDeuda(ci);

          await sendTextMessage(sender, "La deuda es :" + deuda);

          let monto = deuda - deuda;
          let myCuenta = await cuentaLogica.getCuenta(ci);

          let myPago = new Pagos({
            concepto: "pago realizado",
            monto: deuda,
            ci: ci,
            idCuenta: myCuenta._id,
            status: "1",
            // phone: body.phone,
          });

          myPago.save((err, pagosDB) => {
            if (err) {
              console.log("err :>> ", err);
              return console.info("hubo un error al procesar la compra");
            }
            console.log("myPago :>> ", myPago);
          });

          await cuentaLogica.setDeuda(monto, ci);

          await sendTextMessage(sender, "La deuda actual es :" + monto);

          let menumesa = facebookAction.menuMesa(ci);
          sendGenericMessage(sender, menumesa);
        }
        break;

      case "verDeuda.action":
        {
          let ci = parameters.fields.celula.numberValue;
          console.log("verDeuda ci :>> ", ci);
          let deuda = await cuentaLogica.getDeuda(ci);

          await sendTextMessage(sender, "Su deuda es de : " + deuda);

          await sendTextMessage(sender, "Que acción desea realizar:");
          let menumesa = facebookAction.menuMesa(ci);
          sendGenericMessage(sender, menumesa);
        }
        break;
      case "menuMesa.action":
        {
          let menumesa = facebookAction.menuMesa(null);
          sendGenericMessage(sender, menumesa);
        }
        break;
      case "ci.action":
        await sendTextMessage(sender, "ci recibido");
        let ci = parameters.fields.ci.numberValue;
        console.log("ci :>> ", ci);
        console.log("parameters :>> ", parameters);
        clienteLogica.setCi(sender, ci);

        break;
      case "Prendas.info.action":
        let listClothesToDisplay = await facebookAction.PrendasAction(
          parameters
        );
        sendGenericMessage(sender, listClothesToDisplay);

        break;
      case "MenuPrincipal.action":
        let menu = facebookAction.MenuPrincipal();
        sendGenericMessage(sender, menu);

        break;
      case "anadir_a_carrito.action":
        let data = await facebookAction.anadir_a_carrito(queryText, sender);

        if (data == null) {
          await sendTextMessage(
            sender,
            "Hubo un error al añadir el producto al carrito"
          );
        }

        await sendTextMessage(
          sender,
          "Se agregó al carrito : " + data.myProduct.name
        );

        await sendTextMessage(sender, "Te muestro tu carrito ");

        console.log("antes de  data.carritoCliente :>> ", data.carritoCliente);

        let listDetalleCarritoDisplay =
          await carritoLogica.getDetalleCarritoToDisplay(
            data.carritoCliente,
            sender
          );

        console.log(
          "listDetalleCarritoDisplay :>> ",
          listDetalleCarritoDisplay
        );

        sendGenericMessage(sender, listDetalleCarritoDisplay);

        break;
      case "FinalizarCompra.action":
        await facebookAction.finalizarCompra(sender);

        await sendTextMessage(sender, "Compra finalizada con exito");

        break;

      default:
        console.info("entro a default action");

        handleMessages(messages, sender);
    }
  } catch (error) {
    console.log("error facebook bot :>> ", error);
    console.log("error facebook bot error message:>> ", error.message);
    await sendTextMessage(sender, error.message);
  }
}

async function printFiles() {
  const files = await getFilePaths();

  for (const file of files) {
    const contents = await fs.readFile(file, "utf8");
    console.log(contents);
  }
}

async function handleMessage(message, sender) {
  console.log("message :>> ", message);
  switch (message.message) {
    case "text": // text
      for (const text of message.text.text) {
        if (text !== "") {
          await sendTextMessage(sender, text);
        }
      }
      break;
    case "quickReplies": // quick replies
      let replies = [];
      message.quickReplies.quickReplies.forEach((text) => {
        let reply = {
          content_type: "text",
          title: text,
          payload: text,
        };
        replies.push(reply);
      });
      await sendQuickReply(sender, message.quickReplies.title, replies);
      break;
    case "image": // image
      await sendImageMessage(sender, message.image.imageUri);
      break;
    case "payload":
      let desestructPayload = structProtoToJson(message.payload);
      var messageData = {
        recipient: {
          id: sender,
        },
        message: desestructPayload.facebook,
      };
      await callSendAPI(messageData);
      break;
    default:
      break;
  }
}

async function handleCardMessages(messages, sender) {
  let elements = [];
  for (let m = 0; m < messages.length; m++) {
    let message = messages[m];
    let buttons = [];
    for (let b = 0; b < message.card.buttons.length; b++) {
      let isLink = message.card.buttons[b].postback.substring(0, 4) === "http";
      let button;
      if (isLink) {
        button = {
          type: "web_url",
          title: message.card.buttons[b].text,
          url: message.card.buttons[b].postback,
        };
      } else {
        button = {
          type: "postback",
          title: message.card.buttons[b].text,
          payload:
            message.card.buttons[b].postback === ""
              ? message.card.buttons[b].text
              : message.card.buttons[b].postback,
        };
      }
      buttons.push(button);
    }

    let element = {
      title: message.card.title,
      image_url: message.card.imageUri,
      subtitle: message.card.subtitle,
      buttons,
    };
    elements.push(element);
  }
  await sendGenericMessage(sender, elements);
}

async function handleMessages(messages, sender) {
  try {
    let i = 0;
    let cards = [];
    while (i < messages.length) {
      switch (messages[i].message) {
        case "card":
          for (let j = i; j < messages.length; j++) {
            if (messages[j].message === "card") {
              cards.push(messages[j]);
              i += 1;
            } else j = 9999;
          }
          await handleCardMessages(cards, sender);
          cards = [];
          break;
        case "text":
          await handleMessage(messages[i], sender);
          break;
        case "image":
          await handleMessage(messages[i], sender);
          break;
        case "quickReplies":
          await handleMessage(messages[i], sender);
          break;
        case "payload":
          await handleMessage(messages[i], sender);
          break;
        default:
          break;
      }
      i += 1;
    }
  } catch (error) {
    console.log(error);
  }
}

async function sendToDialogFlow(senderId, messageText) {
  sendTypingOn(senderId);
  console.log("senderId :>> ", senderId);
  try {
    let result;
    setSessionAndUser(senderId);
    let session = sessionIds.get(senderId);

    result = await dialogflow.sendToDialogFlow(
      messageText,
      session,
      "FACEBOOK"
    );

    handleDialogFlowResponse(senderId, result);
  } catch (error) {
    console.log("salio mal en sendToDialogflow...", error);
  }
}

function handleDialogFlowResponse(sender, response) {
  let responseText = response.fulfillmentMessages.fulfillmentText;
  let messages = response.fulfillmentMessages;
  let action = response.action;
  let contexts = response.outputContexts;
  let parameters = response.parameters;
  let queryText = response.queryText;

  console.log("response handleDialogFlowResponse :>> ", response);

  sendTypingOff(sender);

  if (isDefined(action)) {
    handleDialogFlowAction(
      sender,
      action,
      messages,
      contexts,
      parameters,
      queryText
    );
  } else if (isDefined(messages)) {
    handleMessages(messages, sender);
  } else if (responseText == "" && !isDefined(action)) {
    //dialogflow could not evaluate input.
    sendTextMessage(sender, "No entiendo lo que trataste de decir ...");
  } else if (isDefined(responseText)) {
    sendTextMessage(sender, responseText);
  }
}
async function getUserData(senderId) {
  console.log("consiguiendo datos del usuario...");
  let access_token = config.FB_PAGE_TOKEN;
  try {
    let userData = await axios.get(
      "https://graph.facebook.com/v6.0/" + senderId,
      {
        params: {
          access_token,
        },
      }
    );
    return userData.data;
  } catch (err) {
    console.log("algo salio mal en axios getUserData: ", err);
    return {
      first_name: "",
      last_name: "",
      profile_pic: "",
    };
  }
}

async function sendTextMessage(recipientId, text) {
  if (text.includes("{first_name}") || text.includes("{last_name}")) {
    let userData = await getUserData(recipientId);
    text = text
      .replace("{first_name}", userData.first_name)
      .replace("{last_name}", userData.last_name);
  }
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: text,
    },
  };
  await callSendAPI(messageData);
}

/*
 * Send an image using the Send API.
 *
 */
async function sendImageMessage(recipientId, imageUrl) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url: imageUrl,
        },
      },
    },
  };
  await callSendAPI(messageData);
}

/*
 * Send a button message using the Send API.
 *
 */
async function sendButtonMessage(recipientId, text, buttons) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: text,
          buttons: buttons,
        },
      },
    },
  };
  await callSendAPI(messageData);
}

async function sendGenericMessage(recipientId, elements) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: elements,
        },
      },
    },
  };

  await callSendAPI(messageData);
}

/*
 * Send a message with Quick Reply buttons.
 *
 */
async function sendQuickReply(recipientId, text, replies, metadata) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    message: {
      text: text,
      metadata: isDefined(metadata) ? metadata : "",
      quick_replies: replies,
    },
  };

  await callSendAPI(messageData);
}

/*
 * Turn typing indicator on
 *
 */
function sendTypingOn(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    sender_action: "typing_on",
  };

  callSendAPI(messageData);
}

/*
 * Turn typing indicator off
 *
 */
function sendTypingOff(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId,
    },
    sender_action: "typing_off",
  };

  callSendAPI(messageData);
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function callSendAPI(messageData) {
  return new Promise((resolve, reject) => {
    request(
      {
        uri: "https://graph.facebook.com/v6.0/me/messages",
        qs: {
          access_token: config.FB_PAGE_TOKEN,
        },
        method: "POST",
        json: messageData,
      },
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var recipientId = body.recipient_id;
          var messageId = body.message_id;

          if (messageId) {
            console.log(
              "Successfully sent message with id %s to recipient %s",
              messageId,
              recipientId
            );
          } else {
            console.log(
              "Successfully called Send API for recipient %s",
              recipientId
            );
          }
          resolve();
        } else {
          reject();
          console.error(
            "Failed calling Send API",
            response.statusCode,
            response.statusMessage,
            body.error
          );
        }
      }
    );
  });
}

async function receivedPostback(event) {
  var senderId = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  var payload = event.postback.payload;
  switch (payload) {
    default:
      //unindentified payload
      sendToDialogFlow(senderId, payload);
      break;
  }

  console.log(
    "Received postback for user %d and page %d with payload '%s' " + "at %d",
    senderId,
    recipientID,
    payload,
    timeOfPostback
  );
}

function isDefined(obj) {
  if (typeof obj == "undefined") {
    return false;
  }

  if (!obj) {
    return false;
  }

  return obj != null;
}

module.exports = router;
