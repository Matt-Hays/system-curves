import * as math from 'mathjs';

export default class PipeSection {
	private hydraulicArea: number;
	private relativeRoughness: number;
	private hasVelocityHead: boolean;

	constructor(
		private p1: number,
		private p2: number,
		private v1: number,
		private v2: number,
		private z1_min: number,
		private z2_min: number,
		private z1_max: number,
		private z2_max: number,
		private length: number,
		private diameter: number,
		private absoluteRoughness: number,
		private kinematicViscOfFluid: number,
		private targetFlowRate: number,
		private appurtenanceKValues: number[]
	) {
		if (this.diameter <= 0) throw new Error('Pipe diameter must be greater than 0.');
		if (this.length <= 0) throw new Error('Pipe length must be greater than 0.');
		if (this.absoluteRoughness < 0) throw new Error('Absolute roughness must be non-negative.');
		if (this.kinematicViscOfFluid <= 0) throw new Error('Kinematic viscosity must be greater than 0.');
		if (!this.appurtenanceKValues.length) throw new Error('Appurtenance K values must not be empty.');
		if (this.z2_max < this.z1_min || this.z2_min < this.z1_max) {
			throw new Error('Elevation ranges are invalid.');
		}

		this.hydraulicArea = (math.pi * Math.pow(this.diameter, 2)) / 4;
		this.relativeRoughness = this.absoluteRoughness / this.diameter;
		this.hasVelocityHead = this.v2 !== this.v1;
	}

	/**
	 * Calculates system curve data points.
	 * @returns An array of [maxTDH, minTDH, flowRate].
	 */
	public execute = (): [number, number, number][] => {
		return this.generateFlowRange().map((flowRate) => {
			const [maxTDH, minTDH] = this.calculateTDH(flowRate);
			return [maxTDH, minTDH, flowRate];
		});
	};

	/**
	 * Calculates a range of flow rates where the target flow rate is the median value.
	 * @returns An array containing a equally distributed range of flow rates.
	 */
	private generateFlowRange = (): number[] => {
		const step = this.targetFlowRate / 20;
		return Array.from({ length: 20 }, (_, i) => step * (i + 1));
	};

	/**
	 * Calculates the head loss for a given flow rate.
	 * @param flowRate The flow rate to calculate the head loss for.
	 * @returns An array containing maximum and minimum TDH values as well as the associated flow rate.
	 */
	private calculateTDH = (flowRate: number): [number, number] => {
		const adjustedFlowRate = Math.max(flowRate, 1e-6);
		const pressureHead = (this.p2 - this.p1) * 2.31;
		const velocityHead = this.hasVelocityHead
			? Math.pow(adjustedFlowRate, 2) / (2 * 32.17 * Math.pow(this.hydraulicArea, 2))
			: 0;
		const staticHeadMax = this.z2_max - this.z1_min;
		const staticHeadMin = this.z2_min - this.z1_max;
		const majorLosses = this.calculateMajorLosses(adjustedFlowRate);
		const minorLosses = this.calculateMinorLosses(adjustedFlowRate);
		const totalLosses = majorLosses + minorLosses + velocityHead + pressureHead;
		return [staticHeadMax + totalLosses, staticHeadMin + totalLosses];
	};

	/**
	 * Calcuates the major losses for a given flow rate.
	 * @param flowRate The flow rate to calculate the major losses for.
	 * @returns Major head loss value.
	 */
	private calculateMajorLosses = (flowRate: number): number => {
		const frictionFactor = this.calculateFrictionFactor(flowRate);
		return (
			(frictionFactor * (this.length / this.diameter) * Math.pow(flowRate, 2)) /
			(2 * 32.17 * Math.pow(this.hydraulicArea, 2))
		);
	};

	/**
	 * Calculates the minor losses for a given flow rate.
	 * @param flowRate The flow rate to calculate the minor losses for.
	 * @returns Minor head loss value.
	 */
	private calculateMinorLosses = (flowRate: number): number => {
		const kSum = this.appurtenanceKValues.reduce((sum, k) => sum + k, 0);
		return (kSum * Math.pow(flowRate, 2)) / (2 * 32.17 * Math.pow(this.hydraulicArea, 2));
	};

	/**
	 * Calculates the friction factor for a given flow rate using Serghide's approximation method.
	 * @param flowRate The flow rate to calculate the friction factor for.
	 * @returns The Serghide's friction factor approximation.
	 */
	private calculateFrictionFactor = (flowRate: number): number => {
		const reynoldsNumber = Math.max(
			(flowRate / this.hydraulicArea) * (this.diameter / this.kinematicViscOfFluid),
			1e-6
		);

		if (reynoldsNumber < 2300) {
			return 64 / reynoldsNumber;
		}

		const roughnessTerm = this.relativeRoughness / 3.7;

		const calcTerm = (prev: number | null): number => {
			const reynoldsTerm = prev ? (2.51 / reynoldsNumber) * prev : 12 / reynoldsNumber;
			return -2 * Math.log10(roughnessTerm + reynoldsTerm);
		};

		const a = calcTerm(null);
		const b = calcTerm(a);
		const c = calcTerm(b);

		return Math.pow(a - Math.pow(b - a, 2) / (c - 2 * b + a), -2);
	};
}
