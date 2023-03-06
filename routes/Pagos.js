const express = require("express");
const router = express.Router();

const Pagos = require("../Models/Pagos");

router.post("", (req, res) => {
  let body = req.body;

  let myPago = new Pagos({
    concepto: body.concepto,
    monto: body.monto,
    ci: body.ci,
    idCuenta: body.idCuenta,
    status: body.status,
    // phone: body.phone,
  });
  myPago.save((err, pagosDB) => {
    if (err) return res.json({ ok: false, msg: "Hubo un error" });
    res.json({
      ok: true,
      msg: "Deuda creado correctamente",
      product: pagosDB,
    });
  });
});

// router.post("/updateClientStatus", async (req, res) => {
//     // create a filter for a movie to update

//     let body = req.body;
//     var mongoose = require('mongoose');
//     const filter = { '_id': mongoose.Types.ObjectId(body.id) }
//     // const filter = { 'email': body.email }
//     // this option instructs the method to create a document if no documents match the filter
//     const options = { upsert: false };
//     // create a document that sets the plot of the movie
//     const updateDoc = {
//         $set: {
//             status: body.status,

//         },
//     };
//     const result = await Client.updateOne(filter, updateDoc, options);
//     res.json(true);
// });
module.exports = router;
