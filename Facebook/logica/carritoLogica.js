const Carrito = require("../../Models/Carrito");
const CarritoDetalle = require("../../Models/CarritosDetalle");
const Product = require("../../Models/Products");
const metodosGenerales = require("./metodosGeneralesLogica");
const ObjectID = require("mongodb").ObjectID;
class carritoLogica {
  constructor() {}

  static async carritoClear(mycarrito) {
    const deletedCar = await Carrito.deleteOne({ _id: mycarrito._id });
    console.log({ deletedCar });
  }

  static async getCarrito(client_id) {
    var clientCar = await Carrito.findOne({
      cliente: ObjectID(client_id),
    });
    return clientCar;
  }

  static async sumacarritos(clientCarrito) {
    let dblistDetalleCarrito = await CarritoDetalle.find({
      carrito: new ObjectID(clientCarrito._id),
    });
    console.log("inicio de detalle", dblistDetalleCarrito);

    var suma = 0;

    await Promise.all(
      dblistDetalleCarrito.map(async (myDetalle) => {
        let clothesInfo = await Product.findOne({
          _id: new ObjectID(myDetalle.product),
        });

        suma = suma + clothesInfo.price;
      })
    );

    return suma;
  }

  static async getDetalleCarritoToDisplay(clientCarrito, sender) {
    var ObjectID = require("mongodb").ObjectID;
    console.info("inicio de detalle en carrito", JSON.stringify(clientCarrito));
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
      "dentro de metodo listDetalleCarritoDisplay :>> ",
      listDetalleCarritoDisplay
    );
    return listDetalleCarritoDisplay;
  }

  static async crearCarritoAlCliente(myProduct, myClient) {
    let fechaActual = metodosGenerales.getFechaActual();

    let carritoAGuardar = new Carrito({
      date: fechaActual,
      status: 1,
      total: myProduct.price,
      cliente: myClient._id,
    });

    try {
      let nuevoCarrito = await carritoAGuardar.save();
      return nuevoCarrito;
    } catch (err) {
      console.log("err :>> ", err);
      console.info("hubo un error al guardar el carrito");
      return null;
    }

    // let nuevoCarrito = null;
    // await carritoAGuardar.save((err, carritoDB) => {
    //   if (err) {
    //     console.log("err :>> ", err);
    //     console.info("hubo un error al guardar el carrito");
    //   }
    //   nuevoCarrito = carritoDB;
    // });
    // return nuevoCarrito;
  }
}
module.exports = carritoLogica;
