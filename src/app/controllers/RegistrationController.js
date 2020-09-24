import { startOfHour, parseISO, addMonths, isAfter } from 'date-fns';
import * as Yup from 'yup';
import Student from '../models/Student';
import Plan from '../models/Plan';
import Registration from '../models/Registration';

import RegistrationMail from '../jobs/RegistrationMail';
import Queue from '../../lib/Queue';

class RegistrationController {
  async index(req, res) {
    const registrations = await Registration.findAll({
      attributes: ['id', 'start_date', 'end_date', 'price', 'active'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title', 'duration', 'price'],
        },
      ],
    });
    return res.json(registrations);
  }

  async show(req, res) {
    const { id } = req.params;
    const registration = await Registration.findOne({
      where: { id },
      attributes: ['id', 'price', 'start_date', 'end_date', 'active'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title', 'duration', 'price'],
        },
      ],
    });
    if (!registration) {
      return res.status(400).json({ error: 'registration does not exists' });
    }
    return res.json(registration);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number().required(),
      plan_id: Yup.number().required(),
      start_date: Yup.date().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const { student_id, plan_id } = req.body;

    const start_date = startOfHour(parseISO(req.body.start_date));

    // verify students exists

    const student = await Student.findByPk(student_id);

    if (!student) {
      return res.status(400).json({ error: 'student not found' });
    }

    // verify plans exists

    const plan = await Plan.findByPk(plan_id);

    if (!plan) {
      return res.status(400).json({ error: 'plan not found' });
    }

    const end_date = addMonths(start_date, plan.duration);

    const price = plan.price * plan.duration;

    const { id, canceled_at } = await Registration.create({
      start_date,
      end_date,
      price,
      student_id,
      plan_id,
    });

    await Queue.add(RegistrationMail.key, {
      student,
      plan,
      start_date,
      end_date,
      price,
    });

    return res.json({
      id,
      student_id,
      plan_id,
      price,
      start_date,
      end_date,
      canceled_at,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      student_id: Yup.number(),
      plan_id: Yup.number(),
      start_date: Yup.date(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation fails' });
    }

    const registration = await Registration.findByPk(req.params.id);

    if (!registration) {
      return res.status(400).json({ error: 'registration not found' });
    }

    // verify student exist
    const student_id = req.body.student_id
      ? req.body.student_id
      : registration.student_id;

    const student = await Student.findByPk(student_id);

    if (!student) {
      return res.status(400).json({ error: 'student not found' });
    }

    // verify plan exists

    const plan_id = req.body.plan_id ? req.body.plan_id : registration.plan_id;

    const plan = await Plan.findByPk(plan_id);

    if (!plan) {
      return res.status(400).json({ error: 'plan not found' });
    }

    const start_date = startOfHour(parseISO(req.body.start_date));

    if (!start_date) {
      // eslint-disable-next-line no-const-assign
      start_date = registration.start_date;
    }

    const end_date = addMonths(start_date, plan.duration);

    const price = plan.price * plan.duration;

    const { id } = await registration.update({
      start_date,
      end_date,
      price,
      student_id,
      plan_id,
    });

    return res.json({
      id,
      start_date,
      end_date,
      price,
      student_id,
      plan_id,
    });
  }

  async delete(req, res) {
    const registration = await Registration.findByPk(req.params.id);

    if (!registration) {
      return res.status(401).json({ error: 'registration not found' });
    }

    const { start_date } = registration;

    if (isAfter(new Date(), start_date)) {
      return res.status(400).json({ error: 'registration is active' });
    }

    await Registration.destroy({
      where: {
        id: req.params.id,
      },
    });

    const registrations = await Registration.findAll({
      attributes: ['id', 'price', 'start_date', 'end_date', 'active'],
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'title', 'duration', 'price'],
        },
      ],
    });

    return res.json(registrations);
  }
}

export default new RegistrationController();
