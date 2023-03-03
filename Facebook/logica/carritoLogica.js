const CarritoDetalle = require('../../Models/CarritosDetalle');
const Product = require('../../Models/Products');


 class carritoLogica{
  constructor(){

  }
    async sumacarritos(clientCarrito, sender){

      
        var ObjectID = require('mongodb').ObjectID;
        console.info("inicio de detalle en carrito");
        let dblistDetalleCarrito = await  CarritoDetalle.find({ "carrito": new ObjectID(clientCarrito._id) });
        console.log("inicio de detalle", dblistDetalleCarrito);
      
        var suma = 0;
      
        
        await Promise.all(dblistDetalleCarrito.map(async (myDetalle) => {
      
          let clothesInfo = await Product.findOne({ "_id": new ObjectID(myDetalle.product) });
      
          suma = suma + clothesInfo.price  ;
      
      
        }));
      
        return suma ;
        
       }
}
module.exports = carritoLogica;