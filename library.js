var rolimonsIcon = 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Rolimon%27s_Logo.png?utm_source=commons.wikimedia.org&utm_campaign=index&utm_content=original'

function dquery(q) {
   return document.querySelector(q) // literally just a wrapper but i get to type less words
}

function dcreate(tag, className=null, innerHTML=null) {
   const e = document.createElement(tag)
   if (className) {e.className = className}
   if (innerHTML) {e.innerHTML = innerHTML}
   return e
}

async function request(url) {
   const _ = await fetch(url)
   return await _.json()
}

async function requestRaw(url) {
   const _ = await fetch(url)
   return _
}

async function fetchApi() {
   const data1 = await request('https://rolimons.cadenchau.com/api/items');
   const data2 = await request('https://rolimons.cadenchau.com/api/bulk_history')
   return [data1.data, data2.data]
}

function animateOpenModal(m) {
   m.style.display = ""
   m.style.opacity = "1"
   m.style.background = "rgba(0, 0, 0, 0.8)"
   m.style.animation = "fade-in 0.3s"
   m.children[0].style.animation = "move-up 0.3s"
}

function animateCloseModal(m) {
   setTimeout(function() {
      m.style.display = "none"
   }, 301)
   m.children[0].style.animation = "move-down 0.3s"
   m.style.animation = "fade-out 0.3s"
   m.style.opacity = 0
}

class time {
   // time related things
   static sleep(millis) {
      return new Promise(resolve => setTimeout(resolve, millis));
   }
}

class random {
   // basically the random module in python
   static choice(list) {
      return list[Math.floor(Math.random() * list.length)]
   }

   static randint(a, b) {
      return Math.floor(Math.random() * (b - a + 1)) + a
   }
}

class requests {
   async get(url) {
      return request(url)
   }
}

const getRelativeTime = (date) => {
   const units = [
      { name: 'year', value: 31536000000 },
      { name: 'month', value: 2592000000 },
      { name: 'day', value: 86400000 },
      { name: 'hour', value: 3600000 },
      { name: 'minute', value: 60000 },
      { name: 'second', value: 1000 }
   ]
   
   const diff = date - new Date()
   
   for (const unit of units) {
      const value = Math.round(diff / unit.value)
      if (value) return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(value, unit.name)
   }
   
   return 'just now'
};


function createResTag(identifier, parent, diff, max) {
   if ((e = dquery(`#_tradez-res-tag-${identifier}`))) {e.remove()}

   e = dcreate('div', '', (diff > 0 ? "+" : "")+`${diff.toLocaleString()} (${Math.abs((diff/max) * 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)`)
   e.id = `_tradez-res-tag-${identifier}`
   e.style = `color: ${diff <= 0 ? "red" : "lime"}; font-weight: bold; font-size: 20px; width: 100%; text-align: right;`
   parent.append(e)
}


const tradezCardBadgeBackground = "rgba(150, 150, 150, 0.2)"
const tradezChartRanges = [
   { id: "7d", label: "7D", durationMs: 7 * 86400000 },
   { id: "1m", label: "1M", durationMs: 30 * 86400000 },
   { id: "1y", label: "1Y", durationMs: 365 * 86400000 },
   { id: "all", label: "All time", durationMs: Infinity }
]

