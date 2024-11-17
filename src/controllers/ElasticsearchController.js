const ELService = require('../services/elasticsearchService');
const { SuccessResponse } = require('../core/successResponse');

class ELSController {
    searchProduct = async (req, res, next) => {
        try {
            const { query } = req.query;
            if (!query) {
                return res.status(400).json({ message: 'Query không được để trống' });
            }

            const products = await ELService.searchProduct(query);
            if (products.message) {
                return res.status(404).json({ message: products.message });
            }

            new SuccessResponse({
                message: 'Products found successfully',
                metaData: products
            }).send(res);
        } catch (error) {
            next(error); // Truyền lỗi cho middleware xử lý
        }
    }
}

module.exports = new ELSController();
