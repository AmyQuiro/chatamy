const express = require("express");
const router = express.Router();


const DeudaMesa = require("../Models/DeudaMesa");


router.get("", async (req, res) => {
    let deudas = await DeudaMesa.find();
    res.json(deudas);

});

router.post("", (req, res) => {
    let body = req.body;
    let myDeuda = new DeudaMesa({
        concepto: body.concepto,
        idcliente: body.idcliente,
        status: body.status,
        phone: body.phone,

    });
    myDeuda.save((err, deudaDB) => {
        if (err) return res.json({ ok: false, msg: "Hubo un error" });
        res.json({
            ok: true,
            msg: "Deuda creado correctamente",
            product: deudaDB,
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
