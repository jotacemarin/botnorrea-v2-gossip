import { APIGatewayEvent, Callback, Context } from "aws-lambda";
import { CREATED, BAD_REQUEST } from "http-status";
import { Crew, FormattingOptionsTg, UpdateTg, User } from "../../lib/models";
import { BotnorreaService } from "../../lib/services/botnorrea";
import { CrewDao } from "../../lib/dao/crewDao";
import { getTextCommand } from "../../lib/utils/telegramHelper";
import { UserDao } from "../../lib/dao/userDao";

const extractSelfUser = async (body: UpdateTg): Promise<User | null> => {
  await UserDao.initInstance();
  return UserDao.findByTelegramId(Number(body?.message?.from?.id));
};

const getDataFromBody = (
  body: UpdateTg
): { crewName: string; usernames: Array<string> } => {
  const key = getTextCommand(body) ?? "";

  const [crewName, ...usernames] = body?.message?.text
    ?.replace(key, "")
    ?.trim()
    ?.split(" ");

  return { crewName: crewName?.toLowerCase(), usernames };
};

const getUsersId = async (usernames: Array<string>) => {
  await UserDao.initInstance();
  const users = await UserDao.findByUsernames(usernames);
  if (!users || !users?.length) {
    return [];
  }

  return users.map((user: User) => user?._id as string);
};

const getCrewCreate = async (body: UpdateTg): Promise<Crew | null> => {
  const user = await extractSelfUser(body);
  const { crewName, usernames } = getDataFromBody(body);

  const usersInput = await getUsersId(usernames);
  const stringIdUsers = [user?._id, ...usersInput]
    ?.filter((user) => Boolean(user))
    ?.map((rawUser) => String(rawUser));
  const users = [...new Set(stringIdUsers)];

  await CrewDao.initInstance();
  return CrewDao.save({
    name: crewName,
    members: users,
  });
};

const sendMessage = async (body: UpdateTg, text: string): Promise<void> => {
  BotnorreaService.initInstance();
  await BotnorreaService.sendMessage({
    chat_id: body?.message?.chat?.id,
    text,
    reply_to_message_id: body?.message?.message_id,
    parse_mode: FormattingOptionsTg.HTML,
  });
  return;
};

const buildMessage = async (body: UpdateTg, crew: Crew): Promise<void> => {
  const usernames = crew?.members
    ?.map((member) => member as User)
    ?.map((member: User) => `@${member?.username}`)
    .join(" | ");

  await sendMessage(
    body,
    `Crew <b>${crew?.name}</b> updated, members added:\n\n[ ${usernames} ]`
  );
  return;
};

const execute = async (
  body: UpdateTg
): Promise<{ statusCode: number; body?: string }> => {
  const crew = await getCrewCreate(body);
  if (!crew) {
    await sendMessage(body, "Crew could not be created");
    return { statusCode: BAD_REQUEST };
  }

  await buildMessage(body, crew);
  return { statusCode: CREATED };
};

export const crewsCreate = async (
  event: APIGatewayEvent,
  context: Context,
  callback: Callback
): Promise<void> => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!event?.body) {
    return callback(null, { statusCode: BAD_REQUEST });
  }

  const body = JSON.parse(event?.body);
  const response = await execute(body);
  return callback(null, response);
};
