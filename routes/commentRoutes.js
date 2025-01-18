const router = require('express').Router();
const commentController = require('../controllers/commentController');
const { authGuard } = require('../middleware/authGuard');

router.post('/addComment', authGuard, commentController.addCommentToImage);
router.get('/getComment/:id', authGuard, commentController.getCommentsForImage);

module.exports = router;
