<template>
  <router-view />
</template>

<script setup>
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif; }
/* Mobile: make Element Plus tables/forms scroll horizontally */
@media (max-width: 767px) {
  .el-table { font-size: 13px; }
  .el-card { border-radius: 8px !important; }
  .el-dialog { width: 92vw !important; margin: 0 auto !important; }
  .el-form--inline .el-form-item { margin-right: 8px; }
  .el-descriptions { font-size: 13px; }
}
</style>
