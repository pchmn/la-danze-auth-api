import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as bcrypt from 'bcrypt';
import { Document } from 'mongoose';
import * as uniqueValidator from 'mongoose-unique-validator';
import { RandomStringUtils } from "src/app/core/utils/random-string.utils";
import { ValidatorUtils } from "src/app/core/utils/validator.utils";
import { ApplicationRole } from "src/generated/graphql.schema";

const SALT_ROUNDS = 10;

@Schema({
  collection: 'accounts'
})
export class AccountDocument extends Document {

  @Prop({ required: true, unique: true, immutable: true, default: RandomStringUtils.createId })
  accountId: string;

  @Prop(raw({
    value: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (email) => {
          return ValidatorUtils.isEmailValid(email);
        },
        message: (props) => `"${props.value}" is not a valid email`,
        type: 'invalid'
      }
    },
    isConfirmed: { type: Boolean, default: false }
  }))
  email: { value: string, isConfirmed?: boolean };

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true, minlength: [8, 'password must be 8 characters minimum'] })
  password: string;

  @Prop()
  roles: ApplicationRole[];

  @Prop({ type: Date, default: Date.now() })
  createdAt: number;

  isActive: boolean;

  validatePassword: (password: string) => Promise<boolean>;
}

export const AccountSchema = SchemaFactory.createForClass(AccountDocument);

AccountSchema.plugin(uniqueValidator, { message: '{PATH} "{VALUE}" already exists' });

AccountSchema.pre<AccountDocument>('save', function (next) {
  if (this.isModified('password')) {
    // Hash password only if password has been modified or is new
    // Generate salt
    bcrypt.genSalt(SALT_ROUNDS)
      // Hash password
      .then(salt => bcrypt.hash(this.password, salt))
      .then(hashedPassword => {
        this.password = hashedPassword;
        next();
      })
      .catch(err => next(err));
  } else if (this.isModified('email.value')) {
    // If email has changed, it is not confirmed
    this.email.isConfirmed = false;
    next();
  } else {
    next();
  }
});

AccountSchema.method('validatePassword', async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
});

AccountSchema.virtual('isActive').get(function () {
  // If one of account emails is confirmed, account is active
  return this.email.isConfirmed;
});
