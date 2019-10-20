import User from '../models/User';
import Notification from '../schemas/Notification';

class NotificationController {
  async index(req, res) {
    const checkIsProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!checkIsProvider) {
      return res
        .status(400)
        .json({ erro: 'Only provider can load notifications' });
    }

    const notifications = await Notification.find({
      user: req.userId,
      read: false,
    })
      .sort({ createdAt: 'desc' })
      .limit(20);
    return res.send(notifications);
  }
}

export default new NotificationController();
