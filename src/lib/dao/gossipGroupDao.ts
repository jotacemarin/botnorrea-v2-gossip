import { Model, Schema, model } from "mongoose";
import { MongodbService } from "../services/mongodb";
import { GossipGroup } from "../models";

export class GossipGroupDao {
  private static schemaName: string = "gossip_group";
  private static gossipGroupSchema: Schema<GossipGroup>;
  private static gossipGroupModel: Model<GossipGroup>;

  private constructor() {}

  public static async initInstance() {
    await MongodbService.initInstance();

    if (!GossipGroupDao.gossipGroupSchema) {
      GossipGroupDao.gossipGroupSchema = new Schema(
        {
          id: { type: String, required: true, unique: true },
          enabled: { type: Boolean, required: true },
        },
        { timestamps: true }
      );
    }

    if (!GossipGroupDao.gossipGroupModel) {
      GossipGroupDao.gossipGroupModel = model(
        GossipGroupDao.schemaName,
        GossipGroupDao.gossipGroupSchema
      );
    }
  }

  public static async findAll(): Promise<Array<GossipGroup>> {
    return GossipGroupDao.gossipGroupModel.find({}).exec();
  }

  public static async findById(id: number | string): Promise<GossipGroup | null> {
    const document = await GossipGroupDao.gossipGroupModel
      .findOne({ id })
      .exec();
    if (document) {
      return { ...document.toObject() } as GossipGroup;
    }

    return null;
  }

  public static async save(
    gossipGroup: GossipGroup
  ): Promise<GossipGroup | null> {
    if (!gossipGroup?.id) {
      throw new Error("id is missing");
    }

    await GossipGroupDao.gossipGroupModel.updateOne(
      { id: gossipGroup?.id },
      { ...gossipGroup, id: gossipGroup?.id, enabled: gossipGroup?.enabled },
      { upsert: true }
    );

    return GossipGroupDao.findById(gossipGroup?.id);
  }
}
