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
  switch (action) {
    case "Prendas.info.action":
      let listClothesToDisplay = await facebookAction.PrendasAction(parameters);
      sendGenericMessage(sender, listClothesToDisplay);

      break;
    case "MenuPrincipal.action":
      sendGenericMessage(sender, [
        {
          title: "Menu de Prendas",
          image_url:
            "https://www.esdesignbarcelona.com/sites/default/files/imagenes/haz-crecer-tu-marca-de-ropa-frente-la-competencia_1.jpg",
          subtitle: "Prendas de mujeres",

          buttons: [
            {
              type: "postback",
              title: "Vestidos",
              payload: "Vestidos",
            },
            {
              type: "postback",
              title: "Shorts",
              payload: "muestrame mas informacionde Shorts",
            },
            {
              type: "postback",
              title: "Blusas",
              payload: "podria ver Blusas",
            },
          ],
        },
      ]);

      break;
    case "anadir_a_carrito.action":
      let id = "";
      if (queryText.includes("anadir_carrito")) {
        id = queryText.replace("anadir_carrito_", "");
      }
      console.log("id del producto :>> ", id);
      // AQUI SE TIENE QUE ADICIONAR EL AÑADIR A CARRITO

      console.log("sender :>> ", sender);
      var ObjectID = require("mongodb").ObjectID;

      let myProduct = await Product.findOne({ _id: new ObjectID(id) });

      console.log("myProduct :>> ", myProduct);

      var facebookId = sender;
      var myClient = await client.findOne({ facebookId });
      console.log("myClient :>> ", myClient);

      console.info("====================================================");
      let clientCarrito = await Carrito.findOne({
        cliente: ObjectID(myClient._id),
      });
      console.log("clientCarrito :>> ", clientCarrito);

      let fechaActual = metodosGenerales.getFechaActual();
      if (!clientCarrito) {
        let carritoAGuardar = new Carrito({
          date: fechaActual,
          status: 1,
          total: myProduct.price,
          cliente: myClient._id,
        });

        await carritoAGuardar.save((err, carritoDB) => {
          if (err) {
            console.log("err :>> ", err);
            return console.info("hubo un error ");
          }
          console.log("carritoDB :>> ", carritoDB);
          clientCarrito = carritoDB;
        });
      }
      if (!clientCarrito) {
        console.info("No existe el carrito para añadir los detalles.");
        return;
      }
      let carritoDetalle = new CarritoDetalle({
        price: myProduct.price,
        quantity: 1,
        product: myProduct._id,
        carrito: clientCarrito._id,
      });
      await carritoDetalle.save((err, carritoDetalleDB) => {
        if (err) {
          console.log("err :>> ", err);
          return console.info("hubo un error ");
        }
        console.log("carritoDetalleDB :>> ", carritoDetalleDB);
      });

      await sendTextMessage(sender, "Se agregó al carrito : " + myProduct.name);

      await sendTextMessage(sender, "Te muestro tu carrito ");

      let listDetalleCarritoDisplay = await getDetalleCarritoToDisplay(
        clientCarrito,
        sender
      );

      console.log("listDetalleCarritoDisplay :>> ", listDetalleCarritoDisplay);

      sendGenericMessage(sender, listDetalleCarritoDisplay);

      //  console.log(parameters);
      break;
    case "FinalizarCompra.action":
      var ObjectID = require("mongodb").ObjectID;

      var facebookId = sender;
      var myCliente = await client.findOne({ facebookId });
      console.log("myClient :>> ", myCliente);

      // let facebook=sender;

      //console.log('Esto es el facebook  id :>>',facebook);

      //let myClien = await client.findOne({ facebook });

      //        console.log('Esto es el id cliente  :>> ', myClien);

      // let carrito = await Carrito.findOne(myCliente);
      //    console.log('lista de carrito dbListClothes :>> ', carrito);

      var clientCar = await Carrito.findOne({
        cliente: ObjectID(myCliente._id),
      });
      console.log("clientCarrito :>> ", clientCar);

      let sumTotalCarrito = await new logicaCarrito().sumacarritos(
        clientCar,
        sender
      );
      console.log("sumTotalCarrito :>> ", sumTotalCarrito);

      let fechaAct = metodosGenerales.getFechaActual();

      let CompraG = new Compra({
        date: fechaAct,
        total: sumTotalCarrito,
        idCarrito: clientCar.idCarrito,
        cliente: myCliente._id,
      });

      console.log("clientCarrito :>> guardo");

      await CompraG.save((err, compraDB) => {
        if (err) {
          console.log("err :>> ", err);
          return console.info("hubo un error al procesar la compra");
        }
        console.log("compraDB :>> ", compraDB);
        // clientCar = compraDB;
      });

      // pasar de detalle carrito a detalle compra_uhmmmm

      let dblistDetalleCarrito = await CarritoDetalle.find({
        carrito: new ObjectID(clientCar._id),
      });
      console.log("inicio de detalle", dblistDetalleCarrito);

      await Promise.all(
        dblistDetalleCarrito.map(async (myDetalle) => {
          let myProduct = await Product.findOne({
            _id: new ObjectID(myDetalle.product),
          });

          console.log("mi producto de carrito  :>> ", myProduct);

          let myCompraDetalle = new CompraDetalle({
            price: myProduct.price,
            quantity: myProduct.quantity,
            product: myProduct._id,
            Compra: CompraG._id,
          });

          await myCompraDetalle.save((err, compraDetalleDB) => {
            if (err) {
              console.log("err :>> ", err);
              return console.info("hubo un error al procesar la compra");
            }
            console.log("compraDetalleDB :>> ", compraDetalleDB);
          });
        })
      );

      console.info("inicio de cambio de estado de usuario");
      console.log("facebookId :>> ", facebookId);

      // const filter = { 'cliente': new ObjectId(facebookId) }
      // console.info("filter ");
      // let dbListCompras = await Compra.find(filter);
      // console.log('dbListCompras total cliente :>> ', dbListCompras.length);

      var dbListCompras = await Compra.find({
        cliente: ObjectID(myCliente._id),
      });
      console.log("compra cliente :>> ", clientCar);

      // Obtenemos el cliente y actualizamos su status
      let filterClient = { _id: ObjectID(myCliente._id) };
      console.info("filterClient");

      const options = { upsert: false };
      let newStatus = 3; // cliente
      if (dbListCompras.length >= 3) {
        newStatus = 4; // Cliente recurrente
      }

      console.info("newStatus " + newStatus);
      const updateDoc = {
        $set: {
          status: newStatus,
        },
      };
      const result = await client.updateOne(filterClient, updateDoc, options);
      console.info("terminado de cambio de estado de usuario");

      await sendTextMessage(sender, "Compra finalizada con exito");

      break;

    default:
      console.info("entro a default action");
      //unhandled action, just send back the text
      handleMessages(messages, sender);
  }
}

