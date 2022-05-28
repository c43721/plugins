import { fromAsync, isErr, type Args, Command, type PieceContext, type ChatInputCommand, UserError, type MessageCommand } from '@sapphire/framework';
import type { Message } from 'discord.js';
import {
	ChatInputSubcommandMappings,
	ChatInputSubcommandGroupMappings,
	ChatInputSubcommandMappingValue,
	ChatInputSubcommandToProperty,
	MessageSubcommandMappings,
	MessageSubcommandMappingValue,
	MessageSubcommandToProperty,
	type SubcommandMappingsArray,
	MessageSubcommandGroupMappings
} from './SubcommandMappings';
import {
	type ChatInputSubcommandAcceptedPayload,
	SubcommandPluginEvents,
	type MessageSubcommandAcceptedPayload,
	SubcommandPluginIdentifiers
} from './types/Events';

export class SubCommandPluginCommand<
	PreParseReturn extends Args = Args,
	O extends SubCommandPluginCommand.Options = SubCommandPluginCommand.Options
> extends Command<PreParseReturn, O> {
	public subcommandsInternalMapping: SubcommandMappingsArray;

	public constructor(context: PieceContext, options: O) {
		super(context, options);
		this.subcommandsInternalMapping = options.subcommands ?? [];
	}

	public onLoad() {
		super.onLoad();

		const externalMapping: SubcommandMappingsArray | undefined = Reflect.get(this, 'subcommandMappings');
		if (externalMapping) {
			const subcommands = Array.isArray(externalMapping) ? externalMapping : [];
			this.subcommandsInternalMapping = subcommands;
			this.options.subcommands = subcommands;
		}
	}

	public async messageRun(message: Message, args: PreParseReturn, context: MessageCommand.RunContext) {
		args.save();
		const subcommandOrGroup = args.nextMaybe();
		const subcommandName = args.nextMaybe();
		let defaultCommmand: MessageSubcommandMappingValue | null = null;

		for (const mapping of this.subcommandsInternalMapping) {
			if (mapping instanceof MessageSubcommandMappings && subcommandOrGroup.exists) {
				defaultCommmand = mapping.subcommands.find((s) => s.default === true) ?? null;

				const subcommand = mapping.subcommands.find(({ name }) => name === subcommandOrGroup.value);
				if (subcommand) return this.#handleMessageRun(message, args, context, subcommand);
			}

			if (mapping instanceof MessageSubcommandGroupMappings && mapping.groupName === subcommandOrGroup.value) {
				defaultCommmand = mapping.subcommands.find((s) => s.default === true) ?? null;

				const subcommand = mapping.subcommands.find(({ name }) => name === subcommandName.value);
				if (subcommand) return this.#handleMessageRun(message, args, context, subcommand);
			}
		}

		// No subcommand matched, let's restore and try to run default, if any:
		args.restore();
		if (defaultCommmand) return this.#handleMessageRun(message, args, context, defaultCommmand);

		// No match and no subcommand, return an err:
		throw new UserError({ identifier: SubcommandPluginIdentifiers.MessageSubcommandNoMatch, context });
	}

	public async chatInputRun(interaction: ChatInputCommand.Interaction, context: ChatInputCommand.RunContext) {
		const subcommandName = interaction.options.getSubcommand(false);
		const subcommandGroupName = interaction.options.getSubcommandGroup(false);

		for (const mapping of this.subcommandsInternalMapping) {
			if (mapping instanceof ChatInputSubcommandMappings && subcommandName && !subcommandGroupName) {
				const subcommand = mapping.subcommands.find(({ name }) => name === subcommandName);
				if (subcommand) return this.#handleInteractionRun(interaction, context, subcommand);
			}

			if (mapping instanceof ChatInputSubcommandGroupMappings && subcommandGroupName && mapping.groupName === subcommandGroupName) {
				const subcommand = mapping.subcommands.find(({ name }) => name === subcommandName);
				if (subcommand) return this.#handleInteractionRun(interaction, context, subcommand);
			}
		}

		// No match and no subcommand, return an err:
		throw new UserError({ identifier: SubcommandPluginIdentifiers.ChatInputSubcommandNoMatch, context });
	}

	async #handleInteractionRun(
		interaction: ChatInputCommand.Interaction,
		context: ChatInputCommand.RunContext,
		subcommand: ChatInputSubcommandMappingValue
	) {
		const payload: ChatInputSubcommandAcceptedPayload = { command: this, context, interaction };
		const result = await fromAsync(async () => {
			this.container.client.emit(SubcommandPluginEvents.ChatInputSubcommandRun, interaction, subcommand, payload);
			subcommand.type ??= 'method';
			let result: unknown;

			if (subcommand.type === 'command') {
				const parsedCommandName = subcommand.to && typeof subcommand.to === 'string' ? subcommand.to : subcommand.name;
				const command = this.container.stores.get('commands').get(parsedCommandName);
				if (!command?.supportsChatInputCommands())
					throw new UserError({ identifier: SubcommandPluginIdentifiers.SubcommandNotFound, context: { ...payload } });

				// Run global preconditions:
				const globalResult = await this.container.stores
					.get('preconditions')
					.chatInputRun(interaction, command as ChatInputCommand, context as any);

				if (!globalResult.success) {
					this.container.client.emit(SubcommandPluginEvents.ChatInputSubcommandDenied, globalResult.error, { ...payload, subcommand });
					return;
				}

				// Run command-specific preconditions:
				const localResult = await command.preconditions.chatInputRun(interaction, command as ChatInputCommand, context as any);

				if (!localResult.success) {
					this.container.client.emit(SubcommandPluginEvents.ChatInputSubcommandDenied, localResult.error, { ...payload, subcommand });
					return;
				}

				result = await command.chatInputRun(interaction, context);
			}

			if (subcommand.type === 'method' && subcommand.to) {
				if (typeof subcommand.to === 'string') {
					const method: ChatInputSubcommandToProperty | undefined = Reflect.get(this, subcommand.to);
					if (!method) throw new UserError({ identifier: SubcommandPluginIdentifiers.SubcommandNotFound, context: { ...payload } });
					result = await Reflect.apply(method, this, [interaction, context]);
				} else {
					result = await subcommand.to(interaction, context);
				}
			}

			this.container.client.emit(SubcommandPluginEvents.ChatInputSubcommandSuccess, interaction, subcommand, { ...payload, result });
		});

		if (isErr(result)) {
			this.container.client.emit(SubcommandPluginEvents.ChatInputSubcommandError, result.error, payload);
		}
	}

	async #handleMessageRun(message: Message, args: Args, context: MessageCommand.RunContext, subcommand: MessageSubcommandMappingValue) {
		const payload: MessageSubcommandAcceptedPayload = { message, command: this, context };
		const result = await fromAsync(async () => {
			this.container.client.emit(SubcommandPluginEvents.MessageSubcommandRun, message, subcommand, payload);
			subcommand.type ??= 'method';
			let result: unknown;

			if (subcommand.type === 'command') {
				const parsedCommandName = subcommand.to && typeof subcommand.to === 'string' ? subcommand.to : subcommand.name;
				const command = this.container.stores.get('commands').get(parsedCommandName);
				if (!command?.supportsMessageCommands())
					throw new UserError({ identifier: SubcommandPluginIdentifiers.SubcommandNotFound, context: { ...payload } });

				const prefixLess = message.content.slice(context.commandPrefix.length).trim();
				const spaceIndex = prefixLess.indexOf(' ');
				const parameters = spaceIndex === -1 ? '' : prefixLess.substring(spaceIndex + 1).trim();

				// Run global preconditions:
				const globalResult = await this.container.stores.get('preconditions').messageRun(message, command as MessageCommand, payload as any);

				if (!globalResult.success) {
					this.container.client.emit(SubcommandPluginEvents.MessageSubcommandDenied, globalResult.error, {
						...payload,
						parameters,
						subcommand
					});
					return;
				}

				// Run command-specific preconditions:
				const localResult = await command.preconditions.messageRun(message, command as MessageCommand, context as any);

				if (!localResult.success) {
					this.container.client.emit(SubcommandPluginEvents.MessageSubcommandDenied, localResult.error, {
						...payload,
						parameters,
						subcommand
					});
					return;
				}

				result = await command.messageRun(message, args, context);
			}

			if (subcommand.type === 'method' && subcommand.to) {
				if (typeof subcommand.to === 'string') {
					const method: MessageSubcommandToProperty | undefined = Reflect.get(this, subcommand.to);
					if (!method) throw new UserError({ identifier: SubcommandPluginIdentifiers.SubcommandNotFound, context: { ...payload } });

					result = await Reflect.apply(method, this, [message, args, context]);
				} else {
					result = await subcommand.to(message, args, context);
				}
			}

			this.container.client.emit(SubcommandPluginEvents.MessageSubcommandSuccess, message, subcommand, { ...payload, result });
		});

		if (isErr(result)) {
			this.container.client.emit(SubcommandPluginEvents.MessageSubcommandError, result.error, payload);
		}
	}
}

export interface SubcommandPluginCommandOptions extends Command.Options {
	subcommands?: SubcommandMappingsArray;
}

export namespace SubCommandPluginCommand {
	export type Options = SubcommandPluginCommandOptions;
}
