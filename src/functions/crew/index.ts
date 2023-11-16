import { APIGatewayEvent, Callback, Context } from "aws-lambda";
import { BAD_REQUEST, OK, NOT_FOUND } from "http-status";
import { FormattingOptionsTg, UpdateTg, User } from "../../lib/models";
import { getTextCommand } from "../../lib/utils/telegramHelper";
import { CrewDao } from "../../lib/dao/crewDao";
import { BotnorreaService } from "../../lib/services/botnorrea";

const sendMessage = async (body: UpdateTg, text: string): Promise<void> => {
  BotnorreaService.initInstance();
  await BotnorreaService.sendMessage({
    chat_id: body?.message?.chat?.id,
    text,
    reply_to_message_id: body?.message?.message_id,
    parse_mode: FormattingOptionsTg?.HTML,
  });
  return;
};

const getDataFromBody = (body: UpdateTg): { crew: string; message: string } => {
  const key = getTextCommand(body) ?? "";

  const [crewName, ...rawMessage] = body?.message?.text
    ?.replace(key, "")
    ?.trim()
    ?.split(" ");

  return { crew: crewName?.toLowerCase(), message: rawMessage?.join(" ")?.trim() };
};

const getCrewMembers = async (name: string): Promise<string | void> => {
  await CrewDao.initInstance();
  const crew = await CrewDao.findByName(name);
  if (!crew) {
    return;
  }

  if (!crew?.members || !crew?.members?.length) {
    return;
  }

  const members = crew?.members
    ?.filter((member) => typeof member !== "string")
    ?.map((member) => member as User)
    ?.map((member: User) => `@${member?.username}`)
    ?.join(" | ");

  if (!members) {
    return;
  }

  return `[ ${members} ]`;
};

const buildMessage = async (body: UpdateTg): Promise<string | void> => {
  const { crew, message } = getDataFromBody(body);
  const crewMembers = await getCrewMembers(crew);
  if (!crewMembers) {
    return;
  }

  return [`${crew}:`, `<b>${message}</b>`, crewMembers]?.join("\n\n")?.trim();
};

const execute = async (body: UpdateTg): Promise<{ statusCode: number }> => {
  const crewMembers = await buildMessage(body);
  if (!crewMembers) {
    await sendMessage(body, "Crew not found");
    return { statusCode: NOT_FOUND };
  }

  await sendMessage(body, crewMembers);
  return { statusCode: OK };
};

export const crew = async (
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