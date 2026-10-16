<script setup>
import { onUnmounted, onMounted, ref } from "vue";
import { createTour } from "@take-a-tour/core";

/**
 * The Vue equivalent of the React rule: create the tour in the setup phase and
 * destroy it in `onUnmounted`.
 *
 * A tour left alive after its component unmounts would keep a DOM overlay, a
 * document-level keydown listener and a locked tourId alive forever.
 */
const showBanner = ref(true);
let tour = null;

onMounted(() => {
  tour = createTour({
    tourId: "vue-dashboard",
    steps: [
      {
        tourId: "vue.banner",
        title: "A dismissible banner",
        content: "Vue mounts and unmounts markup constantly; tours wait for their target.",
        placement: "bottom",
      },
      {
        tourId: "vue.chart",
        title: "Live chart",
        content: "Resized by the framework whenever the data changes.",
        placement: "top",
      },
    ],
    theme: "system",
    // The banner may not be mounted yet when the tour starts.
    target: { missing: "wait", timeout: 5000 },
  });
});

onUnmounted(() => {
  tour?.destroy();
  tour = null;
});

function startTour() {
  tour?.start();
}
</script>

<template>
  <main class="page">
    <header class="page__header">
      <h1>Dashboard</h1>
      <button class="btn btn--primary" data-tour-id="vue.start" @click="startTour">
        Start tour
      </button>
    </header>

    <section v-if="showBanner" class="banner" data-tour-id="vue.banner">
      <strong>Scheduled maintenance</strong>
      <span> Saturday 02:00–04:00 UTC.</span>
      <button class="banner__close" aria-label="Dismiss banner" @click="showBanner = false">
        &times;
      </button>
    </section>

    <section class="card">
      <h2>Revenue</h2>
      <div class="chart" data-tour-id="vue.chart">
        <span
          v-for="height in [40, 62, 48, 85, 70, 92]"
          :key="height"
          :style="{ height: height + '%' }"
        ></span>
      </div>
    </section>

    <button class="btn" @click="showBanner = !showBanner">Toggle banner</button>
  </main>
</template>
