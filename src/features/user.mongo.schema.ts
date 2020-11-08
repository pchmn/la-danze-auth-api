import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as bcrypt from 'bcrypt';
import * as EmailValidator from 'email-validator';
import { Document } from 'mongoose';
import * as uniqueValidator from 'mongoose-unique-validator';
import { ApplicationRole } from "src/generated/graphql.schema";

const SALT_ROUNDS = 10;

@Schema({
  collection: 'users'
})
export class UserDocument extends Document {

  @Prop({
    required: true,
    unique: true,
    validate: {
      validator: (email) => {
        return EmailValidator.validate(email);
      },
      message: (props) => `"${props.value}" is not a valid email`,
      type: 'invalid'
    }
  })
  email: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  roles: ApplicationRole[];

  @Prop({ type: Date })
  createdAt: number;

  @Prop({ type: Boolean, default: false })
  isEmailActive: boolean;

  validatePassword: Function;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);

UserSchema.plugin(uniqueValidator, { message: '{PATH} "{VALUE}" already exists' });

UserSchema.pre<UserDocument>('save', function (next) {
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

UserSchema.method('validatePassword', async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
});
