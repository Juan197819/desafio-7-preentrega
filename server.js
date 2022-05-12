import express, { Router } from "express";
import fs from "fs";
import { isAsyncFunction } from "util/types";
import productosLista from "./productos.js";

const app = express()
const routerProductos = Router(); 
const routerCarrito = Router();  

let administrador=false;

app.use('/api/productos', routerProductos)
app.use('/api/carrito', routerCarrito)

routerProductos.use(express.json());
routerProductos.use(express.urlencoded({ extended: true }));
routerCarrito.use(express.json());
routerCarrito.use(express.urlencoded({ extended: true }));

const guardar= async (productosOrCarrito)=>{
    try {
        fs.promises.writeFile('./productos.txt', productosOrCarrito)
    } catch (error) {
        throw Error (`Este el codigo de error ${error}`)
    }
}

let prod = productosLista; 
const adminok= (req, res,next)=>{
    if (administrador) {
        console.log('Usuario Habilitado')
        next()
    }else{
        console.log('Usuario No valido');
        res.json({error: -1, descripcion: 'ruta /api/productos metodo no valido'})
    }
}
//--------------PRODUCTOS------------------

routerProductos.get('/:id?', (req, res) => {
    console.log('OK');
    console.log("peticion GET");
    const id= req.params.id;
    let r;
    if (id) {
        r = prod.find((p) => p.id == id);
        !r ? res.json("Producto no existente") : res.json(r)
    }else{
        res.json(prod);
    }
})

routerProductos.post('/',  adminok, (req, res) => {
let producto = req.body
producto.id = prod.length + 1 
producto.timestamp= Date.now()
prod.push(producto)
guardar(prod)
res.json(prod);
})

routerProductos.put('/:id', adminok, (req, res) => {
    const id = req.params.id;
    let producto = req.body;
    let nuevaLista = prod.filter(p=>p.id!=id)
    console.log(nuevaLista);
    producto.id=id
    producto.timestamp = Date.now();
    nuevaLista.push(producto);
    function compare(a, b) { 
        if (a.id < b.id) {
            return -1;
        }
        if (a.id > b.id) {  
            return 1;
        }
        return 0;
    }
    nuevaLista.sort(compare);
    guardar(nuevaLista)
    res.json(nuevaLista);
})

routerProductos.delete('/:id', adminok, (req, res) => {
    const id = req.params.id;
    const listaModificada = prod.filter(p=>p.id!=id)
    guardar(listaModificada)
    res.json(listaModificada)
});

//--------------CARRITO------------------
let carritos=[]

routerCarrito.post('/', (req, res) => {
    const productoCarrito = {
        id: carritos.length + 1,
        timestamp: Date.now(), 
        productos: [],
    }
    carritos.push(productoCarrito)
    console.log(carritos)
    res.json(productoCarrito.id)
}) 

routerCarrito.delete('/:id', (req, res) => {
    console.log("DELETE DESDE ACA PARA ABAJO")
    const id = req.params.id
    // 1ro VACIADO DE CARRITO
    carritos.forEach(carrito=>{
        if (carrito.id == id) {
            carrito.productos = []
        }
    })
    // 2do ELIMINACION DE CARRITO
    const carritoModificado= carritos.filter(e=>e.id!=id)
    res.json(carritoModificado)
})

routerCarrito.get('/:id/productos', (req, res) => {
    const id = req.params.id
    let carrito = carritos.find(el=>el.id==id)
    carrito?res.json(carrito.productos):res.json("Carrito Inexistente")
})

routerCarrito.post('/:id/productos', (req, res) => {
    const id = req.params.id
    let producto = req.body
    let isExist=carritos.find((e=>e.id==id))
    if (isExist) {
        carritos.forEach(e=>{
            if (e.id==id) {
                e.productos.push(producto)
                res.json(e)
            }
        })
    }else{    
        res.json("Carrito inexistente")
    }
})

routerCarrito.delete('/:id/productos/:id_prod', (req, res) => {
    //DELETE DE PRODUCTOS
    let id =req.params.id;
    let id_prod =req.params.id_prod;
    let u="Carrito no encontrado"
    carritos.forEach(carrito=>{
        if (carrito.id==id) {
            u=carrito.productos.find(e=>e.id==id_prod)
            carrito.productos=carrito.productos.filter(prod=>prod.id!=id_prod)
            console.log(carrito);
        }
    })
    res.json(u)
})

const PORT = process.env.PORT || 8080

const server = app.listen(PORT, ()=>{
    console.log(`Conectado en el puerto ${server.address().port}`);
})
server.on("error", error => console.log(`El error fue ${error}`))