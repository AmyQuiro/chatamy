const CarritosDetalle = require("../../Models/CarritosDetalle");
const Compra = require("../../Models/Compra");
const CompraDetalle = require("../../Models/CompraDetalle");
const Products = require("../../Models/Products");
const carritoLogica = require("./carritoLogica");
const metodosGenerales = require("./metodosGeneralesLogica");
const ObjectID = require("mongodb").ObjectID;
class compraLogica {
  constructor() {}
  static async compra() {
    let sumTotalCarrito = await carritoLogica.sumacarritos(clientCar);
    console.log("sumTotalCarrito :>> ", sumTotalCarrito);

    let fechaAct = metodosGenerales.getFechaActual();

    let CompraG = new Compra({
      date: fechaAct,
      total: sumTotalCarrito,
      idCarrito: clientCar.idCarrito,
      cliente: myCliente._id,
    });

    console.log("CompraG :>> guardo");

    await CompraG.save((err, compraDB) => {
      if (err) {
        console.log("err :>> ", err);
        return console.info("hubo un error al procesar la compra");
      }
      console.log("compraDB :>> ", compraDB);
    });

    // pasar de detalle carrito a detalle compra_uhmmmm

    let dblistDetalleCarrito = await CarritosDetalle.find({
      carrito: new ObjectID(clientCar._id),
    });
    console.log("inicio de detalle", dblistDetalleCarrito);

    await Promise.all(
      dblistDetalleCarrito.map(async (myDetalle) => {
        let myProduct = await Products.findOne({
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
  }
}
module.exports = compraLogica;
