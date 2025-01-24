<script setup lang="ts">
import {array, type InferType, number, object} from 'yup';
import System from '@/models/System';
import type PipeSection from '~/models/PipeSection';
import regression from 'regression';
import {Chart, registerables} from "chart.js";

Chart.register(...registerables);

const pipeSectionSchema = object({
  pressure_1: number().required().positive(),
  pressure_2: number().required().positive(),
  velocity_1: number().required().positive(),
  velocity_2: number().required().positive(),
  height_1_min: number().required().positive(),
  height_2_min: number().required().positive(),
  height_1_max: number().required().positive(),
  height_2_max: number().required().positive(),
  length: number().required().positive(),
  diameter: number().required().positive(),
  absolute_roughness: number().required().positive(),
  kinematic_viscosity: number().required().positive(),
  target_flow_rate: number().required().positive(),
  k_values: array().of(number().positive().nullable()).required(),
});

type PipeSectionSchema = InferType<typeof pipeSectionSchema>;

const pipeSectionList = reactive([
  {
    pressure_1: undefined,
    pressure_2: undefined,
    velocity_1: undefined,
    velocity_2: undefined,
    height_1_min: undefined,
    height_2_min: undefined,
    height_1_max: undefined,
    height_2_max: undefined,
    length: undefined,
    diameter: undefined,
    absolute_roughness: undefined,
    kinematic_viscosity: undefined,
    target_flow_rate: undefined,
    k_values: [] as number[],
  },
]);

function addPipeSection() {
  pipeSectionList.push({
    pressure_1: undefined,
    pressure_2: undefined,
    velocity_1: undefined,
    velocity_2: undefined,
    height_1_min: undefined,
    height_2_min: undefined,
    height_1_max: undefined,
    height_2_max: undefined,
    length: undefined,
    diameter: undefined,
    absolute_roughness: undefined,
    kinematic_viscosity: undefined,
    target_flow_rate: undefined,
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
  const system = new System();

  for (const pipeSection of pipeSectionList) {
    const validKValues = pipeSection.k_values.filter(
        (v): v is number => v !== null && v !== undefined
    );

    const pipeSectionParams: ConstructorParameters<typeof PipeSection> = [
      pipeSection.pressure_1!,
      pipeSection.pressure_2!,
      pipeSection.velocity_1!,
      pipeSection.velocity_2!,
      pipeSection.height_1_min!,
      pipeSection.height_1_max!,
      pipeSection.height_2_min!,
      pipeSection.height_2_max!,
      pipeSection.length!,
      pipeSection.diameter!,
      pipeSection.absolute_roughness!,
      pipeSection.kinematic_viscosity!,
      pipeSection.target_flow_rate!,
      validKValues,
    ];

    system.addPipeSection(pipeSectionParams);
  }

  const tdhData = system.calcTDH();
  console.log('System TDH:', tdhData);

  // Extract x (flowRates) and y (maxTDHs) for plotting
  const flowRates = tdhData.map(([_, __, flowRate]) => flowRate);
  const maxTDHs = tdhData.map(([maxTDH]) => maxTDH);

  const dataForRegression: [number, number][] = flowRates.map((x, i) => [x, maxTDHs[i]]);

  // Perform polynomial regression (degree 2)
  const regressionResult = regression.polynomial(dataForRegression, { order: 2 });

  // Extract regression points
  const regressionPoints = regressionResult.points.map(([x, y]) => ({ x, y }));

  // Create or update the Chart.js chart
  const ctx = document.getElementById('chartCanvas') as HTMLCanvasElement;

  new Chart(ctx, {
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
    <canvas id="chartCanvas" style="width: 100%; height: 400px;"></canvas>
    <div v-for="(pipeSection, index) in pipeSectionList" :key="index" class="border p-4 mb-4">
      <h3>Pipe Section {{ index + 1 }}</h3>
      <UForm :schema="pipeSectionSchema" :state="pipeSection" @submit.prevent="submitAll">

        <UFormGroup label="Pressure 1" name="pressure_1">
          <UInput v-model="pipeSection.pressure_1" type="number" step="any" />
        </UFormGroup>

        <UFormGroup label="Pressure 1" name="pressure_1">
          <UInput v-model="pipeSection.pressure_1" type="number" step="any" />
        </UFormGroup>

        <UFormGroup label="Pressure 2" name="pressure_2">
          <UInput v-model="pipeSection.pressure_2" type="number" step="any" />
        </UFormGroup>

        <UFormGroup label="Velocity 1" name="velocity_1">
          <UInput v-model="pipeSection.velocity_1" type="number" step="any" />
        </UFormGroup>

        <UFormGroup label="Velocity 2" name="velocity_2">
          <UInput v-model="pipeSection.velocity_2" type="number" step="any" />
        </UFormGroup>

        <UFormGroup label="Height 1 Min" name="height_1_min">
          <UInput v-model="pipeSection.height_1_min" type="number" step="any" />
        </UFormGroup>

        <UFormGroup label="Height 2 Min" name="height_2_min">
          <UInput v-model="pipeSection.height_2_min" type="number" step="any" />
        </UFormGroup>

        <UFormGroup label="Height 1 Max" name="height_1_max">
          <UInput v-model="pipeSection.height_1_max" type="number" step="any" />
        </UFormGroup>

        <UFormGroup label="Height 2 Max" name="height_2_max">
          <UInput v-model="pipeSection.height_2_max" type="number" step="any" />
        </UFormGroup>

        <UFormGroup label="Length" name="length">
          <UInput v-model="pipeSection.length" type="number" step="any" />
        </UFormGroup>

        <UFormGroup label="Diameter" name="diameter">
          <UInput v-model="pipeSection.diameter" type="number" step="any" />
        </UFormGroup>

        <UFormGroup label="Absolute Roughness" name="absolute_roughness">
          <UInput v-model="pipeSection.absolute_roughness" type="number" step="any" />
        </UFormGroup>

        <UFormGroup label="Kinematic Viscosity" name="kinematic_viscosity">
          <UInput v-model="pipeSection.kinematic_viscosity" type="number" step="any" />
        </UFormGroup>

        <UFormGroup label="Target Flow Rate" name="target_flow_rate">
          <UInput v-model="pipeSection.target_flow_rate" type="number" step="any" />
        </UFormGroup>

        <UFormGroup label="K Values" name="k_values">
          <div>
            <div v-for="(kValue, kIndex) in pipeSection.k_values" :key="kIndex" class="flex items-center space-x-2">
              <UInput v-model="pipeSection.k_values[kIndex]" type="number" step="any" />
              <UButton type="button" @click="() => removeKValue(index, kIndex)">Remove</UButton>
            </div>
            <UButton type="button" @click="() => addKValue(index)">Add K Value</UButton>
          </div>
        </UFormGroup>
        <UButton type="button" @click="() => removePipeSection(index)">Remove Pipe Section</UButton>
      </UForm>
    </div>
    <UButton type="button" @click="addPipeSection">Add Pipe Section</UButton>
    <UButton type="button" @click="submitAll">Submit</UButton>
  </div>
</template>