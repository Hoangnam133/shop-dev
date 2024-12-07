const productModel = require('../models/productModel')
const {recommendProducts } = require('../utils/recommentdationUtils_V4')
const {SuccessResponse} = require('../core/successResponse')
class RecommendationController{
    getRecommendations = async (req, res, next)=>{
        const userId = req.userId;  
        const recommendedProductIds = await recommendProducts(userId);  
        let products
        if(recommendedProductIds){
            products = await productModel.find({
                _id: { $in: recommendedProductIds }
            }).select('product_thumb product_price product_name').limit(10);
        }
        else{
            products = await productModel.find({}).select('product_thumb product_price product_name').sort({ createdAt: -1 }).limit(10)
        }
        new SuccessResponse({
            message: 'Recommendations fetched successfully',
            metaData: products
        }).send(res);  
    }
}
module.exports = new RecommendationController();