function ensureChartTooltip() {
   if (!document.getElementById("tradez-card-tooltip-styles")) {
      const style = dcreate("style")
      style.id = "tradez-card-tooltip-styles"
      style.textContent = `
         .tradez-chart-tooltip { display:none; position:fixed; width:360px; padding:12px; box-sizing:border-box; border:1px solid rgba(60,70,85,.2); border-radius:10px; background:#f8f9fb; color:#20242b; box-shadow:0 8px 28px rgba(0,0,0,.25); z-index:2147483647; pointer-events:auto; }
         .tradez-chart-toolbar { display:flex; align-items:center; justify-content:space-between; gap:8px; margin:0 0 9px; }
         .tradez-chart-tooltip-heading { margin:0; color:#5d6571; font:600 12px/1.2 Arial,sans-serif; letter-spacing:.04em; text-transform:uppercase; white-space:nowrap; }
         .tradez-chart-ranges { display:flex; gap:4px; }
         .tradez-chart-range { border:1px solid #d3d8df; border-radius:999px; background:#fff; color:#59616d; padding:4px 8px; font:600 10px Arial,sans-serif; cursor:pointer; white-space:nowrap; }
         .tradez-chart-range[aria-pressed='true'] { background:#28313d; border-color:#28313d; color:#fff; }
         .tradez-chart-range:disabled {
            background:#e0e3e8; border-color:#bcc3cc; opacity:.4; cursor:default;
         }
         .tradez-chart-tooltip .tradez-graph { position:relative; background:#f1f3f6; border-radius:6px; box-sizing:border-box; }
         .tradez-card-hover-anchor { position:relative; --tradez-image-height:50%; }
         .tradez-chart-trigger {
            position:absolute; transform:translateY(-100%); z-index:5;
            width:26px; height:26px; box-sizing:border-box;
            display:grid; place-items:center; padding:0; border:0;
            background:transparent; color:#353942; cursor:pointer;
         }
         .tradez-chart-trigger::before {
            content:""; position:absolute; inset:0; z-index:-1; border-radius:50%;
            background:${tradezCardBadgeBackground}; pointer-events:none;
         }
         .tradez-card-mini-graph { width:100%; flex:0 1 50%; min-height:0; pointer-events:none; }
         @media(max-width:700px) { .tradez-chart-tooltip { width:min(360px,85vw); } }
      `
      document.head.append(style)
   }
   let tooltip = document.getElementById("_tradez-chart-tooltip")
   if (!tooltip) {
      tooltip = dcreate("div", "tradez-chart-tooltip")
      tooltip.id = "_tradez-chart-tooltip"
      tooltip.innerHTML = "<div class='tradez-chart-toolbar'><div class='tradez-chart-tooltip-heading'>RAP history</div><div class='tradez-chart-ranges' role='group' aria-label='Chart time range'></div></div>"
      const ranges = tooltip.querySelector(".tradez-chart-ranges")
      for (const { id, label } of tradezChartRanges) {
         const button = dcreate("button", "tradez-chart-range", label)
         button.type = "button"
         button.dataset.range = id
         ranges.append(button)
      }
      const graph = dcreate("div", "tradez-graph")
      graph.style.height = "180px"
      graph.style.width = "100%"
      tooltip.append(graph)
   }
   if (tooltip.parentElement !== document.body) document.body.append(tooltip)
   if (tooltip.dataset.rangeHandlerBound !== "true") {
      tooltip.addEventListener("click", event => {
         const button = event.target.closest(".tradez-chart-range")
         if (!button || button.disabled) return
         tooltip.dataset.range = button.dataset.range
         const points = JSON.parse(tooltip.dataset.chartPoints || "[]")
         updateChartTooltip(tooltip, tooltip.dataset.itemId || "", points, tooltip.dataset.range)
      })
      tooltip.dataset.rangeHandlerBound = "true"
   }
   return tooltip
}

function positionChartTooltip(tooltip, trigger) {
   const rect = trigger.getBoundingClientRect()
   const width = tooltip.offsetWidth
   const height = tooltip.offsetHeight
   const fitsRight = rect.right + width <= window.innerWidth
   const fitsLeft = rect.left >= width
   let left
   let top

   if (fitsRight || fitsLeft) {
      left = fitsRight ? rect.right : rect.left - width
      const centeredTop = rect.top + (rect.height - height) / 2
      top = Math.max(0, Math.min(centeredTop, window.innerHeight - height))
   } else {
      left = Math.max(0, Math.min(rect.left, window.innerWidth - width))
      top = rect.bottom + height <= window.innerHeight ? rect.bottom : Math.max(0, rect.top - height)
   }

   tooltip.style.left = `${left}px`
   tooltip.style.top = `${top}px`
}

function chartTimestampMs(timestamp) {
   const value = Number(timestamp)
   return Math.abs(value) < 1e12 ? value * 1000 : value
}

