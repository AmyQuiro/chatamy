const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CompraSchema = new Schema(
    {  
      date: String,
     // status: Number, // 1:inicial
      total: Number, 
      idCarrito:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Carrito"
      },
                 
      cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Client"
      }, 
      // CompraDetalle:{
      //   type: mongoose.Schema.Types.ObjectId,
      //   ref: "CompraDetalle"
      // },  
        //  MontoTotal: Number,
            
    },
    { timestamps: true }
  );
  
  