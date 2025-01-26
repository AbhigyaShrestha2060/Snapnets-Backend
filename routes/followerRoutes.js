const router = require('express').Router();
const followerController = require('../controllers/followersController');
const { authGuard } = require('../middleware/authGuard');

router.post('/followUser', authGuard, followerController.followUser);
router.post('/unfollowUser', authGuard, followerController.unfollowUser);
router.get('/getFollowers', authGuard, followerController.getFollowers);
router.get('/getFollowing', authGuard, followerController.getFollowing);
router.get(
  '/getUserFollowDetails/:userIdToCheck',
  authGuard,
  followerController.getUserFollowDetails
);

module.exports = router;
