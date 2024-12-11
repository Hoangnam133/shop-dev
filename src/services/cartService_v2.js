const {addTocart,
    removeProductFromCart,
    incOfDecProductQuantity, getCartByUserId} = require('../repositories/cartRepository_v5')

class CartServiceV2 {
    static async addTocart({user, product, shop}) {
        return await addTocart({user, product, shop})
    }
    static async removeProductFromCart({ user, product }) {
        return await removeProductFromCart({user, product })
    }
    static async incOfDecProductQuantity({user, product, shop, action}) {
        return await incOfDecProductQuantity({user, product, shop, action})
    }
    static async getCartByUserId(user) {
        return await getCartByUserId(user)
    }
}
module.exports = CartServiceV2