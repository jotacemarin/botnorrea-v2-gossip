import { NOT_FOUND, OK } from "http-status";
import { GossipGroupDao } from "../../lib/dao";
import { UpdateTg } from "../../lib/models";
import { BotnorreaService } from "../../lib/services";
import { sendMessage } from "./botnorreaHelper";

const getGroupFromCallback = (
  body: UpdateTg,
  groupId: number | string
): string | undefined => {
  try {
    return body.callback_query!.message?.reply_markup?.inline_keyboard[0]?.find(
      (keyboardButtom) => keyboardButtom?.callback_data === String(groupId)
    )?.text;
  } catch {
    return undefined;
  }
};

const buildPrivateReply = (
  body: UpdateTg,
  groupId: number | string,
  text: string
): string => {
  const groupName = getGroupFromCallback(body, groupId);
  return [
    `Gossip: ${text}`,
    groupName ? `\n\nto: <b>${groupName}</b> ` : ``,
  ].join("");
};

const editMessage = async (body: UpdateTg, text: string): Promise<void> => {
  const {
    chat: { id: chatId },
    message_id: messageId,
    from,
  } = body?.callback_query!.message;
  if (from?.is_bot) {
    await BotnorreaService.editMessage({
      chat_id: chatId,
      message_id: messageId,
      text,
      reply_markup: { inline_keyboard: [] },
    });
  }
};

const executeCallback = async (
  body: UpdateTg,
  cleanGossipText: (body: UpdateTg) => { text: string; spoiler: boolean }
): Promise<{
  statusCode: number;
  text: string;
}> => {
  const groupId = body?.callback_query!.data;

  const group = await GossipGroupDao.findById(groupId);
  if (!group) {
    return {
      statusCode: NOT_FOUND,
      text: "Group not found",
    };
  }

  const message = body?.callback_query!.message?.reply_to_message;

  const { text, spoiler } = cleanGossipText({
    update_id: body.update_id,
    message,
  });

  await Promise.allSettled([
    sendMessage(message, group, text, spoiler),
    editMessage(body, `Gossip sent!`),
  ]);

  const privateReply = buildPrivateReply(body, group?.id, text);

  return {
    statusCode: OK,
    text: privateReply,
  };
};

export default executeCallback;
