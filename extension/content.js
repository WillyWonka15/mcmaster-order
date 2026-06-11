// McMaster Order Filler - Content Script
// Listens for order data from the web app, then fills McMaster's order page

window.addEventListener("message", async (event) => {
  if (event.data?.type !== "MCMASTER_FILL_ORDER") return;
  const items = event.data.items;
  if (!items?.length) return;

  // Open McMaster orders page in a new tab, then fill it
  chrome.runtime.sendMessage({ type: "OPEN_AND_FILL", items });
});
