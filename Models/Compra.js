const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CompraSchema = new Schema(
    {     
            
      cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Client"
      }, 
      CompraDetalle:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "CompraDetalle"
      },  
          MontoTotal: Number,
          Fecha: date,  
    },
    { timestamps: true }
  );
  
  