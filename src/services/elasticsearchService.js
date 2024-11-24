const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });
const {BadRequestError} = require('../core/errorResponse')
const productModel = require('../models/productModel')
class ElasticsearchService {
    static async searchProduct(query) {
        try {
            // Log yêu cầu tìm kiếm
            console.log('Yêu cầu tìm kiếm với query:', query);
            const start = Date.now();
            const result = await client.search({
                index: 'products',
                body: {
                    query: {
                        bool: {
                            must: [
                                {
                                    match_phrase_prefix: {
                                        product_data: query
                                    }
                                }
                            ],
                            filter: [
                                { term: { isDelete: false } },
                                { term: { isPublish: true } }
                            ]
                        }
                    },
                    size: 5
                }
            });
            const end = Date.now(); 
            const elapsedTime = end - start;  
            console.log('Tốc độ tìm kiếm (miligiây):', elapsedTime);
            // Log các sản phẩm tìm được
            result.hits.hits.forEach((hit, index) => {
                console.log(`Sản phẩm ${index + 1}:`);
                console.log('ID:', hit._id);
                console.log('Score:', hit._score);
                console.log('Tên sản phẩm:', hit._source.product_name);
                console.log('Ảnh sản phẩm:', hit._source.product_thumb);
                console.log('---');
            });

            // Kiểm tra nếu có sản phẩm tìm thấy
            if (result.hits.hits.length === 0) {
                console.log('Không có sản phẩm nào được tìm thấy.');
                return [];
            }

            const formattedProducts = result.hits.hits.map(hit => ({
                product_id: {
                    _id: hit._id,
                    product_name: hit._source.product_name,
                    product_description: hit._source.product_description,
                    product_thumb: hit._source.product_thumb, // Hoặc sử dụng `product_thumb` nếu có trường này
                    product_price: hit._source.product_price // Thêm trường giá sản phẩm nếu có
                }
            }));
            return { products : formattedProducts}
            
        } catch (error) {
            console.error('Lỗi khi tìm kiếm sản phẩm:', error);
            throw new Error('Lỗi trong quá trình tìm kiếm');
        }   
    }
    static async reindexAllProducts() {
        try {
            const allProducts = await productModel.find();  
            const bulkBody = allProducts.map(product => ({
                index: {
                    _index: 'products',
                    _id: product._id.toString(),
                    _source: {
                        product_name: product.product_name,
                        product_thumb: product.product_thumb,
                        product_description: product.product_description,
                        product_price: product.product_price,
                        isDeleted: product.isDeleted,
                        isPublished: product.isPublished
                    }
                }
            }));

            const bulkResponse = await client.bulk({ body: bulkBody });

            if (bulkResponse.errors) {
                console.error('Lỗi khi thêm lại tất cả các sản phẩm:', bulkResponse.errors);
                throw new BadRequestError('Bulk insert failed');
            }

            console.log('Đã thêm lại tất cả các sản phẩm vào Elasticsearch thành công');
        } catch (error) {
            console.error('Lỗi khi thêm lại sản phẩm vào Elasticsearch:', error);
            throw new BadRequestError('reindexAllProducts error');
        }
    }
}

module.exports = ElasticsearchService;
