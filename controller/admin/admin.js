const fs = require('fs');
const Product = require('../../models/product');
const {validationResult} = require('express-validator/check');
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
}).single('image');
// const UsersModel = require('../../models/usersModel');
// const usersModel = new UsersModel();
//admin openadd-product page for adding new product
//get of add-product page
exports.addProduct = (req, res, next)=>{     
    res.render('admin/edit-product', {
        pageTitle : 'Admin',
        path : '/admin/add-product',
        edit:false,
        errorMessage:req.flash('error'),
        hasError:false,
        product:{
            name:"",
            image:"",
            price:"",
            ingredients:""
        },
        validateInput:[]
    })
}

//store product in database from add-product page no update
//post of add-product page -> 
exports.getProduct = (req, res, next)=>{
    // const errors = validationResult(req);
    // if(!errors.isEmpty()) {
    //     req.flash('error', errors.array()[0].msg);
    //     return res.render('admin/edit-product', {
    //             pageTitle : 'Admin',
    //             path : '/admin/add-product',
    //             edit:false,
    //             errorMessage:req.flash('error'),
    //             hasError:true,
    //             product:{
    //                 name:req.body.name,
    //                 price:req.body.price,
    //                 ingredients:req.body.ingredients
    //             },
    //             validateInput:errors.array()
    //     })
    // }
    // singleUpload(req, res, function(err, some) { 
    //     console.log(req)           
    //         if (err) {
    //             req.flash('error', 'Upload Image');
    //                 return res.render('admin/edit-product', {
    //                     pageTitle : 'Admin',
    //                     path : '/admin/add-product',
    //                     edit:false,
    //                     errorMessage:req.flash('error'),
    //                     hasError:false,
    //                     product:{
    //                         name:req.body.name,
    //                         price:req.body.price,
    //                         ingredients:req.body.ingredients
    //                     },
    //                     validateInput:[]
    //                 })
    //         }
            
    //         const product = new Product({name:req.body.name, image:req.file.location, price:req.body.price, ingredients:req.body.ingredients, userId:req.user});
    //             product.save().then(() => {
    //             res.redirect('/admin/products')
    //         }).catch(err => {
    //             const error = new Error(err);
    //             error.httpStatusCode = 500;
    //             next(error);
    //         });
    //  });       
    upload(req, res, function(err, some) { 
        if (err) {          
            req.flash('error', `Image Upload Error: ${err.message}`);
            return res.render('admin/edit-product', {
                pageTitle : 'Admin',
                path : '/admin/add-product',
                edit:false,
                errorMessage:req.flash('error'),
                hasError:false,
                product:{
                    name:'',
                    price:'',
                    ingredients:''
                },
                validateInput:[]
            })
        }
        const product = new Product({name:req.body.name, image: req.file.location, key:req.file.key, price:req.body.price, ingredients:req.body.ingredients, userId:req.user});
            product.save().then(() => {
            res.redirect('/admin/products')
        }).catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            next(error);
        });
    })
}


//fetch products from database when click products in admin
//get of /admin/products
exports.getProducts = (req, res, next)=>{
    Product.find({userId:req.user._id}).then(products => {
        res.render('admin/products', {
            pageTitle : 'Admin Products',
            path: '/admin/products',
            products:products,
        })
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
    }); 
}


// delete product in admin-products page when click delete button and redirect to the same page 
// post of /admin/products
exports.deleteProduct = (req, res, next)=>{    
    Product.findById(req.params.productId).then(product =>{
        const params = {
            Bucket: 'sweet-store',
            Key:product.key
        };
        s3.deleteObject(params, function (err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else {         
                Product.deleteOne({_id:req.params.productId, userId:req.user._id}).then (() => {       
                        res.json({message:'success'});       
                }).catch(err => {
                        res.json({message:'failed'});
                        const error = new Error(err);
                        error.httpStatusCode = 500;
                        next(error);
                });
            } 
        })
    })   
     
}

    
//open add porduct page for edit product 
//get of edit product in add-product page -> edit button in admin products page
exports.editProduct = async (req, res, next)=>{
   Product.findById(req.params.productId).then(product =>{      
        res.render('admin/edit-product', {
            pageTitle : 'Admin',
            path : '/admin/add-product',
            edit:req.query.edit,
            product:{
                name:product.name,
                price:product.price,
                ingredients:product.ingredients,
                _id:product._id,
                },
            errorMessage:req.flash('error'),
            validateInput:[]
        })                 
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
    });    
  }


//update product in add-product page
//post of edit-product page -> update product button
exports.postEditProduct = (req,res,next) =>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        req.flash('error', errors.array()[0].msg);
        return res.render('admin/edit-product', {
            pageTitle : 'Admin',
            path : '/admin/add-product',
            edit:false,
            errorMessage:req.flash('error'),
            hasError:true,
            product:{
                name:req.body.name,
                price:req.body.price,
                ingredients:req.body.ingredients
            },
            validateInput:errors.array()
        })
     }
    // if(!req.file){
    //     req.flash('error', 'Upload Image');
    //     return res.render('admin/edit-product', {
    //         pageTitle : 'Admin',
    //         path : '/admin/add-product',
    //         edit:false,
    //         errorMessage:req.flash('error'),
    //         hasError:false,
    //         product:{
    //             name:req.body.name,
    //             price:req.body.price,
    //             ingredients:req.body.ingredients
    //         },
    //         validateInput:[]
    //     })
    // }    
    Product.findById(req.body.id).then(product =>{
        product.name = req.body.name;
        product.image = req.body.image;
        product.price = req.body.price;
        product.ingredients = req.body.ingredients;     
        Product.findOne({_id:req.body.id, userId:req.user._id}).then((item)=>{
            if(!item){
                return res.redirect('/admin/products');
            }    
            // fs.unlink(item.image, (err)=>{
            //     console.log(err)
            // })        
            product.save((err)=>{
                if(err){
                    return next(err);
                }
                res.redirect('/admin/products')
            })                
        }).catch(err => {
            throw new Error("Can't find product in database for editing")
        });   
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
    });    
}

