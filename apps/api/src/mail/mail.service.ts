import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) { }

  async sendOtpEmail(email: string, otp: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Your ESMP Verification OTP',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5; text-align: center;">Email Verification</h2>
          <p>Hi there,</p>
          <p>Use the OTP below to verify your email address. It expires in <strong>10 minutes</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background: #f1f5f9; border: 2px dashed #4f46e5; border-radius: 12px; padding: 20px 40px;">
              <span style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #4f46e5;">${otp}</span>
            </div>
          </div>
          <p style="color: #64748b; font-size: 14px;">Do not share this OTP with anyone. If you didn't request this, ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">ESMP Portal — Secure Verification Service</p>
        </div>
      `,
    });
    console.log(`OTP email sent to: ${email} | OTP: ${otp}`);
  }

  async sendTeamInviteEmail(toEmail: string, toName: string, fromName: string, teamName: string) {
    await this.mailerService.sendMail({
      to: toEmail,
      subject: `${fromName} invited you to join "${teamName}" on ESMP`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #1D4ED8; text-align: center;">Team Invitation</h2>
          <p>Hi <strong>${toName}</strong>,</p>
          <p><strong>${fromName}</strong> has invited you to join the team <strong>"${teamName}"</strong> on the ESMP Portal.</p>
          <p>Log in to your ESMP account and check your notifications to accept or decline this invitation.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/dashboard" style="background-color: #1D4ED8; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View Invitation
            </a>
          </div>
          <p style="color: #64748b; font-size: 13px;">This invitation expires in 7 days. If you did not expect this, you can safely ignore it.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">ESMP Portal — Enterprise Service Management</p>
        </div>
      `,
    });
  }

  async sendEmployeeCredentials(email: string, name: string, tempPassword: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Your ESMP Employee Account Has Been Created',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="text-align:center; margin-bottom: 24px;">
            <div style="display:inline-block; background:#0052CC; color:white; font-weight:900; font-size:18px; padding:8px 16px; border-radius:6px;">ESMP</div>
          </div>
          <h2 style="color: #172B4D; margin-bottom: 8px;">Welcome to ESMP, ${name}!</h2>
          <p style="color: #5E6C84;">Your employee account has been created by your manager. Use the credentials below to log in.</p>
          <div style="background: #F4F5F7; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 8px; color: #5E6C84; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Login URL</p>
            <p style="margin: 0 0 16px; color: #0052CC;">http://localhost:3000/login</p>
            <p style="margin: 0 0 8px; color: #5E6C84; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Email</p>
            <p style="margin: 0 0 16px; color: #172B4D; font-weight: 600;">${email}</p>
            <p style="margin: 0 0 8px; color: #5E6C84; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Temporary Password</p>
            <p style="margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 4px; color: #0052CC; font-family: monospace;">${tempPassword}</p>
          </div>
          <p style="color: #DE350B; font-size: 13px; font-weight: 600;">⚠ Please change your password immediately after your first login.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #97A0AF; text-align: center;">ESMP Enterprise Portal — Do not share these credentials with anyone.</p>
        </div>
      `,
    });
    console.log(`Employee credentials sent to: ${email} | Temp password: ${tempPassword}`);
  }

  async sendVerificationEmail(email: string, url: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your ESMP Account',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #4f46e5; text-align: center;">Account Verification</h2>
          <p>Hi there,</p>
          <p>Click the button below to verify your email and activate your account on the ESMP Portal.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Account</a>
          </div>
          <p style="word-break: break-all; color: #64748b;">${url}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Security Tip: If you didn't request this email, you can safely ignore it.</p>
        </div>
      `,
    });
    console.log(`Verification email sent to: ${email}`);
  }
}
