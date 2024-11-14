const cartModel = require('../models/cartModel')
const {checkProductStockInShop} = require('../repositories/inventoryRepository')
const {checkProductInShop, getProductById} = require('../repositories/productRepository')
const {NotFoundError, BadRequestError} = require('../core/errorResponse')
const {toObjectId} = require('../utils/index')
const sideDishModel = require('../models/sideDishModel')
// Kiểm tra giỏ hàng xem tồn tại hay không
const getCartByUserId  = async(user) => {
    if (!user) throw new NotFoundError('User not found');
    
    const foundCart = await cartModel.findOne({ cart_userId: user._id })
  
    // if (!foundCart) throw new NotFoundError('Cart not found')

    return foundCart
}
const getCart  = async(user) => {
    if (!user) throw new NotFoundError('User not found');
    
    const foundCart = await cartModel.findOne({ cart_userId: user._id })
    .populate(
        {
         path: 'cart_products.product_id',
         select: 'product_name product_thumb'
        }
    )
  
    // if (!foundCart) throw new NotFoundError('Cart not found')

    return foundCart
}
const checkStockAndProductInShop = async({product_id, shop_id, quantity})=>{
    // kiểm tra sản phẩm có nằm trong shop này hay không
    const checkProduct = await checkProductInShop(shop_id, product_id)
    if(!checkProduct){
        throw new NotFoundError('Product not found in shop')
    }
    // kiểm tra sản phẩm xem có đủ số lượng để thêm vào giỏ hàng hay không
    const checkQuantityProduct = await checkProductStockInShop({shop_id, product_id, quantity})
    if(!checkQuantityProduct){
        throw new BadRequestError('Not enough product in stock')
    }
}
// tạo giỏ hàng 
const createUserCart = async({user, product, shop})=>{
    const shop_id = shop._id
    const {product_id, quantity, sideDish_ids = []} = product
    console.log('Checking product in shop with shop_id:', shop_id, 'and product_id:', product_id);
    await checkStockAndProductInShop({product_id, shop_id, quantity})
    const getProduct = await getProductById(product_id)
    const sideDishs = await sideDishModel.find({
        _id: {$in: sideDish_ids}
    })
    if(sideDishs.length !== sideDish_ids.length){
        throw new BadRequestError('One or more side dish are not valid')
    }
    let totalPriceSideDish = sideDishs.reduce((total, dish) => total + dish.price, 0)
    const payload = {
        cart_userId: user._id,
        cart_status: 'active',
        cart_products:[{
                product_id,
                quantity,
                totalPrice: quantity * getProduct.product_price + totalPriceSideDish * quantity,
                sideDishes: sideDishs.map(dish => ({
                    sideDish_id: dish._id,
                    quantity: 1,  
                    sideDish_name: dish.sideDish_name
            }))
        }]
    }

    const createCart = await cartModel.create(payload)
    if(!createCart){
        throw new BadRequestError('Create cart failed')
    }

    return createCart
}
// thêm sản phẩm vào giỏ hàng trống
const addProductToEmptyCartIfAbsent = async({user, product, shop})=>{
    const {product_id, quantity, sideDish_ids = []} = product
    const shop_id = shop._id

    await checkStockAndProductInShop({product_id, shop_id, quantity})
    const foundCart = await getCartByUserId (user)
    const getProduct = await getProductById(product_id)

    const sideDishs = await sideDishModel.find({
        _id: {$in: sideDish_ids}
    })
    if(sideDishs.length !== sideDish_ids.length){
        throw new BadRequestError('One or more side dish are not valid')
    }
    let totalPriceSideDish = 0
    for(let i = 0; i < sideDishs.length; i++) {
        totalPriceSideDish += sideDishs[i].price;
    }
    const payload = {
        $push:{
            cart_products: {
                product_id,
                quantity,
                totalPrice: quantity * getProduct.product_price + totalPriceSideDish * quantity,
                sideDishes: sideDishs.map(dish => ({
                    sideDish_id: dish._id,
                    quantity: 1,  
                    sideDish_name: dish.sideDish_name
            }))
            }
        }
    },
    options =  {
        new: true
       
    }
    const updateCart = await cartModel.findByIdAndUpdate(foundCart._id, payload, options)
    if(!updateCart){
        throw new BadRequestError('Add product to cart failed')
    }
    return updateCart
}
// const updateCartProductQuantity = async ({ user, product, shop }) => {
//     const { product_id, quantity, sideDish_ids = [] } = product;
//     const shop_id = shop._id;

