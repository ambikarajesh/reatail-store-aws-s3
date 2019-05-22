const express = require('express');
const {check, body} = require('express-validator/check');
const User = require('../../models/user');
const router = express.Router();

const authController = require('../../controller/auth/auth');
router.get('/login', authController.getLogin);
router.post('/login', [check('email').isEmail().withMessage('Please Enter Valid Email !!!').normalizeEmail(),
                       check("password").isLength({min:8}).withMessage('Please Enter Valid Password !!!').trim()], authController.postLogin);
router.get('/signup', authController.getSignup);

router.post('/signup', [check('email').isEmail().withMessage('Please Enter Valid Email !!!').normalizeEmail().custom((value, {req})=>{
                            return User.findOne({email:req.body.email}).then(user => {
                                if(user){
                                    return Promise.reject('E-mail Alredy Exist !!!')
                                }
                                return true;
                            })
                        }), 
                        check("password").isLength({min:8}).withMessage("Password Should be Combination of One Uppercase , One Lower case, One Special Char, One Digit and atleast 8 Charaters !!!").trim(),
                        check('confirmPassword').trim().custom((value, { req }) => {
                            if (value !== req.body.password) {                               
                                throw new Error('Password Confirmation does not Match Password !!!');
                            }else{
                                return true;
                            }                           
                        })], authController.postSignup);
router.post('/logout', authController.postLogout);
router.get('/reset', authController.getPwdReset);
router.post('/reset', authController.postPwdReset);
router.get('/reset/:token', authController.getNewPassword);
router.post('/reset/newpassword', authController.postNewPassword);
module.exports = router;