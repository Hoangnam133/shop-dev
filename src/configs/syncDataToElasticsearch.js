const productModel = require('../models/productModel');
const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

const syncProductsToElasticsearch = async () => {
    try {
        // Kiểm tra xem có sản phẩm nào trong MongoDB không
        const products = await productModel.find();
        if (products.length === 0) {
            console.log("Không có sản phẩm nào để đồng bộ.");
            return { message: "No products found in MongoDB." };
        }

        // Kiểm tra chỉ mục 'products' có tồn tại không
        const indexExists = await client.indices.exists({ index: 'products' });

        if (!indexExists) {
            // Tạo chỉ mục nếu không tồn tại
            await client.indices.create({
                index: 'products',
                body: {
                    settings: {
                        analysis: {
                            tokenizer: {
                                standard: { type: 'standard' }
                            },
                            filter: {
                                asciifolding: { type: 'asciifolding' } // Loại bỏ dấu
                            },
                            analyzer: {
                                remove_accents_analyzer: {
                                    tokenizer: 'standard',
                                    filter: ['asciifolding']
                                }
                            }
                        }
                    },
                    mappings: {
                        properties: {
                            product_data: {
                                type: 'text',
                                analyzer: 'remove_accents_analyzer' // Sử dụng analyzer loại bỏ dấu cho product_name
                            },
                            product_thumb: { type: 'text' }
                        }
                    }
                }
            });
            console.log("Chỉ mục 'products' đã được tạo.");
        } else {
            console.log("Chỉ mục 'products' đã tồn tại.");
        }

        // Đồng bộ từng sản phẩm lên Elasticsearch
        for (let product of products) {
            await client.update({
                index: 'products',
                id: product._id.toString(), // Đảm bảo _id là chuỗi
                body: {
                    doc: {
                        product_data: product.product_name + " " + product.product_description,
                        product_thumb: product.product_thumb,
                        product_price: product.product_price,
                        product_name: product.product_name, 
                        isDelete: product.isDeleted,
                        isPublish: product.isPublished,
                        product_description: product.product_description,
                        product_ratingAverage: product.product_ratingAverage,
                        preparation_time: product.preparation_time,
                        required_points: product.required_points,
                        createdAt: product.createdAt
                    },
                    doc_as_upsert: true // Nếu không có tài liệu, sẽ tạo mới
                }
            });
            console.log(`Đã đồng bộ sản phẩm: ${product.product_name}`);
        }

        return {
            message: "Đồng bộ sản phẩm thành công."
        };
    } catch (error) {
        console.error("Lỗi khi đồng bộ sản phẩm với Elasticsearch:", error);
        throw new Error("Lỗi khi đồng bộ sản phẩm với Elasticsearch");
    }
};

module.exports = {
    syncProductsToElasticsearch
};
