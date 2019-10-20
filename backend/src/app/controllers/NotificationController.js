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

  async update(req, res) {
    const notifications = await Notification.findByIdAndUpdate(
      req.params.id,
      {
        read: true,
      },
      { new: true }
    );

    if (!notifications) {
      return res
        .status(400)
        .json({ error: 'it is problem in update notification.' });
    }

    return res.json(notifications);
  }
}

export default new NotificationController();
