const {s3, PutObjectCommand, GetObjectCommand, DeleteBucketCommand} = require('../configs/s3.config')
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto =require('crypto')
const dotenv = require('dotenv')
dotenv.config()
const randomFileName = ()=> crypto.randomBytes(16).toString('hex')
const urlPublic = process.env.AWS_CLOUDFRONT
const uploadImageFromLocalS3 = async(file)=>{
    try{
        const imageName = randomFileName()
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: imageName,
            Body: file.buffer,
            ContentType: 'image/jpeg'
        })
       
        const result = await s3.send(command)
        console.log(result)
        const signedUrl = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: imageName,
            
        });
        // const url = await getSignedUrl(s3, signedUrl, { expiresIn: 3600 });
        // console.log('url',url)

        return `${urlPublic}/${imageName}`
        
    }catch(error){
        console.log(error)
        throw new Error('Error uploading file to S3')
    }
    
}
module.exports = {
    uploadImageFromLocalS3
}
