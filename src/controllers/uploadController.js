const {uploadImageFromLocalS3} = require('../services/uploadService')
const {SuccessResponse} = require('../core/successResponse')
const {BadRequestError} = require('../core/errorResponse')
class UploadController {
    uploadImageFromLocalS3 = async(req, res, next) => {
        const {file} = req
        if(!file){
            throw new BadRequestError('file missing')
        }
        new SuccessResponse({
            message: 'upload successfully',
            metaData: await uploadImageFromLocalS3(file)
        }).send(res)
    }
}
module.exports = new UploadController()