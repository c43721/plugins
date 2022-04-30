import {
	fromAsync,
	isErr,
	type Args,
	Command,
	type MessageCommandContext,
	type PieceContext,
	ChatInputCommand,
	err,
	UserError,
	Identifiers
} from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';
import {
	SubCommandMessageRunMappingValue,
	SubcommandMessageRunMappings,
	type SubcommandMappingsArray,
	ChatInputSubcommandMappings,
	SubCommandMappingValue,
	ChatInputSubcommandGroupMappings,
	SubCommandInteractionToProperty,
	SubCommandMessageToProperty
} from './SubcommandMappings';
import { Events } from './types/Events';

export class SubCommandPluginCommand extends Command {
	public readonly subCommands: SubcommandMappingsArray;

	public constructor(context: PieceContext, options: SubCommandPluginCommandOptions) {
		super(context, options);
		this.subCommands = options.subCommands ?? [];
	}

	public messageRun(message: Message, args: Args, context: MessageCommandContext) {
		args.save();
		const value = args.nextMaybe();
		let defaultCommmand: SubCommandMessageRunMappingValue | null = null;

		for (const mapping of this.subCommands) {
			if (!(mapping instanceof SubcommandMessageRunMappings)) continue;
			defaultCommmand = mapping.subcommands.find((s) => s.default === true) ?? null;
			const subCommand = mapping.subcommands.find(({ name }) => name === value.value);
			if (subCommand) return this.#handleMessageRun(message, args, context, subCommand);
		}

		// No subcommand matched, let's restore and try to run default, if any:
		args.restore();
		if (defaultCommmand) return this.#handleMessageRun(message, args, context, defaultCommmand);

		// No match and no subcommand, return an err:
		return err(new UserError({ identifier: Identifiers.SubCommandMessageNoMatch, context }));
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

		// No match and no subcommand, return an err:
		return err(new UserError({ identifier: Identifiers.SubCommandInteractionNoMatch, context }));
	}

	async #handleInteractionRun(interaction: CommandInteraction, context: ChatInputCommand.RunContext, subCommand: SubCommandMappingValue) {
		const result = await fromAsync(async () => {
			interaction.client.emit(Events.SubCommandMessageRun as never, interaction, subCommand, context);
			if (typeof subCommand.to === 'string') {
				const method = Reflect.get(this, subCommand.to) as SubCommandInteractionToProperty | undefined;
				if (method) {
					await method(interaction, context);
				} else {
					err(new UserError({ identifier: Identifiers.SubCommandMethodNotFound, context }));
				}
			} else {
				await subCommand.to(interaction, context);
			}

			interaction.client.emit(Events.SubCommandMessageSuccess as never, interaction, subCommand, context);
		});

		if (isErr(result)) {
			interaction.client.emit(Events.SubCommandMessageSuccess as never, result.error, context);
		}
	}

	async #handleMessageRun(message: Message, args: Args, context: MessageCommandContext, subCommand: SubCommandMessageRunMappingValue) {
		const result = await fromAsync(async () => {
			message.client.emit(Events.SubCommandMessageRun as never, message, subCommand, context);

			if (typeof subCommand.to === 'string') {
				const method = Reflect.get(this, subCommand.to) as SubCommandMessageToProperty | undefined;
				if (method) {
					await method(message, args, context);
				} else {
					err(new UserError({ identifier: Identifiers.SubCommandMethodNotFound, context }));
				}
			} else {
				await subCommand.to(message, args, context);
			}

			message.client.emit(Events.SubCommandMessageSuccess as never, message, subCommand, context);
		});

		if (isErr(result)) {
			message.client.emit(Events.SubCommandMessageSuccess as never, result.error, context);
		}
	}
}

export interface SubCommandPluginCommandOptions extends Command.Options {
	subCommands?: SubcommandMappingsArray;
}