function updateChartTooltip(tooltip, itemId, points, requestedRange = "all") {
   tooltip.dataset.chartPoints = JSON.stringify(points)
   let oldest = Infinity
   let latest = -Infinity
   for (const point of points) {
      if (!Array.isArray(point) || !Number.isFinite(Number(point[1]))) continue
      const timestamp = chartTimestampMs(point[0])
      if (!Number.isFinite(timestamp)) continue
      oldest = Math.min(oldest, timestamp)
      latest = Math.max(latest, timestamp)
   }

   const historySpan = latest - oldest
   const availableRanges = tradezChartRanges.filter((_, index) =>
      index === 0 || historySpan > tradezChartRanges[index - 1].durationMs
   )
   const selectedRange = availableRanges.find(range => range.id === requestedRange) ?? availableRanges.at(-1)
   for (const button of tooltip.querySelectorAll(".tradez-chart-range")) {
      button.disabled = !availableRanges.some(range => range.id === button.dataset.range)
      button.setAttribute("aria-pressed", String(button.dataset.range === selectedRange.id))
   }

   const cutoff = latest - selectedRange.durationMs
   const filteredPoints = points.filter(point => Array.isArray(point) && chartTimestampMs(point[0]) >= cutoff)
   const pointsKey = `${selectedRange.id}:${JSON.stringify(filteredPoints)}`
   if (tooltip.dataset.itemId !== itemId || tooltip.dataset.pointsKey !== pointsKey) {
      tooltip.dataset.itemId = itemId
      tooltip.dataset.pointsKey = pointsKey
      tooltip._tradezChart?.destroy()
      tooltip._tradezChart = renderLineChart({
         element: tooltip.querySelector(".tradez-graph"),
         points: filteredPoints,
         showGrid: true,
         showPoints: true,
         showAxisLabels: true,
         showXAxisDates: true,
         showHoverValues: true,
         startAtZero: true,
         lineWidth: 2.5,
         padding: 16
      })
   }
}

