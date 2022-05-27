import type { ChatInputCommand, MessageCommand, UserError } from '@sapphire/framework';
import type { Message } from 'discord.js';

import type { ChatInputSubcommandMappingValue, MessageSubcommandMappingValue } from '../SubcommandMappings';

export const SubcommandsEvents = {
	ChatInputSubcommandRun: 'chatInputSubcommandRun' as const,
	ChatInputSubcommandSuccess: 'chatInputSubcommandSuccess' as const,
	ChatInputSubcommandNotFound: 'chatInputSubcommandNotFound' as const,
	ChatInputSubcommandDenied: 'chatInputSubcommandDenied' as const,
	ChatInputSubcommandError: 'chatInputSubcommandError' as const,
	MessageSubcommandRun: 'messageSubcommandRun' as const,
	MessageSubcommandSuccess: 'messageSubcommandSuccess' as const,
	MessageSubcommandNotFound: 'messageSubcommandNotFound' as const,
	MessageSubcommandDenied: 'messageSubcommandDenied' as const,
	MessageSubcommandError: 'messageSubcommandError' as const
};

export const enum SubcommandsIdentifiers {
	MessageSubcommandNoMatch = 'messageSubcommandNoMatch',
	ChatInputSubcommandNoMatch = 'chatInputSubcommandNoMatch',
	SubcommandNotFound = 'subcommandNotFound'
}

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
		[SubcommandsEvents.ChatInputSubcommandRun]: [
			interaction: Interaction,
			subcommand: ChatInputSubcommandMappingValue,
			payload: ChatInputSubcommandRunPayload
		];
		[SubcommandsEvents.ChatInputSubcommandSuccess]: [
			interaction: Interaction,
			subcommand: ChatInputSubcommandMappingValue,
			payload: ChatInputSubcommandSuccessPayload
		];
		[SubcommandsEvents.ChatInputSubcommandNotFound]: [
			interaction: Interaction,
			subcommand: ChatInputSubcommandMappingValue,
			context: ChatInputCommand.Context
		];
		[SubcommandsEvents.ChatInputSubcommandDenied]: [error: UserError, payload: ChatInputSubcommandDeniedPayload];
		[SubcommandsEvents.ChatInputSubcommandError]: [error: unknown, payload: ChatInputSubcommandErrorPayload];
		[SubcommandsEvents.MessageSubcommandRun]: [message: Message, subcommand: MessageSubcommandMappingValue, payload: MessageSubcommandRunPayload];
		[SubcommandsEvents.MessageSubcommandSuccess]: [
			message: Message,
			subcommand: MessageSubcommandMappingValue,
			payload: MessageSubcommandSuccessPayload
		];
		[SubcommandsEvents.MessageSubcommandNotFound]: [
			message: Message,
			subcommand: MessageSubcommandMappingValue,
			context: ChatInputCommand.Context
		];
		[SubcommandsEvents.MessageSubcommandDenied]: [error: UserError, payload: MessageSubcommandDeniedPayload];
		[SubcommandsEvents.MessageSubcommandError]: [error: unknown, payload: MessageSubcommandErrorPayload];
	}
}
