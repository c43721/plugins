import type { Awaitable, ChatInputCommand } from '@sapphire/framework';
import type { CommandInteraction } from 'discord.js';

export type SubcommandMappingsArray = (ChatInputSubcommandGroupMappings | ChatInputSubcommandMappings)[];
// TODO: Add support for message subcommands
// | MessageSubcommandGroupMappings
// | MessageSubcommandMappings

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
	public subcommands: SubcommandMappingArrayValue[];

	public constructor(groupName: string, mappings: SubcommandMappingArrayValue[]) {
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
	public subcommands: SubcommandMappingArrayValue[];

	public constructor(subcommands: SubcommandMappingArrayValue[]) {
		this.subcommands = subcommands;
	}
}

export interface SubcommandMappingArrayValue {
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
