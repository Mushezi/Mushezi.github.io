/* 数学公式渲染：自托管 KaTeX + auto-render
 *
 * 背景：主题自带 katex 支持只加载 CSS（@see layout/includes/third-party/math/katex.pug），
 *      真正的公式渲染依赖已经废弃的 hexo-renderer-katex（服务端渲染），
 *      所以浏览器端自动渲染这一步需要自己补：
 *        1. 加载 katex.min.js（由 scripts/katex-assets.js 从 node_modules 输出到 /js/katex/）
 *        2. 加载 auto-render.min.js
 *        3. 对正文做一次 renderMathInElement
 *
 * 注意：$$...$$ 显示公式请写在同一行，因为 markdown 会在多行公式中间插入 <br>，
 *      渲染器就找不到完整的定界符了。
 */
(function () {
  var KATEX_JS = '/js/katex/katex.min.js'
  var AUTO_RENDER_JS = '/js/katex/auto-render.min.js'

  function addScript(src, onload) {
    var s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = onload
    s.onerror = function () {
      console.warn('[math] 脚本加载失败：', src)
    }
    document.head.appendChild(s)
  }

  function render(target) {
    if (typeof renderMathInElement !== 'function') return
    renderMathInElement(target, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false,
      strict: false,
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code']
    })
  }

  // 主题的 CSS 默认把 .katex 设为 display:none，等加 .katex-show 才显示。
  // 这里渲染完统一补上这个类，不依赖自定义 CSS 是否被缓存。
  function reveal() {
    var nodes = document.querySelectorAll('#article-container .katex, .post-content .katex')
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].classList.add('katex-show')
    }
  }

  function init() {
    var containers = document.querySelectorAll('#article-container, .post-content')
    if (!containers.length) return

    var hasMath = false
    for (var i = 0; i < containers.length; i++) {
      if (containers[i].textContent.indexOf('$') !== -1) {
        hasMath = true
        break
      }
    }
    if (!hasMath) return

    addScript(KATEX_JS, function () {
      addScript(AUTO_RENDER_JS, function () {
        for (var i = 0; i < containers.length; i++) render(containers[i])
        reveal()
        // 主题脚本稍后可能再跑一次 showKatex，这里再兜一次
        setTimeout(reveal, 300)
        setTimeout(reveal, 1200)
      })
    })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
