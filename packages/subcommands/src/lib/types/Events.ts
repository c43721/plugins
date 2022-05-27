import type { ChatInputCommand, MessageCommand, UserError } from '@sapphire/framework';
import type { Message } from 'discord.js';

import type { ChatInputSubcommandMappingValue, MessageSubcommandMappingValue } from '../SubcommandMappings';

export const SubcommandPluginEvents = {
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

export const enum SubcommandPluginIdentifiers {
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
		[SubcommandPluginEvents.ChatInputSubcommandRun]: [
			interaction: Interaction,
			subcommand: ChatInputSubcommandMappingValue,
			payload: ChatInputSubcommandRunPayload
		];
		[SubcommandPluginEvents.ChatInputSubcommandSuccess]: [
			interaction: Interaction,
			subcommand: ChatInputSubcommandMappingValue,
			payload: ChatInputSubcommandSuccessPayload
		];
		[SubcommandPluginEvents.ChatInputSubcommandNotFound]: [
			interaction: Interaction,
			subcommand: ChatInputSubcommandMappingValue,
			context: ChatInputCommand.Context
		];
		[SubcommandPluginEvents.ChatInputSubcommandDenied]: [error: UserError, payload: ChatInputSubcommandDeniedPayload];
		[SubcommandPluginEvents.ChatInputSubcommandError]: [error: unknown, payload: ChatInputSubcommandErrorPayload];
		[SubcommandPluginEvents.MessageSubcommandRun]: [
			message: Message,
			subcommand: MessageSubcommandMappingValue,
			payload: MessageSubcommandRunPayload
		];
		[SubcommandPluginEvents.MessageSubcommandSuccess]: [
			message: Message,
			subcommand: MessageSubcommandMappingValue,
			payload: MessageSubcommandSuccessPayload
		];
		[SubcommandPluginEvents.MessageSubcommandNotFound]: [
			message: Message,
			subcommand: MessageSubcommandMappingValue,
			context: ChatInputCommand.Context
		];
		[SubcommandPluginEvents.MessageSubcommandDenied]: [error: UserError, payload: MessageSubcommandDeniedPayload];
		[SubcommandPluginEvents.MessageSubcommandError]: [error: unknown, payload: MessageSubcommandErrorPayload];
	}
}