//     await checkStockAndProductInShop({ product_id, shop_id, quantity });
//     const foundCart = await getCartByUserId(user);
//     const getProduct = await getProductById(product_id);

//     const sideDishes = await sideDishModel.find({
//         _id: { $in: sideDish_ids }
//     });
//     if (sideDishes.length !== sideDish_ids.length) {
//         throw new BadRequestError('One or more side dishes are not valid');
//     }

//     let totalPriceSideDish = 0
//     for(let i = 0; i < sideDishes.length; i++) {
//         totalPriceSideDish += sideDishes[i].price;
//     }
    
//     // Chuẩn hóa danh sách món phụ để dễ so sánh
//     const sortedNewSideDishes = sideDishes.map(dish => dish._id.toString()).sort();

//     // Tìm sản phẩm có cùng product_id và sideDishes trong giỏ hàng
//     let findProductInCart = foundCart.cart_products.find(product => 
//         product.product_id.toString() === product_id.toString() &&
//         product.sideDishes.map(d => d.sideDish_id.toString()).sort().every((id, index) => id === sortedNewSideDishes[index])
//     );

//     if (findProductInCart) {
//         // Cập nhật số lượng nếu món phụ trùng khớp
//         console.log(' chạy vào // Cập nhật số lượng nếu món phụ trùng khớp')
//         const newQuantity = findProductInCart.quantity + quantity;
//         const newTotalPrice = newQuantity * getProduct.product_price + newQuantity * totalPriceSideDish;

//         const payload = {
//             $set: {
//                 'cart_products.$[elem].quantity': newQuantity,
//                 'cart_products.$[elem].totalPrice': newTotalPrice
//             }
//         };
//         const options = { 
//             arrayFilters: [
//                 { 
//                     "elem.product_id": product_id,
//                     "elem.sideDishes": { $size: sortedNewSideDishes.length }, // Ensures the correct count of side dishes
//                     "elem.sideDishes.sideDish_id": { $all: sortedNewSideDishes } // Matches sideDish_id values directly
//                 }
//             ], 
//             new: true 
//         }

//         const updateCart = await cartModel.findOneAndUpdate({ _id: foundCart._id }, payload, options);
//         if (!updateCart) {
//             throw new BadRequestError('Update product quantity in cart failed');
//         }
//         return updateCart;
//     }

//     // Nếu món phụ khác nhau hoặc sản phẩm chưa tồn tại trong giỏ, thêm sản phẩm mới
//     console.log(' chạy vào // Nếu món phụ khác nhau hoặc sản phẩm chưa tồn tại trong giỏ, thêm sản phẩm mới')
//     const payload = {
//         $push: {
//             cart_products: {
//                 product_id,
//                 quantity,
//                 totalPrice: quantity * getProduct.product_price + totalPriceSideDish * quantity,
//                 sideDishes: sideDishes.map(dish => ({
//                     sideDish_id: dish._id,
//                     quantity: 1,  
//                     sideDish_name: dish.sideDish_name
//                 }))
//             }
//         }
//     };
//     const options = { new: true };
//     const filter = { _id: foundCart._id };

