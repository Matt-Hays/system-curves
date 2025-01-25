<script setup lang="ts">
import { array, boolean, number, object, string } from 'yup';
import type PipeSection from '~/models/PipeSection';
import Pipeline from '~/models/Pipeline';
import regression from 'regression';
import { Chart, registerables } from 'chart.js';
import { ApproximationMethod } from '~/models/enums/ApproximationMethod';

Chart.register(...registerables);

let chartInstance: Chart | null = null;

const approxMethods = ['serghide', 'colebrook'];

const pipelineSchema = object({
    target_flow_rate: number().required().positive(),
    is_imperial: boolean().required(),
    approximation_method: string().required(),
});

const pipelineList = reactive({
    target_flow_rate: undefined,
    is_imperial: undefined,
    approximation_method: undefined,
});

const pipeSectionSchema = object({
    initial_pressure: number().required(),
    final_pressure: number().required(),
    initial_velocity: number().required(),
    final_velocity: number().required(),
    initial_elevation: number().required(),
    final_elevation: number().required(),
    length: number().required(),
    diameter: number().required(),
    absolute_roughness: number().required(),
    kinematic_viscosity: number().required(),
    k_values: array(number()).required(),
});

const pipeSectionList = reactive([
    {
        initial_pressure: undefined,
        final_pressure: undefined,
        initial_velocity: undefined,
        final_velocity: undefined,
        initial_elevation: undefined,
        final_elevation: undefined,
        length: undefined,
        diameter: undefined,
        absolute_roughness: undefined,
        kinematic_viscosity: undefined,
        k_values: [] as Array<number>,
    },
]);

function addPipeSection() {
    pipeSectionList.push({
        initial_pressure: undefined,
        final_pressure: undefined,
        initial_velocity: undefined,
        final_velocity: undefined,
        initial_elevation: undefined,
        final_elevation: undefined,
        length: undefined,
        diameter: undefined,
        absolute_roughness: undefined,
        kinematic_viscosity: undefined,
        k_values: [],
    });
}

function removePipeSection(index: number) {
    pipeSectionList.splice(index, 1);
}

function addKValue(pipeSectionIndex: number) {
    pipeSectionList[pipeSectionIndex].k_values.push(0); // Add a default value of 0
}

function removeKValue(pipeSectionIndex: number, kValueIndex: number) {
    pipeSectionList[pipeSectionIndex].k_values.splice(kValueIndex, 1);
}

async function submitAll() {
    const pipeline = new Pipeline();

    for (const pipeSection of pipeSectionList) {
        const pipeSectionParams: ConstructorParameters<typeof PipeSection> = [
            pipeSection.initial_pressure!,
            pipeSection.final_pressure!,
            pipeSection.initial_velocity!,
            pipeSection.final_velocity!,
            pipeSection.initial_elevation!,
            pipeSection.final_elevation!,
            pipeSection.length!,
            pipeSection.diameter!,
            pipeSection.absolute_roughness!,
            pipeSection.kinematic_viscosity!,
            pipeSection.k_values,
        ];

        pipeline.addPipeSection(pipeSectionParams);
    }

    if (
        pipelineList.target_flow_rate == undefined ||
        pipelineList.is_imperial == undefined
    )
        throw Error('Required attributes not set.');

    let method: ApproximationMethod | null = null;
    switch (pipelineList.approximation_method!) {
        case 'serghide':
            method = ApproximationMethod.SERGHIDE;
            break;
        case 'colebrook':
            method = ApproximationMethod.COLEBROOK;
            break;
        default:
            throw Error('Unsupported approximation method.');
    }
    const tdhData = pipeline.execute(
        pipelineList.target_flow_rate,
        method,
        pipelineList.is_imperial
    );
    console.log('System TDH:', tdhData);

    // Extract x (flowRates) and y (maxTDHs) for plotting
    const flowRates = tdhData.map(([_, flowRate]) => flowRate);
    const maxTDHs = tdhData.map(([maxTDH]) => maxTDH);

    const dataForRegression: [number, number][] = flowRates.map((x, i) => [
        x,
        maxTDHs[i],
    ]);

    // Perform polynomial regression (degree 2)
    const regressionResult = regression.polynomial(dataForRegression, {
        order: 2,
    });

    // Extract regression points
    const regressionPoints = regressionResult.points.map(([x, y]) => ({
        x,
        y,
    }));

    // Create or update the Chart.js chart
    const ctx = document.getElementById('chartCanvas') as HTMLCanvasElement;

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Original Data',
                    data: flowRates.map((x, i) => ({ x, y: maxTDHs[i] })),
                    backgroundColor: 'blue',
                    borderColor: 'blue',
                    showLine: false, // Scatter plot
                },
                {
                    label: 'Polynomial Fit (Degree 2)',
                    data: regressionPoints,
                    backgroundColor: 'red',
                    borderColor: 'red',
                    fill: false,
                    tension: 0.4, // Smooth curve
                    showLine: true, // Display line
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'System TDH vs Flow Rate',
                },
                legend: {
                    display: true,
                    position: 'top',
                },
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Flow Rate',
                    },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Max TDH',
                    },
                },
            },
        },
    });
}
</script>

