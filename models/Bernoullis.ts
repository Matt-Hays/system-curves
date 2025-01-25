import type Approximation from '~/models/interfaces/Approximation';
import type PipeSection from '~/models/PipeSection';
import * as math from 'mathjs';

export default class Bernoullis {
    constructor(
        private _approximationMethod: Approximation,
        private _pipeSection: PipeSection
    ) {
        if (!this._approximationMethod)
            throw Error('Approximation method must be supplied.');
        if (!this._pipeSection) throw Error('PipeSection must be supplied.');
    }

    execute = (
        flowRates: Array<number>,
        isImperial: boolean = true
    ): Array<Array<number>> => {
        const relativeRoughness: number =
            this._pipeSection.absoluteRoughness / this._pipeSection.diameter;

        return flowRates.map((flowRate: number) => {
            const tdh = this.calculateTDH(
                isImperial,
                flowRate,
                relativeRoughness
            );
            return [tdh, flowRate];
        });
    };

    private calculateTDH = (
        isImperial: boolean = true,
        flowRate: number,
        relativeRoughness: number
    ): number => {
        const staticHead = this.calculateStaticHead();
        const pressureHead = this.calculatePressureHead(isImperial);
        const velocityHead = this.calculateVelocityHead(isImperial);
        const majorLosses = this.calculateMajorLosses(
            isImperial,
            flowRate,
            relativeRoughness
        );
        const minorLosses = this.calculateMinorLosses(flowRate, isImperial);

        return (
            staticHead + pressureHead + velocityHead + majorLosses + minorLosses
        );
    };

    private calculateStaticHead = (): number => {
        return (
            this._pipeSection.finalElevation -
            this._pipeSection.initialElevation
        );
    };

    private calculatePressureHead = (isImperial: boolean = true): number => {
        let correctionFactor: number = 2.31;
        if (!isImperial) correctionFactor = 10.2;
        return (
            (this._pipeSection.finalPressure -
                this._pipeSection.initialPressure) *
            correctionFactor
        );
    };

    private calculateVelocityHead = (isImperial: boolean = true): number => {
        let gravity: number = 32.17;
        if (!isImperial) gravity = 9.81;
        return (
            (this._pipeSection.finalVelocity -
                this._pipeSection.initialVelocity) /
            (2 * gravity)
        );
    };

    private calculateMajorLosses = (
        isImperial: boolean = true,
        flowRate: number,
        relativeRoughness: number
    ): number => {
        let gravity: number = 32.17;
        if (!isImperial) gravity = 9.81;
        return (
            (this._approximationMethod.calculateFrictionFactor(
                relativeRoughness,
                this.calculateReynoldsNumber(flowRate)
            ) *
                (this._pipeSection.length / this._pipeSection.diameter) *
                flowRate ** 2) /
            ((2 * gravity * math.pi * this._pipeSection.diameter ** 2) / 4)
        );
    };

    private calculateMinorLosses = (
        flowRate: number,
        isImperial: boolean = true
    ): number => {
        let gravity: number = 9.81;
        if (isImperial) gravity = 32.17;
        const sum = this._pipeSection.kValues.reduce((sum, k) => sum + k, 0);
        return (
            (sum * flowRate ** 2) /
            ((2 * gravity * math.pi * this._pipeSection.diameter ** 2) / 4)
        );
    };

    private calculateReynoldsNumber = (flowRate: number): number => {
        const velocity: number =
            flowRate / ((math.pi * this._pipeSection.diameter ** 2) / 4);
        return Math.max(
            (velocity * this._pipeSection.diameter) /
                this._pipeSection.kinematicViscosity,
            1e-6
        );
    };
}
