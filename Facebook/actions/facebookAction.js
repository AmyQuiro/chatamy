const Carrito = require("../../Models/Carrito");
const CarritosDetalle = require("../../Models/CarritosDetalle");
const Products = require("../../Models/Products");
const client = require("../../Models/client");
const metodosGenerales = require("../logica/metodosGeneralesLogica");
const productoLogica = require("../logica/productoLogica");

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
    var ObjectID = require("mongodb").ObjectID;

    let myProduct = await Products.findOne({ _id: new ObjectID(id) });

    console.log("myProduct :>> ", myProduct);

    var facebookId = sender;

    var myClient = await client.findOne({ facebookId });
    console.log("myClient :>> ", myClient);

    console.info("====================================================");

    let clientCarrito = await Carrito.findOne({
      cliente: ObjectID(myClient._id),
    });
    console.log("clientCarrito :>> ", clientCarrito);

    let fechaActual = metodosGenerales.getFechaActual();
    if (!clientCarrito) {
      let carritoAGuardar = new Carrito({
        date: fechaActual,
        status: 1,
        total: myProduct.price,
        cliente: myClient._id,
      });

      await carritoAGuardar.save((err, carritoDB) => {
        if (err) {
          console.log("err :>> ", err);
          console.info("hubo un error al guardar el carrito");
          return null;
        }
        console.log("carritoDB :>> ", carritoDB);
        clientCarrito = carritoDB;
      });
    }
    if (!clientCarrito) {
      console.info("No existe el carrito para añadir los detalles.");
      return null;
    }

    let carritoDetalle = new CarritosDetalle({
      price: myProduct.price,
      quantity: 1,
      product: myProduct._id,
      carrito: clientCarrito._id,
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
      clientCarrito: clientCarrito,
    };
    return data;
  }
}

module.exports = facebookAction;