<template>
    <div>
        <h3 class="pl-4 pt-4">System Parameters</h3>
        <UForm
            :schema="pipelineSchema"
            :state="pipelineList"
            class="grid grid-cols-7 gap-4 p-4"
        >
            <UFormGroup
                label="Target Flow Rate"
                name="target_flow_rate"
                class="w-sm"
            >
                <UInput
                    v-model="pipelineList.target_flow_rate"
                    type="number"
                    step="any"
                />
            </UFormGroup>
            <UFormGroup
                label="Approximation Method"
                name="approximation_method"
            >
                <USelect
                    v-model="pipelineList.approximation_method"
                    name="approximation_method"
                    :options="approxMethods"
                />
            </UFormGroup>
            <UFormGroup label="Imperial Units" name="is_imperial">
                <UCheckbox
                    v-model="pipelineList.is_imperial"
                    name="is_imperial"
                />
            </UFormGroup>
            <div class="col-start-7 flex justify-end items-center">
                <UButton type="button" @click="submitAll"
                    >Generate System Curve</UButton
                >
            </div>
        </UForm>
        <hr class="m-4" />
        <div
            v-for="(pipeSection, index) in pipeSectionList"
            :key="index"
            class="p-4 mb-4"
        >
            <h3>Pipe Section {{ index + 1 }}</h3>
            <UForm
                :schema="pipeSectionSchema"
                :state="pipeSection"
                @submit.prevent="submitAll"
                class="grid grid-cols-7 gap-4"
            >
                <UFormGroup label="Pressure 1" name="pressure_1">
                    <UInput
                        v-model="pipeSection.initial_pressure"
                        type="number"
                        step="any"
                    />
                </UFormGroup>

                <UFormGroup label="Pressure 2" name="pressure_2">
                    <UInput
                        v-model="pipeSection.final_pressure"
                        type="number"
                        step="any"
                    />
                </UFormGroup>

                <UFormGroup label="Velocity 1" name="velocity_1">
                    <UInput
                        v-model="pipeSection.initial_velocity"
                        type="number"
                        step="any"
                    />
                </UFormGroup>

                <UFormGroup label="Velocity 2" name="velocity_2">
                    <UInput
                        v-model="pipeSection.final_velocity"
                        type="number"
                        step="any"
                    />
                </UFormGroup>

                <UFormGroup label="Height 1 Min" name="height_1_min">
                    <UInput
                        v-model="pipeSection.initial_elevation"
                        type="number"
                        step="any"
                    />
                </UFormGroup>

                <UFormGroup label="Height 2 Min" name="height_2_min">
                    <UInput
                        v-model="pipeSection.final_elevation"
                        type="number"
                        step="any"
                    />
                </UFormGroup>

                <UFormGroup label="Length" name="length">
                    <UInput
                        v-model="pipeSection.length"
                        type="number"
                        step="any"
                    />
                </UFormGroup>

                <UFormGroup label="Diameter" name="diameter">
                    <UInput
                        v-model="pipeSection.diameter"
                        type="number"
                        step="any"
                    />
                </UFormGroup>

                <UFormGroup
                    label="Absolute Roughness"
                    name="absolute_roughness"
                >
                    <UInput
                        v-model="pipeSection.absolute_roughness"
                        type="number"
                        step="any"
                    />
                </UFormGroup>

                <UFormGroup
                    label="Kinematic Viscosity"
                    name="kinematic_viscosity"
                >
                    <UInput
                        v-model="pipeSection.kinematic_viscosity"
                        type="number"
                        step="any"
                    />
                </UFormGroup>

                <UFormGroup label="K Values" name="k_values">
                    <div>
                        <div
                            v-for="(kValue, kIndex) in pipeSection.k_values"
                            :key="kIndex"
                            class="flex items-center space-x-2"
                        >
                            <UInput
                                v-model="pipeSection.k_values[kIndex]"
                                type="number"
                                step="any"
                            />
                            <UButton
                                type="button"
                                @click="() => removeKValue(index, kIndex)"
                                >Remove</UButton
                            >
                        </div>
                        <UButton type="button" @click="() => addKValue(index)"
                            >Add K Value</UButton
                        >
                    </div>
                </UFormGroup>
                <UButton
                    type="button"
                    @click="() => removePipeSection(index)"
                    class="mt-8 w-32"
                    >Remove Pipe Section</UButton
                >
            </UForm>
        </div>
        <div class="grid grid-cols-5 gap-4">
            <div class="col-start-5 flex justify-end items-center mr-6">
                <UButton type="button" @click="addPipeSection"
                    >Add Pipe Section</UButton
                >
            </div>
        </div>
    </div>
    <div
        class="chart-container"
        style="height: 400px; position: relative; width: 80vw"
    >
        <canvas id="chartCanvas"></canvas>
    </div>
</template>
