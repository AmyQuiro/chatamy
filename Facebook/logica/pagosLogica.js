const Pagos = require("../../Models/Pagos");
const client = require("../../Models/client");
const ObjectID = require("mongodb").ObjectID;

class pagosLogica {
  static async getListaPagos(ci) {
    let dblistDePagos = await Pagos.find({
      ci: ci,
    });

    return dblistDePagos;
  }
}
module.exports = pagosLogica;
