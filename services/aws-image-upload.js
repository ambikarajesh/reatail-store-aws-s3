const multer = require('multer');
const multerS3 = require('multer-s3');  
const aws = require('aws-sdk');
const dotenv = require('dotenv');
dotenv.config();

aws.config.update({
    secretAccessKey:process.env.SECRET_ACCESS_KEY,
    accessKeyId:process.env.ACCESS_KEY_ID,
    region:'us-east-2'
})

console.log(process.env.SECRET_ACCESS_KEY)
const s3 = new aws.S3({apiVersion: '2006-03-01'});
const upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: 'sweet-store',
      acl: 'public-read',
      metadata: function (req, file, cb) {
        cb(null, {fieldName: 'META_DATA_ITEMS'});
      },
      key: function (req, file, cb) {
        cb(null, Date.now().toString())
      }
    })
})

const delImage = (delfile) => {
  console.log(delfile)
    const params = {
        Bucket: 'sweet-store',
        Key:delfile
    };
    s3.deleteObject(params, function (err, data) {
      if (err) console.log(err, err.stack); // an error occurred
      else     console.log(data);
    });
}

module.exports = {
 upload, delImage
}

//  const singleUpload = upload.single('image');

// app.post('/image-upload', function(req, res) {
//     console.log(req.body)
//   singleUpload(req, res, function(err, some) {
//     console.log(req.body)
//     if (err) {
//       return res.status(422).send({errors: [{title: 'Image Upload Error', detail: err.message}] });
//     }

//     return res.json({'imageUrl': req.file.location, "name":req.body.name});
//   });
// })