var apiData
var chartData
window.onload = async function() {
    [apiData, chartData] = await fetchApi()
    setInterval(async () => {
        [apiData, chartData] = await fetchApi();
    }, 5000)

    setInterval(function() {
        // get total value for each side
        let values = []
        for (child of document.getElementsByClassName("robux-line")) {
            if (child.innerHTML.includes("Total Value:")) {
                values.push(parseInt(child.querySelector('.robux-line-value').innerHTML.replaceAll(",", "")))
            }
        }
        let [selfRap, otherRap] = values

        // update inventory cards
        if (apiData) {
            // get both inventories
            let lists = document.getElementsByClassName("hlist item-cards item-cards-stackable")
            let children = [...lists].flatMap(list => [...list.children])

            for (child of children) {
                child.style.marginBottom = '0'
                let a = child.querySelector('a')
                let itemId = a.href.split('/')[4]
                
                createCard(child, itemId, apiData, chartData)
            }

            // get items in offer/request
            let requestItems = document.getElementsByClassName("trade-request-item")
            for (child of requestItems) {
                // check value shit here
                let offering = child.parentElement.firstElementChild.innerHTML == "Your Offer" ? true : false

                let a = child.querySelector('a')
                if (a) {
                    let itemId = a.href.split('/')[4]
                    if (itemId in apiData && apiData[itemId].value) {
                        let offset = apiData[itemId].value - apiData[itemId].rap
                        if (offering) {
                            selfRap += offset
                        } else {
                            otherRap += offset
                        }
                    }
                    createRequestCard(child, itemId, apiData)
                }
            }

        }

        let windows = document.getElementsByClassName('trade-request-window-offer')
        createResTag(0, windows[0], otherRap-selfRap, selfRap)
        createResTag(1, windows[1], selfRap-otherRap, otherRap)
    }, 100)
}