const express = require("express");
const router = express.Router();

const Compra = require("../Models/Compra");
const CompraDetalle = require("../Models/CompraDetalle");
const Products = require("../Models/Products");


// Obtiene todas las compras realizadas
router.get("/", async (req, res) => {
    // console.log('req compra :>> ', req);
    console.log('req compra :>> ', req.query);
    let body = req.query;
    console.log('body :>> ', body);
    console.log('body :>> ', body.client_id);
    var mongoose = require('mongoose');
    const filter = { 'cliente': mongoose.Types.ObjectId(body.client_id.toString()) }
    console.log('filter :>> ', filter);
    let dbListCompras = await Compra.find(filter);
    console.log('dbListCompras :>> ', dbListCompras.length);
    let listToSend = [];
    await Promise.all(dbListCompras.map(async (myCompra) => {
        let listDetalle = [];
        let myCompraDetalle = await CompraDetalle.find({ 'Compra': mongoose.Types.ObjectId(myCompra._id) });

        console.log('myCompraDetalle :>> ', myCompraDetalle.length);
        await Promise.all(myCompraDetalle.map(async (detalle) => {
            let myProduct = await Products.findOne({ "_id": mongoose.Types.ObjectId(detalle.product) });
            let detalleToSend = {
                "_id": detalle._id,
                "price": detalle.price,
                "quantity": 1,
                "product": myProduct.name,
                "product_id": myProduct._id,
            }

            listDetalle.push(detalleToSend);

        }));

        let total = listDetalle.reduce((acc, item) => acc + item.price * item.quantity, 0);

        let compraToSend = {
            "_id": myCompra._id,
            "date": myCompra.date,
            "total": total,
            "cliente": myCompra.cliente,
            "detalle": listDetalle
        }

        console.log('myCompra :>> ', compraToSend);
        listToSend.push(compraToSend);


    }));
    res.json(listToSend);
});



router.post("/compraDetalle", (req, res) => {
    let body = req.body;
    let compra = new CompraDetalle({

        price: body.price,
        quantity: body.quantity,
        product: body.product,
        compra: body.compra
    });
    compra.save((err, compraDetalleDB) => {
        if (err) return res.json({ ok: false, msg: "Hubo un error" });
        res.json({
            ok: true,
            msg: "carritoDetalle creado correctamente",
            compra: compraDetalleDB,
        });

    })
})

router.post("/Compra", (req, res) => {
    let body = req.body;
    let compra = new Compra({
        date: body.date,
        total: body.total,
        carrito: body.carrito,
        cliente: body.cliente
    });
    compra.save((err, compraDB) => {
        if (err) return res.json({ ok: false, msg: "Hubo un error" });
        res.json({
            ok: true,
            msg: "Compra creado correctamente",
            Compra: compraDB,
        });

    })
});
module.exports = router;