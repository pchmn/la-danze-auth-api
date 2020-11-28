import * as fs from 'fs';
import * as mjml2html from 'mjml';
import * as Mustache from 'mustache';
import { EmailTokensDocument } from '../mongo-schemas/email-tokens.mongo.schema';

export class EmailTemplate {

  static emailConfirmationTemplate: string = fs.readFileSync('src/app/features/auth/email-templates/email-confirmation.mjml', 'utf-8');

  static emailConfirmation(emailToken: EmailTokensDocument): string {
    const confirmEmailUrl = `http://localhost:3010/graphql?query={confirmEmail(username: "${emailToken.account.username}", token: "${emailToken.confirmToken.value}")}`;
    const renderedTemplate = Mustache.render(this.emailConfirmationTemplate, { username: emailToken.account.username, confirmEmailUrl });
    return mjml2html(renderedTemplate, { filePath: '.' }).html;
  }
}