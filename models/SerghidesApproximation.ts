import * as math from 'mathjs';
import type Approximation from '~/models/interfaces/Approximation';

export default class SerghidesApproximation implements Approximation {
    calculateFrictionFactor = (
        relativeRoughness: number,
        reynoldsNum: number
    ): number => {
        if (reynoldsNum < 2300) return 64 / reynoldsNum; // Laminar flow

        const roughnessTerm: number = relativeRoughness / 3.7;
        const calculateTerm = (prev: number | null = null): number => {
            const reynoldsTerm = prev
                ? (2.51 * prev) / reynoldsNum
                : 12 / reynoldsNum;
            return -2 * math.log10(roughnessTerm + reynoldsTerm);
        };
        const a: number = calculateTerm(null);
        const b: number = calculateTerm(a);
        const c: number = calculateTerm(b);

        return Number(
            math.pow(
                math
                    .chain(a)
                    .subtract(
                        math
                            .chain(math.pow(b - a, 2))
                            .divide(c - 2 * b + a)
                            .done()
                    )
                    .done(),
                -2
            )
        );
    };
}
