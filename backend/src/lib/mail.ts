import nodemailer from 'nodemailer';

class EmailService {
    private transporter: nodemailer.Transporter | null = null;

    constructor() {
        const host = process.env.SMTP_HOST;
        const port = parseInt(process.env.SMTP_PORT || '587');
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;

        if (host && user && pass) {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: { user, pass },
            });
            console.log('Email Service initialized with SMTP');
        } else {
            console.warn('Email Service: SMTP credentials not provided. Emails will be logged to console only.');
        }
    }

    async sendEmail(to: string, subject: string, html: string) {
        const from = process.env.MAIL_FROM || 'no-reply@jsmentor.ai';

        if (this.transporter) {
            try {
                await this.transporter.sendMail({ from, to, subject, html });
                console.log(`Email sent to ${to}: ${subject}`);
            } catch (error) {
                console.error(`Failed to send email to ${to}:`, error);
            }
        } else {
            console.log('--- MOCK EMAIL ---');
            console.log(`From: ${from}`);
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Body: ${html}`);
            console.log('------------------');
        }
    }

    async sendInvitationEmail(email: string, workspaceName: string, taskTitle: string, inviterName: string) {
        const subject = `You've been invited to workspace: ${workspaceName}`;
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #333;">Welcome to ${workspaceName}!</h2>
                <p>Hello,</p>
                <p><strong>${inviterName}</strong> has assigned you a task: <strong>${taskTitle}</strong>.</p>
                <p>You have been automatically added to the <strong>${workspaceName}</strong> workspace. Please sign in or create an account with this email to get started.</p>
                <div style="margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Task</a>
                </div>
                <p style="margin-top: 30px; font-size: 0.8em; color: #777;">If you weren't expecting this, you can safely ignore this email.</p>
            </div>
        `;
        await this.sendEmail(email, subject, html);
    }

    async sendAssignmentNotification(email: string, taskTitle: string, inviterName: string) {
        const subject = `New Task Assigned: ${taskTitle}`;
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #333;">New Assignment</h2>
                <p>Hello,</p>
                <p><strong>${inviterName}</strong> has assigned you a task: <strong>${taskTitle}</strong>.</p>
                <div style="margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Tasks</a>
                </div>
            </div>
        `;
        await this.sendEmail(email, subject, html);
    }
}

export const emailService = new EmailService();
