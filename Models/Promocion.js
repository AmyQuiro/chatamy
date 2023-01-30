const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const PromocionSchema = new Schema(
    {    
      Name: String,
      grupo: Number,
      message:String,
      status:Number,//1: creoado : 2= enviado 3= error
    },
    { timestamps: true }
  );
  
  module.exports = mongoose.model("Promocion", PromocionSchema);