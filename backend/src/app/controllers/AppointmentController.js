import * as Yup from 'yup';
import { startOfHour, parseISO, isBefore, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';
import User from '../models/User';
import File from '../models/File';
import Appointment from '../models/Appointment';
import NotificationSchema from '../schemas/Notification';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const appointments = await Appointment.findAll({
      where: {
        user_id: req.userId,
        canceled_at: null,
      },
      order: ['date'],
      attributes: ['id', 'date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['id', 'name'],
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'path', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(appointments);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({
        error: 'Validation fails.',
      });
    }

    const { provider_id, date } = req.body;

    /**
     * Check if provider_id is a provider
     */
    const isProvider = await User.findOne({
      where: {
        id: provider_id,
        provider: true,
      },
    });

    if (!isProvider) {
      return res.status(401).json({
        error: 'You can only create appointments with providers.',
      });
    }

    if (isProvider.id === provider_id) {
      return res.status(401).json({
        error: 'You can only create appointments with providers user.',
      });
    }

    const hourStart = startOfHour(parseISO(date));
    /**
     * Check for past dates
     */
    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({
        error: 'Past dates are not permited.',
      });
    }

    /**
     * Check date availabilty
     */

    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart,
      },
    });

    if (checkAvailability) {
      return res.status(400).json({
        error: 'Appointment date is not available.',
      });
    }

    const appointment = await Appointment.create({
      user_id: req.userId,
      provider_id,
      date: hourStart,
    });

    /**
     * Notify appointment provider
     */
    const user = await User.findByPk(req.userId);
    const formattedDate = format(
      hourStart,
      " 'dia' dd 'de' MMMM', às' H:mm'h' ",
      {
        locale: pt,
      }
    );

    await NotificationSchema.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate} `,
      user: provider_id,
    });

    return res.send(appointment);
  }

  async delete(req, res) {
    try {
      const appointmens = await Appointment.findByPk(req.params.id);

      if (appointmens.user_id !== req.userId) {
        return res.status(401).json({
          error: "You don't have permission to cancel this appointment.",
        });
      }

      const dateWithSub = subHours(appointmens.date, 2);

      if (isBefore(dateWithSub, new Date())) {
        return res.status(401).json({
          error: 'You can only cancel appointment 2 hours in advance.',
        });
      }

      appointmens.canceled_at = new Date();

      await appointmens.save();
      return res.json(appointmens);
    } catch (err) {
      return res.json(err);
    }
  }
}

export default new AppointmentController();
