import PipeSection from './PipeSection';

export default class System {
	private pipeSections: PipeSection[] = [];

	constructor() {}

	/**
	 * Calculates the total dynamic head (TDH) for the system.
	 * @returns The maximum and minimum TDH values.
	 */
	public calcTDH = (): [number, number, number][] => {
		if (this.pipeSections.length === 0) {
			throw new Error('No pipe sections exist.');
		}

		// Assume all pipe sections have the same flow rate range
		const flowRateCount = this.pipeSections[0].execute().length;

		// Initialize the system curve array
		const systemCurve: [number, number, number][] = Array(flowRateCount).fill([0, 0, 0]);

		// Sum minTDH and maxTDH values for each flow rate across all pipe sections
		for (let i = 0; i < flowRateCount; i++) {
			let cumulativeMinTDH = 0;
			let cumulativeMaxTDH = 0;
			let flowRate = 0;

			for (const pipeSection of this.pipeSections) {
				const [maxTDH, minTDH, currentFlowRate] = pipeSection.execute()[i];
				cumulativeMinTDH += minTDH;
				cumulativeMaxTDH += maxTDH;
				flowRate = currentFlowRate; // The flow rate is assumed identical across all pipe sections
			}

			// Store the result for this flow rate
			systemCurve[i] = [cumulativeMaxTDH, cumulativeMinTDH, flowRate];
		}

		return systemCurve;
	};

	/**
	 * Adds a new pipe section to the system.
	 * @param pipeSectionParams Parameters for creating a PipeSection instance.
	 */
	public addPipeSection = (pipeSectionParams: ConstructorParameters<typeof PipeSection>): void => {
		this.pipeSections.push(new PipeSection(...pipeSectionParams));
	};

	/**
	 * Removes a pipe section by index.
	 * @param index Index of the pipe section to remove.
	 */
	public removePipeSection = (index: number): void => {
		if (index < 0 || index >= this.pipeSections.length) {
			throw new Error('Invalid pipe section index.');
		}
		this.pipeSections.splice(index, 1);
	};

	/**
	 * Modifies an existing pipe section.
	 * @param index Index of the pipe section to modify.
	 * @param newParams New parameters for the pipe section.
	 */
	public modifyPipeSection = (index: number, newParams: ConstructorParameters<typeof PipeSection>): void => {
		if (index < 0 || index >= this.pipeSections.length) {
			throw new Error('Invalid pipe section index.');
		}
		this.pipeSections[index] = new PipeSection(...newParams);
	};

	/**
	 * Gets all pipe sections in the system.
	 * @returns Array of pipe sections.
	 */
	public getPipeSections = (): PipeSection[] => this.pipeSections;
}
