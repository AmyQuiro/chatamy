const dialogflow = require("dialogflow");
const config = require("./config");

const credentials = {
  client_email: config.GOOGLE_CLIENT_EMAIL,
  private_key: config.GOOGLE_PRIVATE_KEY,
};

const sessionClient = new dialogflow.SessionsClient({
  projectId: config.GOOGLE_PROJECT_ID,
  credentials,
});

/**
 * Send a query to the dialogflow agent, and return the query result.
 * @param {string} projectId The project to be used
 */
async function sendToDialogFlow(msg, session, source, params) {
  let textToDialogFlow = msg;

  console.log('msg:>> ', msg);
  console.log('session:>> ', session);
  console.log('source:>> ', source);
  console.log('params:>> ', params);
  
  console.log('config.GOOGLE_PROJECT_ID :>> ', config.GOOGLE_PROJECT_ID);
  console.log('config.DF_LANGUAGE_CODE :>> ', config.DF_LANGUAGE_CODE);

  try {
    const sessionPath = sessionClient.sessionPath(
      config.GOOGLE_PROJECT_ID,
      session
    );

    
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: textToDialogFlow,
          languageCode: config.DF_LANGUAGE_CODE,
        },
      },
      queryParams: {
        payload: {
          data: params,
        },
      },
    };
    console.log('request :>> ', request);
    const responses = await sessionClient.detectIntent(request);
    console.log('responses :>> ', responses);
    
    const result = responses[0].queryResult;
    
    console.log("INTENT EMPAREJADO: ", result.intent.displayName);
    let defaultResponses = [];
    if (result.action !== "input.unknown") {
      result.fulfillmentMessages.forEach((element) => {
        if (element.platform === source) {
          defaultResponses.push(element);
        }
      });
    }
    if (defaultResponses.length === 0) {
      result.fulfillmentMessages.forEach((element) => {
        if (element.platform === "PLATFORM_UNSPECIFIED") {
          defaultResponses.push(element);
        }
      });
    }

    //inicio codigo 
    console.log('result.parameters :>> ', result.parameters);
    console.log('result.queryText :>> ', result.queryText);
    if(result.queryText.includes("anadir_carrito")){
      console.info("entro a anahidr cartio query");
    }
    console.log('result.intent :>> ', result.intent);

       //fin codigo 
    result.fulfillmentMessages = defaultResponses;
    return result;
    // console.log("se enviara el resultado: ", result);
  } catch (e) {
    console.log("error");
    console.log(e);
  }
}

module.exports = {
  sendToDialogFlow,
};
