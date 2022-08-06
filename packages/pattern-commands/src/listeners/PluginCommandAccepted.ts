import { Result, Listener } from '@sapphire/framework';
import type { PieceContext } from '@sapphire/pieces';
import { Stopwatch } from '@sapphire/stopwatch';
import { PatternCommandEvents } from '../lib/utils/PaternCommandEvents';
import type { PatternCommandAcceptedPayload } from '../lib/utils/PatternCommandInterfaces';

export class CommandAcceptedListener extends Listener<typeof PatternCommandEvents.CommandAccepted> {
	public constructor(context: PieceContext) {
		super(context, { event: PatternCommandEvents.CommandAccepted });
	}

	public async run(payload: PatternCommandAcceptedPayload) {
		const { message, command, alias } = payload;

		if (command.chance >= Math.round(Math.random() * 99) + 1) {
			await this.runPatternCommand(payload);
		} else {
			message.client.emit(PatternCommandEvents.CommandNoLuck, message, command, alias);
		}
	}

	public async runPatternCommand(payload: PatternCommandAcceptedPayload) {
		const { message, command } = payload;

		let duration = -1;
		const result = await Result.fromAsync(async () => {
			message.client.emit(PatternCommandEvents.CommandRun, message, command, payload);

			const stopwatch = new Stopwatch();
			const result = await command.messageRun(message);
			duration = stopwatch.stop().duration;

			message.client.emit(PatternCommandEvents.CommandSuccess, { ...payload, result, duration });

			return duration;
		});

		result.inspectErr((error) => message.client.emit(PatternCommandEvents.CommandError, error, { ...payload, duration }));

		message.client.emit(PatternCommandEvents.CommandFinished, message, command, {
			...payload,
			success: result.isOk(),
			duration: result.unwrapOr(-1)
		});
	}
}
