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
}
module.exports = facebookAction;
