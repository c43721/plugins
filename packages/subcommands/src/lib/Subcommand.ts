import {
	Command,
	Events,
	fromAsync,
	isErr,
	PreconditionContainerArray,
	UserError,
	type Args,
	type ChatInputCommand,
	type MessageCommand,
	type PieceContext
} from '@sapphire/framework';
import type { CacheType, Message } from 'discord.js';
import type {
	ChatInputCommandSubcommandMappingMethod,
	MessageSubcommandMappingMethod,
	SubcommandMappingArray,
	SubcommandMappingMethod
} from './SubcommandMappings';
import {
	SubcommandPluginEvents,
	SubcommandPluginIdentifiers,
	type ChatInputSubcommandAcceptedPayload,
	type MessageSubcommandAcceptedPayload
} from './types/Events';

export class Subcommand<PreParseReturn extends Args = Args, O extends Subcommand.Options = Subcommand.Options> extends Command<PreParseReturn, O> {
	public parsedSubcommandMappings: SubcommandMappingArray;

	public constructor(context: PieceContext, options: O) {
		super(context, options);
		this.parsedSubcommandMappings = options.subcommands ?? [];
	}

	public onLoad() {
		super.onLoad();

		const externalMapping: SubcommandMappingArray | undefined = Reflect.get(this, 'subcommandMappings');
		if (externalMapping) {
			const subcommands = Array.isArray(externalMapping) ? externalMapping : [];
			this.parsedSubcommandMappings = subcommands;
			this.options.subcommands = subcommands;
		}
	}

	public async messageRun(message: Message, args: PreParseReturn, context: MessageCommand.RunContext) {
		args.save();
		const subcommandOrGroup = args.nextMaybe();
		const subcommandName = args.nextMaybe();
		let defaultCommand: SubcommandMappingMethod | null = null;
		let actualSubcommandToRun: SubcommandMappingMethod | null = null;

		for (const mapping of this.parsedSubcommandMappings) {
			mapping.type ??= 'method';

			if (mapping.type === 'method') {
				if (mapping.default) {
					defaultCommand = mapping;
				}

				if (subcommandOrGroup.exists && mapping.name === subcommandOrGroup.value) {
					actualSubcommandToRun = mapping;
					// Exit early
					break;
				}
			}

			// We expect a group mapping
			if (mapping.type === 'group' && subcommandName.exists) {
				// We know a group was passed in here
				if (mapping.name === subcommandOrGroup.value) {
					// Find the actual subcommand to run
					const findResult = this.#findSubcommand(mapping.entries, subcommandName.value);

					if (findResult.defaultMatch) {
						defaultCommand = findResult.mapping;
					} else {
						actualSubcommandToRun = findResult.mapping;
						// Exit early
						break;
					}
				}
			}
		}

		// Preemptively restore the args state, to provide a correct args result for users
		args.restore();

		if (actualSubcommandToRun) {
			// Skip over the subcommandOrGroup
			args.next();

			// We might've matched a group subcommand
			if (subcommandName.exists && subcommandName.value === actualSubcommandToRun.name) {
				args.next();
			}

			return this.#handleMessageRun(message, args, context, actualSubcommandToRun);
		}

		// No subcommand matched, let's try to run default, if any:
		if (defaultCommand) {
			if (subcommandOrGroup.exists) {
				args.next();
			}

			// We might've ran `!example group subcm` but the default subcommand is `subcmd` instead, we should strip that out
			if (subcommandName.exists) {
				args.next();
			}

			return this.#handleMessageRun(message, args, context, defaultCommand);
		}

		// No match and no subcommand, return an err:
		throw new UserError({
			identifier: SubcommandPluginIdentifiers.MessageSubcommandNoMatch,
			context: {
				...context,
				possibleSubcommandName: subcommandName.value ?? null,
				possibleSubcommandGroupOrName: subcommandOrGroup.value ?? null
			}
		});
	}

	public async chatInputRun(interaction: ChatInputCommand.Interaction, context: ChatInputCommand.RunContext) {
		const subcommandName = interaction.options.getSubcommand(false);
		const subcommandGroupName = interaction.options.getSubcommandGroup(false);

		for (const mapping of this.parsedSubcommandMappings) {
			mapping.type ??= 'method';

			// If we have a group, we know we also have a subcommand and we should find and run it
			if (subcommandGroupName && subcommandName) {
				if (mapping.type !== 'group') continue;
				if (mapping.name !== subcommandGroupName) continue;

				const foundSubcommand = this.#findSubcommand(mapping.entries, subcommandName!);

				// Only run if its not the "default" found command mapping, as interactions don't have that
				if (!foundSubcommand.defaultMatch) {
					return this.#handleChatInputInteractionRun(interaction, context, foundSubcommand.mapping);
				}

				// Skip to the next entry
				continue;
			}

			// If we have a direct subcommand, and no group, then run the mapping
			if (mapping.type === 'method' && mapping.name === subcommandName) {
				return this.#handleChatInputInteractionRun(interaction, context, mapping);
			}
		}

		// No match and no subcommand, return an err:
		throw new UserError({ identifier: SubcommandPluginIdentifiers.ChatInputSubcommandNoMatch, context });
	}

