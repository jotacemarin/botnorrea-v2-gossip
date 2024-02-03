import { Model, Schema, SchemaTypes, model } from "mongoose";
import { MongodbService } from "../services/mongodb";
import { GossipMessage } from "../models";

const { ObjectId } = SchemaTypes;

export class GossipMessageDao {
  private static schemaName: string = "gossip_message";
  private static gossipMessageSchema: Schema<GossipMessage>;
  private static gossipMessageModel: Model<GossipMessage>;

  private constructor() {}

  public static async initInstance() {
    await MongodbService.initInstance();

    if (!GossipMessageDao.gossipMessageSchema) {
      GossipMessageDao.gossipMessageSchema = new Schema(
        {
          user: { type: ObjectId, required: true },
          message: { type: String, required: true },
        },
        { timestamps: true }
      );
    }

    if (!GossipMessageDao.gossipMessageModel) {
      GossipMessageDao.gossipMessageModel = model(
        GossipMessageDao.schemaName,
        GossipMessageDao.gossipMessageSchema
      );
    }
  }

  public static async findByUser(
    userId: string
  ): Promise<Array<GossipMessage>> {
    return GossipMessageDao.gossipMessageModel.find({ user: userId }).exec();
  }

  public static async save(gossipMessage: GossipMessage) {
    if (!gossipMessage?.user) {
      throw new Error("user is missing");
    }

    if (!gossipMessage?.message) {
      throw new Error("message is missing");
    }

    const message = await GossipMessageDao.gossipMessageModel.create(
      gossipMessage
    );

    return message.toObject();
  }
}
