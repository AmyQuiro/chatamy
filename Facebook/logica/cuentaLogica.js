const Cuenta = require("../../Models/Cuenta");
const client = require("../../Models/client");
const ObjectID = require("mongodb").ObjectID;

class cuentaLogica {
  static async setDeuda(monto, ci) {
    console.info("Inicio de set monto ");
    var filterCuenta = { CI: ci };

    const options = { upsert: false };

    const updateDoc = {
      $set: {
        Deudas: monto,
      },
    };

    const result2 = await Cuenta.updateOne(filterCuenta, updateDoc, options);

    console.log(`${result2.modifiedCount} documento(s)  actualizado(s)`);
  }
  static async getCuenta(ci) {
    try {
      var myCuenta = await Cuenta.findOne({ CI: ci });

      if (myCuenta == null) {
        throw new Error("No exite una cuenta con ese numero de ci");
      }

      return myCuenta;
    } catch (error) {
      console.log("getCuenta error.message :>> ", error.message);
      throw new Error(error.message);
    }
  }
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
      return deuda;
    } catch (error) {
      console.log("getDeuda error.message :>> ", error.message);
      throw new Error(error.message);
    }
  }
}
module.exports = cuentaLogica;
