const express = require("express");
const router = express.Router();

const Promocion = require("../Models/Promocion");

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
  
    })
  })
  module.exports = router;