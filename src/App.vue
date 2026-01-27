<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="main">

    <RouterView />

  </div>
</template>

<style>
.main {
  background: #59C173;  /* fallback for old browsers */
  background: -webkit-linear-gradient(to left, #5D26C1, #a17fe0, #59C173);
  background: linear-gradient(to left, #5D26C1, #a17fe0, #59C173);
}
</style>
