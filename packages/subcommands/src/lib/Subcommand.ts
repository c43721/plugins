import { type Args, type Awaitable, Command, type CommandContext, type PieceContext } from '@sapphire/framework';
import type { Message } from 'discord.js';

export class SubCommand extends Command {
	public readonly subCommands;

	public constructor(context: PieceContext, options: SubCommandPluginCommandOptions) {
		super(context, options);

		this.subCommands = new Map();
	}

	public messageRun(message: Message, args: Args, context: CommandContext): Awaitable<unknown> {
		// TODO: Implement current behavior (pickResult + match on result)
		throw new Error('unimplimented');
	}

	public chatInputRun(): Awaitable<unknown> {
		// TODO: Pick off subcommand group, try to match result to subcommand
		throw new Error('unimplimented');
	}
}

export interface SubCommandPluginCommandOptions<ArgType extends Args = Args, CommandType extends Command<ArgType> = Command<ArgType>>
	extends Command.Options {
	subCommands?: any;
}
