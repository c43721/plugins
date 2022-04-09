import { type Args, type Awaitable, Command, type CommandContext, type PieceContext } from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';
import { ChatInputSubcommandGroupMappings, ChatInputSubcommandMappings, type SubcommandMappingsArray } from './SubcommandMappings';

export class SubCommand extends Command {
	public readonly subCommands: Map<string, SubcommandMappingsArray>;

	public constructor(context: PieceContext, options: SubCommandPluginCommandOptions) {
		super(context, options);

		this.subCommands = new Map();
	}

	public messageRun(message: Message, args: Args, context: CommandContext): Awaitable<unknown> {
		// Pick one argument, then try to match a subcommand:
		args.save();
		const value = args.nextMaybe();

		if (value.exists && this.subCommands.has(value.value)) {
			// TODO: ? ?
		}

		// No subcommand matched, let's restore and try to run default, if any:
		args.restore();
		throw new Error(`The command ${this.name} does not support sub-commands.`);
	}

	public chatInputRun(interaction: CommandInteraction): Awaitable<unknown> {
		if (!this.subCommands) return;

		const subcommand = interaction.options.getSubcommand();
		const group = interaction.options.getSubcommandGroup();

		if (!subcommand && !group) {
			throw new Error(`The command ${this.name} does not support sub-commands.`);
		}

		if (this.subCommands.has(subcommand) || this.subCommands.has(group)) {
			const mappedSubcommand = this.subCommands.get(subcommand) ?? this.subCommands.get(group);

			if (mappedSubcommand instanceof ChatInputSubcommandMappings) {
				// TODO: We have chat input subcommand, run it and check result
				const toRun = mappedSubcommand.subcommands.find((scmd) => scmd.name === subcommand);

				if (toRun) {
					try {
					} catch {}
				}
			} else if (mappedSubcommand instanceof ChatInputSubcommandGroupMappings) {
				// TODO: We have chat input group, run it and check result
			}
		}
	}

	#handleChatinput() {}

	#handleMessageRun() {}
}

export interface SubCommandPluginCommandOptions<ArgType extends Args = Args, CommandType extends Command<ArgType> = Command<ArgType>>
	extends Command.Options {
	subCommands?: SubcommandMappingsArray;
}
