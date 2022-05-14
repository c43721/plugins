import type { Args, Awaitable, ChatInputCommand, MessageCommand } from '@sapphire/framework';
import type { Message } from 'discord.js';

export type SubcommandMappingsArray = (ChatInputSubcommandGroupMappings | ChatInputSubcommandMappings | MessageSubcommandMappings)[];
export type ChatInputSubcommandToProperty = (interaction: ChatInputCommand.Interaction, context: ChatInputCommand.RunContext) => Awaitable<unknown>;
export type MessageSubcommandToProperty = (message: Message, args: Args, context: MessageCommand.RunContext) => Awaitable<unknown>;
export type SubcommandType = 'method' | 'command';
export class ChatInputSubcommandGroupMappings {
	/**
	 * Name of the subcommand group
	 */
	public groupName: string;

	/**
	 * Subcommands for this command with groups
	 *
	 * @example
	 * /config   mod-roles  add         role
	 * command   group      subcommand  option
	 */
	public subcommands: ChatInputSubcommandMappingValue[];

	public constructor(groupName: string, mappings: ChatInputSubcommandMappingValue[]) {
		this.groupName = groupName;
		this.subcommands = mappings;
	}
}

export class ChatInputSubcommandMappings {
	/**
	 * Subcommands for this Command
	 *
	 * @example
	 * /config  language   en-US
	 *          command    subcommand option
	 */
	public subcommands: ChatInputSubcommandMappingValue[];

	public constructor(subcommands: ChatInputSubcommandMappingValue[]) {
		this.subcommands = subcommands;
	}
}

export class MessageSubcommandMappings {
	/**
	 * Subcommands for this Command
	 *
	 * @example
	 * /config  language   en-US
	 *          command    subcommand option
	 */
	public subcommands: MessageSubcommandMappingValue[];

	public constructor(subcommands: MessageSubcommandMappingValue[]) {
		this.subcommands = subcommands;
	}
}

export interface ChatInputSubcommandMappingValue {
	/**
	 * Name of the Subcommand
	 *
	 * @since 3.0.0
	 */
	name: string;

	/**
	 * The method or name used used to run the subcommand
	 *
	 * @since 3.0.0
	 */
	to?: ChatInputSubcommandToProperty | string;

	/**
	 * Select whether you want to execute a command class method or a command registered in the store.
	 * @since 3.0.0
	 */
	type?: SubcommandType;
}

export interface MessageSubcommandMappingValue extends Omit<ChatInputSubcommandMappingValue, 'to'> {
	/**
	 * The method or name used used to run the subcommand
	 *
	 * @since 3.0.0
	 */
	to?: MessageSubcommandToProperty | string;

	/**
	 * Should this command be ran if no input is given
	 *
	 * @since 3.0.0
	 */
	default?: boolean;
}
