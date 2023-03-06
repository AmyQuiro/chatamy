const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const PagosSchema = new Schema(
  {
    concepto: String,
    monto: Number,
    ci: Number,
    idCuenta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cuenta",
    },
    status: Number, //1:Pendiente ;  2:Pagado
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pagos", PagosSchema);
