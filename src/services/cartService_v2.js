const {addTocart,
    removeProductFromCart,
    incOfDecProductQuantity, getCart} = require('../repositories/cartRepository_v3')

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
    static async getCart({user}) {
        return await getCart(user)
    }
}
module.exports = CartServiceV2