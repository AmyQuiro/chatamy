const express = require("express");
const router = express.Router();
const Product = require('../Models/Products');

const { post } = require("request");

const Carrito = require("../Models/Carrito");
const CarritoDetalle = require("../Models/CarritosDetalle");
// const CompraDetalle = require("../Models/CompraDetalle");

const Promocion = require("../Models/Promocion");

// ROUTES
router.use('/client', require('./client'));
router.use('/compra', require('./compra'));
router.use('/promocion', require('./promocion'));
router.use('/deuda', require('./deudaMesa'));
router.use('/Cuenta', require('./cuenta'));




router.get("/chatbot", async (req, res) => {

  console.info("inicio");
  let clothes = "blusa";


  var selector = { "name": { $regex: clothes, $options: "i" } };
  let dbListClothes = await Product.find(selector);
  console.log('dbListClothes :>> ', dbListClothes);


  res.json({ ok: true, msg: JSON.stringify(dbListClothes) });
});




router.post("/products", (req, res) => {
  let body = req.body;
  let product = new Product({
    name: body.name,
    description: body.description,
    price: body.price,
    img: body.img,
  });
  product.save((err, productDB) => {
    if (err) return res.json({ ok: false, msg: "Hubo un error" });
    res.json({
      ok: true,
      msg: "Producto creado correctamente",
      product: productDB,
    });
  });
});

router.post("/carritoDetalle", (req, res) => {
  let body = req.body;
  let carrito = new CarritoDetalle({


    price: body.price,
    quantity: body.quantity,
    product: body.product,
    carrito: body.carrito
  });
  carrito.save((err, carritoDetalleDB) => {
    if (err) return res.json({ ok: false, msg: "Hubo un error" });
    res.json({
      ok: true,
      msg: "carritoDetalle creado correctamente",
      carrito: carritoDetalleDB,
    });

  })
})

router.post("/carrito", (req, res) => {
  let body = req.body;
  let carrito = new Carrito({
    date: body.date,
    status: body.status,
    total: body.total,
    cliente: body.cliente
  });
  carrito.save((err, carritoDB) => {
    if (err) return res.json({ ok: false, msg: "Hubo un error" });
    res.json({
      ok: true,
      msg: "carrito creado correctamente",
      carrito: carritoDB,
    });

  })
})


router.get("/carrito", async (req, res) => {
  let dbListCarrito = await Carrito.find();
  res.json({ ok: true, msg: JSON.stringify(dbListCarrito) });
});




module.exports = router;