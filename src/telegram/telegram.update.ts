import { Update, Start, Hears, Action } from 'nestjs-telegraf';
import { Markup, Context } from 'telegraf';
import { CustomLoggerService } from '../logger/custom-logger.service';
import * as WebTorrent from 'webtorrent';

@Update()
export class TelegramUpdate {
  private readonly client;
  private readonly fileExtension;
  private readonly AdmZip;
  private lastMessages;

  constructor(private readonly logger: CustomLoggerService) {
    this.client = new WebTorrent();
    this.fileExtension = require('file-extension');
    this.AdmZip = require('adm-zip');
    this.lastMessages = {
      bot: null,
      user: null,
    };

    this.client.on('download', (bytes) => {
      console.log('just downloaded: ' + bytes);
      console.log('total downloaded: ' + this.client.downloaded);
      console.log('download speed: ' + this.client.downloadSpeed);
      console.log('progress: ' + this.client.progress);
    });
  }

  @Start()
  async startCommand(ctx: Context) {
    this.lastMessages.bot = ctx.message.message_id + 1;
    await ctx.reply(
      "Hey bro. Just send me magnet link and I'll download it. Click help button to get more information",
      Markup.inlineKeyboard(
        [
          {
            text: 'Help',
            callback_data: 'Help',
          },
          {
            text: 'Media',
            callback_data: 'Media',
          },
          {
            text: 'Status',
            callback_data: 'Status',
          },
          {
            text: 'Registration',
            callback_data: 'Registration',
          },
          {
            text: 'Remove data',
            callback_data: 'Remove data',
          },
          {
            text: 'Sing up',
            callback_data: 'Sing up',
          },
          {
            text: 'Sing in',
            callback_data: 'Sing in',
          },
        ],
        { columns: 3 },
      ),
    );
    await ctx.deleteMessage(ctx.message.message_id);
  }

  @Action('Help')
  async helpCommand(ctx: Context) {
    await this.replyWithText(
      ctx,
      '• To start downloading send magnet link into the chat.\n' +
        '• You can check downloading progress. Click status button.\n' +
        '• You can use web interface to watch you files. Click registration button and follow the instructions.\n' +
        '• To save your media data your should authorize into the app. Click sign up button.\n' +
        '• You can restore your media data. Click sign in button.\n' +
        '• You can delete all you data like media and user data. Click remove data button.\n',
    );
  }

  @Action('Status')
  async status(ctx: Context) {
    const progress = this.client.progress;
    await this.replyWithText(ctx, `Downloading progress ${progress}`);
  }

  @Action('Registration')
  async registration(ctx: Context) {
    await this.replyWithText(ctx, 'Registration link');
  }

  @Action('Remove data')
  async removeData(ctx: Context) {
    await this.replyWithText(ctx, 'Data was removed');
  }

  @Action('Sing up')
  async signUp(ctx: Context) {
    await this.replyWithText(ctx, 'You are signed up');
  }

  @Action('Sing in')
  async signIn(ctx: Context) {
    await this.replyWithText(ctx, 'You are signed in');
  }

  @Action('Media')
  async media(ctx: Context) {
    const torrents = this.client.torrents.map((el) => el.name);
    console.log(torrents);
    await this.replyWithText(ctx, torrents);
  }

  async downloaded(ctx: Context, torrent: any) {
    // await this.replyWithText(ctx, 'done');
    await ctx.replyWithDocument({
      source: `./${torrent.dn}.zip`,
    });
    await torrent.destroy();
  }

  @Hears(new RegExp(/magnet:?/g))
  async magentoUrl(ctx: any) {
    try {
      ctx.deleteMessage(ctx.message.message_id);
      this.client.add(
        ctx.message.text,
        {
          path: './download',
          addUID: true,
        },
        async (torrent) => {
          if (torrent.length > 2136746229) {
            torrent.destroy();
            await this.replyWithText(
              ctx,
              'The size of downloaded files must be less than 2 GB.\n' +
                'To download files larger than 2 GB you should use web interface',
            );
            return;
          }
          await this.replyWithText(
            ctx,
            'Downloading will start in a few seconds',
          );
          const zip = new this.AdmZip();
          torrent.on('done', async () => {
            console.log('torrent finished downloading');
            torrent.files.forEach((file) => {
              zip.addLocalFile(file.path);
            });
            zip.writeZip(`${torrent.dn}.zip`);
            await this.downloaded(ctx, torrent);
            // ctx
            //   .replyWithDocument({
            //     source: `./${torrent.dn}.zip`,
            //   })
            //   .then(() => {
            //     console.log('file sent to telegram');
            //     torrent.destroy();
            //   })
            //   .catch(function (error) {
            //     console.log(error);
            //   });
            // console.log('file sent to telegram');
            // torrent.destroy();
          });
        },
      );
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  async replyWithText(ctx: Context, text) {
    try {
      const messageId = this.lastMessages.bot;
      const chatId = ctx.chat.id;
      await ctx.telegram.editMessageText(
        chatId,
        messageId,
        undefined,
        text,
        Markup.inlineKeyboard(
          [
            {
              text: 'Help',
              callback_data: 'Help',
            },
            {
              text: 'Media',
              callback_data: 'Media',
            },
            {
              text: 'Status',
              callback_data: 'Status',
            },
            {
              text: 'Registration',
              callback_data: 'Registration',
            },
            {
              text: 'Remove data',
              callback_data: 'Remove data',
            },
            {
              text: 'Sing up',
              callback_data: 'Sing up',
            },
            {
              text: 'Sing in',
              callback_data: 'Sing in',
            },
          ],
          { columns: 3 },
        ),
      );
    } catch (e) {
      this.logger.error(e.message);
    }
  }
}
