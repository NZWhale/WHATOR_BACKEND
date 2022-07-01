import { Update, Start, Hears} from 'nestjs-telegraf';
import { Markup } from 'telegraf';

@Update()
export class TelegramUpdate {
  constructor() {}

  @Start()
  async startCommand(ctx: any) {
    await ctx.reply(
      "Hey bro. Just send me magnet link and I'll download it. Click help button to get more information",
      Markup.keyboard([
        ['Help', 'Media', 'Status'],
        ['Registration', 'Remove data'],
        ['Sing up', 'Sing in'],
      ]).resize(),
    );
    await ctx.deleteMessage(ctx.message.message_id - 1);
  }

  @Hears('Help')
  async helpCommand(ctx: any) {
    await ctx.deleteMessage();
    await ctx.deleteMessage(ctx.message.message_id - 1);
    await ctx.reply(
      '• To start downloading send magnet link into the chat.\n' +
        '• You can check downloading progress. Click status button.\n' +
        '• You can use web interface to watch you files. Click registration button and follow the instructions.\n' +
        '• To save your media data your should authorize into the app. Click sign up button.\n' +
        '• You can restore your media data. Click sign in button.\n' +
        '• You can delete all you data like media and user data. Click remove data button.\n',
      Markup.keyboard([
        ['Help', 'Media', 'Status'],
        ['Registration', 'Remove data'],
        ['Sing up', 'Sing in'],
      ]).resize(),
    );
  }

  @Hears('Status')
  async status(ctx: any) {
    await ctx.deleteMessage();
    await ctx.deleteMessage(ctx.message.message_id - 1);
    await ctx.reply(
      'Downloading progress',
      Markup.keyboard([
        ['Help', 'Media', 'Status'],
        ['Registration', 'Remove data'],
        ['Sing up', 'Sing in'],
      ]).resize(),
    );
  }

  @Hears('Registration')
  async registration(ctx: any) {
    await ctx.deleteMessage();
    await ctx.deleteMessage(ctx.message.message_id - 1);
    await ctx.reply(
      'Registration link',
      Markup.keyboard([
        ['Help', 'Media', 'Status'],
        ['Registration', 'Remove data'],
        ['Sing up', 'Sing in'],
      ]).resize(),
    );
  }

  @Hears('Remove data')
  async removeData(ctx: any) {
    await ctx.deleteMessage();
    await ctx.deleteMessage(ctx.message.message_id - 1);
    await ctx.reply(
      'Data was removed',
      Markup.keyboard([
        ['Help', 'Media', 'Status'],
        ['Registration', 'Remove data'],
        ['Sing up', 'Sing in'],
      ]).resize(),
    );
  }

  @Hears('Sing up')
  async signUp(ctx: any) {
    await ctx.deleteMessage();
    await ctx.deleteMessage(ctx.message.message_id - 1);
    await ctx.reply(
      'You are signed up',
      Markup.keyboard([
        ['Help', 'Media', 'Status'],
        ['Registration', 'Remove data'],
        ['Sing up', 'Sing in'],
      ]).resize(),
    );
  }

  @Hears('Sing in')
  async signIn(ctx: any) {
    await ctx.deleteMessage();
    await ctx.deleteMessage(ctx.message.message_id - 1);
    await ctx.reply(
      'You are signed in',
      Markup.keyboard([
        ['Help', 'Media', 'Status'],
        ['Registration', 'Remove data'],
        ['Sing up', 'Sing in'],
      ]).resize(),
    );
  }

  @Hears('Media')
  async media(ctx: any) {
    await ctx.deleteMessage();
    await ctx.deleteMessage(ctx.message.message_id - 1);
    await ctx.reply(
      'You are signed in',
      Markup.keyboard([
        ['Help', 'Media', 'Status'],
        ['Registration', 'Remove data'],
        ['Sing up', 'Sing in'],
      ]).resize(),
    );
  }

  @Hears(new RegExp(/magnet:?/g))
  async magentoUrl(ctx: any) {
    console.log(ctx);
    await ctx.reply('Downloading will start in a few seconds');
  }
}
