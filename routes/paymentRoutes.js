const router = require('express').Router();

const paymentController = require('../controllers/paymentController');
const { authGuard } = require('../middleware/authGuard');

router.post(
  '/initialize-khalti',
  authGuard,
  paymentController.initializePayment
);
router.get(
  '/complete-khalti-payment',

  paymentController.completeKhaltiPayment
);
router.get('/verify-khalti-payment', authGuard, paymentController.verifyKhalti);

module.exports = router;
