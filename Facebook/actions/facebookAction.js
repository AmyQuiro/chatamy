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
const Cuenta = require("../../Models/Cuenta");
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

  static menuMesa(ci) {
    let botonVerDeuda = {
      type: "postback",
      title: "ver deuda",
      payload: "ver deuda",
    };

    let botonPagarDeuda = {
      type: "postback",
      title: "pagar deuda ",
      payload: "pagar deuda",
    };
    let botonVerPagos = {
      type: "postback",
      title: "ver pagos",
      payload: "ver pagos",
    };

    let botonPagosEspecificos = {
      type: "postback",
      title: "pagos por monto",
      payload: "pagos monto",
    };

    let listaBotones = [];
    if (ci == null) {
      listaBotones.push(botonVerDeuda);
    } else {
      botonPagarDeuda.title = "pagar deuda " + ci;
      botonPagarDeuda.payload = "pagar_deuda_" + ci;
      botonVerPagos.payload = "ver_pagos_" + ci;
      botonPagosEspecificos.payload = "pagos_especificos_" + ci;

      listaBotones.push(botonPagosEspecificos);
    }

    listaBotones.push(botonPagarDeuda);
    listaBotones.push(botonVerPagos);

    console.log("listaBotones :>> ", listaBotones);
    let miMenu = [
      {
        title: "Menu ",
        image_url:
          "https://previews.123rf.com/images/ylivdesign/ylivdesign1612/ylivdesign161202203/66987914-dinero-en-efectivo-en-icono-de-la-mano-ilustraci%C3%B3n-de-dibujos-animados-de-dinero-en-efectivo-en-el.jpg",
        subtitle: "que desea hacer?",

        buttons: listaBotones,
      },
    ];

    return miMenu;
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
    await carritoLogica.guardarCarritoDetalle(myProduct, carritoCliente);

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
