import { Update, Start, Hears, Action } from 'nestjs-telegraf';
import { Markup, Context } from 'telegraf';
import { CustomLoggerService } from '../logger/custom-logger.service';
import * as WebTorrent from 'webtorrent';
import * as fs from 'fs';

@Update()
export class TelegramUpdate {
  private readonly client;
  private readonly fileExtension;
  private readonly AdmZip;
  private lastMessages;
  private progress;
  private awayMessage = 'Downloading will start in a few seconds';

  constructor(private readonly logger: CustomLoggerService) {
    this.client = new WebTorrent();
    this.fileExtension = require('file-extension');
    this.AdmZip = require('adm-zip');
    this.lastMessages = {
      bot: null,
      user: null,
    };

    // this.client.on('download', (bytes) => {
    //   console.log('just downloaded: ' + bytes);
    //   console.log('total downloaded: ' + this.client.downloaded);
    //   console.log('download speed: ' + this.client.downloadSpeed);
    //   console.log('progress: ' + this.client.progress);
    // });
  }

  @Start()
  async startCommand(ctx: Context) {
    this.lastMessages.bot = ctx.message.message_id + 1;
    await this.replyWithInlineKeyboard(
      "Hey bro. Just send me magnet link and I'll download it. Click help button to get more information",
      ctx,
    );
    await ctx.deleteMessage(ctx.message.message_id);
  }

  @Action('Help')
  async helpCommand(ctx: Context) {
    await this.editMessageText(
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
    await this.editMessageText(ctx, `Downloading progress ${progress}`);
  }

  @Action('Registration')
  async registration(ctx: Context) {
    await this.editMessageText(ctx, 'Registration link');
  }

  @Action('Remove data')
  async removeData(ctx: Context) {
    await this.editMessageText(ctx, 'Data was removed');
  }

  @Action('Sing up')
  async signUp(ctx: Context) {
    await this.editMessageText(ctx, 'You are signed up');
  }

  @Action('Sing in')
  async signIn(ctx: Context) {
    await this.editMessageText(ctx, 'You are signed in');
  }

  @Action('Media')
  async media(ctx: Context) {
    const torrents = this.client.torrents.map((el) => el.name);
    console.log(torrents);
    await this.editMessageText(ctx, torrents);
  }

  async uploadToTg(ctx: Context, torrent: any): Promise<void> {
    await this.editMessageText(ctx, '');
    await ctx.replyWithDocument({
      source: `./${torrent.dn}.zip`,
    });
    await torrent.destroy();
    await ctx.deleteMessage(this.lastMessages.bot);
    await this.replyWithInlineKeyboard(
      "Here we go! Let's move on, buddy!",
      ctx,
    );
    this.lastMessages.bot = ctx.message.message_id + 2;
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
          destroyStoreOnDestroy: true,
        },
        async (torrent) => {
          if (torrent.length > 2136746229) {
            torrent.destroy();
            await this.editMessageText(
              ctx,
              'The size of downloaded files must be less than 2 GB.\n' +
                'To download files larger than 2 GB you should use web interface',
            );
            return;
          }
          await this.editMessageText(ctx, this.awayMessage);
          this.showProgress(ctx);
          const zip = new this.AdmZip();
          torrent.on('done', async () => {
            console.log('torrent finished downloading');
            torrent.files.forEach((file) => {
              zip.addLocalFile(file.path);
            });
            zip.writeZip(`${torrent.dn}.zip`);
            await this.uploadToTg(ctx, torrent);
            // await fs.promises.rm(`./${torrent.dn}.zip`);
          });
        },
      );
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  showProgress(ctx: Context) {
    try {
      this.progress = 0;
      this.client.on('download', async (bytes) => {
        const clientProgress = Math.floor(this.client.progress * 10) / 10;
        const downloadingSpeed = this.client.downloadSpeed;
        console.log(clientProgress, this.progress);
        if (clientProgress > this.progress) {
          this.progress = clientProgress;
          const progressText = this.getProgress(clientProgress);
          const text = `${progressText}\ndownload speed: ${downloadingSpeed}`;
          await this.editMessageText(ctx, text);
        }
      });
    } catch (e) {
      this.logger.error(e.message);
    }
  }

  async editMessageText(ctx: Context, text) {
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

  getProgress(progress: number): string {
    const progressBar = {
      10: '⬛⬜⬜⬜⬜⬜⬜⬜⬜⬜',
      20: '⬛⬛⬜⬜⬜⬜⬜⬜⬜⬜',
      30: '⬛⬛⬛⬜⬜⬜⬜⬜⬜⬜',
      40: '⬛⬛⬛⬛⬜⬜⬜⬜⬜⬜',
      50: '⬛⬛⬛⬛⬛⬜⬜⬜⬜⬜',
      60: '⬛⬛⬛⬛⬛⬛⬜⬜⬜⬜',
      70: '⬛⬛⬛⬛⬛⬛⬛⬜⬜⬜',
      80: '⬛⬛⬛⬛⬛⬛⬛⬛⬜⬜',
      90: '⬛⬛⬛⬛⬛⬛⬛⬛⬛⬜',
      100: '⬛⬛⬛⬛⬛⬛⬛⬛⬛⬛',
    };
    // ▪️▫
    //❓❗️
    // const progressBar = {
    //   10: '▫▪▪▪▪▪▪▪▪▪',
    //   20: '▫▫▪▪▪▪▪▪▪▪',
    //   30: '▫▫▫▪▪▪▪▪▪▪',
    //   40: '▫▫▫▫▪▪▪▪▪▪',
    //   50: '▫▫▫▫▫▪▪▪▪▪',
    //   60: '▫▫▫▫▫▫▪▪▪▪',
    //   70: '▫▫▫▫▫▫▫▪▪▪',
    //   80: '▫▫▫▫▫▫▫▫▪▪',
    //   90: '▫▫▫▫▫▫▫▫▫▪',
    //   100: '▫▫▫▫▫▫▫▫▫▫',
    // };
    // const progressBar = {
    //   10: '❓❗❗❗❗❗❗❗❗❗',
    //   20: '❓❓❗❗❗❗❗❗❗❗',
    //   30: '❓❓❓❗❗❗❗❗❗❗',
    //   40: '❓❓❓❓❗❗❗❗❗❗',
    //   50: '❓❓❓❓❓❗❗❗❗❗',
    //   60: '❓❓❓❓❓❓❗❗❗❗',
    //   70: '❓❓❓❓❓❓❓❗❗❗',
    //   80: '❓❓❓❓❓❓❓❓❗❗',
    //   90: '❓❓❓❓❓❓❓❓❓❗',
    //   100: '❓❓❓❓❓❓❓❓❓❓',
    // };
    switch (progress) {
      case 0.1:
        return progressBar['10'];
      case 0.2:
        return progressBar['20'];
      case 0.3:
        return progressBar['30'];
      case 0.4:
        return progressBar['40'];
      case 0.5:
        return progressBar['50'];
      case 0.6:
        return progressBar['60'];
      case 0.7:
        return progressBar['70'];
      case 0.8:
        return progressBar['80'];
      case 0.9:
        return progressBar['90'];
      case 1:
        return progressBar['100'];
    }
  }

  async replyWithInlineKeyboard(text: string, ctx: Context): Promise<void> {
    await ctx.reply(
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
    this.lastMessages.bot = ctx.message.message_id + 1;
  }
}
