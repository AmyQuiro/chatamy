const client = require("../../Models/client");

class clienteLogica {
  ObjectID = require("mongodb").ObjectID;
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
