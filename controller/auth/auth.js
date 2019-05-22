const User = require('../../models/user');
const bcrypt = require('bcrypt');
const nodeMailer = require('nodemailer');
const nodeMailerTransport = require('nodemailer-sendgrid-transport');
const {validationResult} = require('express-validator/check');
const crypto = require('crypto');
//const sendGrid_API_Key = require('../../api_key').sendGrid_API_Key;

const Transport = nodeMailer.createTransport(nodeMailerTransport({
    auth:{
        api_key:process.env.SENDGRID_API
    }
}))

exports.getLogin = (req, res, next)=>{
    res.render('auth/login', {
        pageTitle : 'Login',
        path: '/auth/login',
        errorMessage:req.flash('error'),
        successMessage:req.flash('success'),
        oldInput:{
            email:"",
            password:""
        },
        validateInput:[]
    })
}

exports.postLogin = (req, res, next)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
       req.flash('error', errors.array()[0].msg)
       return res.status(422).render('auth/login', {
            pageTitle : 'Login',
            path: '/auth/login',
            errorMessage:req.flash('error'),
            successMessage:req.flash('success'),
            oldInput:{
                email:req.body.email,
                password:req.body.password
            },
            validateInput:errors.array()
        });
    } 
    User.findOne({email:req.body.email}).then(user => {        
        bcrypt.compare(req.body.password, user.password, (err, result)=>{
            if(!result){
                //password wrong
                req.flash('error', 'Invalid Password')
                return res.status(422).render('auth/login', {
                    pageTitle : 'Login',
                    path: '/auth/login',
                    errorMessage:req.flash('error'),
                    successMessage:req.flash('success'),
                    oldInput:{
                        email:req.body.email,
                        password:req.body.password
                    },
                    validateInput:errors.array()
                });
            }
            req.session.userId = user._id;
            req.session.isLoggedIn = true;
            req.session.save(()=>{
                res.redirect('/')
            })
        })
    }).catch(err => {
        req.flash('error', 'Invalid Email')
        return res.status(422).render('auth/login', {
            pageTitle : 'Login',
            path: '/auth/login',
            errorMessage:req.flash('error'),
            successMessage:req.flash('success'),
            oldInput:{
                email:req.body.email,
                password:req.body.password
            },
            validateInput:errors.array()
        });
    })   
}

exports.getSignup = (req, res, next)=>{
    res.render('auth/signup', {
        pageTitle : 'SignUp',
        path: '/auth/signup',
        errorMessage:req.flash('error'),
        oldInput:{
            email:"",
            password:"",
            confirmPassword:""
        },
         validateInput:[]
    })
}

exports.postSignup = (req, res, next)=>{
   const errors = validationResult(req);
   console.log(errors.array().find(error => error.param === "email" ? "invalid" : ""));
    if (!errors.isEmpty()) {
       req.flash('error', errors.array()[0].msg)
       return res.status(422).render('auth/signup', {
            pageTitle : 'SignUp',
            path: '/auth/signup',
            errorMessage:req.flash('error'),
            oldInput:{
                        email:req.body.email,
                        password:req.body.password,
                        confirmPassword:req.body.confirmPassword
                    },
            validateInput:errors.array()
        })
    }   
    bcrypt.hash(req.body.password, 10, (err,hashPassword) => {
        if(err){            
            console.log('+++ Password Ecrypt Issue: +++', err)
        }
        else{
            const newUser = new User({email:req.body.email, password:hashPassword, cart:{items:[], subTotal:0}, saveForLater:[]});
            newUser.save((err)=>{
                if(err){
                    console.log('+++ Save Session Issue: +++', err)
                }
                const mail = {
                    to: req.body.email,
                    from: 'sweetstore@gmail.com',
                    subject: 'Signup successfully!!!',
                    text: 'yop did signup successfully in sweetstore.com',
                    html: '<b>Thank you</b>'
                }
                Transport.sendMail(mail, (err, result)=>{
                    if(err){
                        console.log("+++ Can't send email for signup +++", err)
                    }
                    req.flash('success', 'you signed up successfully!!!!');
                    return res.redirect('/auth/login');                            
                })
            })
        }
    }) 
}

exports.postLogout = (req, res, next)=>{
    req.session.destroy((err)=>{
        if(err){
            console.log(err)
        }       
        return res.redirect('/auth/login');
    });    
}

exports.getPwdReset = (req, res, next)=>{    
    res.render('auth/reset-password', {
        pageTitle : 'Password Reset',
        path: '/auth/reset',
        errorMessage:req.flash('error'),
        successMessage:req.flash('success')
    })
}

exports.postPwdReset = (req, res, next)=>{    
    User.findOne({email:req.body.email}).then((user)=>{
        if(!user){
            req.flash('error', 'No Account found this mail');
            return res.redirect('/auth/reset')
        }
        crypto.randomBytes(15, (err, buffer)=>{
            const token = buffer.toString('hex');
            user.resetToken = token;            
            user.resetTokenExpire = Date.now() + 3600000;
            user.save((err)=>{
                if(err){
                    console.log(err)
                }
                const mail = {
                    to: req.body.email,
                    from: 'sweetstore@gmail.com',
                    subject: 'Reset Password Link',
                    text: 'you did reset password in sweetstore.com',
                    html: `<b>please click the following <a href="http://localhost:3000/auth/reset/${token}">link</a> for reset password</b>`
                }
                Transport.sendMail(mail, (err, result)=>{
                    if(err){
                        console.log(err)
                    }
                    req.flash('success', 'Send email link Successfully!!!')
                    return res.redirect('/auth/reset');
                })
            })
        })
    }).catch(err=>{
        req.flash('error', 'No Account found for this mail.');
    })    
}

exports.getNewPassword = (req, res, next) => {
    User.findOne({resetToken:req.params.token, resetTokenExpire:{$gt:Date.now()}}).then(user => {        
            res.render('auth/new-password', {
            pageTitle : 'New Password',
            path: '/auth/reset/:token',
            errorMessage:req.flash('error'),
            token:req.params.token        
        })
    })   
}

exports.postNewPassword = (req, res, next) => {
    User.findOne({resetToken:req.body.token, resetTokenExpire:{$gt:Date.now()}}).then(user => { 
        if(!user){
            req.flash('error', 'Token expired. resend email for reset password');
            return res.redirect('/auth/reset');
        }
        bcrypt.hash(req.body.password, 10, (err,hashPassword) => {
            if(err){            
                console.log('+++ Password Ecrypt Issue: +++', err)
            }
            console.log(user)
            user.password = hashPassword;
            user.resetToken = undefined;
            user.resetTokenExpire = undefined;
            user.save((err, result)=>{
                if(err){
                    return res.redirect('/auth/reset');
                }
                req.flash('success', 'Update your password Successfully!!!');
                return res.redirect('/auth/login')               
            })
        })
    })
}