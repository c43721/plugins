import { type Args, type Awaitable, Command, type CommandContext, type PieceContext } from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';
import { ChatInputSubcommandGroupMappings, ChatInputSubcommandMappings, type SubcommandMappingsArray } from './SubcommandMappings';

export class SubCommand extends Command {
	public readonly subCommands = null;

	public constructor(context: PieceContext, options: SubCommandPluginCommandOptions) {
		super(context, options);

		this.subCommands = new Map();
	}

	public messageRun(message: Message, args: Args, context: CommandContext): Awaitable<unknown> {
		// TODO: Implement current behavior (pickResult + match on result)
		throw new Error('unimplemented');
	}

	public chatInputRun(interaction: CommandInteraction): Awaitable<unknown> {
		if (!this.subCommands) return;

		const subcommand = interaction.options.getSubcommand();
		const group = interaction.options.getSubcommandGroup();

		if (!subcommand && !group) {
			// TODO: figure out what to do when no subcommands nor groups are found
		}

		if (this.subCommands.has(subcommand) || this.subCommands.has(group)) {
			const mappedSubcommand = this.subCommands.get(subcommand) ?? this.subCommands.get(group);

			if (mappedSubcommand instanceof ChatInputSubcommandMappings) {
				// TODO: We have chat input subcommand, run it and check result
			} else if (mappedSubcommand instanceof ChatInputSubcommandGroupMappings) {
				// TODO: We have chat input group, run it and check result
			}
		}
	}
}

export interface SubCommandPluginCommandOptions<ArgType extends Args = Args, CommandType extends Command<ArgType> = Command<ArgType>>
	extends Command.Options {
	subCommands?: SubcommandMappingsArray;
}
