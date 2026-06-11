// Background service worker
// Opens McMaster orders page and fills in parts using bulk paste mode

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "OPEN_AND_FILL") return;

  const items = message.items;

  chrome.tabs.create({ url: "https://www.mcmaster.com/orders/" }, (tab) => {
    const checkReady = setInterval(() => {
      chrome.tabs.get(tab.id, (t) => {
        if (t.status === "complete") {
          clearInterval(checkReady);
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
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Build the bulk paste text: "PARTNUMBER QUANTITY" per line
  const bulkText = items.map(item => `${item.mcmaster_part} ${item.packs_to_order}`).join("\n");

  // Click "Paste part numbers and quantities" to switch mode
  const switchBtn = document.querySelector("button.switch-mode-link");
  if (!switchBtn) {
    console.warn("McMaster filler: could not find switch mode button");
    return;
  }
  switchBtn.click();
  await sleep(800);

  // Find the textarea and fill it
  const textarea = document.querySelector("#bulk-lines-textarea");
  if (!textarea) {
    console.warn("McMaster filler: could not find bulk textarea");
    return;
  }
  textarea.focus();
  textarea.value = bulkText;
  textarea.dispatchEvent(new Event("input",  { bubbles: true }));
  textarea.dispatchEvent(new Event("change", { bubbles: true }));
  await sleep(300);

  // Click the Add button
  const addBtn = document.querySelector("button.button-add-all-lines");
  if (!addBtn) {
    console.warn("McMaster filler: could not find Add button");
    return;
  }
  addBtn.click();

  console.log("McMaster filler: all parts submitted.");
}
