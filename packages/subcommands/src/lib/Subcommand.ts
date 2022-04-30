import { fromAsync, isErr, type Args, Command, type MessageCommandContext, type PieceContext, ChatInputCommand } from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';

import {
	SubCommandMessageRunMappingValue,
	SubcommandMessageRunMappings,
	type SubcommandMappingsArray,
	ChatInputSubcommandMappings,
	SubCommandMappingValue,
	ChatInputSubcommandGroupMappings
} from './SubcommandMappings';
import { Events } from './types/Events';

export class SubCommand extends Command {
	public subCommands: SubcommandMappingsArray;

	public constructor(context: PieceContext, options: SubCommandPluginCommandOptions) {
		super(context, options);
		this.subCommands = options.subCommands ?? [];
	}

	public messageRun(message: Message, args: Args, context: MessageCommandContext) {
		args.save();
		const value = args.nextMaybe();

		for (const mapping of this.subCommands) {
			if (!(mapping instanceof SubcommandMessageRunMappings)) continue;
			const subCommand = mapping.subcommands.find(({ name }) => name === value.value);
			if (subCommand) return this.#handleMessageRun(message, args, context, subCommand);
		}

		// No subcommand matched, let's restore and try to run default, if any:
		args.restore();
		throw new Error(`The command ${this.name} does not support sub-commands.`);
	}

	public chatInputRun(interaction: CommandInteraction, context: ChatInputCommand.RunContext) {
		const subCommandName = interaction.options.getSubcommand(false);
		const subCommandGroupName = interaction.options.getSubcommandGroup(false);

		if (subCommandName && !subCommandGroupName) {
			for (const mapping of this.subCommands) {
				if (!(mapping instanceof ChatInputSubcommandMappings)) continue;
				const subCommand = mapping.subcommands.find(({ name }) => name === subCommandName);
				if (subCommand) return this.#handleInteractionRun(interaction, context, subCommand);
			}
		}

		if (subCommandGroupName) {
			for (const mapping of this.subCommands) {
				if (!(mapping instanceof ChatInputSubcommandGroupMappings)) continue;
				if (mapping.groupName !== subCommandGroupName) continue;

				const subCommand = mapping.subcommands.find(({ name }) => name === subCommandName);
				if (subCommand) return this.#handleInteractionRun(interaction, context, subCommand);
			}
		}

		throw new Error(`The command ${this.name} does not support sub-commands.`);
	}

	async #handleInteractionRun(interaction: CommandInteraction, context: ChatInputCommand.RunContext, subCommand: SubCommandMappingValue) {
		const result = await fromAsync(async () => {
			interaction.client.emit(Events.SubCommandMessageRun as never, interaction, subCommand, context);
			await subCommand.to(interaction, context);
			interaction.client.emit(Events.SubCommandMessageSuccess as never, interaction, subCommand.name, context);
		});

		if (isErr(result)) {
			interaction.client.emit(Events.SubCommandMessageSuccess as never, result.error, context);
		}
	}

	async #handleMessageRun(message: Message, args: Args, context: MessageCommandContext, subCommand: SubCommandMessageRunMappingValue) {
		const result = await fromAsync(async () => {
			message.client.emit(Events.SubCommandMessageRun as never, message, subCommand, context);
			await subCommand.to(message, args, context);
			message.client.emit(Events.SubCommandMessageSuccess as never, message, subCommand.name, context);
		});

		if (isErr(result)) {
			message.client.emit(Events.SubCommandMessageSuccess as never, result.error, context);
		}
	}
}

export interface SubCommandPluginCommandOptions extends Command.Options {
	subCommands?: SubcommandMappingsArray;
}
