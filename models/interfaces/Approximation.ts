export default interface Approximation {
    calculateFrictionFactor(
        relativeRoughness: number,
        reynoldsNum: number
    ): number;
}
