import { actionButton, baseEmailTemplate } from './base.template';

export function deleteAccountTemplate(name: string, url: string) {
  return {
    subject: 'Delete your account',
    html: baseEmailTemplate(`
      <h2 style="color: #333;">Confirm Account Deletion</h2>
      <p>Hello ${name},</p>
      <p>We're sorry to see you go! Please confirm your account deletion by clicking the button below:</p>
      ${actionButton(url, 'Confirm Deletion', '#dc3545')}
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 24 hours.</p>
    `),
    text: `Hello ${name},\n\nWe're sorry to see you go! Please confirm your account deletion by clicking this link: ${url}\n\nIf you didn't request this, please ignore this email.\n\nThis link will expire in 24 hours.\n\nBest regards,\nYour App Team`,
  };
}
