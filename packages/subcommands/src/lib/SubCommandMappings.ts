import type { Args, Awaitable, ChatInputCommand, MessageCommand } from '@sapphire/framework';
import type { Message } from 'discord.js';

export type SubCommandMappingsArray = (
	| ChatInputSubCommandGroupMappings
	| ChatInputSubCommandMappings
	| MessageSubCommandMappings
	| MessageSubCommandGroupMappings
)[];
export type ChatInputSubCommandToProperty = (interaction: ChatInputCommand.Interaction, context: ChatInputCommand.RunContext) => Awaitable<unknown>;
export type MessageSubCommandToProperty = (message: Message, args: Args, context: MessageCommand.RunContext) => Awaitable<unknown>;
export type SubCommandType = 'method' | 'command';

export class ChatInputSubCommandGroupMappings {
	/**
	 * Name of the subcommand group
	 */
	public groupName: string;

	/**
	 * SubCommands for this command with groups
	 *
	 * @example
	 * /config   mod-roles  add         role
	 * command   group      subcommand  option
	 */
	public subcommands: ChatInputSubCommandMappingValue[];

	public constructor(groupName: string, mappings: ChatInputSubCommandMappingValue[]) {
		this.groupName = groupName;
		this.subcommands = mappings;
	}
}

export class MessageSubCommandGroupMappings {
	/**
	 * Name of the subcommand group
	 */
	public groupName: string;

	/**
	 * SubCommands for this command with groups
	 *
	 * @example
	 * !config   mod-roles  add         role
	 * command   group      subcommand  option
	 */
	public subcommands: MessageSubCommandMappingValue[];

	public constructor(groupName: string, mappings: MessageSubCommandMappingValue[]) {
		this.groupName = groupName;
		this.subcommands = mappings;
	}
}

export class ChatInputSubCommandMappings {
	/**
	 * SubCommands for this Command
	 *
	 * @example
	 * /config  language   en-US
	 * command  subcommand option
	 */
	public subcommands: ChatInputSubCommandMappingValue[];

	public constructor(subcommands: ChatInputSubCommandMappingValue[]) {
		this.subcommands = subcommands;
	}
}

export class MessageSubCommandMappings {
	/**
	 * SubCommands for this Command
	 *
	 * @example
	 * !config  language   en-US
	 * command  subcommand option
	 */
	public subcommands: MessageSubCommandMappingValue[];

	public constructor(subcommands: MessageSubCommandMappingValue[]) {
		this.subcommands = subcommands;
	}
}

export interface SubCommandMappingValueBase {
	/**
	 * Name of the SubCommand
	 *
	 * @since 3.0.0
	 */
	name: string;

	/**
	 * Select whether you want to execute a command class method or a command registered in the store.
	 * @since 3.0.0
	 */
	type?: SubCommandType;
}

export interface ChatInputSubCommandMappingValue extends SubCommandMappingValueBase {
	/**
	 * The method or name used used to run the subcommand
	 *
	 * @since 3.0.0
	 */
	to?: ChatInputSubCommandToProperty | string;
}

export interface MessageSubCommandMappingValue extends SubCommandMappingValueBase {
	/**
	 * The method or name used used to run the subcommand
	 *
	 * @since 3.0.0
	 */
	to?: MessageSubCommandToProperty | string;

	/**
	 * Should this command be ran if no input is given
	 *
	 * @since 3.0.0
	 */
	default?: boolean;
}
