const router = require('express').Router();
const boardController = require('../controllers/boardController');
const { authGuard } = require('../middleware/authGuard');

router.post('/createBoard', authGuard, boardController.createBoard);
router.post('/addImageToBoard', authGuard, boardController.addImagesToBoard);
router.get('/viewBoard/:boardId', authGuard, boardController.viewBoard);
router.get(
  '/getAllBoardsOfAUser',
  authGuard,
  boardController.getAllBoardsOfUser
);

router.delete(
  '/removeImageFromBoard',
  authGuard,
  boardController.removeImageFromBoard
);
router.delete('/deleteBoard/:boardId', authGuard, boardController.deleteBoard);
module.exports = router;
