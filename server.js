import express, { Router } from "express";
import guardar from "./persistencia.js";
import productosLista from "./productos.js";

const app = express()
const routerProductos = Router(); 
const routerCarrito = Router();  

let administrador=true;

app.use('/api/productos', routerProductos)
app.use('/api/carrito', routerCarrito)

routerProductos.use(express.json());
routerProductos.use(express.urlencoded({ extended: true }));
routerCarrito.use(express.json());
routerCarrito.use(express.urlencoded({ extended: true }));

//-----------MIDDLEWARE USUARIO----------

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

let prod = productosLista; 

routerProductos.get('/:id?', (req, res) => {
    const id= req.params.id;
    let r;
    if (id) {
        r = prod.find((p) => p.id == id);
        !r ? res.json("Producto no existente") : res.json(r)
    }else{
        res.json(prod);
    }
})

routerProductos.post('/', adminok, (req, res) => {
    let producto = req.body
    producto.id = prod.length + 1 
    producto.timestamp= Date.now()
    prod.push(producto)
    guardar('productos',prod)
    res.json(prod); 
})

routerProductos.put('/:id', adminok, (req, res) => {
    const id = req.params.id;
    let isExist = prod.find(p=>p.id==id)
    if (isExist) {
        prod = prod.filter(p=>p.id!=id)
        let producto = req.body;
        producto.id=id
        producto.timestamp = Date.now();
        prod.push(producto);
        function compare(a, b) { 
            if (a.id < b.id) {
                return -1;
            }
            if (a.id > b.id) {  
                return 1;
            }
            return 0;
        }
        prod.sort(compare);
        guardar('productos', prod)
        res.json(prod);
    }else{
        res.json('El producto que quiere modificar no existe');
    }
})

routerProductos.delete('/:id', adminok, (req, res) => {
    const id = req.params.id;
    let isExist = prod.find(p=>p.id==id)
    if (isExist) {
        prod = prod.filter(p=>p.id!=id)
        guardar('productos', prod)
        res.json(prod) 
    }else{
        res.json('El producto que quiere eliminar no existe') 
    }
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
    guardar('carritos', carritos)
    res.json(productoCarrito.id)
}) 

routerCarrito.delete('/:id', (req, res) => {
    const id = req.params.id
    let idExist;
    // 1ro VACIADO DE CARRITO
    carritos.forEach(carrito=>{
        if (carrito.id == id) {
            idExist='ok'
            carrito.productos = []
        }
    })
    // 2do ELIMINACION DE CARRITO
    carritos= carritos.filter(e=>e.id!=id)
    guardar('carritos', carritos)
    idExist? res.json(carritos):res.json('Id de carrito no encontrado')
})

routerCarrito.get('/:id/productos', (req, res) => {
    const id = req.params.id
    let carrito = carritos.find(el=>el.id==id)
    carrito?res.json(carrito.productos):res.json("Carrito Inexistente")
}) 
routerCarrito.get('/', (req, res) => {
   res.json(carritos)
}) 

routerCarrito.post('/:id/productos', (req, res) => {
    const id = req.params.id
    let producto = req.body
    let isExist=carritos.find((e=>e.id==id))
    if (isExist) {
        carritos.forEach(e=>{
            if (e.id==id) {
                e.productos.push(producto)
                guardar('carritos', carritos)
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
            if (u) {
                carrito.productos=carrito.productos.filter(prod=>prod.id!=id_prod);
                guardar('carritos', carritos);
            }else{
                u='Producto Inexistente'
            } 
        }
    })
    res.json(u)
})

//-------------RUTAS POR DEFAULT------------

const errorRuta= {error: -2, descripcion: `ruta no implementada`}

app.route('*')
    .post((req,res)=>{
        res.json(errorRuta)
    })
    .get((req,res)=>{
        res.json(errorRuta)
    })
    .delete((req,res)=>{
        res.json(errorRuta)
    })
    .put((req,res)=>{
        res.json(errorRuta)
    })

const PORT = process.env.PORT || 8080

const server = app.listen(PORT, ()=>{
    console.log(`Conectado en el puerto ${server.address().port}`);
})
server.on("error", error => console.log(`El error fue ${error}`))