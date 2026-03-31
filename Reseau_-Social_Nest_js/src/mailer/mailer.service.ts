import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from "nodemailer"

@Injectable()
export class MailerService implements OnModuleInit {
  private transport!: nodemailer.Transporter;
  private mailFrom!: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get('MAIL_HOST');
    this.mailFrom = this.configService.get('MAIL_FROM') || 'noreply@reseau-social.com';

    if (host) {
      this.transport = nodemailer.createTransport({
        host,
        port: parseInt(this.configService.get('MAIL_PORT') || '587'),
        secure: this.configService.get('MAIL_PORT') === '465',
        auth: {
          user: this.configService.get('MAIL_USER'),
          pass: this.configService.get('MAIL_PASS'),
        },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      this.transport = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        ignoreTLS: true,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async sendSignupConfirmation(userEmail: string) {
    await this.transport.sendMail({
      from: this.mailFrom,
      to: userEmail,
      subject: "Inscription",
      html: "<h1>Confirmation d'inscription</h1>"
    });
  }

  async resetPasswordConfirmation(userEmail: string, code: string, url: string) {
    const safeCode = this.escapeHtml(code);
    const safeUrl = encodeURI(url);
    await this.transport.sendMail({
      from: this.mailFrom,
      to: userEmail,
      subject: "Reset password",
      html: "<h1>Voici le code de reinitialisation du mot de passe</h1>" +
        `<p>Votre code : <strong>${safeCode}</strong></p>` +
        `<a href="${safeUrl}">Cliquez ici pour continuer</a>`
    });
  }

  async DeleteAccountConfirmation(userEmail: string, code: string, url: string) {
    const safeCode = this.escapeHtml(code);
    const safeUrl = encodeURI(url);
    await this.transport.sendMail({
      from: this.mailFrom,
      to: userEmail,
      subject: "Suppression de compte",
      html: "<h1>Voici le code pour supprimer le compte</h1>" +
        `<p>Votre code : <strong>${safeCode}</strong></p>` +
        `<a href="${safeUrl}">Cliquez ici pour continuer</a>`
    });
  }
}
