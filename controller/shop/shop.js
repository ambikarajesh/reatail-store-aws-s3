const Product = require('../../models/product');
const User = require('../../models/user');
const Order = require('../../models/order');
const path = require('path');
const fs = require('fs');
const PDFkit = require('pdfkit');
//const stripe_key = require('../../api_key').stripe_key;
var stripe = require("stripe")(process.env.STRIPE_KEY);
exports.getIndex= async(req, res, next)=>{
    res.render('shop/home', {
        pageTitle : 'Shop',
        path: '/'
    })
}

exports.getProducts = (req, res, next)=>{
    Product.find().then(products => {
        res.render('shop/product-list', {
            pageTitle : 'Products',
            path: '/products',
            products:products
        });
    })
}

exports.getProduct = (req, res, next)=>{
    Product.findById(req.params.productId).then(product => {
        res.render('shop/product-detail', {
            pageTitle : 'Products',
            path: '/products',
            product:product
        })
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
    });        
}

exports.getCart = (req, res, next)=>{
    User.findOne({_id:req.user._id}).populate('cart.items.productId saveForLater.productId').then(user => {        
        res.render('shop/cart', {
            pageTitle : 'My Cart',
            path: '/cart',
            items: user.cart.items,
            products: user.saveForLater,
            subTotal: user.cart.subTotal
        })
    })        
}

exports.addProducttoCart = (req, res, next) =>{ 
    //console.log(req.body, req.user)
    req.user.addToCart(req.body.productId, req.body.price).then(() => {
        res.redirect('/cart');  
    })
}

exports.DecreaseCartItem = (req, res, next) => {
    req.user.decItem(req.body.productId, req.body.price).then(() => {
        res.redirect('/cart');       
    })
}

exports.IncreaseCartItem = (req, res, next) => {
    req.user.incItem(req.body.productId, req.body.price).then(() => {
        res.redirect('/cart');       
    })
}

exports.deleteCartItem = (req, res, next) => {
    req.user.deleteCartItem(req.body.productId, req.body.price).then(() => {
        res.redirect('/cart');       
    })
}


exports.moveToCartItem = (req, res, next) => {
    req.user.moveToCartItem(req.body.productId, req.body.price).then(() => {
        res.redirect('/cart');       
    })
}

exports.saveForLaterItem = (req, res, next) => {
    req.user.saveLaterItem(req.body.productId, req.body.price).then(() => {
        res.redirect('/cart');       
    })
}

exports.deleteSaveLaterItem =(req, res, next) => {
    req.user.deleteSaveLaterItem(req.body.productId).then(() => {
        res.redirect('/cart');       
    })
}

exports.getOrders = (req, res, next)=>{
    Order.find({userId:req.user._id}).populate({path:'items.productId userId', select:'name price image quantity userId', populate:{path:'userId'}}).then(orders =>{
       res.render('shop/orders', {
            pageTitle : 'My Orders',
            path: '/orders',
            orders:orders
        })
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
    });    
}

exports.getCheckout = (req, res, next)=>{
    User.findOne({_id:req.user._id}).populate('cart.items.productId').then(user => {  
        res.render('shop/checkout', {
            pageTitle : 'Checkout',
            path: '/checkout',
            items: user.cart.items,
            subTotal: user.cart.subTotal

        })
    })
}

exports.postOrderNow = (req, res, next)=>{       
    const token = req.body.stripeToken;
    let total = 0;
    req.user.populate('cart.items.productId').execPopulate().then(user => {  
        total = user.cart.subTotal;
        const orderItems = user.cart.items.map(item => {
            return {productId:item.productId, quantity:item.quantity}
        })
        const order = new Order({
            items:orderItems,
            userId: user._id,
            total:user.cart.subTotal
        })
        
        return order.save();         
    }).then((result)=>{        
    (async () => {
        const charge = await stripe.charges.create({
            amount: Math.round(total.toFixed(2)*100),
            currency: 'usd',
            description: 'Example charge',
            source: token,
            metadata:{orderId:result._id.toString()}
        });
        })();  
        req.user.clearCartItems();     
        res.render('shop/orderdone', {
            pageTitle : 'Order Success',
            path: '/order-now'
        })
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        next(error);
    });     
}


exports.getInvoice = (req,res,next) => {    
    Order.findById(req.params.orderId).populate('items.productId').then(order =>{
        if(!order){
            throw new Error('Order not find');
        }
        if(order.userId.toString() !== req.user._id.toString()){
            throw new Error('Different User');
        }
        const invoiceName = 'invoice-'+req.params.orderId+'.pdf';
        const invoicePath = path.join('invoices', invoiceName);
        const pdfkit = new PDFkit();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="'+invoiceName+'"')
        pdfkit.pipe(fs.createWriteStream(invoicePath));
        pdfkit.pipe(res);
        pdfkit.text('Orders:');
        pdfkit.text('---------');  
        pdfkit.text('                ');      
        order.items.forEach((item , index)=>{
            pdfkit.text('                ');
            pdfkit.text((index+1)+'. ' +item.productId.name+'      -      '+item.quantity+'lb * $'+item.productId.price);
        })
        pdfkit.text('                ');
        pdfkit.text('                ');
        pdfkit.fontSize(14).text('Total:  $'+order.total)
        pdfkit.end();
    }).catch(err =>{
        return next(err);
    })    
}