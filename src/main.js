import { Telegraf, session } from "telegraf";
import config from "config";
import { message } from "telegraf/filters";
import { ogg } from "./ogg.js";
import { code } from "telegraf/format";
import { openai } from "./openai.js";
const bot = new Telegraf(config.get("Telegram_token"));
const INITIAL_SESSION = {
  messages: [],
};
bot.launch();
bot.use(session());
bot.command("new", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply("Жду вашего запроса");
});
bot.command("start", async (ctx) => {
  ctx.session = INITIAL_SESSION;
  await ctx.reply("Жду вашего запроса");
});
bot.on(message("voice"), async (ctx) => {
  ctx.session ??= INITIAL_SESSION;
  try {
    await ctx.reply(code("ждите.."));
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    const oggPath = await ogg.create(link.href, userId);
    const mp3Path = await ogg.toMp3(oggPath, userId);
    const text = await openai.transform(mp3Path);
    // const response = await openai.chat(text)
    await ctx.reply(code(`Ваш запрос: ${text}`));

    ctx.session.messages.push({ role: "user", content: text });
    const response = await openai.chat(ctx.session.messages);
    ctx.session.messages.push({
      role: "assistant",
      content: response.content,
    });
    await ctx.reply(response.content);
  } catch {
    console.log("Error in main");
  }
});
bot.on(message("text"), async (ctx) => {
    ctx.session ??= INITIAL_SESSION;
    try {
      await ctx.reply(code("ждите.."));
;
  
      ctx.session.messages.push({ role: "user", content: ctx.message.text });
      const response = await openai.chat(ctx.session.messages);
      ctx.session.messages.push({
        role: "assistant",
        content: response.content,
      });
      await ctx.reply(response.content);
    } catch {
      console.log("Error in main");
    }
  });

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
