const mongoose = require('mongoose')
const {db:{host, port, name}}= require('../configs/configMongodb')
const connectString = `mongodb://${host}:${port}/${name}`
class Dadabase{
    constructor(){
        this.connect()
    }

    connect(type ='mongoose'){
        if(1===1){
            mongoose.set('debug',true)
            mongoose.set('debug',{color: true})
        }
        mongoose.connect(connectString)
        .then(()=>{
            console.log(`connectDB sucsses ::: ${connectString}`)
        })
        .catch(err => console.log(`connect fail ${err}`))
    }
    
    static getInstance(){
        if(!Dadabase.instance){
            Dadabase.instance = new Dadabase()
        }
        return Dadabase.instance
    }

}
const instanceMongodb = Dadabase.getInstance()
module.exports = instanceMongodb