import { baseEmailTemplate } from './base.template';

export function welcomeTemplate(name: string) {
  return {
    subject: 'Welcome to Better Auth!',
    html: baseEmailTemplate(`
      <h2 style="color: #333;">Welcome to Better Auth!</h2>
      <p>Hello ${name},</p>
      <p>Thank you for signing up for our app! We're excited to have you on board.</p>
    `),
    text: `Hello ${name},\n\nThank you for signing up for our app! We're excited to have you on board.\n\nBest regards,\nYour App Team`,
  };
}
