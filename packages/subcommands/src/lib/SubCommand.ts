import { fromAsync, isErr, type Args, Command, type PieceContext, type ChatInputCommand, UserError, type MessageCommand } from '@sapphire/framework';
import type { Message } from 'discord.js';
import {
	ChatInputSubCommandMappings,
	ChatInputSubCommandGroupMappings,
	ChatInputSubCommandMappingValue,
	ChatInputSubCommandToProperty,
	MessageSubCommandMappings,
	MessageSubCommandMappingValue,
	MessageSubCommandToProperty,
	type SubCommandMappingsArray,
	MessageSubCommandGroupMappings
} from './SubCommandMappings';
import {
	type ChatInputSubCommandAcceptedPayload,
	SubCommandPluginEvents,
	type MessageSubCommandAcceptedPayload,
	SubCommandPluginIdentifiers
} from './types/Events';

export class SubCommandPluginCommand<
	PreParseReturn extends Args = Args,
	O extends SubCommandPluginCommand.Options = SubCommandPluginCommand.Options
> extends Command<PreParseReturn, O> {
	public subcommandsInternalMapping: SubCommandMappingsArray;

	public constructor(context: PieceContext, options: O) {
		super(context, options);
		this.subcommandsInternalMapping = options.subcommands ?? [];
	}

	public onLoad() {
		super.onLoad();

		const externalMapping: SubCommandMappingsArray | undefined = Reflect.get(this, 'subcommandMappings');
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
		let defaultCommmand: MessageSubCommandMappingValue | null = null;

		for (const mapping of this.subcommandsInternalMapping) {
			if (mapping instanceof MessageSubCommandMappings && subcommandOrGroup.exists) {
				defaultCommmand = mapping.subcommands.find((s) => s.default === true) ?? null;

				const subcommand = mapping.subcommands.find(({ name }) => name === subcommandOrGroup.value);
				if (subcommand) return this.#handleMessageRun(message, args, context, subcommand);
			}

			if (mapping instanceof MessageSubCommandGroupMappings && mapping.groupName === subcommandOrGroup.value) {
				defaultCommmand = mapping.subcommands.find((s) => s.default === true) ?? null;

				const subcommand = mapping.subcommands.find(({ name }) => name === subcommandName.value);
				if (subcommand) return this.#handleMessageRun(message, args, context, subcommand);
			}
		}

		// No subcommand matched, let's restore and try to run default, if any:
		args.restore();
		if (defaultCommmand) return this.#handleMessageRun(message, args, context, defaultCommmand);

		// No match and no subcommand, return an err:
		throw new UserError({ identifier: SubCommandPluginIdentifiers.MessageSubCommandNoMatch, context });
	}

	public async chatInputRun(interaction: ChatInputCommand.Interaction, context: ChatInputCommand.RunContext) {
		const subcommandName = interaction.options.getSubcommand(false);
		const subcommandGroupName = interaction.options.getSubcommandGroup(false);

		for (const mapping of this.subcommandsInternalMapping) {
			if (mapping instanceof ChatInputSubCommandMappings && subcommandName && !subcommandGroupName) {
				const subcommand = mapping.subcommands.find(({ name }) => name === subcommandName);
				if (subcommand) return this.#handleInteractionRun(interaction, context, subcommand);
			}

			if (mapping instanceof ChatInputSubCommandGroupMappings && subcommandGroupName && mapping.groupName === subcommandGroupName) {
				const subcommand = mapping.subcommands.find(({ name }) => name === subcommandName);
				if (subcommand) return this.#handleInteractionRun(interaction, context, subcommand);
			}
		}

		// No match and no subcommand, return an err:
		throw new UserError({ identifier: SubCommandPluginIdentifiers.ChatInputSubCommandNoMatch, context });
	}

	async #handleInteractionRun(
		interaction: ChatInputCommand.Interaction,
		context: ChatInputCommand.RunContext,
		subcommand: ChatInputSubCommandMappingValue
	) {
		const payload: ChatInputSubCommandAcceptedPayload = { command: this, context, interaction };
		const result = await fromAsync(async () => {
			this.container.client.emit(SubCommandPluginEvents.ChatInputSubCommandRun, interaction, subcommand, payload);
			subcommand.type ??= 'method';
			let result: unknown;

			if (subcommand.type === 'command') {
				const parsedCommandName = subcommand.to && typeof subcommand.to === 'string' ? subcommand.to : subcommand.name;
				const command = this.container.stores.get('commands').get(parsedCommandName);
				if (!command?.supportsChatInputCommands())
					throw new UserError({ identifier: SubCommandPluginIdentifiers.SubCommandNotFound, context: { ...payload } });

				// Run global preconditions:
				const globalResult = await this.container.stores
					.get('preconditions')
					.chatInputRun(interaction, command as ChatInputCommand, context as any);

				if (!globalResult.success) {
					this.container.client.emit(SubCommandPluginEvents.ChatInputSubCommandDenied, globalResult.error, { ...payload, subcommand });
					return;
				}

				// Run command-specific preconditions:
				const localResult = await command.preconditions.chatInputRun(interaction, command as ChatInputCommand, context as any);

				if (!localResult.success) {
					this.container.client.emit(SubCommandPluginEvents.ChatInputSubCommandDenied, localResult.error, { ...payload, subcommand });
					return;
				}

				result = await command.chatInputRun(interaction, context);
			}

			if (subcommand.type === 'method' && subcommand.to) {
				if (typeof subcommand.to === 'string') {
					const method: ChatInputSubCommandToProperty | undefined = Reflect.get(this, subcommand.to);
					if (!method) throw new UserError({ identifier: SubCommandPluginIdentifiers.SubCommandNotFound, context: { ...payload } });
					result = await Reflect.apply(method, this, [interaction, context]);
				} else {
					result = await subcommand.to(interaction, context);
				}
			}

			this.container.client.emit(SubCommandPluginEvents.ChatInputSubCommandSuccess, interaction, subcommand, { ...payload, result });
		});

		if (isErr(result)) {
			this.container.client.emit(SubCommandPluginEvents.ChatInputSubCommandError, result.error, payload);
		}
	}

	async #handleMessageRun(message: Message, args: Args, context: MessageCommand.RunContext, subcommand: MessageSubCommandMappingValue) {
		const payload: MessageSubCommandAcceptedPayload = { message, command: this, context };
		const result = await fromAsync(async () => {
			this.container.client.emit(SubCommandPluginEvents.MessageSubCommandRun, message, subcommand, payload);
			subcommand.type ??= 'method';
			let result: unknown;

			if (subcommand.type === 'command') {
				const parsedCommandName = subcommand.to && typeof subcommand.to === 'string' ? subcommand.to : subcommand.name;
				const command = this.container.stores.get('commands').get(parsedCommandName);
				if (!command?.supportsMessageCommands())
					throw new UserError({ identifier: SubCommandPluginIdentifiers.SubCommandNotFound, context: { ...payload } });

				const prefixLess = message.content.slice(context.commandPrefix.length).trim();
				const spaceIndex = prefixLess.indexOf(' ');
				const parameters = spaceIndex === -1 ? '' : prefixLess.substring(spaceIndex + 1).trim();

				// Run global preconditions:
				const globalResult = await this.container.stores.get('preconditions').messageRun(message, command as MessageCommand, payload as any);

				if (!globalResult.success) {
					this.container.client.emit(SubCommandPluginEvents.MessageSubCommandDenied, globalResult.error, {
						...payload,
						parameters,
						subcommand
					});
					return;
				}

				// Run command-specific preconditions:
				const localResult = await command.preconditions.messageRun(message, command as MessageCommand, context as any);

				if (!localResult.success) {
					this.container.client.emit(SubCommandPluginEvents.MessageSubCommandDenied, localResult.error, {
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
					const method: MessageSubCommandToProperty | undefined = Reflect.get(this, subcommand.to);
					if (!method) throw new UserError({ identifier: SubCommandPluginIdentifiers.SubCommandNotFound, context: { ...payload } });

					result = await Reflect.apply(method, this, [message, args, context]);
				} else {
					result = await subcommand.to(message, args, context);
				}
			}

			this.container.client.emit(SubCommandPluginEvents.MessageSubCommandSuccess, message, subcommand, { ...payload, result });
		});

		if (isErr(result)) {
			this.container.client.emit(SubCommandPluginEvents.MessageSubCommandError, result.error, payload);
		}
	}
}

export interface SubcommandPluginCommandOptions extends Command.Options {
	subcommands?: SubCommandMappingsArray;
}

export namespace SubCommandPluginCommand {
	export type Options = SubcommandPluginCommandOptions;
}
