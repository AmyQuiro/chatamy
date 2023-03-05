const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const ClientSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    facebookId: {
      type: String,
      unique: true,
    },
    phone: String,
    profilePic: String,
    ci: String,
    carrito: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Carritos",
    },
    status: Number, //1:prospecto - 2:Contacto - 3:Cliente - 4:Cliente recurrente
    email: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", ClientSchema);
