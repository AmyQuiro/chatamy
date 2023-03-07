const Promocion = require("../../Models/Promocion");
const ObjectID = require("mongodb").ObjectID;

class promocionLogica {
  static async getPromocionById(id) {
    let myPromocion = await Promocion.findOne({ _id: new ObjectID(id) });
    console.log("myPromocion :>> ", myPromocion);
    return myPromocion;
  }
}
module.exports = promocionLogica;
