const router = require('express').Router();
const { authGuard } = require('../middleware/authGuard');
const balanceController = require('../controllers/balanceController');

router.post('/addbalance', authGuard, balanceController.updateUserBalance);
router.post(
  '/withdrawBalance',
  authGuard,
  balanceController.withdrawUserBalance
);
router.get('/allbalance', authGuard, balanceController.getAllUsersWithBalances);
router.get(
  '/balancebyuser',
  authGuard,
  balanceController.getUserBalanceWithTransactions
);

module.exports = router;
