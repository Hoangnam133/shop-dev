const keyTokenModel = require('../models/keyTokenModel')
class KeyTokenService{
    static createKeyToken = async({userId, publicKey, privateKey, refreshToken})=>{
        try{
            const filter = {user: userId},
            update = {
                publicKey, privateKey, refreshTokensUsed: [], refreshToken 
            },
            options = { upsert: true, new: true }
            const tokens = await keyTokenModel.findOneAndUpdate(filter, update, options)
            return tokens ? tokens.publicKey : null
        }catch(err){
            console.log(`create key token fail ${err}`)
            return null
        }
    }
    static findByUserId = async(userId)=>{
        return await keyTokenModel.findOne({user: userId})
    }
    
    static removeKeyById = async (id) => {
        try {
            const result = await keyTokenModel.findByIdAndDelete(id)
            return result ? result : null;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    static findRefreshTokenUsed = async(refreshToken)=>{
        return await keyTokenModel.findOne({refreshTokensUsed: refreshToken})
    }

    static findRefreshToken = async(refreshToken)=>{
        return await keyTokenModel.findOne({refreshToken})
    }

    static deleteKeyById = async(userId)=>{
        return await keyTokenModel.findOneAndDelete({user: userId})
    }
    static updateKeyToken = async (id, updateData) => {
        return await keyTokenModel.updateOne({ _id: id }, updateData)
    }
}
module.exports = KeyTokenService