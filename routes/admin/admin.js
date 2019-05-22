const express = require('express');
const authMiddleware = require('../../middleware/middleware');
const router = express.Router();
const {check} = require('express-validator/check');
const adminController = require('../../controller/admin/admin')
router.get('/add-product', authMiddleware, adminController.addProduct);
 router.post('/add-product', [check('name').isString().isLength({min:5}).trim().withMessage('Invalid Title'),
                                check('price').isFloat().withMessage('Invalid Price').trim(),
                                check('ingredients').isString().isLength({min:5, max:100}).trim().withMessage('Invalid Ingredients')], authMiddleware, adminController.getProduct);
router.get('/edit-product/:productId', authMiddleware, adminController.editProduct);
router.post('/edit-product', [check('name').isString().isLength({min:5}).trim().withMessage('Invalid Title'),
                                check('price').isFloat().withMessage('Invalid Price').trim(),
                                check('ingredients').isString().isLength({min:5, max:100}).trim().withMessage('Invalid Ingredients')], authMiddleware, adminController.postEditProduct)
router.get('/products', authMiddleware, adminController.getProducts);
router.delete('/products/:productId', authMiddleware, adminController.deleteProduct);
module.exports = router;