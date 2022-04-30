import type { Args, Awaitable, ChatInputCommand, MessageCommandContext } from '@sapphire/framework';
import type { CommandInteraction, Message } from 'discord.js';

export type SubcommandMappingsArray = (SubCommandMappingValue | ChatInputSubcommandMappings | SubcommandMessageRunMappings)[];
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
	public subcommands: SubCommandMappingValue[];

	public constructor(groupName: string, mappings: SubCommandMappingValue[]) {
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
	public subcommands: SubCommandMappingValue[];

	public constructor(subcommands: SubCommandMappingValue[]) {
		this.subcommands = subcommands;
	}
}

export class SubcommandMessageRunMappings {
	/**
	 * Subcommands for this Command
	 *
	 * @example
	 * /config  language   en-US
	 *          command    subcommand option
	 */
	public subcommands: SubCommandMessageRunMappingValue[];

	public constructor(subcommands: SubCommandMessageRunMappingValue[]) {
		this.subcommands = subcommands;
	}
}

export interface SubCommandMappingValue {
	/**
	 * Name of the Subcommand
	 *
	 * @since 3.0.0
	 */
	name: string;

	/**
	 * The method name used to run the subcommand
	 *
	 * @since 3.0.0
	 */
	to: (interaction: CommandInteraction, context: ChatInputCommand.RunContext) => Awaitable<unknown>;

	/**
	 * Should this command be ran if no input is given
	 *
	 * @since 3.0.0
	 */
	default?: boolean;
}

export interface SubCommandMessageRunMappingValue extends Omit<SubCommandMappingValue, 'to'> {
	/**
	 * The method name used to run the subcommand
	 *
	 * @since 3.0.0
	 */
	to: (message: Message, args: Args, context: MessageCommandContext) => Awaitable<unknown>;
}