function createCard(child, itemId, apiData, chartData) {
   if (itemId in apiData) {
      // add value tag
      if (apiData[itemId].value) {
         let parent = child.querySelector('.item-card-caption')
         if ((e = parent.querySelector('#_tradez-value-tag'))) {e.remove()}

         e = dcreate("span", "", `<img style='width: auto; height: 18px;' src='${rolimonsIcon}'>${apiData[itemId].value.toLocaleString()}`)
         e.id = "_tradez-value-tag"
         e.style = "color: dodgerblue; display: flex; align-items: center; gap: 2px; font-weight: bold; padding-left: 3px;"
         parent.append(e)
      }

      // add meta card
      const imageParent = child.querySelector('.item-card-link.item-card-link')
      const previousMeta = imageParent.querySelector('#_tradez-meta-tag')
      let miniGraph = previousMeta?.querySelector(".tradez-card-mini-graph")
      let graphTrigger = imageParent.querySelector(".tradez-chart-trigger")
      const points = chartData?.[itemId]
      const hasHistory = Array.isArray(points) && points.length > 0

      const item = apiData[itemId]
      const meta = dcreate("span", "", `
      <div style='color: ${item.best_price > item.rap ? "lime" : "Red"}'>Bp: ${item.best_price.toLocaleString()} <span>(${(item.best_price-item.rap).toLocaleString()})</span></div>
      <div>S: ${item.sellers}</div>
      `)
      
      if (hasHistory) {
         miniGraph ??= dcreate("div", "tradez-card-mini-graph")
         meta.append(miniGraph)
      } else {
         imageParent._tradezMiniChart?.destroy()
         imageParent._tradezMiniChart = null
         graphTrigger?.remove()
      }

      // create projected tag
      if (item.projected) {
         const tag = dcreate("div", "", "⚠️")
         tag.style = `width: 18px; height: 18px; position: absolute; bottom: 5px; right: ${hasHistory ? 37 : 10}px;`
         meta.append(tag)
      }

      child.querySelector(".thumbnail-2d-container")?.remove()
      meta.id = "_tradez-meta-tag"
      meta.style = `
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      border-radius: 8px;
      color: rgb(220,220,220);
      width: 100%; 
      height: var(--tradez-image-height);
      padding: 5px; 
      font-size: 16px; 
      font-weight: bold; 
      position: absolute; 
      left: 0; 
      top: 0; 
      pointer-events: none;
      z-index: -1;`
      meta.style.background = `linear-gradient(rgba(0, 0, 0, 1), transparent 66.67%), url("${item.icon}") center / cover no-repeat`
      imageParent.classList.add("tradez-card-hover-anchor")
      const tooltip = ensureChartTooltip()
      if (previousMeta) previousMeta.replaceWith(meta)
      else imageParent.append(meta)

      const limitedBadge = child.querySelector(".limited-icon-container")
      if (limitedBadge) limitedBadge.style.backgroundColor = tradezCardBadgeBackground

      if (hasHistory) {
         if (!graphTrigger) {
            graphTrigger = dcreate("button", "tradez-chart-trigger", "<svg viewBox='0 0 24 24' width='16' height='16' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M3 17l6-6 4 3 8-9'/><path d='M15 5h6v6'/></svg>")
            graphTrigger.type = "button"
            graphTrigger.title = "Show RAP history chart"
            graphTrigger.setAttribute("aria-label", "Show RAP history chart")
            imageParent.append(graphTrigger)
         }
         const pointsKey = JSON.stringify(points)
         if (!miniGraph.firstElementChild || graphTrigger.dataset.tradezChartPoints !== pointsKey) {
            imageParent._tradezMiniChart?.destroy()
            imageParent._tradezMiniChart = renderLineChart({ element: miniGraph, points })
            graphTrigger.dataset.tradezChartPoints = pointsKey
         }
         graphTrigger.dataset.tradezItemId = itemId

         // Mirror the thumbnail badge's inset and bottom edge on the right.
         const cardRect = imageParent.getBoundingClientRect()
         const badgeRect = limitedBadge?.getBoundingClientRect()
         if (badgeRect?.height) {
            graphTrigger.style.top = `${badgeRect.bottom - cardRect.top}px`
            graphTrigger.style.right = `${Math.max(0, badgeRect.left - cardRect.left)}px`
         } else {
            graphTrigger.style.top = `${cardRect.width - 8}px`
            graphTrigger.style.right = "8px"
         }
      }
      if (!window.tradezCardTooltipHandlersBound) {
         let activeTrigger = null
         const cardObserver = new MutationObserver(() => {
            if (activeTrigger && !activeTrigger.isConnected) hideTooltip()
         })
         const hideTooltip = () => {
            activeTrigger = null
            tooltip.style.display = "none"
            cardObserver.disconnect()
         }
         const showTooltip = trigger => {
            const points = JSON.parse(trigger.dataset.tradezChartPoints)
            activeTrigger = trigger
            tooltip.style.display = "block"
            updateChartTooltip(tooltip, trigger.dataset.tradezItemId, points, tooltip.dataset.range || "all")
            positionChartTooltip(tooltip, trigger)
            cardObserver.observe(document.body, { childList: true, subtree: true })
         }
         const isWithinChartArea = target =>
            activeTrigger?.isConnected && (activeTrigger.contains(target) || tooltip.contains(target))

         document.addEventListener("pointerover", event => {
            const trigger = event.target.closest?.(".tradez-chart-trigger")
            if (trigger && trigger !== activeTrigger) showTooltip(trigger)
         }, true)
         document.addEventListener("pointerout", event => {
            if (activeTrigger && !isWithinChartArea(event.relatedTarget)) hideTooltip()
         }, true)
         document.addEventListener("pointermove", event => {
            if (!activeTrigger) return
            if (!isWithinChartArea(document.elementFromPoint(event.clientX, event.clientY))) hideTooltip()
         }, true)
         document.addEventListener("focusin", event => {
            const trigger = event.target.closest?.(".tradez-chart-trigger")
            if (trigger && trigger !== activeTrigger) showTooltip(trigger)
         }, true)
         document.addEventListener("focusout", event => {
            if (activeTrigger && !isWithinChartArea(event.relatedTarget)) hideTooltip()
         }, true)
         window.tradezCardTooltipHandlersBound = true
      }
   }
}

function createRequestCard(child, itemId, apiData) {
   if (itemId in apiData) {
      let parent = child.querySelector(".item-value")

      if ((e = parent.querySelector('#_tradez-meta-tag'))) {e.remove()}
      let item = apiData[itemId]
      e = dcreate("span", "", `
      <span style='color: ${item.best_price > item.rap ? "lime" : "Red"}'>(${item.best_price.toLocaleString()})</span>`)
      e.id = "_tradez-meta-tag"
      e.style = `
      font-weight: bold;
      `
      parent.append(e)

      // value after so span goes inline with the RAP
      if (apiData[itemId].value) {
         if ((e = parent.querySelector('#_tradez-value-tag'))) {e.remove()}
         e = dcreate("span", "", `<img style='width: auto; height: 18px;' src='${rolimonsIcon}'>${apiData[itemId].value.toLocaleString()}`)
         e.id = "_tradez-value-tag"
         e.style = "color: dodgerblue; display: flex; align-items: center; gap: 2px; font-weight: bold; padding-left: 3px;"
         parent.append(e)
      }
   }
}
