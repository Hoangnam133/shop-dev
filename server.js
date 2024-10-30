const app = require('./src/app')
const {app:{port}} = require('./src/configs/configMongodb')
const server = app.listen(port, ()=>{
    console.log(`server started port ${port}`)
})
