const express = require("express");
const router = express.Router();

const Promocion = require("../Models/Promocion");
const Client = require("../Models/client");

router.post("", (req, res) => {
  let body = req.body;
  let promocion = new Promocion({
    Name: body.Name,
    grupo: body.grupo,
    message: body.message,
    status: body.status,
  });
  promocion.save((err, promocionDB) => {
    if (err) return res.json({ ok: false, msg: "Hubo un error" });
    res.json({
      ok: true,
      msg: "promocion creado correctamente",
      promocion: promocionDB,
    });
  });
});

router.get("/getPromocion/:id", async (req, res) => {
  console.info("get promocion");
  var mongoose = require("mongoose");

  let idPromocion = req.params.id;
  console.info(idPromocion);
  let promocion = await Promocion.findOne({
    _id: mongoose.Types.ObjectId(idPromocion),
  });
  console.info("mi promocion");

  res.json(promocion);
});

router.get("/:id", async (req, res) => {
  let idPromocion = req.params.id;
  var mongoose = require("mongoose");
  let promocion = await Promocion.findOne({
    _id: mongoose.Types.ObjectId(idPromocion),
  });

  console.log("promocion.grupo :>> ", promocion.grupo);

  var selector = { status: promocion.grupo };
  let listaCliente = await Client.find(selector);
  let listaCorreos = "";
  listaCliente.forEach((element) => {
    listaCorreos += element.email + ";";
  });
  listaCorreos = listaCorreos.substring(0, listaCorreos.length - 1);

  let miPromocion = {
    name: promocion.Name,
    message: promocion.message,
    emailList: listaCorreos,
  };
  promocion["listaCorreos"] = listaCorreos;

  res.json({ miPromocion });
});

module.exports = router;
