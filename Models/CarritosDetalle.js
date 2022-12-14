const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CarritoDetalleSchema = new Schema(
    {
          price:Number,
          quantity:Number,
          product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Products"
          },
          carrito: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Carritos"
          }
          
    },
    { timestamps: true }
  );
  
  module.exports = mongoose.model("carritoDetalle", CarritoDetalleSchema);
  