import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import Mail from 'nodemailer/lib/mailer';
import { EmailService } from './email.service';

const sendEmailSucces = (mailOptions: Mail.Options, callback) => jest.fn().mockRejectedValueOnce(callback(null, null));
const sendEmailError = (mailOptions: Mail.Options, callback) => jest.fn().mockRejectedValueOnce(callback(new Error('error'), null));

export class MailTransporterMock {
  sendMail = sendEmailSucces;
}

const mailTransporterMock = new MailTransporterMock();

jest.mock("nodemailer");
const nodemailer = require("nodemailer");
nodemailer.createTransport.mockReturnValue(mailTransporterMock);

describe('EmailService', () => {
  let service: EmailService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        ConfigService
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });


  it('[sendEmail] should send email with good parameters', () => {
    const emailToken: any = { user: { email: { value: 'test@test.com' }, username: 'username' }, confirmToken: { value: 'token' } };
    spyOn(mailTransporterMock, 'sendMail');

    // Send email
    service.sendEmail(emailToken);

    expect(mailTransporterMock.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      "to": 'test@test.com'
    }), expect.anything());
  });

  it('[sendEmail] should send email', () => {
    const emailToken: any = { user: { email: { value: 'test@test.com' }, username: 'username' }, confirmToken: { value: 'token' } };
    spyOn(Logger, 'log');

    // Send email
    service.sendEmail(emailToken);

    expect(Logger.log).not.toHaveBeenCalledWith();
  });

  it('[sendEmail] should log error', () => {
    const emailToken: any = { user: { email: { value: 'test@test.com' }, username: 'username' }, confirmToken: { value: 'token' } };
    mailTransporterMock.sendMail = sendEmailError;
    spyOn(Logger, 'log');

    // Send email
    service.sendEmail(emailToken);

    expect(Logger.log).toHaveBeenCalledWith('error', EmailService.CLASS_NAME);
  });
});
