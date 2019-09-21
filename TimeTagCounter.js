
var timeTagCounterTimeoutReference;
let previousTimeTagCounterMsg;

function clearTimeTagCounter(){
    clearTimeout(timeTagCounterTimeoutReference);
}

function updateTimeTagCounter() 
{
    function toastMsg(str, sec, err) {
        clearTimeout();
        WF.hideMessage();
        WF.showMessage(str.bold(), err);
        timeTagCounterTimeoutReference = setTimeout(() => WF.hideMessage(), (sec || 2) * 1e3)
    }

    function applyToEachItem(functionToApply, parent) {
        functionToApply(parent);
        for (let child of parent.getChildren()) {
            applyToEachItem(functionToApply, child)
        }
    }

    function findMatchingItems(itemPredicate, parent) {
        const matches = [];

        function addIfMatch(item) {
            if (itemPredicate(item)) {
                matches.push(item)
            }
        }
        applyToEachItem(addIfMatch, parent);
        return matches
    }
    const itemHasTimeTag = item => WF.getItemNameTags(item).concat(WF.getItemNoteTags(item)).some(t => t.tag.match(/([@#])(\d+)([hm])$/i));
    const getTimeTags = item => WF.getItemNameTags(item).concat(WF.getItemNoteTags(item)).filter(t => t.tag.match(/([@#])(\d+)([hm])$/i) !== null);
    const matchHasTimeTag = item => item.data.search_result && item.data.search_result.matches && itemHasTimeTag(item);

    function getMinutes(str) {
        const m = str.match(/(\d+)([hm])/i);
        return m[2] === "h" ? parseInt(m[1]) * 60 : parseInt(m[1])
    }

    function convertMinsToStr(mins) {
        const hours = Math.floor(mins / 60);
        const netMins = mins - hours * 60;
        const days = hours / 8;
        const weeks = (days / 3).toFixed(2);
        return `${hours.toString().padStart(4," ")}h ${netMins.toString().padStart(2," ")}m | ${days.toString().padStart(2," ")} days | ${weeks.toString().padStart(2," ")} weeks`
    }

    function getTimeTagInfo(items) {
        let hashComplete = 0,
            hashInComplete = 0,
            atComplete = 0,
            atInComplete = 0;
        items.forEach(item => {
            getTimeTags(item).forEach(t => {
                let tag = t.tag,
                    addMins = getMinutes(tag);
                if (tag.startsWith("#")) {
                    item.isWithinCompleted() ? hashComplete += addMins : hashInComplete += addMins
                } else {
                    item.isWithinCompleted() ? atComplete += addMins : atInComplete += addMins
                }
            })
        });
        const hashAll = hashComplete + hashInComplete,
            atAll = atComplete + atInComplete;
        if (atAll + hashAll === 0) return null;
        hashTotals = hashAll > 0 ? `<br>#Total: \t${convertMinsToStr(hashAll)}<br> Incomplete:\t${convertMinsToStr(hashInComplete)}<br> Complete:\t${convertMinsToStr(hashComplete)}` : "";
        atTotals = atAll > 0 ? `<br>@Total:\t${convertMinsToStr(atAll)}<br> Complete:\t${convertMinsToStr(atComplete)}<br> Incomplete:\t${convertMinsToStr(atInComplete)}` : "";
        return `<pre>${hashTotals}<br>${atTotals}</pre>`
    }

    function convertTimeToStr(mins) {
        const hours = Math.floor(mins / 60);
        const netMins = mins - hours * 60;
        const days = hours / 8;
        const weeks = (days / 3).toFixed(2);
        return `${days.toString()} days // ${weeks.toString()} weeks`
    }

    function getTimeTagInfoSimple(items) {
        let hashComplete = 0,
            hashInComplete = 0,
            atComplete = 0,
            atInComplete = 0;
        items.forEach(item => 
        {
            getTimeTags(item).forEach(t => 
            {
                let tag = t.tag,
                    addMins = getMinutes(tag);
                if (tag.startsWith("#")) 
                {
                    item.isWithinCompleted() ? hashComplete += addMins : hashInComplete += addMins
                } 
                else 
                {
                    item.isWithinCompleted() ? atComplete += addMins : atInComplete += addMins
                }
            })
        });
        // const hashAll = hashComplete + hashInComplete;
        const hashAll = hashInComplete;
        const atAll = atComplete + atInComplete;
        if (atAll + hashAll === 0) return null;
        hashTotals = hashAll > 0 ? `\t${convertTimeToStr(hashAll)}` : "";
        return `${hashTotals}`
    }

    function showSortDialog(bodyHtml, title, button1, button2) {
        const style = '.btnX{font-size:18px;background-color:#49baf2;border:2px solid;border-radius:20px;color:#fff;padding:5px 15px;margin-top:16px;margin-right:16px}.btnX:focus{border-color:#c4c4c4}';
        const buttons = `<div><button type="button" class="btnX" id="btn1">${button1}</button></div>`;
        WF.showAlertDialog(`<style>${htmlEscapeText(style)}</style><div>${bodyHtml}</div>${buttons}`, title);
        setTimeout(() => {
            const btn1 = document.getElementById("btn1");
            btn1.focus();
            btn1.onclick = function() {
                const timeTagInfo = getTimeTagInfoSimple(itemsToCount);
                const name = WF.currentItem().getNameInPlainText();
                WF.setItemName(WF.currentItem(), name + timeTagInfo)
            };
        }, 100)
    }

    const focusedItem = WF.focusedItem();
    const currentItem = WF.currentItem();
    const parentItem = focusedItem
    ? focusedItem.equals(currentItem) ? focusedItem : focusedItem.getParent()
    : currentItem;

    const itemsToCount = WF.currentSearchQuery() 
    ? findMatchingItems(matchHasTimeTag, parentItem) 
    : findMatchingItems(itemHasTimeTag, parentItem); 

    const timeTagInfo = getTimeTagInfo(itemsToCount);
    const name = parentItem.getNameInPlainText();
    const msg = "'" + name + "'" + " === " + getTimeTagInfoSimple(itemsToCount);

    if(msg === previousTimeTagCounterMsg)
        return;

    previousTimeTagCounterMsg = msg;

    WF.hideMessage();
    clearTimeTagCounter();

    if (!timeTagInfo) 
        WF.showMessage("No Time Tags found.".bold(), true);
    else
        WF.showMessage(msg.bold(), false);

    //showSortDialog(timeTagInfo, name, 'Add Time to Name?', 'Z-A')
    // toastMsg(msg, 3, false);
    // return void toastMsg("No Time Tags found.", 2, true);
};



