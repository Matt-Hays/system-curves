import PipeSection from './PipeSection';
import { ApproximationMethod } from '~/models/enums/ApproximationMethod';
import type Approximation from '~/models/interfaces/Approximation';
import SerghidesApproximation from '~/models/SerghidesApproximation';

export default class Pipeline {
    constructor(private pipeSections: PipeSection[] = []) {}

    /**
     * Calculates the total dynamic head (TDH) for the system.
     * @returns The maximum and minimum TDH values.
     */
    public execute = (
        targetFlowRate: number,
        approximationMethod: ApproximationMethod = ApproximationMethod.SERGHIDE,
        isImperial: boolean
    ): Array<Array<number>> => {
        if (this.pipeSections.length === 0)
            throw new Error('No pipe sections exist.');

        let method: Approximation | null = null;
        switch (approximationMethod) {
            case ApproximationMethod.SERGHIDE:
                method = new SerghidesApproximation();
                break;
            case ApproximationMethod.COLEBROOK:
                throw Error('Colebook method not implemented.');
        }

        if (!method) throw Error('No approximation method defined.');

        const flowRates: Array<number> = this.generateFlowRange(targetFlowRate);

        // Assume all pipe sections have the same flow rate range
        const flowRateCount: number = 20;

        // Initialize the system curve array
        const systemCurve: Array<Array<number>> = Array(flowRateCount).fill([
            0, 0,
        ]);

        // Sum minTDH and maxTDH values for each flow rate across all pipe sections
        for (let i = 0; i < flowRateCount; i++) {
            let cumulativeTDH = 0;
            let flowRate = 0;

            for (const pipeSection of this.pipeSections) {
                const [tdh, currentFlowRate] = pipeSection.execute(
                    flowRates,
                    method,
                    isImperial
                )[i];
                cumulativeTDH += tdh;
                flowRate = currentFlowRate; // The flow rate is assumed identical across all pipe sections
            }

            // Store the result for this flow rate
            systemCurve[i] = [cumulativeTDH, flowRate];
        }

        return systemCurve;
    };

    /**
     * Adds a new pipe section to the system.
     * @param pipeSectionParams Parameters for creating a PipeSection instance.
     */
    public addPipeSection = (
        pipeSectionParams: ConstructorParameters<typeof PipeSection>
    ): void => {
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
    public modifyPipeSection = (
        index: number,
        newParams: ConstructorParameters<typeof PipeSection>
    ): void => {
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

    private generateFlowRange = (targetFlowRate: number): Array<number> => {
        const step = targetFlowRate / 10;
        return Array.from({ length: 20 }, (_, i) => step * i);
    };
}
