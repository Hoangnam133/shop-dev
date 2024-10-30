const { NotFoundError, BadRequestError } = require('../core/errorResponse')
const {unGetSelectData} = require('../utils/index')
const {createCart, getCartByUser, updateProductQuantityInCart, fillQuantityInBlank, insertNewProductInCart, deleteProductCart, addToCart} = require('../repositories/cartRepository')
class CartServiceV2 {

    static async createCart({ user, product }) {
        return await createCart({ user, product})
    }
    static async getCartByUser({ user }) {
       return getCartByUser({ user })
    }
    static async updateProductQuantityInCart({ user, product }) {
        return await updateProductQuantityInCart({ user, product})
    }
    static async insertNewProductInCart({userCart, foundProduct, product}) {
        return await insertNewProductInCart({userCart, foundProduct, product})
    }
    static async addToCart({ user, product }) {
        return await addToCart({ user, product})
    }
    static async deleteProductCart({ user, product }) {
        return await deleteProductCart({ user, product})
    }
    static async fillQuantityInBlank({user, product}) {
        return await fillQuantityInBlank({user, product})
    }
    
}
module.exports = CartServiceV2
