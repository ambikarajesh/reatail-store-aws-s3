const express = require('express');
const authMiddleware = require('../../middleware/middleware');
const router = express.Router();

const shopController = require('../../controller/shop/shop')
router.get('/', shopController.getIndex);
router.get('/products', shopController.getProducts);
router.get('/products/:productId', shopController.getProduct);
router.get('/cart', authMiddleware, shopController.getCart);
router.post('/cart', authMiddleware, shopController.addProducttoCart);
router.post('/delete-cart-item', authMiddleware, shopController.deleteCartItem);
router.post('/save-for-later-item', authMiddleware, shopController.saveForLaterItem);
router.post('/delete-save-for-later-item', authMiddleware, shopController.deleteSaveLaterItem)
router.post('/move-to-cart-item', authMiddleware, shopController.moveToCartItem)
router.post('/decrease-cart-item', authMiddleware, shopController.DecreaseCartItem);
router.post('/increase-cart-item', authMiddleware, shopController.IncreaseCartItem);
router.post('/checkout', authMiddleware, shopController.getCheckout);
router.post('/order-now', authMiddleware, shopController.postOrderNow);
router.get('/orders', authMiddleware, shopController.getOrders);
router.get('/orders/:orderId', authMiddleware, shopController.getInvoice);

module.exports = router;