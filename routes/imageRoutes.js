const router = require('express').Router();
const imageController = require('../controllers/imageController');
const { authGuard } = require('../middleware/authGuard');

router.post('/add', authGuard, imageController.addImage);
router.get('/getAll', imageController.getAllImages);
router.get('/get/:id', imageController.getImageById);
router.delete('/delete/:id', imageController.deleteImage);
router.post('/like/:id', authGuard, imageController.toggleImageLike);
router.get(
  '/getlikedbyuser',
  authGuard,
  imageController.getAllImagesWithLikeStatus
);
router.get(
  '/getalllikedbyuser',
  authGuard,
  imageController.getLikedImagesByUser
);
router.get('/search', imageController.searchImagesByKeywords);
router.get(
  '/getAllImagesOfUser',
  authGuard,
  imageController.getImagesUploadedByUser
);

router.put('/updateImage/:id', authGuard, imageController.editImage);

router.get('/mostLikedImages', imageController.getAllImages);

router.get(
  '/getAllImageOfAUserbyId/:userId',
  authGuard,
  imageController.getImagesByUserIdWithLikeStatus
);

module.exports = router;
