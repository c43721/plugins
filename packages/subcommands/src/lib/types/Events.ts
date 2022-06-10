import type { ChatInputCommand, MessageCommand } from '@sapphire/framework';
import type { Message } from 'discord.js';
import type { ChatInputCommandSubcommandMappingMethod, MessageSubcommandMappingMethod, SubcommandMappingMethod } from '../SubcommandMappings';
import type { SubcommandPluginCommand } from '../SubcommandPluginCommand';

export const SubcommandPluginEvents = {
	ChatInputSubcommandRun: 'chatInputSubcommandRun' as const,
	ChatInputSubcommandSuccess: 'chatInputSubcommandSuccess' as const,
	ChatInputSubcommandNotFound: 'chatInputSubcommandNotFound' as const,
	ChatInputSubcommandError: 'chatInputSubcommandError' as const,

	MessageSubcommandRun: 'messageSubcommandRun' as const,
	MessageSubcommandSuccess: 'messageSubcommandSuccess' as const,
	MessageSubcommandNotFound: 'messageSubcommandNotFound' as const,
	MessageSubcommandError: 'messageSubcommandError' as const,

	SubcommandMappingIsMissingMessageCommandHandler: 'subcommandMappingIsMissingMessageCommandHandler' as const,
	SubcommandMappingIsMissingChatInputCommandHandler: 'subcommandMappingIsMissingChatInputCommandHandler' as const
};

export enum SubcommandPluginIdentifiers {
	MessageSubcommandNoMatch = 'messageSubcommandNoMatch',
	ChatInputSubcommandNoMatch = 'chatInputSubcommandNoMatch',
	SubcommandNotFound = 'subcommandNotFound'
}

export interface MessageSubcommandNoMatchContext extends MessageCommand.RunContext {
	possibleSubcommandName: string | null;
	possibleSubcommandGroupOrName: string | null;
}

export interface IMessageSubcommandPayload {
	message: Message;
	command: SubcommandPluginCommand;
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
	command: SubcommandPluginCommand;
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
		[SubcommandPluginEvents.ChatInputSubcommandRun]: [
			interaction: ChatInputCommand.Interaction,
			subcommand: ChatInputCommandSubcommandMappingMethod,
			payload: ChatInputSubcommandRunPayload
		];
		[SubcommandPluginEvents.ChatInputSubcommandSuccess]: [
			interaction: ChatInputCommand.Interaction,
			subcommand: ChatInputCommandSubcommandMappingMethod,
			payload: ChatInputSubcommandSuccessPayload
		];
		[SubcommandPluginEvents.ChatInputSubcommandNotFound]: [
			interaction: ChatInputCommand.Interaction,
			subcommand: ChatInputCommandSubcommandMappingMethod,
			context: ChatInputCommand.Context
		];
		[SubcommandPluginEvents.ChatInputSubcommandError]: [error: unknown, payload: ChatInputSubcommandErrorPayload];

		[SubcommandPluginEvents.MessageSubcommandRun]: [
			message: Message,
			subcommand: MessageSubcommandMappingMethod,
			payload: MessageSubcommandRunPayload
		];
		[SubcommandPluginEvents.MessageSubcommandSuccess]: [
			message: Message,
			subcommand: MessageSubcommandMappingMethod,
			payload: MessageSubcommandSuccessPayload
		];
		[SubcommandPluginEvents.MessageSubcommandNotFound]: [
			message: Message,
			subcommand: MessageSubcommandMappingMethod,
			context: ChatInputCommand.Context
		];
		[SubcommandPluginEvents.MessageSubcommandError]: [error: unknown, payload: MessageSubcommandErrorPayload];

		[SubcommandPluginEvents.SubcommandMappingIsMissingMessageCommandHandler]: [
			message: Message,
			subcommand: SubcommandMappingMethod,
			payload: MessageSubcommandAcceptedPayload
		];
		[SubcommandPluginEvents.SubcommandMappingIsMissingChatInputCommandHandler]: [
			message: ChatInputCommand.Interaction,
			subcommand: SubcommandMappingMethod,
			payload: ChatInputSubcommandAcceptedPayload
		];
	}
}
