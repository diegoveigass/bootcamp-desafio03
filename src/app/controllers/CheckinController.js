import { subDays } from 'date-fns';
import { Op } from 'sequelize';

import Student from '../models/Student';
import Checkin from '../models/Checkin';

class CheckinController {
  async index(req, res) {
    const student = await Student.findByPks(req.params.id);

    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }
    const checkins = await Checkin.findAll({
      where: {
        student_id: req.params.id,
      },
    });
    return res.json(checkins);
  }

  async store(req, res) {
    const student = await Student.findByPk(req.params.id);

    if (!student) {
      return res.status(400).json({ error: 'Student not found' });
    }

    const dateNow = new Date();
    const dateOld = subDays(dateNow, 7);

    const numCheckins = await Checkin.count({
      where: {
        student_id: req.params.id,
        created_at: {
          [Op.between]: [dateOld, dateNow],
        },
      },
    });

    if (numCheckins >= 5) {
      return res
        .status(400)
        .json({ error: 'Maximum amount of checkins reached' });
    }

    const student_id = student.id;

    const checkin = await Checkin.create({
      student_id,
    });
    return res.json(checkin);
  }
}

export default new CheckinController();
