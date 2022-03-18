import type { ChatInputCommand } from '@sapphire/framework';
import type { SubcommandMappingArrayValue } from '../SubcommandMappings';

export const Events = {
	SubcommandRun: 'subcommandRun',
	SubcommandSuccess: 'subcommandSuccess',
	SubcommandError: 'subcommandError',
	SubcommandFinish: 'subcommandFinish'
};

declare module 'discord.js' {
	interface ClientEvents {
		[Events.SubcommandRun]: [interaction: Interaction, subcommand: SubcommandMappingArrayValue, context: ChatInputCommand.Context];
		[Events.SubcommandSuccess]: [context: ChatInputCommand.Context];
		[Events.SubcommandError]: [error: unknown, payload: ChatInputCommand.Context];
		[Events.SubcommandFinish]: [interaction: Interaction, subcommand: SubcommandMappingArrayValue, context: ChatInputCommand.Context];
	}
}
