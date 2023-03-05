const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CuentaSchema = new Schema(
    {
        CI: String,
        Nombre: String,
        Deudas: Number, // 1:inicial
        cuotas: Number,
        credito: Number,

    },
    { timestamps: true }
);

module.exports = mongoose.model("Cuenta", CuentaSchema);
