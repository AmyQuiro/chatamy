const Carrito = require("../../Models/Carrito");
const CarritosDetalle = require("../../Models/CarritosDetalle");
const Compra = require("../../Models/Compra");
const CompraDetalle = require("../../Models/CompraDetalle");
const Products = require("../../Models/Products");
const client = require("../../Models/client");
const carritoLogica = require("../logica/carritoLogica");
const clienteLogica = require("../logica/clienteLogica");
const compraLogica = require("../logica/compraLogica");
const metodosGenerales = require("../logica/metodosGeneralesLogica");
const productoLogica = require("../logica/productoLogica");
const ObjectID = require("mongodb").ObjectID;

class facebookAction {
  static async PrendasAction(parameters) {
    let clothes = parameters.fields.clothes.stringValue;
    console.log("clothes :>> ", clothes);

    var dbListClothes = await productoLogica.bucarProductosPorNombre(clothes);

    let listClothesToDisplay = [];
    dbListClothes.forEach((clothesInfo) => {
      let info = {
        title: clothesInfo.name + " $" + clothesInfo.price,
        image_url: clothesInfo.img,
        subtitle: clothesInfo.description,

        buttons: [
          {
            type: "postback",
            title: "Añadir a Carrito " + clothesInfo.name,
            payload: "anadir_carrito_" + clothesInfo.id,
          },
          {
            type: "postback",
            title: "Ver mas Prendas",
            payload: "ver_mas_prendas",
          },
        ],
      };
      listClothesToDisplay.push(info);
    });
    return listClothesToDisplay;
  }

  static MenuPrincipal() {
    return [
      {
        title: "Menu de Prendas",
        image_url:
          "https://www.esdesignbarcelona.com/sites/default/files/imagenes/haz-crecer-tu-marca-de-ropa-frente-la-competencia_1.jpg",
        subtitle: "Prendas de mujeres",

        buttons: [
          {
            type: "postback",
            title: "Vestidos",
            payload: "Vestidos",
          },
          {
            type: "postback",
            title: "Shorts",
            payload: "muestrame mas informacionde Shorts",
          },
          {
            type: "postback",
            title: "Blusas",
            payload: "podria ver Blusas",
          },
        ],
      },
    ];
  }

  static async anadir_a_carrito(queryText, sender) {
    let id = "";
    if (queryText.includes("anadir_carrito")) {
      id = queryText.replace("anadir_carrito_", "");
    }
    console.log("id del producto :>> ", id);
    // AQUI SE TIENE QUE ADICIONAR EL AÑADIR A CARRITO

    console.log("sender :>> ", sender);

    let myProduct = await Products.findOne({ _id: new ObjectID(id) });

    console.log("myProduct :>> ", myProduct);

    var facebookId = sender;

    var myClient = await client.findOne({ facebookId });
    console.log("myClient :>> ", myClient);

    let carritoCliente = await Carrito.findOne({
      cliente: ObjectID(myClient._id),
    });
    console.log("carritoCliente :>> ", carritoCliente);

    if (!carritoCliente) {
      console.info("No tiene carrito, asi que se crea uno.");
      carritoCliente = await carritoLogica.crearCarritoAlCliente(
        myProduct,
        myClient
      );
    }

    let carritoDetalle = new CarritosDetalle({
      price: myProduct.price,
      quantity: 1,
      product: myProduct._id,
      carrito: carritoCliente._id,
    });
    await carritoDetalle.save((err, carritoDetalleDB) => {
      if (err) {
        console.log("err :>> ", err);
        console.info("hubo un error al guardar el carrito detalle");
        return null;
      }
      console.log("carritoDetalleDB :>> ", carritoDetalleDB);
    });

    let data = {
      myProduct: myProduct,
      carritoCliente: carritoCliente,
    };

    console.log("anadir_a_carrito data :>> ", JSON.stringify(data));
    return data;
  }

  static async finalizarCompra(sender) {
    let myClient = await clienteLogica.getClientByFacebookId(sender);

    // logica carrito - getCarrito
    let clientCar = await carritoLogica.getCarrito(myClient._id);

    console.log("carritoCliente :>> ", clientCar);

    // logica compra - create Compra

    await compraLogica.compra(clientCar, myClient);

    // hasta aqui es la compra

    var dbListCompras = await Compra.find({
      cliente: ObjectID(myClient._id),
    });
    console.log("compra cliente :>> ", clientCar);

    // Obtenemos el cliente y actualizamos su status

    await clienteLogica.setStatus(myClient._id, dbListCompras);
    console.log("compra terminado :>> ", clientCar);

    await carritoLogica.carritoClear(clientCar);

    console.log("carrito limpio :>> ", clientCar);
  }
}

module.exports = facebookAction;
