const router = require('express').Router();
const notificationController = require('../controllers/notificationController');
const { authGuard } = require('../middleware/authGuard');

router.get(
  '/getNotification',
  authGuard,
  notificationController.getNotifications
);

router.put(
  '/markAsRead/:id',
  authGuard,
  notificationController.markNotificationAsRead
);

router.put(
  '/markAllAsRead',
  authGuard,
  notificationController.markAllNotificationsAsRead
);

module.exports = router;
