const express = require("express");
const router = express.Router();

const Client = require("../Models/client");

router.post("/client", (req, res) => {
    let body = req.body;
    let myClient = new Client({
        firstName: body.firstName,
        lastName: body.lastName,
        facebookId: body.facebookId,
        phone: body.phone,
        profilePic: body.profilePic,
        status: body.status,
        email: body.email,
    });
    myClient.save((err, clientDB) => {
        if (err) return res.json({ ok: false, msg: "Hubo un error" });
        res.json({
            ok: true,
            msg: "Client creado correctamente",
            product: clientDB,
        });
    });
});



router.get("/client", async (req, res) => {
    let dbListClothes = await Client.find();
    res.json(dbListClothes);

});


router.post("/updateClientStatus", async (req, res) => {
    // create a filter for a movie to update

    let body = req.body;
    var mongoose = require('mongoose');
    const filter = { '_id': mongoose.Types.ObjectId(body.id) }
    // const filter = { 'email': body.email }
    // this option instructs the method to create a document if no documents match the filter
    const options = { upsert: false };
    // create a document that sets the plot of the movie
    const updateDoc = {
        $set: {
            status: body.status,

        },
    };
    const result = await Client.updateOne(filter, updateDoc, options);
    res.json(true);
});
module.exports = router;
