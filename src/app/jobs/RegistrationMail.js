import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class RegistrationMail {
  get key() {
    return 'RegistrationMail';
  }

  async handle({ data }) {
    const { student, plan, start_date, end_date, price } = data;

    await Mail.sendMail({
      to: `${student.name} <${student.email}>`,
      subject: 'Matrícula cadastrada',
      template: 'registration',
      context: {
        student: student.name,
        plan: plan.title,
        start_date: format(parseISO(start_date), "dd 'de' MMMM 'de' yyyy", {
          locale: pt,
        }),
        end_date: format(parseISO(end_date), "dd 'de' MMMM 'de' yyyy", {
          locale: pt,
        }),
        price: `R$${price} reais`,
      },
    });
  }
}

export default new RegistrationMail();
