const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CompraDetalleSchema = new Schema(
    {
          price:Number,
          quantity:Number,
          product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Products"
          },
          Compra: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Compra"
          }
          
    },
    { timestamps: true }
  );
  
  module.exports = mongoose.model("compraDetalle", CompraDetalleSchema);
  