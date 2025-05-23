import {
  FormattingOptionsTg,
  GossipGroup,
  MessageTg,
  PhotoSizeTg,
  UpdateTg,
  User,
  VideoTg,
} from "../../lib/models";
import { BotnorreaService } from "../../lib/services";

const sendTextMessage = async (
  group: GossipGroup | { id: string | number },
  text: string
) => {
  await BotnorreaService.sendMessage({
    chat_id: group?.id,
    text: `Anonymous: ${text}`,
    parse_mode: FormattingOptionsTg.HTML,
  });
};

const sendPhoto = async (
  group: GossipGroup | { id: string | number },
  photo: PhotoSizeTg,
  text: string,
  spoiler: boolean
) => {
  await BotnorreaService.sendPhoto({
    chat_id: group?.id,
    photo: photo?.file_id,
    caption: `Anonymous: ${text}`,
    has_spoiler: spoiler,
    parse_mode: FormattingOptionsTg.HTML,
  });
};

const sendVideo = async (
  group: GossipGroup | { id: string | number },
  video: VideoTg,
  text: string,
  spoiler: boolean
) => {
  await BotnorreaService.sendVideo({
    chat_id: group?.id,
    video: video?.file_id,
    caption: `Anonymous: ${text}`,
    has_spoiler: spoiler,
    parse_mode: FormattingOptionsTg.HTML,
  });
};

export const sendMessage = async (
  message:
    | MessageTg
    | { text?: string; photo?: Array<PhotoSizeTg>; video?: VideoTg },
  group: GossipGroup | { id: string | number },
  text: string,
  spoiler: boolean
) => {
  if (message?.text) {
    await sendTextMessage(group, text);
  }

  if (message?.photo) {
    const [bigPhoto] = message?.photo?.sort(
      (first, second) => first.file_size - second.file_size
    );

    await sendPhoto(group, bigPhoto, text, spoiler);
  }

  if (message?.video) {
    await sendVideo(group, message?.video, text, spoiler);
  }
};

export const getChats = async (user: User, chats: Array<string | number>) =>
  BotnorreaService.getChats({ user: user?.id, chats });

export const editMessage = async (
  body: UpdateTg,
  text: string
): Promise<void> => {
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

export const deleteMessage = async (
  chatId: string | number,
  messageId: string | number
): Promise<void> => {
  await BotnorreaService.deleteMessage({
    chat_id: chatId,
    message_id: messageId,
  });
};
