import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaMongoose } from "mongoose";
import { UserDocument } from "src/features/user.mongo.schema";
import { RandomToken } from "../utils/random-token";

@Schema({
  collection: 'email_tokens'
})
export class EmailTokenDocument extends Document {

  @Prop({ type: SchemaMongoose.Types.ObjectId, ref: UserDocument.name })
  user: UserDocument;

  @Prop(raw({
    value: { type: String, default: RandomToken.create(), unique: true },
    expiresAt: { type: Date, default: Date.now() + RandomToken.TOKEN_LIFE_TIME }
  }))
  confirmToken: Record<string, any>;

  @Prop(raw({
    value: { type: String, unique: true },
    expiresAt: { type: Date }
  }))
  resetPasswordToken: Record<string, any>;

  @Prop({ type: Date, default: Date.now() })
  createdAt: number;

  isConfirmTokenValid: boolean;

  isResetPasswordTokenValid: boolean;
}

export const EmailTokenSchema = SchemaFactory.createForClass(EmailTokenDocument);

EmailTokenSchema.pre<EmailTokenDocument>('save', function (next) {
  if (this.isModified('confirmToken.value') && this.isModified('resetPasswordToken.value')) {
    // Set expiresAt for new confirmToken
    if (!this.confirmToken.expiresAt) this.confirmToken.expiresAt = Date.now() + RandomToken.TOKEN_LIFE_TIME;
    // Set expiresAt for new resetPasswordToken
    if (!this.resetPasswordToken.expiresAt) this.resetPasswordToken.expiresAt = Date.now() + RandomToken.TOKEN_LIFE_TIME;
    next();
  } else if (this.isModified('confirmToken.value')) {
    // Set expiresAt for new confirmToken
    if (!this.confirmToken.expiresAt) this.confirmToken.expiresAt = Date.now() + RandomToken.TOKEN_LIFE_TIME;
    next();
  } else if (this.isModified('resetPasswordToken.value')) {
    // Set expiresAt for new resetPasswordToken
    if (!this.resetPasswordToken.expiresAt) this.resetPasswordToken.expiresAt = Date.now() + RandomToken.TOKEN_LIFE_TIME;
    next();
  } else {
    next();
  }
});

EmailTokenSchema.virtual('isConfirmTokenValid').get(function () {
  return Date.now() < this.confirmToken.expiresAt;
});

EmailTokenSchema.virtual('isResetPasswordTokenValid').get(function () {
  return this.resetPasswordToken && (Date.now() < this.resetPasswordToken.expiresAt);
});
