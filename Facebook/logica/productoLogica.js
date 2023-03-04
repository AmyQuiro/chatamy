const CarritoDetalle = require('../../Models/CarritosDetalle');
const Product = require('../../Models/Products');


 class productoLogica{
  constructor(){

  }
  static  async bucarProductosPorNombre(nombreProducto){

        var selector = { "name": { $regex: clothes, $options: "i" } };
      let dbListClothes = await Product.find(selector);
      console.log('dbListClothes :>> ', dbListClothes);
return dbListClothes;
        
       }
}
module.exports = productoLogica;