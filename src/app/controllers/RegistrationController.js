import { startOfHour, parseISO, addMonths } from 'date-fns';
import * as Yup from 'yup';
import Student from '../models/Student';
import Plan from '../models/Plan';
import Registration from '../models/Registration';

class RegistrationController {
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

    const registration = await Registration.create({
      start_date,
      end_date,
      price,
      student_id,
      plan_id,
    });
    return res.json(registration);
  }
}

export default new RegistrationController();
