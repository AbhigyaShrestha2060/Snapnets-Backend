const router = require('express').Router();
const { auth } = require('google-auth-library');
const userController = require('../controllers/userController');
const { authGuard } = require('../middleware/authGuard');

router.post('/register', userController.createUser);
router.post('/login', userController.loginUser);
router.put('/edit', authGuard, userController.editUser);
router.put('/editProfilePicture', authGuard, userController.editProfilePicture);
router.get('/getMe', authGuard, userController.getMe);
router.put('/changePassword', authGuard, userController.changePassword);
router.post('/googleLogin', userController.googleLogin);
router.get('/getAllUsers', userController.getAllUsers);
router.get(
  '/getFollowersandFollowing',
  authGuard,
  userController.getFollowersAndFollowing
);
router.post('/resetPasswordEmail', userController.requestPasswordReset);
router.post('/verifyResetOTP', userController.verifyResetOTP);

module.exports = router;
