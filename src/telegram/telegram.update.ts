import { Update, Start, Hears, Action } from 'nestjs-telegraf';
import { Markup, Context } from 'telegraf';
import { CustomLoggerService } from '../logger/custom-logger.service';
import * as WebTorrent from 'webtorrent';
import { getManager } from 'typeorm';
import { UserEntity } from '../entities/User.entity';
import { LinkEntity } from '../entities/Link.entity';
import { FileEntity } from '../entities/File.entity';
import { User } from './interfaces';

@Update()
export class TelegramUpdate {
  private readonly client;
  private readonly fileExtension;
  private readonly AdmZip;
  private lastMessages;
  private progress;
  private isDowloading;

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
    this.lastMessages.user = ctx.message.message_id;
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
        '• You can use web interface to watch you files. Click registration button and follow the instructions.\n' +
        '• To save your media data your should authorize into the app. Click sign up button.\n' +
        '• You can restore your media data. Click sign in button.\n' +
        '• You can delete all you data like media and user data. Click remove data button.\n',
    );
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
    // await this.editMessageText(ctx, 'You are signed up');
    try {
      const newUser = {} as User;
      newUser.telegramId = ctx.update['callback_query'].from.id;
      newUser.username = ctx.update['callback_query'].from.username;
      newUser.firstName = ctx.update['callback_query'].from.first_name;
      newUser.lastName = ctx.update['callback_query'].from.last_name;
      newUser.languageCode = ctx.update['callback_query'].from.language_code;
      newUser.isBot = ctx.update['callback_query'].from.is_bot;

      await getManager('magxb').transaction(async (transaction) => {
        const isUserExits = await transaction.findOne(UserEntity, {
          where: { userId: newUser.telegramId },
        });
        if (isUserExits) {
          throw new Error('User already exists');
        }
        const rowUser = {
          id: null,
          userId: newUser.telegramId,
          username: newUser.username,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          languageCode: newUser.languageCode,
          isBot: newUser.isBot,
        };
        const user = transaction.create(UserEntity, rowUser);
        await transaction.save(user);
        await this.editMessageText(ctx, 'You are signed up');
      });
      this.logger.log(`User ${newUser.telegramId} signed up`);
    } catch (e) {
      this.logger.error(e.message);
      await this.editMessageText(ctx, e.message);
    }
  }

  @Action('Sing in')
  async signIn(ctx: Context) {
    await this.editMessageText(ctx, 'You are signed in');
  }

  @Action('Media')
  async media(ctx: Context) {
    try {
      const newUser = {} as User;
      newUser.telegramId = ctx.update['callback_query'].from.id;
      newUser.username = ctx.update['callback_query'].from.username;
      newUser.firstName = ctx.update['callback_query'].from.first_name;
      newUser.lastName = ctx.update['callback_query'].from.last_name;
      newUser.languageCode = ctx.update['callback_query'].from.language_code;
      newUser.isBot = ctx.update['callback_query'].from.is_bot;

      await getManager('magxb').transaction(async (transaction) => {
        const isUserExits = await transaction.findOne(UserEntity, {
          where: { userId: newUser.telegramId },
        });
        if (!isUserExits) {
          throw new Error('User not exists');
        }
        const links = await transaction.find(LinkEntity, {
          relations: ['user'],
          where: { user: { userId: newUser.telegramId } },
        });
        if (!links) {
          throw new Error('Media not exists');
        }
        await this.editMessageText(
          ctx,
          `You have media ${JSON.stringify(links)}`,
        );
      });
      this.logger.log(`User ${newUser.telegramId} signed up`);
    } catch (e) {
      this.logger.error(e.message);
      await this.editMessageText(ctx, e.message);
    }
  }

  async uploadToTg(ctx: Context, torrent: any): Promise<void> {
    await ctx.replyWithDocument({
      source: `./${torrent.dn}.zip`,
    });
    await torrent.destroy();
    await ctx.deleteMessage(this.lastMessages.bot);
    await this.replyWithInlineKeyboard(
      "Here we go! Let's move on, buddy!",
      ctx,
    );
    this.isDowloading = false;
  }

  @Hears(new RegExp(/magnet:?/g))
  async magentoUrl(ctx: any) {
    try {
      ctx.deleteMessage(ctx.message.message_id);
      if (this.isDowloading) {
        const text = 'Only one file can be downloaded at a time';
        await ctx.reply(text);
        setTimeout(async () => {
          await ctx.deleteMessage(ctx.message.message_id + 1);
        }, 2000);
        return;
      }
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
          await this.editMessageText(
            ctx,
            'Downloading will start in a few seconds.',
          );
          this.isDowloading = true;
          this.showProgress(ctx);
          const zip = new this.AdmZip();
          torrent.on('done', async () => {
            console.log('torrent finished downloading');
            torrent.files.forEach((file) => {
              zip.addLocalFile(file.path);
            });
            const pathToZip = `${torrent.dn}.zip`;
            zip.writeZip(pathToZip);
            await this.uploadToTg(ctx, torrent);
            await this.saveTorrent(
              ctx.message.from.id,
              ctx.message.text,
              pathToZip,
              torrent.dn,
            );
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
      this.client.on('download', async () => {
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

  async replyWithInlineKeyboard(text: string, ctx: Context): Promise<void> {
    const message = await ctx.reply(
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
    this.lastMessages.bot = message.message_id;
  }

  async saveTorrent(
    userId: number,
    magnet: string,
    path: string,
    fileName: string,
  ) {
    // save torrent to db
    try {
      await getManager('magxb').transaction(async (transaction) => {
        const user = await transaction.findOne(UserEntity, {
          where: { userId: userId },
        });
        if (!user) {
          throw new Error('User not exists');
        }
        const link: LinkEntity = {
          id: null,
          link: magnet,
          linkType: 'magnet',
          receiveDate: new Date(),
          user: user,
        };
        const linkEntity = await transaction.create(LinkEntity, link);
        // const file: FileEntity = {
        //   id: null,
        //   fileName: fileName,
        //   pathToFile: path,
        //   receiveDate: new Date(),
        //   user: user,
        // };
        await transaction.save(linkEntity);
      });
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
}
