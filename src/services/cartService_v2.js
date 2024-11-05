const {addTocart,
    deleteProductInCart,
    incOfDecProductQuantity, getCartByUserId} = require('../repositories/cartRepository_v2')

class CartServiceV2 {
    static async addTocart({user, product, shop}) {
        return await addTocart({user, product, shop})
    }
    static async deleteProductInCart({user, product}) {
        return await deleteProductInCart({user, product})
    }
    static async incOfDecProductQuantity({user, product, shop, action}) {
        return await incOfDecProductQuantity({user, product, shop, action})
    }
    static async getCartByUserId({user}) {
        return await getCartByUserId({user})
    }
}
module.exports = CartServiceV2