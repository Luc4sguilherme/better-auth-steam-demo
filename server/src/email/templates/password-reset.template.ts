import { actionButton, baseEmailTemplate } from './base.template';

export function passwordResetTemplate(name: string, url: string) {
  return {
    subject: 'Reset your password',
    html: baseEmailTemplate(`
      <h2 style="color: #333;">Reset Your Password</h2>
      <p>Hello ${name},</p>
      <p>You requested to reset your password. Click the button below to reset it:</p>
      ${actionButton(url, 'Reset Password', '#007bff')}
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 24 hours.</p>
    `),
    text: `Hello ${name},\n\nYou requested to reset your password. Click this link to reset it: ${url}\n\nIf you didn't request this, please ignore this email.\n\nThis link will expire in 24 hours.\n\nBest regards,\nYour App Team`,
  };
}