//     const updateCart = await cartModel.findOneAndUpdate(filter, payload, options);
//     if (!updateCart) {
//         throw new BadRequestError('Add product to cart failed');
//     }
//     return updateCart;
// };
const updateCartProductQuantity = async ({ user, product, shop }) => {
    const { product_id, quantity, sideDish_ids = [] } = product;
    const shop_id = shop._id;

    // Kiểm tra tồn kho sản phẩm và số lượng yêu cầu
    await checkStockAndProductInShop({ product_id, shop_id, quantity });
    
    // Tìm giỏ hàng của người dùng và sản phẩm muốn thêm
    const foundCart = await getCartByUserId(user);
    const getProduct = await getProductById(product_id);


    // Lấy thông tin món phụ và kiểm tra tính hợp lệ
    const sideDishes = await sideDishModel.find({ _id: { $in: sideDish_ids } });
    if (sideDish_ids.length > 0 && sideDishes.length !== sideDish_ids.length) {
        throw new BadRequestError('Một hoặc nhiều món phụ không hợp lệ');
    }
    let totalPriceSideDish = 0
    for(let i = 0; i < sideDishes.length; i++) {
        totalPriceSideDish += sideDishes[i].price;
    }
    // Sắp xếp mảng món phụ để so sánh dễ dàng hơn
    const sortedNewSideDishes = sideDishes.map(dish => dish._id.toString()).sort();
    let productFound = false;

    // Duyệt qua các sản phẩm trong giỏ hàng
    for (let i = 0; i < foundCart.cart_products.length; i++) {
        const currentProduct = foundCart.cart_products[i];

        // Lấy mảng món phụ của sản phẩm hiện tại và sắp xếp để so sánh
        const sortedOldSideDishes = currentProduct.sideDishes.map(dish => dish.sideDish_id.toString()).sort();

        // Kiểm tra nếu cùng `product_id` và món phụ giống nhau
        if (currentProduct.product_id.toString() === product_id.toString() &&
            JSON.stringify(sortedNewSideDishes) === JSON.stringify(sortedOldSideDishes)) {
            // Cập nhật số lượng và tổng giá nếu tìm thấy sản phẩm giống nhau
            let oldQuantity = currentProduct.quantity, newQuantity = 0
            newQuantity = oldQuantity + quantity
            currentProduct.quantity = newQuantity
            currentProduct.totalPrice = (totalPriceSideDish + getProduct.product_price) * newQuantity
            productFound = true;
            break; // Dừng vòng lặp vì đã tìm thấy
        }
    }

    if (!productFound) {
        // Thêm mới sản phẩm nếu không tìm thấy sản phẩm nào giống
        foundCart.cart_products.push({
            product_id,
            quantity,
            totalPrice: (getProduct.product_price + totalPriceSideDish) * quantity,
            sideDishes: sideDishes.map(dish => ({
                sideDish_id: dish._id,
                quantity: 1,
                sideDish_name: dish.sideDish_name
            }))
        });
    }

    // Cập nhật giỏ hàng
    const updatedCart = await cartModel.findByIdAndUpdate(foundCart._id, foundCart, { new: true });
    return updatedCart;
};


// thêm sản phẩm vào giỏ hàng
const addTocart = async({user, product, shop}) => {
    let foundCart = await getCartByUserId(user)
    const attached = {
        path: 'cart_products.product_id',
        select: 'product_name product_thumb'
    }
  

    if (!foundCart) {
        console.log(' chạy vào //// Nếu giỏ hàng chưa tồn tại, tạo giỏ hàng mới')
        foundCart = await createUserCart({ user, product, shop})
        return foundCart.populate(attached)
    }

   
    if (!foundCart.cart_products.length) {
        console.log(' chạy vào // Nếu giỏ hàng đã tồn tại nhưng không có sản phẩm')
        const updateCart = await addProductToEmptyCartIfAbsent({ user, product, shop})
        return updateCart.populate(attached)
    }
    console.log(' chạy vào // Nếu nếu sản phẩm đã tồn tại trogn giỏ hàng')
    const updateCart =  await updateCartProductQuantity({ user, product, shop})
    return  updateCart.populate(attached)
   
};


