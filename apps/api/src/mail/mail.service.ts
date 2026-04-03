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

  async sendVideoCallInvite(
    toEmail: string,
    toName: string,
    fromName: string,
    teamName: string,
    meetingLink: string,
  ) {
    await this.mailerService.sendMail({
      to: toEmail,
      subject: `📹 ${fromName} started a video call in "${teamName}" — Join now`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:32px 40px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:12px;padding:10px 20px;margin-bottom:16px;">
              <span style="color:#fff;font-weight:900;font-size:18px;letter-spacing:1px;">ESMP</span>
            </div>
            <div style="font-size:48px;margin-bottom:8px;">📹</div>
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Video Call Started</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:15px;">${teamName}</p>
          </div>

          <!-- Body -->
          <div style="padding:32px 40px;">
            <p style="color:#374151;font-size:16px;margin:0 0 8px;">Hi <strong>${toName}</strong>,</p>
            <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 24px;">
              <strong style="color:#111827;">${fromName}</strong> has started a video conference in your team
              <strong style="color:#2563eb;">"${teamName}"</strong>. Click the button below to join now.
            </p>

            <!-- Join button -->
            <div style="text-align:center;margin:32px 0;">
              <a href="${meetingLink}" target="_blank"
                style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 16px rgba(37,99,235,0.35);">
                🎥 Join Video Call
              </a>
            </div>

            <!-- Meeting link box -->
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin:24px 0;">
              <p style="color:#94a3b8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px;">Meeting Link</p>
              <a href="${meetingLink}" style="color:#2563eb;font-size:13px;word-break:break-all;text-decoration:none;font-family:monospace;">${meetingLink}</a>
            </div>

            <!-- Info -->
            <div style="display:flex;gap:16px;margin:24px 0;">
              <div style="flex:1;background:#eff6ff;border-radius:10px;padding:14px 16px;text-align:center;">
                <div style="font-size:20px;margin-bottom:4px;">🔒</div>
                <p style="color:#1d4ed8;font-size:12px;font-weight:600;margin:0;">End-to-End Encrypted</p>
              </div>
              <div style="flex:1;background:#f5f3ff;border-radius:10px;padding:14px 16px;text-align:center;">
                <div style="font-size:20px;margin-bottom:4px;">🖥️</div>
                <p style="color:#7c3aed;font-size:12px;font-weight:600;margin:0;">Screen Sharing</p>
              </div>
              <div style="flex:1;background:#ecfdf5;border-radius:10px;padding:14px 16px;text-align:center;">
                <div style="font-size:20px;margin-bottom:4px;">👥</div>
                <p style="color:#059669;font-size:12px;font-weight:600;margin:0;">HD Video</p>
              </div>
            </div>

            <p style="color:#9ca3af;font-size:13px;text-align:center;margin:24px 0 0;">
              You can also open this link in any browser — no app download required.
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">
              ESMP Enterprise Portal · You received this because you are a member of <strong>${teamName}</strong>
            </p>
          </div>
        </div>
      `,
    });
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
