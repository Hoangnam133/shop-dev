const productModel = require('../models/productModel')
const { createUserProductMatrix, recommendProducts } = require('../utils/recommendationUtils')
const {SuccessResponse} = require('../core/successResponse')
class RecommendationController{
    getRecommendations = async (req, res, next)=>{
        const userId = req.userId;  
        console.log('userId', userId);
        const userProductMatrix = await createUserProductMatrix();  // Tạo ma trận người dùng-sản phẩm
        const recommendedProductIds = await recommendProducts(userId, userProductMatrix);  // Lấy danh sách các sản phẩm được đề xuất
      
        // if(recommendedProductIds.length <= 0){
        //     throw new Error('No recommended products found');  // Nếu không có sản phẩm đ�� xuất nào, throw l��i
        // }
        const products = await productModel.find({
            _id: { $in: recommendedProductIds }
        })
        new SuccessResponse({
            message: 'Recommendations fetched successfully',
            metaData: products
        }).send(res);  // Trả về kết quả cho client
    }
}
module.exports = new RecommendationController();