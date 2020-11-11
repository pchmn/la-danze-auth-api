import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as SchemaMongoose } from "mongoose";
import { UserDocument } from "src/features/user.mongo.schema";
import { RandomToken } from "../utils/random-token";

@Schema({
  collection: 'refresh_tokens'
})
export class RefreshTokenDocument extends Document {

  @Prop({ type: SchemaMongoose.Types.ObjectId, ref: UserDocument.name })
  user: UserDocument;

  @Prop({ unique: true })
  token: string;

  @Prop({ default: Date.now() + RandomToken.TOKEN_LIFE_TIME })
  expiresAt: Date;

  @Prop({ type: Date, default: Date.now() })
  createdAt: number;

  @Prop({ type: Date })
  revokedAt: number;

  isExpired: boolean;

  isActive: boolean;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshTokenDocument);

RefreshTokenSchema.virtual('isExpired').get(function () {
  return Date.now() >= this.expiresAt;
});

RefreshTokenSchema.virtual('isActive').get(function () {
  return !this.revokedAt && !this.isExpired;
});
