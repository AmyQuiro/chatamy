const client = require("../../Models/client");
const ObjectID = require("mongodb").ObjectID;

class clienteLogica {
  static async getClientByFacebookId(facebookId) {
    var myCliente = await client.findOne({ facebookId });
    console.log("myClient :>> ", myCliente);
    return myCliente;
  }

  static async setStatus(idcliente, dbListCompras) {
    console.info("Inicio de set status cliente");
    let filterClient = { _id: ObjectID(idcliente) };
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

    const result = await client.updateOne(filterClient, updateDoc);

    console.log(`${result.modifiedCount} documento(s) actualizado(s)`);

    const result2 = await client.updateOne(filterClient, updateDoc, options);

    console.log(`${result2.modifiedCount} documento(s) 2 actualizado(s)`);
  }
}
module.exports = clienteLogica;