async function printFiles() {
  const files = await getFilePaths();

  for (const file of files) {
    const contents = await fs.readFile(file, "utf8");
    console.log(contents);
  }
}

async function getDetalleCarritoToDisplay(clientCarrito, sender) {
  var ObjectID = require("mongodb").ObjectID;
  console.info("inicio de detalle en carrito");
  let dblistDetalleCarrito = await CarritoDetalle.find({
    carrito: new ObjectID(clientCarrito._id),
  });
  console.log("inicio de detalle", dblistDetalleCarrito);

  let listDetalleCarritoDisplay = [];
  await Promise.all(
    dblistDetalleCarrito.map(async (myDetalle) => {
      let clothesInfo = await Product.findOne({
        _id: new ObjectID(myDetalle.product),
      });

      console.log("clothesInfo :>> ", clothesInfo);

      let info = {
        title: clothesInfo.name + " $" + clothesInfo.price,
        image_url: clothesInfo.img,
        subtitle: clothesInfo.description,

        buttons: [
          {
            type: "postback",
            title: "Finalizar compra",
            payload: "finalizar_compra_" + sender,
          },
          {
            type: "postback",
            title: "Ver mas Prendas",
            payload: "ver_mas_prendas",
          },
        ],
      };
      console.log("info :>> ", info);
      listDetalleCarritoDisplay.push(info);
    })
  );

  console.log(
    "detnro de metodo listDetalleCarritoDisplay :>> ",
    listDetalleCarritoDisplay
  );
  return listDetalleCarritoDisplay;
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
