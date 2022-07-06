import { Update, Start, Hears } from 'nestjs-telegraf';
import { Markup } from 'telegraf';
import { CustomLoggerService } from '../logger/custom-logger.service';
import * as WebTorrent from 'webtorrent';

@Update()
export class TelegramUpdate {
  private readonly client;
  private readonly fileExtension;
  private readonly AdmZip;

  constructor(private readonly logger: CustomLoggerService) {
    this.client = new WebTorrent();
    this.fileExtension = require('file-extension');
    this.AdmZip = require('adm-zip');

    this.client.on('download', (bytes) => {
      console.log('just downloaded: ' + bytes);
      console.log('total downloaded: ' + this.client.downloaded);
      console.log('download speed: ' + this.client.downloadSpeed);
      console.log('progress: ' + this.client.progress);
    });
  }

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
    const progress = this.client.progress;
    await ctx.reply(
      `Downloading progress ${progress}`,
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
    try {
      this.client.add(ctx.message.text, (torrent) => {
        const zip = new this.AdmZip();
        torrent.on('done', function () {
          console.log('torrent finished downloading');
          torrent.files.forEach(function (file) {
            zip.addLocalFile(file.path);
          });
          zip.writeZip(`./${torrent.dn}.zip`);
          ctx
            .replyWithDocument({
              source: `./${torrent.dn}.zip`,
            })
            .then(() => {
              console.log('file sent to telegram');
              torrent.destroy();
            })
            .catch(function (error) {
              console.log(error);
            });
        });
      });

      await ctx.deleteMessage();
      await ctx.deleteMessage(ctx.message.message_id - 1);
      await ctx.reply('Downloading will start in a few seconds');
    } catch (e) {
      this.logger.error(e.message);
    }
  }
}
