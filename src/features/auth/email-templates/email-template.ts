import * as fs from 'fs';
import * as mjml2html from 'mjml';
import * as Mustache from 'mustache';
import { EmailTokenDocument } from '../mongo-schemas/email-token.mongo.schema';

export class EmailTemplate {

  static emailConfirmationTemplate: string = fs.readFileSync('src/features/auth/email-templates/email-confirmation.mjml', 'utf-8');

  static emailConfirmation(emailToken: EmailTokenDocument): string {
    const confirmEmailUrl = `http://localhost:3010/graphql?query={confirmEmail(username: "${emailToken.user.username}", token: "${emailToken.confirmToken.value}")}`;
    const renderedTemplate = Mustache.render(this.emailConfirmationTemplate, { username: emailToken.user.username, confirmEmailUrl });
    return mjml2html(renderedTemplate, { filePath: '.' }).html;
  }
}