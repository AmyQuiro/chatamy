const express = require("express");
const Cuenta = require("../Models/Cuenta");
const router = express.Router();


router.post("/", (req, res) => {
    let body = req.body;
    let cuenta = new Cuenta({
        CI: body.CI,
        Nombre: body.Nombre,
        Deudas: body.Deudas,
        cuotas: body.cuotas,
        credito: body.credito,
    });
    cuenta.save((err, cuentaDB) => {
        if (err) return res.json({ ok: false, msg: "Hubo un error" });
        res.json({
            ok: true,
            msg: "cuenta creado correctamente",
            cuenta: cuentaDB,
        });

    })
})

module.exports = router;