import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as bcrypt from 'bcrypt';
import * as EmailValidator from 'email-validator';
import { Document } from 'mongoose';
import * as uniqueValidator from 'mongoose-unique-validator';
import { ApplicationRole } from "src/generated/graphql.schema";

const SALT_ROUNDS = 10;

@Schema({
  collection: 'accounts'
})
export class AccountDocument extends Document {

  @Prop(raw({
    value: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (email) => {
          return EmailValidator.validate(email);
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

  @Prop({ required: true })
  password: string;

  @Prop()
  roles: ApplicationRole[];

  @Prop({ type: Date, default: Date.now() })
  createdAt: number;

  isActive: boolean;

  validatePassword: Function;
}

export const AccountSchema = SchemaFactory.createForClass(AccountDocument);

AccountSchema.plugin(uniqueValidator, { message: '{PATH} "{VALUE}" already exists' });

AccountSchema.pre<AccountDocument>('save', function (next) {
  // Hash password only if password has been modified or is new
  if (this.isModified('password')) {
    // Generate salt
    bcrypt.genSalt(SALT_ROUNDS)
      // Hash password
      .then(salt => bcrypt.hash(this.password, salt))
      .then(hashedPassword => {
        this.password = hashedPassword;
        next();
      })
      .catch(err => next(err));
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
