import type { Command } from '@sapphire/framework';
import type { SubcommandPluginCommand } from './SubcommandPluginCommand';

/**
 * FunctionKeys
 * @desc Get union type of keys that are functions in object type `T`
 * @example
 *  type MixedProps = {name: string; setName: (name: string) => void; someKeys?: string; someFn?: (...args: any) => any;};
 *
 *   // Expect: "setName | someFn"
 *   type Keys = FunctionKeys<MixedProps>;
 * @license MIT
 * @copyright 2016 Piotr Witek <piotrek.witek@gmail.com> (http://piotrwitek.github.io)
 * @see {@link https://github.com/piotrwitek/utility-types/blob/df2502ef504c4ba8bd9de81a45baef112b7921d0/src/mapped-types.ts#L68-L79}
 */
type FunctionKeys<T extends object> = {
	// eslint-disable-next-line @typescript-eslint/ban-types
	[K in keyof T]-?: NonUndefined<T[K]> extends Function ? K : never;
}[keyof T];

export type AllowedFunctionKeys<C extends SubcommandPluginCommand> = Exclude<FunctionKeys<C>, FunctionKeys<Command>>;

/**
 * NonUndefined
 * @desc Exclude undefined from set `A`
 * @example
 *   // Expect: "string | null"
 *   SymmetricDifference<string | null | undefined>;
 * @license MIT
 * @copyright 2016 Piotr Witek <piotrek.witek@gmail.com> (http://piotrwitek.github.io)
 * @see {@link https://github.com/piotrwitek/utility-types/blob/df2502ef504c4ba8bd9de81a45baef112b7921d0/src/mapped-types.ts#L50-L57}
 */
export type NonUndefined<A> = A extends undefined ? never : A;

export type SubcommandMapping<Cmd extends SubcommandPluginCommand = SubcommandPluginCommand> =
	| SubcommandMappingMethod<Cmd>
	| SubcommandMappingGroup<Cmd>;

export type SubcommandMappingArray<Cmd extends SubcommandPluginCommand = SubcommandPluginCommand> = SubcommandMapping<Cmd>[];

/**
 * Describes the mapping of all the subcommands to their respective implementations for this command.
 */
interface SubcommandMappingBase {
	/**
	 * The name of this subcommand, or subcommand group
	 */
	name: string;
	/**
	 * Whether this subcommand mapping describes a `'method'` or `'group'`
	 * @default 'method'
	 */
	type?: 'group' | 'method';
}

/**
 * Describes how a subcommand method maps to the actual implementation of that subcommand.
 */
export interface SubcommandMappingMethod<Cmd extends SubcommandPluginCommand = SubcommandPluginCommand> extends SubcommandMappingBase {
	/**
	 * This subcommand mapping describes a subcommand method and can therefore only ever be `'method'`
	 */
	type: 'method';
	/**
	 * Whether this is the default subcommand when none is provided.
	 *
	 * Note that this is effectively only used for Message based subcommand
	 * (those implementing {@link SubcommandMappingMethod.messageRun})
	 * because the subcommand is always provided for chat input commands.
	 */
	default?: boolean;
	/**
	 * The class method to call when invoking this subcommand through a **message command**,
	 * or a callback implementation of the subcommand.
	 *
	 * Note that when providing a string you have to first define the method that will be called within your function
	 * before this will allow any values. This is to ensure that the property is strictly typed to the context of the
	 * class.
	 *
	 * @example
	 * ```typescript
	 * chatInputRun: 'runAdminConfig'
	 * ```
	 *
	 * @example
	 * ```typescript
	 * chatInputRun(interaction: Subcommand.Interaction) {
	 *    return interaction.reply(`${interaction.user} has been granted admin`);
	 * }
	 * ```
	 */
	messageRun?: AllowedFunctionKeys<Cmd> | Command['messageRun'];
	/**
	 * The class method to call when invoking this subcommand through a **chat input command**,
	 * or a callback implementation of the subcommand.
	 *
	 * Note that when providing a string you have to first define the method that will be called within your function
	 * before this will allow any values. This is to ensure that the property is strictly typed to the context of the
	 * class.
	 *
	 * @example
	 * ```typescript
	 * chatInputRun: 'runModeratorConfig'
	 * ```
	 *
	 * @example
	 * ```typescript
	 * chatInputRun(interaction: Subcommand.Interaction) {
	 *    return interaction.reply(`${interaction.user} has been granted moderator`);
	 * }
	 * ```
	 */
	chatInputRun?: AllowedFunctionKeys<Cmd> | Command['chatInputRun'];
}

export interface SubcommandMappingGroup<Cmd extends SubcommandPluginCommand = SubcommandPluginCommand> extends SubcommandMappingBase {
	/**
	 * This subcommand mapping describes a subcommand group and can therefore only ever be `'group'`
	 */
	type: 'group';
	/**
	 * The {@link SubcommandMappingMethod}s that are contained within this subcommand group.
	 */
	entries: SubcommandMappingMethod<Cmd>[];
}

// Type aliases
export type MessageSubcommandMappingMethod<Cmd extends SubcommandPluginCommand = SubcommandPluginCommand> = Omit<
	SubcommandMappingMethod<Cmd>,
	'messageRun'
> &
	Required<Pick<SubcommandMappingMethod<Cmd>, 'messageRun'>>;

export type ChatInputCommandSubcommandMappingMethod<Cmd extends SubcommandPluginCommand = SubcommandPluginCommand> = Omit<
	SubcommandMappingMethod<Cmd>,
	'chatInputRun'
> &
	Required<Pick<SubcommandMappingMethod<Cmd>, 'chatInputRun'>>;
