const client = require("../../Models/client");

class clienteLogica {
  static async setStatus(idcliente, dbListCompras) {
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

    const result = await client.updateOne(filterClient, updateDoc, options);
  }
}
module.exports = clienteLogica;
