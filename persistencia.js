import fs from "fs";

//--------------PERSISTENCIA------------------

const guardar= async (archivo, productosOrCarrito)=>{
    try {
        await fs.promises.writeFile(`./${archivo}.txt`, JSON.stringify(productosOrCarrito))
        console.log('PERSISTENCIA en fyle sistem Exitosa');
    } catch (error) {
        throw Error (`FALLO PERSISTENCIA, este el codigo de error ${error}`)
    }
}

export default guardar