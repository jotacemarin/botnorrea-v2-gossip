import { Model, Schema, model } from "mongoose";
import { Command } from "../models";
import { MongodbService } from "../services/mongodb";

export class CommandDao {
  private static schemaName: string = "command";
  private static commandSchema: Schema<Command>;
  public static commandModel: Model<Command>;

  private constructor() {}

  public static async initInstance() {
    await MongodbService.initInstance();

    if (!CommandDao.commandSchema) {
      CommandDao.commandSchema = new Schema(
        {
          key: { type: String, required: true, unique: true },
          url: { type: String, required: true, unique: true, index: "text" },
          enabled: { type: Boolean, required: true },
        },
        {
          timestamps: true,
        }
      );
    }

    if (!CommandDao.commandModel) {
      CommandDao.commandModel = model(
        CommandDao.schemaName,
        CommandDao.commandSchema
      );
    }
  }

  public static async findByKey(key: string): Promise<Command | null> {
    const document = await CommandDao.commandModel.findOne({ key }).exec();
    if (document) {
      return { ...document.toObject() } as Command;
    }

    return null;
  }

  public static async save(command: Command): Promise<Command | null> {
    if (!command?.key) {
      throw new Error("key is missing");
    }

    if (!command?.url) {
      throw new Error("url is missing");
    }

    const key = String(command.key).toLowerCase();

    await CommandDao.commandModel.updateOne(
      { key },
      {
        key,
        url: command.url,
        enabled: Boolean(command?.enabled),
      },
      { upsert: true }
    );

    return CommandDao.findByKey(key);
  }
}
