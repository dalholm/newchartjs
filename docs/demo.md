---
layout: page
title: Demo Gallery
---

<style>
.demo-frame {
  width: 100%;
  height: calc(100vh - 128px);
  border: none;
  border-radius: 8px;
}
</style>

# Demo Gallery

<iframe class="demo-frame" src="/demo/index.html" id="demo-frame"></iframe>

<script setup>
import { onMounted, onUnmounted } from 'vue'

function sendTheme() {
  const frame = document.getElementById('demo-frame')
  if (!frame || !frame.contentWindow) return
  const isDark = document.documentElement.classList.contains('dark')
  frame.contentWindow.postMessage({ type: 'newchart-theme', dark: isDark }, '*')
}

let observer

onMounted(() => {
  // Send initial theme once iframe loads
  const frame = document.getElementById('demo-frame')
  if (frame) {
    frame.addEventListener('load', sendTheme)
  }

  // Watch for VitePress dark mode toggle (class change on <html>)
  observer = new MutationObserver(sendTheme)
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
})

onUnmounted(() => {
  if (observer) observer.disconnect()
})
</script>
