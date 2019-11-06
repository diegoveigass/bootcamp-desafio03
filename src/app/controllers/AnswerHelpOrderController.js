import HelpOrder from '../schemas/HelpOrder';
import Student from '../models/Student';

import Queue from '../../lib/Queue';
import AnswerQuestionMail from '../jobs/AnswerQuestionMail';

class AnswerHelpOrderController {
  async store(req, res) {
    const help_order = await HelpOrder.findByIdAndUpdate(
      req.params.id,
      { answer: req.body.answer, answer_at: new Date() },
      { new: true }
    );

    if (!help_order) {
      return res.status(400).json({ error: 'help order does not exist' });
    }
    const student = await Student.findByPk(help_order.student_id, {
      attributes: ['name', 'email'],
    });

    await Queue.add(AnswerQuestionMail.key, {
      student,
      help_order,
    });

    return res.json(help_order);
  }

  async index(req, res) {
    const noAnsweredHelps = await HelpOrder.find({
      answer: null,
    });

    return res.json(noAnsweredHelps);
  }
}

export default new AnswerHelpOrderController();
