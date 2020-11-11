import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { EmailTemplate } from '../email-templates/email-template';
import { EmailTokensDocument } from '../mongo-schemas/email-tokens.mongo.schema';


@Injectable()
export class EmailService {

  static readonly CLASS_NAME = 'EmailService';

  private transporter: Mail;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport(this.configService.get('nodemailer.transport'));
  }

  sendEmail(emailToken: EmailTokensDocument) {
    const message = {
      from: 'Nodemailer <example@nodemailer.com>',
      to: emailToken.user.email.value,
      subject: 'AMP4EMAIL message',
      text: 'For clients with plaintext support only',
      html: EmailTemplate.emailConfirmation(emailToken),
    }

    this.transporter.sendMail(message, (err, info) => {
      if (err) {
        Logger.log(err.message, EmailService.CLASS_NAME);
      }
    })
  }
}
