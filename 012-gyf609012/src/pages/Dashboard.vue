<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useIssueStore } from '@/stores/issueStore'
import AppHeader from '@/components/layout/AppHeader.vue'
import StatCards from '@/components/common/StatCards.vue'
import StatusPieChart from '@/components/charts/StatusPieChart.vue'
import FloorBarChart from '@/components/charts/FloorBarChart.vue'
import CategoryBarChart from '@/components/charts/CategoryBarChart.vue'
import IssueFilter from '@/components/issue/IssueFilter.vue'
import IssueList from '@/components/issue/IssueList.vue'
import IssueDetail from '@/components/issue/IssueDetail.vue'
import NewIssueModal from '@/components/issue/NewIssueModal.vue'

const store = useIssueStore()
const showNewIssueModal = ref(false)

onMounted(() => {
  store.initIssues()
})

function handleNewIssue() {
  showNewIssueModal.value = true
}
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <AppHeader @new-issue="handleNewIssue" />

    <main class="p-6">
      <div class="max-w-7xl mx-auto space-y-6">
        <StatCards />

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatusPieChart :data="store.stats.statusCount" title="问题状态分布" />
          <FloorBarChart :data="store.stats.floorCount" title="楼层分布" />
          <CategoryBarChart :data="store.stats.categoryCount" title="碰撞类型分布" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div class="lg:col-span-1">
            <IssueFilter />
          </div>
          <div class="lg:col-span-3">
            <IssueList @select="() => {}" />
          </div>
        </div>
      </div>
    </main>

    <IssueDetail @close="store.selectIssue(null)" />

    <NewIssueModal v-if="showNewIssueModal" @close="showNewIssueModal = false" />
  </div>
</template>
