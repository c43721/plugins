import {
	fromAsync,
	isErr,
	type Args,
	Command,
	type PieceContext,
	ChatInputCommand,
	err,
	UserError,
	Identifiers,
	Awaitable,
	MessageCommand
} from '@sapphire/framework';
import type { Message } from 'discord.js';
import {
	ChatInputSubcommandMappings,
	ChatInputSubcommandGroupMappings,
	ChatInputSubcommandMappingValue,
	ChatInputSubcommandToProperty,
	MessageSubcommandMappings,
	MessageSubcommandMappingValue,
	MessageSubcommandToProperty,
	type SubcommandMappingsArray
} from './SubcommandMappings';
import { ChatInputSubcommandAcceptedPayload, Events, MessageSubcommandAcceptedPayload } from './types/Events';

export class SubCommandPluginCommand extends Command {
	public readonly subcommands: SubcommandMappingsArray;

	public constructor(context: PieceContext, options: SubcommandPluginCommandOptions) {
		super(context, options);
		this.subcommands = options.subcommands ?? [];
	}

	public messageRun(message: Message, args: Args, context: MessageCommand.RunContext): Awaitable<unknown> {
		args.save();
		const value = args.nextMaybe();
		let defaultCommmand: MessageSubcommandMappingValue | null = null;

		for (const mapping of this.subcommands) {
			if (!(mapping instanceof MessageSubcommandMappings)) continue;
			defaultCommmand = mapping.subcommands.find((s) => s.default === true) ?? null;
			const subcommand = mapping.subcommands.find(({ name }) => name === value.value);
			if (subcommand) return this.#handleMessageRun(message, args, context, subcommand);
		}

		// No subcommand matched, let's restore and try to run default, if any:
		args.restore();
		if (defaultCommmand) return this.#handleMessageRun(message, args, context, defaultCommmand);

		// No match and no subcommand, return an err:
		return err(new UserError({ identifier: Identifiers.MessageSubcommandNoMatch, context }));
	}

	public chatInputRun(interaction: ChatInputCommand.Interaction, context: ChatInputCommand.RunContext): Awaitable<unknown> {
		const subcommandName = interaction.options.getSubcommand(false);
		const subcommandGroupName = interaction.options.getSubcommandGroup(false);

		if (subcommandName && !subcommandGroupName) {
			for (const mapping of this.subcommands) {
				if (!(mapping instanceof ChatInputSubcommandMappings)) continue;

				const subcommand = mapping.subcommands.find(({ name }) => name === subcommandName);
				if (subcommand) return this.#handleInteractionRun(interaction, context, subcommand);
			}
		}

		if (subcommandGroupName) {
			for (const mapping of this.subcommands) {
				if (!(mapping instanceof ChatInputSubcommandGroupMappings)) continue;
				if (mapping.groupName !== subcommandGroupName) continue;

				const subcommand = mapping.subcommands.find(({ name }) => name === subcommandName);
				if (subcommand) return this.#handleInteractionRun(interaction, context, subcommand);
			}
		}

		// No match and no subcommand, return an err:
		return err(new UserError({ identifier: Identifiers.ChatInputSubcommandNoMatch, context }));
	}

	async #handleInteractionRun(
		interaction: ChatInputCommand.Interaction,
		context: ChatInputCommand.RunContext,
		subcommand: ChatInputSubcommandMappingValue
	) {
		const payload: ChatInputSubcommandAcceptedPayload = { command: this, context, interaction };
		const result = await fromAsync(async () => {
			interaction.client.emit(Events.ChatInputSubcommandRun, interaction, subcommand, payload);
			let result: unknown;

			if (typeof subcommand.to === 'string') {
				const method = Reflect.get(this, subcommand.to) as ChatInputSubcommandToProperty | undefined;
				if (method) {
					result = await Reflect.apply(method, this, [interaction, context]);
				} else {
					err(new UserError({ identifier: Identifiers.SubcommandMethodNotFound, context: { ...payload } }));
				}
			} else {
				result = await subcommand.to(interaction, context);
			}

			interaction.client.emit(Events.ChatInputSubcommandSuccess, interaction, subcommand, { ...payload, result });
		});

		if (isErr(result)) {
			interaction.client.emit(Events.SubcommandError, result.error, payload);
		}
	}

	async #handleMessageRun(message: Message, args: Args, context: MessageCommand.RunContext, subcommand: MessageSubcommandMappingValue) {
		const payload: MessageSubcommandAcceptedPayload = { message, command: this, context };
		const result = await fromAsync(async () => {
			message.client.emit(Events.MessageSubcommandRun, message, subcommand, payload);
			let result: unknown;

			if (typeof subcommand.to === 'string') {
				const method = Reflect.get(this, subcommand.to) as MessageSubcommandToProperty | undefined;
				if (method) {
					result = await await Reflect.apply(method, this, [message, args, context]);
				} else {
					err(new UserError({ identifier: Identifiers.SubcommandMethodNotFound, context: { ...payload } }));
				}
			} else {
				result = await subcommand.to(message, args, context);
			}

			message.client.emit(Events.MessageSubcommandSuccess, message, subcommand, { ...payload, result });
		});

		if (isErr(result)) {
			message.client.emit(Events.SubcommandError, result.error, payload);
		}
	}
}

export interface SubcommandPluginCommandOptions extends Command.Options {
	subcommands?: SubcommandMappingsArray;
}