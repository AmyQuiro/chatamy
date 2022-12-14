const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CarritoSchema = new Schema(
    {
          date: String,
          status: Number, // 1:inicial
          total: Number,
          cliente: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Client"
          }
          
    },
    { timestamps: true }
  );
  
  module.exports = mongoose.model("Carritos", CarritoSchema);
  