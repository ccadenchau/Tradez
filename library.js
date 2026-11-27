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
      let imageParent = child.querySelector('.item-card-link.item-card-link')
      if ((e = imageParent.querySelector('#_tradez-meta-tag'))) {e.remove()}

      let item = apiData[itemId]
      e = dcreate("span", "", `
      <div style='color: ${item.best_price > item.rap ? "lime" : "Red"}'>Bp: ${item.best_price.toLocaleString()} <span>(${(item.best_price-item.rap).toLocaleString()})</span></div>
      <div>S: ${item.sellers}</div>
      `)
      
      // create graph
      if (itemId in chartData) {
         graph = dcreate("div", "tradez-graph", "")
         graph.style.height = "50%"
         graph.style.width = "100%"
         renderLineChart({element: graph, points: chartData[itemId]})
         e.append(graph)
      }

      // create projected tag
      if (apiData[itemId].projected) {
         tag = dcreate("div", "", "⚠️")
         tag.style = "width: 18px; height: 18px; position: absolute; bottom: 5px; right: 10px;"
         e.append(tag)
      }

      e.id = "_tradez-meta-tag"
      e.style = `
      position: relative;
      border-radius: 8px;
      color: rgb(220,220,220);
      width: 100%; 
      height: 50%; 
      padding: 5px; 
      font-size: 16px; 
      font-weight: bold; 
      position: absolute; 
      left: 0; 
      top: 0; 
      pointer-events: none;
      /* -webkit-text-stroke: 2px rgba(255, 255, 255, 0.5);   */
      background: linear-gradient(rgba(0, 0, 0, 0.5), transparent)`
      imageParent.append(e)
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