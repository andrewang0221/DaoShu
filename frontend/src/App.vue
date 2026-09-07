<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import './styles/global.css';
import './styles/tabbar.css';
import { useAppStore } from './store';

const store = useAppStore();

onLaunch(() => {
  console.log('[道枢·东方智慧AI数字人系统] 应用启动');
  // 全局恢复登录态：token 存于内存，刷新页面/新开 webview 后内存清空，
  // 必须在应用启动时从本地存储恢复，否则直接进入的页面（如认养问卷）会误判未登录
  store.restore();
});
</script>

<style>
/* 全局样式已通过import引入 */
</style>
