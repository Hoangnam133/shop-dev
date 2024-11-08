const multer = require('multer');
const uploadMemory = multer({
    storage: multer.memoryStorage()
})
const uploadDisk = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './src/uploads')
          },
          filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
            cb(null, `${Date.now()}-${file.originalname}`)
          }
    })
})

module.exports = {
    uploadMemory,
    uploadDisk
}