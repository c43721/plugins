import type { ChatInputCommand, MessageCommand, UserError } from '@sapphire/framework';
import type { Message } from 'discord.js';
import type { ChatInputSubcommandMappingValue, MessageSubcommandMappingValue } from '../SubcommandMappings';

export const Events = {
	SubcommandError: 'subcommandError' as const,
	ChatInputSubcommandRun: 'chatInputSubcommandRun' as const,
	ChatInputSubcommandSuccess: 'chatInputSubcommandSuccess' as const,
	ChatInputSubcommandNotFound: 'chatInputSubcommandNotFound' as const,
	ChatInputSubcommandDenied: 'chatInputSubcommandDenied' as const,
	MessageSubcommandRun: 'messageSubcommandRun' as const,
	MessageSubcommandSuccess: 'messageSubcommandSuccess' as const,
	MessageSubcommandNotFound: 'messageSubcommandNotFound' as const,
	MessageSubcommandDenied: 'messageSubcommandDenied' as const
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

export interface MessageSubcommandDeniedPayload extends MessageSubcommandRunPayload {
	parameters: string;
	subcommand: MessageSubcommandMappingValue;
}

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

export interface ChatInputSubcommandDeniedPayload extends ChatInputSubcommandRunPayload {
	subcommand: ChatInputSubcommandMappingValue;
}

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
		[Events.ChatInputSubcommandDenied]: [error: UserError, payload: ChatInputSubcommandDeniedPayload];
		[Events.MessageSubcommandRun]: [message: Message, subcommand: MessageSubcommandMappingValue, payload: MessageSubcommandRunPayload];
		[Events.MessageSubcommandSuccess]: [message: Message, subcommand: MessageSubcommandMappingValue, payload: MessageSubcommandSuccessPayload];
		[Events.MessageSubcommandNotFound]: [message: Message, subcommand: MessageSubcommandMappingValue, context: ChatInputCommand.Context];
		[Events.MessageSubcommandDenied]: [error: UserError, payload: MessageSubcommandDeniedPayload];
		[Events.SubcommandError]: [error: unknown, payload: ChatInputSubcommandErrorPayload | MessageSubcommandErrorPayload];
	}
}

declare module '@sapphire/framework' {
	const enum Identifiers {
		MessageSubcommandNoMatch = 'messageSubcommandNoMatch',
		ChatInputSubcommandNoMatch = 'chatInputSubcommandNoMatch',
		SubcommandNotFound = 'subcommandNotFound'
	}
}
