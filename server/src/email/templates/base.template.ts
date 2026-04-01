export function baseEmailTemplate(content: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      ${content}
      <p>Best regards,<br>Your App Team</p>
    </div>
  `;
}

export function actionButton(
  url: string,
  text: string,
  color = '#28a745',
): string {
  return `<a href="${url}" style="background-color: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 16px 0;">${text}</a>`;
}
