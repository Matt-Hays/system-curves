import type Approximation from '~/models/interfaces/Approximation';
import Bernoullis from '~/models/Bernoullis';
import { ApproximationMethod } from '~/models/enums/ApproximationMethod';
import SerghidesApproximation from '~/models/SerghidesApproximation';

export default class PipeSection {
    constructor(
        private _initialPressure: number,
        private _finalPressure: number,
        private _initialVelocity: number,
        private _finalVelocity: number,
        private _targetFlowRate: number,
        private _initialElevation: number,
        private _finalElevation: number,
        private _length: number,
        private _diameter: number,
        private _absoluteRoughness: number,
        private _kinematicViscosity: number,
        private _kValues: Array<number>
    ) {
        if (this._diameter < 0)
            throw Error('Pipe diameter must be a positive integer');
        if (this._length <= 0)
            throw Error('Pipe length must be a positive integer');
        if (this._absoluteRoughness <= 0)
            throw Error('Pipe absoluteRoughness must be a positive integer');
        if (this._kinematicViscosity <= 0)
            throw Error('Pipe kinematicViscosity must be a positive integer');
    }

    execute = (
        approximationMethod: ApproximationMethod = ApproximationMethod.SERGHIDE,
        isImperial: boolean = true
    ): Array<Array<number>> => {
        let method: Approximation | null = null;
        switch (approximationMethod) {
            case ApproximationMethod.SERGHIDE:
                method = new SerghidesApproximation();
                break;
            case ApproximationMethod.COLEBROOK:
                throw Error('Colebook method not implemented.');
        }

        if (!method) throw Error('No approximation method defined.');

        return new Bernoullis(method, this).execute(isImperial);
    };

    get initialPressure(): number {
        return this._initialPressure;
    }

    set initialPressure(value: number) {
        this._initialPressure = value;
    }

    get finalPressure(): number {
        return this._finalPressure;
    }

    set finalPressure(value: number) {
        this._finalPressure = value;
    }

    get initialVelocity(): number {
        return this._initialVelocity;
    }

    set initialVelocity(value: number) {
        this._initialVelocity = value;
    }

    get finalVelocity(): number {
        return this._finalVelocity;
    }

    set finalVelocity(value: number) {
        this._finalVelocity = value;
    }

    get targetFlowRate(): number {
        return this._targetFlowRate;
    }

    set targetFlowRate(value: number) {
        this._targetFlowRate = value;
    }

    get initialElevation(): number {
        return this._initialElevation;
    }

    set initialElevation(value: number) {
        this._initialElevation = value;
    }

    get finalElevation(): number {
        return this._finalElevation;
    }

    set finalElevation(value: number) {
        this._finalElevation = value;
    }

    get length(): number {
        return this._length;
    }

    set length(value: number) {
        this._length = value;
    }

    get diameter(): number {
        return this._diameter;
    }

    set diameter(value: number) {
        this._diameter = value;
    }

    get absoluteRoughness(): number {
        return this._absoluteRoughness;
    }

    set absoluteRoughness(value: number) {
        this._absoluteRoughness = value;
    }

    get kinematicViscosity(): number {
        return this._kinematicViscosity;
    }

    set kinematicViscosity(value: number) {
        this._kinematicViscosity = value;
    }

    get kValues(): Array<number> {
        return this._kValues;
    }

    set kValues(value: Array<number>) {
        this._kValues = value;
    }
}
