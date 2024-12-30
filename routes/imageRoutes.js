const router = require('express').Router();
const { model } = require('mongoose');
const imageController = require('../controllers/imageController');
const { authGuard } = require('../middleware/authGuard');

router.post('/add', authGuard, imageController.addImage);
router.get('/getAll', imageController.getAllImages);
router.get('/get/:id', imageController.getImageById);
router.delete('/delete/:id', imageController.deleteImage);

module.exports = router;
