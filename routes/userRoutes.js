const router = require('express').Router();
const { model } = require('mongoose');
const userController = require('../controllers/userController');
const { authGuard } = require('../middleware/authGuard');

router.post('/register', userController.createUser);
router.post('/login', userController.loginUser);
router.put('/edit', authGuard, userController.editUser);
router.put('/editProfile', authGuard, userController.editProfilePicture);

module.exports = router;
