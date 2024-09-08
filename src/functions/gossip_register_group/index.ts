import { APIGatewayEvent, Callback, Context } from "aws-lambda";
import { BAD_REQUEST, OK, INTERNAL_SERVER_ERROR } from "http-status";
import {
  ChatTypeTg,
  FormattingOptionsTg,
  GossipGroup,
  UpdateTg,
} from "../../lib/models";
import { GossipGroupDao } from "../../lib/dao";
import { BotnorreaService } from "../../lib/services";

const sendMessage = async (body: UpdateTg, text: string): Promise<void> => {
  await BotnorreaService.sendMessage({
    chat_id: body.message!.chat.id,
    text,
    reply_to_message_id: body?.message?.message_id,
    parse_mode: FormattingOptionsTg.HTML,
  });
  return;
};

const saveGroup = async (body: UpdateTg): Promise<GossipGroup | null> => {
  return GossipGroupDao.save({
    id: String(body?.message?.chat?.id),
    enabled: true,
  });
};

const execute = async (body: UpdateTg): Promise<{ statusCode: number }> => {
  BotnorreaService.initInstance();
  await GossipGroupDao.initInstance();

  if (body?.message?.chat?.type === ChatTypeTg.PRIVATE) {
    await sendMessage(body, "Cannot allowed in private chat!");
    return { statusCode: BAD_REQUEST };
  }

  const gossipGroup = await saveGroup(body);
  if (!gossipGroup) {
    await sendMessage(body, "Something is going wrong!");
    return { statusCode: INTERNAL_SERVER_ERROR };
  }

  await sendMessage(
    body,
    `<b>${body?.message?.chat?.title}</b> now is eligible as gossip recipient`
  );
  return { statusCode: OK };
};

export const gossipRegisterGroup = async (
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
