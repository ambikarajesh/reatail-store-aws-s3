const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UserSchema = new Schema({
    
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }, 
    resetToken: {
        type:String
    },
    resetTokenExpire:{
        type:Date
    },
    cart:{
        items:[{
                productId:{
                    type:Schema.Types.ObjectId,
                    ref:'Product',
                    required:true
                },
                quantity:{
                    type:Number,
                    required:true
                },            
            }],
        subTotal:{
            type:Number,
            required:true
        }
    },
    saveForLater:[{
        productId:{
            type:Schema.Types.ObjectId,
            ref:'Product',
            required:true
        },
        quantity:{
            type:Number,
            required:true
        }            
    }]
    
})

UserSchema.methods.addToCart = function(productId, price) {
    const cart = this.cart;
    const UpdateItemIndex = cart.items.findIndex(item => item.productId.toString() === productId.toString());
    if(UpdateItemIndex>=0){
        cart.items[UpdateItemIndex].quantity += 1;        
    }else{
        cart.items.push({productId:productId, quantity:1});       
    }
    cart.subTotal = cart.subTotal + +price;
    this.cart = cart;
    return this.save();
}

UserSchema.methods.decItem = function(productId, price) {
    const cart = this.cart;
    const UpdateItemIndex = cart.items.findIndex(item => item.productId.toString() === productId.toString());   
    if(cart.items[UpdateItemIndex].quantity>1){
        cart.items[UpdateItemIndex].quantity -= 1;
        cart.subTotal = cart.subTotal - +price;
    }
    this.cart = cart;
    return this.save();
}

UserSchema.methods.incItem = function(productId, price) {
    const cart = this.cart;
    const UpdateItemIndex = cart.items.findIndex(item => item.productId.toString() === productId.toString())
    cart.items[UpdateItemIndex].quantity += 1;
    cart.subTotal = cart.subTotal + +price;
    this.cart = cart;
    return this.save();        
}
UserSchema.methods.deleteCartItem = function(productId, price) {
    const cart = this.cart;
    const UpdateItemIndex = cart.items.findIndex(item => item.productId.toString() === productId.toString())
    cart.subTotal = cart.subTotal - (price*cart.items[UpdateItemIndex].quantity);
    cart.items = cart.items.filter(item => item.productId.toString() !== productId.toString())
    this.cart = cart;
    return this.save();        
}

UserSchema.methods.saveLaterItem = function(productId, price) {
    const cart = this.cart;
    const UpdateItemIndex = cart.items.findIndex(item => item.productId.toString() === productId.toString())
    const checkingSaveLater = this.saveForLater.findIndex(item => item.productId.toString() === productId.toString())
    
    if(checkingSaveLater>=0){
        this.saveForLater[checkingSaveLater].quantity += cart.items[UpdateItemIndex].quantity;
    }
    else{
        this.saveForLater.push(cart.items[UpdateItemIndex])
    }
    cart.subTotal = cart.subTotal - (price*cart.items[UpdateItemIndex].quantity);
    cart.items = cart.items.filter(item => item.productId.toString() !== productId.toString())
    this.cart = cart;
    return this.save(); 
}

UserSchema.methods.moveToCartItem = function(productId, price) {
    const cart = this.cart;
    const UpdateItemIndex = this.saveForLater.findIndex(item => item.productId.toString() === productId.toString());
    const checkingCart = cart.items.findIndex(item => item.productId.toString() === productId.toString());
    
    if(checkingCart>=0){
        cart.items[checkingCart].quantity += this.saveForLater[UpdateItemIndex].quantity;
    }
    else{
        cart.items.push(this.saveForLater[UpdateItemIndex])
    }
    cart.subTotal = cart.subTotal + (price*this.saveForLater[UpdateItemIndex].quantity);
    this.saveForLater = this.saveForLater.filter(item => item.productId.toString() !== productId.toString())
    this.cart = cart;
    return this.save();     
}
UserSchema.methods.deleteSaveLaterItem = function(productId) {
    this.saveForLater = this.saveForLater.filter(item => item.productId.toString() !== productId.toString())
    return this.save();        
}

UserSchema.methods.clearCartItems = function() {
   this.cart.items = [];
    this.cart.subTotal = 0;
    return this.save();
}
module.exports = mongoose.model('User', UserSchema);