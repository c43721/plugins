import type { ChatInputCommand, MessageCommand, UserError } from '@sapphire/framework';
import type { Message } from 'discord.js';

import type { ChatInputSubCommandMappingValue, MessageSubCommandMappingValue } from '../SubCommandMappings';

export const SubCommandPluginEvents = {
	ChatInputSubCommandRun: 'chatInputSubCommandRun' as const,
	ChatInputSubCommandSuccess: 'chatInputSubCommandSuccess' as const,
	ChatInputSubCommandNotFound: 'chatInputSubCommandNotFound' as const,
	ChatInputSubCommandDenied: 'chatInputSubCommandDenied' as const,
	ChatInputSubCommandError: 'chatInputSubCommandError' as const,
	MessageSubCommandRun: 'messageSubCommandRun' as const,
	MessageSubCommandSuccess: 'messageSubCommandSuccess' as const,
	MessageSubCommandNotFound: 'messageSubCommandNotFound' as const,
	MessageSubCommandDenied: 'messageSubCommandDenied' as const,
	MessageSubCommandError: 'messageSubCommandError' as const
};

export const enum SubCommandPluginIdentifiers {
	MessageSubCommandNoMatch = 'messageSubCommandNoMatch',
	ChatInputSubCommandNoMatch = 'chatInputSubCommandNoMatch',
	SubCommandNotFound = 'subcommandNotFound'
}

export interface IMessageSubCommandPayload {
	message: Message;
	command: MessageCommand;
}

export interface MessageSubCommandAcceptedPayload extends IMessageSubCommandPayload {
	context: MessageCommand.RunContext;
}

export interface MessageSubCommandRunPayload extends MessageSubCommandAcceptedPayload {}

export interface MessageSubCommandErrorPayload extends MessageSubCommandRunPayload {}

export interface MessageSubCommandDeniedPayload extends MessageSubCommandRunPayload {
	parameters: string;
	subcommand: MessageSubCommandMappingValue;
}

export interface MessageSubCommandSuccessPayload extends MessageSubCommandRunPayload {
	result: unknown;
}

export interface IChatInputSubCommandPayload {
	interaction: ChatInputCommand.Interaction;
	command: ChatInputCommand;
}

export interface ChatInputSubCommandAcceptedPayload extends IChatInputSubCommandPayload {
	context: ChatInputCommand.RunContext;
}

export interface ChatInputSubCommandRunPayload extends ChatInputSubCommandAcceptedPayload {}

export interface ChatInputSubCommandErrorPayload extends ChatInputSubCommandRunPayload {}

export interface ChatInputSubCommandDeniedPayload extends ChatInputSubCommandRunPayload {
	subcommand: ChatInputSubCommandMappingValue;
}

export interface ChatInputSubCommandSuccessPayload extends ChatInputSubCommandRunPayload {
	result: unknown;
}

declare module 'discord.js' {
	interface ClientEvents {
		[SubCommandPluginEvents.ChatInputSubCommandRun]: [
			interaction: Interaction,
			subcommand: ChatInputSubCommandMappingValue,
			payload: ChatInputSubCommandRunPayload
		];
		[SubCommandPluginEvents.ChatInputSubCommandSuccess]: [
			interaction: Interaction,
			subcommand: ChatInputSubCommandMappingValue,
			payload: ChatInputSubCommandSuccessPayload
		];
		[SubCommandPluginEvents.ChatInputSubCommandNotFound]: [
			interaction: Interaction,
			subcommand: ChatInputSubCommandMappingValue,
			context: ChatInputCommand.Context
		];
		[SubCommandPluginEvents.ChatInputSubCommandDenied]: [error: UserError, payload: ChatInputSubCommandDeniedPayload];
		[SubCommandPluginEvents.ChatInputSubCommandError]: [error: unknown, payload: ChatInputSubCommandErrorPayload];
		[SubCommandPluginEvents.MessageSubCommandRun]: [
			message: Message,
			subcommand: MessageSubCommandMappingValue,
			payload: MessageSubCommandRunPayload
		];
		[SubCommandPluginEvents.MessageSubCommandSuccess]: [
			message: Message,
			subcommand: MessageSubCommandMappingValue,
			payload: MessageSubCommandSuccessPayload
		];
		[SubCommandPluginEvents.MessageSubCommandNotFound]: [
			message: Message,
			subcommand: MessageSubCommandMappingValue,
			context: ChatInputCommand.Context
		];
		[SubCommandPluginEvents.MessageSubCommandDenied]: [error: UserError, payload: MessageSubCommandDeniedPayload];
		[SubCommandPluginEvents.MessageSubCommandError]: [error: unknown, payload: MessageSubCommandErrorPayload];
	}
}