// xóa sản phẩm khỏi giỏ hàng
const removeProductFromCart = async ({ user, product}) => {
    const { product_id, sideDish_ids = [] } = product
    const foundCart = await getCartByUserId(user);
    if (!foundCart) throw new NotFoundError('Cart not found');

    const sortedSideDishesToRemove = sideDish_ids.sort();
    foundCart.cart_products = foundCart.cart_products.filter(product => {
        const sortedExistingSideDishes = product.sideDishes.map(d => d.sideDish_id.toString()).sort();
        return !(product.product_id.toString() === product_id.toString() &&
            JSON.stringify(sortedExistingSideDishes) === JSON.stringify(sortedSideDishesToRemove));
    });

    // Cập nhật giỏ hàng sau khi xóa sản phẩm
    const updatedCart = await cartModel.findByIdAndUpdate(foundCart._id, foundCart, { new: true });
    if(!updatedCart){
        throw new BadRequestError('remove product in cart');
    }
    return updatedCart;
}

const incOfDecProductQuantity = async ({ user, product, shop, action }) => {
    const { product_id, sideDish_ids = [] } = product;
    if (!shop) {
        throw new BadRequestError('Shop data is missing');
    }

    const shop_id = shop._id;
    const sideDishes = await sideDishModel.find({ _id: { $in: sideDish_ids } });
    if (sideDish_ids.length > 0 && sideDishes.length !== sideDish_ids.length) {
        throw new BadRequestError('Một hoặc nhiều món phụ không hợp lệ');
    }
    let totalPriceSideDish = 0
    for(let i = 0; i < sideDishes.length; i++) {
        totalPriceSideDish += sideDishes[i].price;
    }
    await checkStockAndProductInShop({ product_id, shop_id, quantity: 1 });
    const foundCart = await getCartByUserId(user);
    const getProduct = await getProductById(product_id);

    // Tìm sản phẩm trong giỏ hàng với ID sản phẩm và danh sách món phụ (sideDish_ids) tương ứng
    const findProductInCart = foundCart.cart_products.find(product => {
        const sortedSideDishes = product.sideDishes.map(d => d.sideDish_id.toString()).sort();
        const sortedSideDishesToRemove = sideDish_ids.sort();
        return product.product_id.toString() === product_id.toString() && 
               JSON.stringify(sortedSideDishes) === JSON.stringify(sortedSideDishesToRemove);
    });

    if (!findProductInCart) {
        throw new NotFoundError('Product not found in cart');
    }

    const oldQuantity = findProductInCart.quantity;
    let newQuantity = 0;
    if (action === 'inc') {
        newQuantity = oldQuantity + 1;
    } else {
        newQuantity = oldQuantity - 1;
        if (newQuantity <= 0) {
            // Nếu số lượng giảm xuống 0, xóa sản phẩm khỏi giỏ hàng
            return await removeProductFromCart({ user, product });
        }
    }

    // Update the quantity and total price of the product in the cart
    findProductInCart.quantity = newQuantity;
    findProductInCart.totalPrice = newQuantity * (getProduct.product_price + totalPriceSideDish); // assuming `getProduct.price` is the base price of the product
    console.log(' giá hiện tại ',findProductInCart.totalPrice)
    // Save the updated cart back to the database
    const updatedCart = await cartModel.findByIdAndUpdate(foundCart._id, foundCart, { new: true })
        .populate({
            path: 'cart_products.product_id',
            select: 'product_name product_thumb'
        });

    if (!updatedCart) {
        throw new BadRequestError('Error while updating cart');
    }

    return updatedCart;
};



module.exports = {
    addTocart,
    removeProductFromCart,
    incOfDecProductQuantity,
    getCartByUserId,
    getCart
}