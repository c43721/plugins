import type { ChatInputCommand, ChatInputCommandContext, MessageCommand } from '@sapphire/framework';
import type { SubCommandMappingValue, SubCommandMessageRunMappingValue } from '../SubcommandMappings';

export const Events = {
	SubCommandError: 'subcommandError' as const,
	SubCommandInteractionRun: 'subcommandInteractionRun' as const,
	SubCommandInteractionSuccess: 'subcommandInteractionSuccess' as const,
	subCommandInteractionNotFound: 'subcommandInteractionNotFound' as const,
	SubCommandMessageRun: 'subcommandMessageRun' as const,
	SubCommandMessageSuccess: 'subcommandMessageSuccess' as const,
	subCommandMessageNotFound: 'subCommandMessageNotFound' as const
};

declare module 'discord.js' {
	interface ClientEvents {
		[Events.SubCommandInteractionRun]: [interaction: Interaction, subcommand: SubCommandMappingValue, context: ChatInputCommand.Context];
		[Events.SubCommandInteractionSuccess]: [interaction: Interaction, subCommand: SubCommandMappingValue, context: ChatInputCommandContext];
		[Events.subCommandInteractionNotFound]: [interaction: Interaction, subcommand: SubCommandMappingValue, context: ChatInputCommand.Context];
		[Events.SubCommandMessageRun]: [Message: Message, subcommand: SubCommandMessageRunMappingValue, context: MessageCommand.Context];
		[Events.SubCommandMessageSuccess]: [Message: Message, subcommand: SubCommandMessageRunMappingValue, context: MessageCommand.Context];
		[Events.subCommandMessageNotFound]: [
			interaction: Interaction,
			subcommand: SubCommandMessageRunMappingValue,
			context: ChatInputCommand.Context
		];
		[Events.SubCommandError]: [error: unknown, payload: ChatInputCommand.RunContext | MessageCommand.Context];
	}
}

declare module '@sapphire/framework' {
	enum Identifiers {
		SubCommandMessageNoMatch = 'subCommandMessageNoMatch',
		SubCommandInteractionNoMatch = 'subCommandInteractionNoMatch',
		SubCommandMethodNotFound = 'subCommandMethodNotFound'
	}
}
