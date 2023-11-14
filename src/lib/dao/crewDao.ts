import { Model, Schema, SchemaTypes, model } from "mongoose";
import { Crew } from "../models";
import { MongodbService } from "../services/mongodb";
import { UserDao } from "./userDao";

const { ObjectId } = SchemaTypes;

export class CrewDao {
  private static schemaName: string = "crew";
  private static crewSchema: Schema<Crew>;
  public static crewModel: Model<Crew>;

  private constructor() {}

  public static async initInstance() {
    await MongodbService.initInstance();
    await UserDao.initInstance();

    if (!CrewDao.crewSchema) {
      const userSchemaName: string = UserDao.getSchemaName();
      CrewDao.crewSchema = new Schema(
        {
          name: { type: String, unique: true, index: "text", required: true },
          members: [{ type: ObjectId, ref: userSchemaName }],
        },
        {
          timestamps: true,
        }
      );

      CrewDao.crewSchema.pre("findOne", function (next) {
        this.populate("members");
        return next();
      });
    }

    if (!CrewDao.crewModel) {
      CrewDao.crewModel = model(CrewDao.schemaName, CrewDao.crewSchema);
    }
  }

  public static async findAll(): Promise<Array<Crew>> {
    return CrewDao.crewModel.find({}).exec();
  }

  public static async findByName(name: string): Promise<Crew | null> {
    const document = await CrewDao.crewModel.findOne({ name }).exec();
    if (document) {
      return { ...document.toObject() } as Crew;
    }

    return null;
  }

  public static async save(crew: Crew): Promise<Crew | null> {
    if (!crew?.name) {
      throw new Error("name is missing");
    }

    if (!crew?.members || !crew?.members?.length) {
      throw new Error("members is missing");
    }

    const name = crew.name.toLowerCase();

    await CrewDao.crewModel.updateOne(
      { name },
      {
        ...crew,
        name,
      },
      { upsert: true }
    );

    return CrewDao.findByName(name);
  }
}
