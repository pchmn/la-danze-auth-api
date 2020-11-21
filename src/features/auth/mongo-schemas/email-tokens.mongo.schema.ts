import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaMongoose } from "mongoose";
import { AccountDocument } from "src/features/account.mongo.schema";
import { RandomToken } from "../utils/random-token";


@Schema({
  collection: 'email_tokens'
})
export class EmailTokensDocument extends Document {

  @Prop({ type: SchemaMongoose.Types.ObjectId, ref: AccountDocument.name, unique: true })
  user: AccountDocument;

  @Prop(raw({
    value: { type: String, default: RandomToken.create, unique: true },
    expiresAt: { type: Date, default: RandomToken.expiresAt }
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

  getConfirmTokenExpiresAt: Function;

  getResetPasswordTokenExpiresAt: Function;
}

export const EmailTokensSchema = SchemaFactory.createForClass(EmailTokensDocument);

EmailTokensSchema.pre<EmailTokensDocument>('save', function (next) {
  if (this.isModified('confirmToken.value') && this.isModified('resetPasswordToken.value')) {
    // Set expiresAt for new confirmToken
    if (!this.confirmToken.expiresAt) this.confirmToken.expiresAt = RandomToken.expiresAt();
    // Set expiresAt for new resetPasswordToken
    if (!this.resetPasswordToken.expiresAt) this.resetPasswordToken.expiresAt = RandomToken.expiresAt();
    next();
  } else if (this.isModified('confirmToken.value')) {
    // Set expiresAt for new confirmToken
    if (!this.confirmToken.expiresAt) this.confirmToken.expiresAt = RandomToken.expiresAt();
    next();
  } else if (this.isModified('resetPasswordToken.value')) {
    // Set expiresAt for new resetPasswordToken
    if (!this.resetPasswordToken.expiresAt) this.resetPasswordToken.expiresAt = RandomToken.expiresAt();
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
