import { NOT_FOUND, OK } from "http-status";
import { GossipGroupDao } from "../../lib/dao";
import { FormattingOptionsTg, UpdateTg } from "../../lib/models";
import { BotnorreaService } from "../../lib/services";
import { sendMessage } from "./botnorreaHelper";

const getGroupFromCallback = (
  body: UpdateTg,
  groupId: number | string
): string => {
  const cb = (keyboardButtom) =>
    keyboardButtom?.callback_data === String(groupId);

  const groupName =
    body.callback_query!.message?.reply_markup?.inline_keyboard?.[0]?.find(cb)
      ?.text ?? "";

  return groupName ? ` to: <b>${groupName}</b>!` : ``;
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
      parse_mode: FormattingOptionsTg.HTML,
    });
  }
};

const deleteMessage = async (
  chatId: string | number,
  messageId: string | number
): Promise<void> => {
  await BotnorreaService.deleteMessage({
    chat_id: chatId,
    message_id: messageId,
  });
};

const executeCallback = async (
  body: UpdateTg,
  cleanGossipText: (body: UpdateTg) => { text: string; spoiler: boolean }
): Promise<{
  statusCode: number;
  text?: string;
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
  const chatId = body?.callback_query!.message?.reply_to_message?.chat?.id;
  const messageId = body?.callback_query!.message?.reply_to_message?.message_id;

  const { text } = cleanGossipText({
    update_id: body.update_id,
    message,
  });

  const privateReply = getGroupFromCallback(body, group?.id);

  await Promise.allSettled([
    sendMessage(message, group, text, true),
    editMessage(body, `Gossip sent${privateReply ? privateReply : "!"}`),
    deleteMessage(chatId, messageId),
  ]);

  return { statusCode: OK };
};

export default executeCallback;
