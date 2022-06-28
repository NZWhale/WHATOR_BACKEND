import {
    Update,
    Start,
    Help,
    On,
    Hears,
    // Context,
} from 'nestjs-telegraf';
// import { TelegrafContext } from './common/interfaces/telegraf-context.interface.ts';
//TODO: figure out whats with telegrafcontext
@Update()
export class TelegramUpdate {
    constructor(){}

    @Start()
    async startCommand(ctx: any) {
        await ctx.reply('Welcome');
    }

    @Help()
    async helpCommand(ctx: any) {
        await ctx.reply('Send me a sticker');
    }

    @On('sticker')
    async onSticker(ctx: any) {
        await ctx.reply('👍');
    }

    @Hears('hi')
    async hearsHi(ctx: any) {
        await ctx.reply('Hey there');
    }
}
