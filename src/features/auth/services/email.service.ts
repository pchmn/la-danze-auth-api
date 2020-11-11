import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { EmailTemplate } from '../email-templates/email-template';
import { EmailTokenDocument } from '../mongo-schemas/email-token.mongo.schema';


@Injectable()
export class EmailService {

  private transporter: Mail;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport(this.configService.get('nodemailer.transport'));
  }

  sendEmail(emailToken: EmailTokenDocument) {
    const message = {
      from: 'Nodemailer <example@nodemailer.com>',
      to: emailToken.user.email,
      subject: 'AMP4EMAIL message',
      text: 'For clients with plaintext support only',
      html: EmailTemplate.emailConfirmation(emailToken),
    }

    this.transporter.sendMail(message, (err) => {
      console.log(err);
    })
  }
}
