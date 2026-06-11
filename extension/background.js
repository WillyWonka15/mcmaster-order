// Background service worker
// Opens McMaster orders page and fills in parts

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "OPEN_AND_FILL") return;

  const items = message.items;

  // Open McMaster orders page
  chrome.tabs.create({ url: "https://www.mcmaster.com/orders/" }, (tab) => {
    // Wait for the page to load then inject the filler
    const checkReady = setInterval(() => {
      chrome.tabs.get(tab.id, (t) => {
        if (t.status === "complete") {
          clearInterval(checkReady);

          // Small extra delay for JS to render the input fields
          setTimeout(() => {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: fillOrder,
              args: [items]
            });
          }, 2000);
        }
      });
    }, 500);
  });
});


// This function runs inside the McMaster tab
async function fillOrder(items) {
  async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function fillField(selector, value) {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`Field not found: ${selector}`);
    el.focus();
    el.value = value;
    el.dispatchEvent(new Event("input",  { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    try {
      // Fill part number
      await fillField("#new-line-part-number-input-1", item.mcmaster_part);
      await sleep(300);

      // Fill quantity
      await fillField("#new-line-quantity-input-1", String(item.packs_to_order));
      await sleep(300);

      // Click Add button
      const addBtn = document.querySelector("button.button-add-all-lines");
      if (!addBtn) throw new Error("Add button not found");
      addBtn.click();

      // Wait for the line to register before adding the next part
      await sleep(2000);

    } catch (e) {
      console.warn(`McMaster filler: failed on ${item.dv_number} — ${e.message}`);
    }
  }

  console.log("McMaster filler: all parts added.");
}
