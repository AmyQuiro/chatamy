const Cuenta = require("../../Models/Cuenta");
const client = require("../../Models/client");
const ObjectID = require("mongodb").ObjectID;

class cuentaLogica {
  static async getDeuda(ci) {
    try {
      var myCuenta = await Cuenta.findOne({ CI: ci });

      if (myCuenta == null) {
        throw new Error("No exite una cuenta con ese numero de ci");
      }

      let deuda = myCuenta.Deudas;
      if (deuda == 0) {
        throw new Error("No tiene deudas pendientes");
      }
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
module.exports = cuentaLogica;
