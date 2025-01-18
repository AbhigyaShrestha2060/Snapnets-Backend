const router = require('express').Router();
const bidController = require('../controllers/bidContoller');
const { authGuard } = require('../middleware/authGuard');

router.post('/addBid', authGuard, bidController.createBid);
router.get('/userBids', authGuard, bidController.getUserBids);
router.get(
  '/userImagesWithbidInformation',
  authGuard,
  bidController.getBidsForUploadedImages
);

module.exports = router;
