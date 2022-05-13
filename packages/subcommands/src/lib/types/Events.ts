import type { ChatInputCommand, MessageCommand } from '@sapphire/framework';
import type { Message } from 'discord.js';
import type { ChatInputSubcommandMappingValue, MessageSubcommandMappingValue } from '../SubcommandMappings';

export const Events = {
	SubcommandError: 'subcommandError' as const,
	ChatInputSubcommandRun: 'chatInputSubcommandRun' as const,
	ChatInputSubcommandSuccess: 'chatInputSubcommandSuccess' as const,
	ChatInputSubcommandNotFound: 'chatInputSubcommandNotFound' as const,
	MessageSubcommandRun: 'messageSubcommandRun' as const,
	MessageSubcommandSuccess: 'messageSubcommandSuccess' as const,
	MessageSubcommandNotFound: 'messageSubcommandNotFound' as const
};

export interface IMessageSubcommandPayload {
	message: Message;
	command: MessageCommand;
}

export interface MessageSubcommandAcceptedPayload extends IMessageSubcommandPayload {
	context: MessageCommand.RunContext;
}

export interface MessageSubcommandRunPayload extends MessageSubcommandAcceptedPayload {}

export interface MessageSubcommandErrorPayload extends MessageSubcommandRunPayload {}

export interface MessageSubcommandSuccessPayload extends MessageSubcommandRunPayload {
	result: unknown;
}

export interface IChatInputSubcommandPayload {
	interaction: ChatInputCommand.Interaction;
	command: ChatInputCommand;
}

export interface ChatInputSubcommandAcceptedPayload extends IChatInputSubcommandPayload {
	context: ChatInputCommand.RunContext;
}

export interface ChatInputSubcommandRunPayload extends ChatInputSubcommandAcceptedPayload {}

export interface ChatInputSubcommandErrorPayload extends ChatInputSubcommandRunPayload {}

export interface ChatInputSubcommandSuccessPayload extends ChatInputSubcommandRunPayload {
	result: unknown;
}

declare module 'discord.js' {
	interface ClientEvents {
		[Events.ChatInputSubcommandRun]: [
			interaction: Interaction,
			subcommand: ChatInputSubcommandMappingValue,
			payload: ChatInputSubcommandRunPayload
		];
		[Events.ChatInputSubcommandSuccess]: [
			interaction: Interaction,
			subcommand: ChatInputSubcommandMappingValue,
			payload: ChatInputSubcommandSuccessPayload
		];
		[Events.ChatInputSubcommandNotFound]: [
			interaction: Interaction,
			subcommand: ChatInputSubcommandMappingValue,
			context: ChatInputCommand.Context
		];
		[Events.MessageSubcommandRun]: [Message: Message, subcommand: MessageSubcommandMappingValue, payload: MessageSubcommandRunPayload];
		[Events.MessageSubcommandSuccess]: [Message: Message, subcommand: MessageSubcommandMappingValue, payload: MessageSubcommandSuccessPayload];
		[Events.MessageSubcommandNotFound]: [interaction: Interaction, subcommand: MessageSubcommandMappingValue, context: ChatInputCommand.Context];
		[Events.SubcommandError]: [error: unknown, payload: ChatInputSubcommandErrorPayload | MessageSubcommandErrorPayload];
	}
}

declare module '@sapphire/framework' {
	const enum Identifiers {
		MessageSubcommandNoMatch = 'MessageSubcommandNoMatch',
		ChatInputSubcommandNoMatch = 'ChatInputSubcommandNoMatch',
		SubcommandMethodNotFound = 'subcommandMethodNotFound'
	}
}