	async #handleMessageRun(message: Message, args: Args, context: MessageCommand.RunContext, subcommand: SubcommandMappingMethod) {
		const payload: MessageSubcommandAcceptedPayload = { message, command: this, context };
		// @ts-expect-error no i dont want to return everywhere
		const result = await fromAsync(async () => {
			if (subcommand.messageRun) {
				const casted = subcommand as MessageSubcommandMappingMethod;

				this.container.client.emit(SubcommandPluginEvents.MessageSubcommandRun, message, casted, payload);
				let result: unknown;

				if (casted.preconditions) {
					const preconditions = new PreconditionContainerArray(casted.preconditions);
					const result = await preconditions.messageRun(message, this, context);
					if (!result.success) {
						return this.container.client.emit(Events.MessageCommandDenied, result.error, {
							message,
							command: this,
							parameters: 'Preconditions failed to run',
							context
						});
					}
				}

				if (typeof subcommand.messageRun === 'string') {
					const method: this['messageRun'] | undefined = Reflect.get(this, subcommand.messageRun);
					if (!method) throw new UserError({ identifier: SubcommandPluginIdentifiers.SubcommandNotFound, context: { ...payload } });

					result = await Reflect.apply(method, this, [message, args, context]);
				} else {
					result = await subcommand.messageRun(message, args, context);
				}

				this.container.client.emit(SubcommandPluginEvents.MessageSubcommandSuccess, message, casted, { ...payload, result });
			} else {
				this.container.client.emit(SubcommandPluginEvents.SubcommandMappingIsMissingMessageCommandHandler, message, subcommand, payload);
			}
		});

		if (isErr(result)) {
			this.container.client.emit(SubcommandPluginEvents.MessageSubcommandError, result.error, payload);
		}
	}

	async #handleChatInputInteractionRun(
		interaction: ChatInputCommand.Interaction,
		context: ChatInputCommand.RunContext,
		subcommand: SubcommandMappingMethod
	) {
		const payload: ChatInputSubcommandAcceptedPayload = { command: this, context, interaction };
		// @ts-expect-error no i dont want to return everywhere
		const result = await fromAsync(async () => {
			if (subcommand.chatInputRun) {
				const casted = subcommand as ChatInputCommandSubcommandMappingMethod;

				this.container.client.emit(SubcommandPluginEvents.ChatInputSubcommandRun, interaction, casted, payload);
				let result: unknown;

				if (casted.preconditions) {
					const preconditions = new PreconditionContainerArray(casted.preconditions);
					const result = await preconditions.chatInputRun(interaction, this, context);
					if (!result.success) {
						return this.container.client.emit(Events.ChatInputCommandDenied, result.error, {
							interaction,
							command: this,
							context
						});
					}
				}
				if (typeof subcommand.chatInputRun === 'string') {
					const method: this['chatInputRun'] | undefined = Reflect.get(this, subcommand.chatInputRun);
					if (!method) throw new UserError({ identifier: SubcommandPluginIdentifiers.SubcommandNotFound, context: { ...payload } });
					result = await Reflect.apply(method, this, [interaction, context]);
				} else {
					result = await subcommand.chatInputRun(interaction, context);
				}

				this.container.client.emit(SubcommandPluginEvents.ChatInputSubcommandSuccess, interaction, casted, { ...payload, result });
			} else {
				this.container.client.emit(
					SubcommandPluginEvents.SubcommandMappingIsMissingChatInputCommandHandler,
					interaction,
					subcommand,
					payload
				);
			}
		});

		if (isErr(result)) {
			this.container.client.emit(SubcommandPluginEvents.ChatInputSubcommandError, result.error, payload);
		}
	}

	#findSubcommand(mappings: SubcommandMappingMethod[], expectedName: string) {
		let foundDefault: SubcommandMappingMethod | null = null;

		for (const mapping of mappings) {
			mapping.type ??= 'method';

			if (mapping.default) {
				foundDefault = mapping;
			}

			if (mapping.name === expectedName) {
				return { mapping, defaultMatch: false } as const;
			}
		}

		return { mapping: foundDefault, defaultMatch: true } as const;
	}
}

export interface SubcommandOptions extends Command.Options {
	subcommands?: SubcommandMappingArray;
}

export namespace Subcommand {
	export type Options = SubcommandOptions;
	export type JSON = Command.JSON;
	export type Context = Command.Context;
	export type RunInTypes = Command.RunInTypes;
	export type ChatInputInteraction<Cached extends CacheType = CacheType> = Command.ChatInputInteraction<Cached>;
	export type ContextMenuInteraction<Cached extends CacheType = CacheType> = Command.ContextMenuInteraction<Cached>;
	export type AutocompleteInteraction<Cached extends CacheType = CacheType> = Command.AutocompleteInteraction<Cached>;
	export type Registry = Command.Registry;
}
