import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaMongoose } from "mongoose";
import { RandomStringUtils } from "../../../core/utils/random-string.utils";
import { AccountDocument } from "../../account/mongo-schemas/account.mongo.schema";


@Schema({
  collection: 'email_tokens'
})
export class EmailTokensDocument extends Document {

  @Prop({ type: SchemaMongoose.Types.ObjectId, ref: AccountDocument.name, unique: true })
  account: AccountDocument;

  @Prop(raw({
    value: { type: String, default: RandomStringUtils.createToken, unique: true },
    expiresAt: { type: Date, default: RandomStringUtils.tokenExpiresAt }
  }))
  confirmToken: { value: string, expiresAt?: number | Date };

  @Prop(raw({
    value: { type: String, unique: true, sparse: true },
    expiresAt: { type: Date }
  }))
  resetPasswordToken: { value: string, expiresAt?: number | Date };

  @Prop({ type: Date, default: Date.now })
  createdAt: number;

  isConfirmTokenValid: boolean;

  isResetPasswordTokenValid: boolean;

  getConfirmTokenExpiresAt: () => number;

  getResetPasswordTokenExpiresAt: () => number;
}

export const EmailTokensSchema = SchemaFactory.createForClass(EmailTokensDocument);

EmailTokensSchema.pre<EmailTokensDocument>('save', function (next) {
  if (this.isModified('confirmToken.value') && this.isModified('resetPasswordToken.value')) {
    // Set expiresAt for new confirmToken
    if (!this.confirmToken.expiresAt) this.confirmToken.expiresAt = RandomStringUtils.tokenExpiresAt();
    // Set expiresAt for new resetPasswordToken
    if (!this.resetPasswordToken.expiresAt) this.resetPasswordToken.expiresAt = RandomStringUtils.tokenExpiresAt();
    next();
  } else if (this.isModified('confirmToken.value')) {
    // Set expiresAt for new confirmToken
    if (!this.confirmToken.expiresAt) this.confirmToken.expiresAt = RandomStringUtils.tokenExpiresAt();
    next();
  } else if (this.isModified('resetPasswordToken.value')) {
    // Set expiresAt for new resetPasswordToken
    if (!this.resetPasswordToken.expiresAt) this.resetPasswordToken.expiresAt = RandomStringUtils.tokenExpiresAt();
    next();
  } else {
    next();
  }
});

EmailTokensSchema.virtual('isConfirmTokenValid').get(function () {
  return Date.now() < this.confirmToken.expiresAt;
});

EmailTokensSchema.virtual('isResetPasswordTokenValid').get(function () {
  return this.resetPasswordToken && (Date.now() < this.resetPasswordToken.expiresAt);
});

EmailTokensSchema.method('getResetPasswordTokenExpiresAt', function (): number {
  return this.resetPasswordToken.expiresAt ? this.resetPasswordToken.expiresAt.getTime() : 0;
});

EmailTokensSchema.method('getConfirmTokenExpiresAt', function (): number {
  // Confirm token expiresAt never null or undefined
  return this.confirmToken.expiresAt.getTime();
});

EmailTokensSchema.set('toObject', { virtuals: true })
EmailTokensSchema.set('toJSON', { virtuals: true })
