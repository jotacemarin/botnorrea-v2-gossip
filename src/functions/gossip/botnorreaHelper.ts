import { GossipGroup, User } from "../../lib/models";
import {
  FormattingOptionsTg,
  MessageTg,
  PhotoSizeTg,
  ReplyToMessageTg,
} from "../../lib/models/telegram";
import { BotnorreaService } from "../../lib/services/botnorrea";

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
    parse_mode: FormattingOptionsTg.HTML
  });
};

export const sendMessage = async (
  message: MessageTg | ReplyToMessageTg,
  group: GossipGroup | { id: string | number },
  text: string,
  spoiler: boolean
) => {
  if (message?.text) {
    await sendTextMessage(group, text);
  }

  if (message?.caption) {
    const [bigPhoto] = message?.photo?.sort(
      (first, second) => first.file_size - second.file_size
    );

    await sendPhoto(group, bigPhoto, text, spoiler);
  }
};

export const getChats = async (user: User, chats: Array<string | number>) =>
  BotnorreaService.getChats({ user: user?.id, chats });
