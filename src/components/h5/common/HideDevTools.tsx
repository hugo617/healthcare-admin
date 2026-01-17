'use client';

import { useEffect } from 'react';

/**
 * 隐藏 Next.js Dev Tools 徽章组件
 * Next.js Dev Tools 扩展会通过 <nextjs-portal> 元素和 Shadow DOM 注入徽章
 */
export function HideDevToolsBadge() {
  useEffect(() => {
    // 使用 MutationObserver 监听 DOM 变化，移除 Next.js Dev Tools 徽章
    const removeDevToolsBadge = () => {
      // 方法 1: 查找并移除 nextjs-portal 元素
      const portal = document.querySelector('nextjs-portal');
      if (portal) {
        portal.remove();
        return;
      }

      // 方法 2: 查找并移除带有 data-next-badge 的元素
      const badges = document.querySelectorAll('[data-next-badge="true"]');
      badges.forEach((badge) => {
        if (badge instanceof HTMLElement) {
          badge.remove();
        }
      });

      // 方法 3: 查找并移除 Next.js Dev Tools 按钮（处理在主 DOM 中的情况）
      const buttons = document.querySelectorAll(
        '[data-nextjs-dev-tools-button="true"]'
      );
      buttons.forEach((button) => {
        const parent = button.closest('[data-next-badge="true"]');
        if (parent instanceof HTMLElement) {
          parent.remove();
        }
      });
    };

    // 初始执行一次
    removeDevToolsBadge();

    // 使用 MutationObserver 监听 DOM 变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            // 检查是否是 nextjs-portal 元素
            if (
              (node instanceof HTMLElement &&
                node.tagName === 'NEXTJS-PORTAL') ||
              (node instanceof HTMLElement && node.tagName === 'nextjs-portal')
            ) {
              node.remove();
              return;
            }

            if (node instanceof HTMLElement) {
              // 检查添加的节点是否包含 Next.js Dev Tools 元素
              if (
                node.hasAttribute('data-next-badge') ||
                node.querySelector('[data-next-badge="true"]') ||
                node.querySelector('[data-nextjs-dev-tools-button="true"]') ||
                node.querySelector('nextjs-portal')
              ) {
                removeDevToolsBadge();
              }
            }
          });
        }
      });
    });

    // 监听整个 document.body 的变化
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 定期检查（防止某些情况下 MutationObserver 未捕获）
    const intervalId = setInterval(() => {
      removeDevToolsBadge();
    }, 1000);

    // 清理函数
    return () => {
      observer.disconnect();
      clearInterval(intervalId);
    };
  }, []);

  // 这个组件不渲染任何内容
  return null;
}
