document.getElementById("offerBtn").addEventListener("click", async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        function: getPageContent,
      },
      async (results) => {
        if (results && results[0].result) {
          const response = await offerWithBackend(results[0].result);
          document.getElementById("resultArea").value = response;
        } else {
          document.getElementById("resultArea").value =
            "Could not extract or summarize the page content.";
        }
      }
    );
  });
});

var oldMessages = [];

/**
 * It sends page content to backend with system message and gets the response.
 * @param {string} text 
 * @returns {string} The offer text
 */
async function offerWithBackend(text) {
  document.getElementById("offerBtn").innerText = "Loading...";
  const url = "https://gpt.unl.cx/chat"; // Your backend endpoint

  const headers = {
    "Content-Type": "application/json",
  };

  const body = JSON.stringify({
    messages: [{
      role: "system",
      content: `
      You are a food assistant. We will give you a some web content that details about yemeksepeti.com that is a popular food delivery website in Turkey. Your task is to offer some food to user:
      The response format should be like this in json:
      {
        text: "I recommend you to try the ... in the ... restaurant. ..."
      },

      do not forget to offer different food types to the user at everytime. Good luck!
      `,
    },{ role: "user", content: text }, ...oldMessages],
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: body,
    });

    if (!response.ok) {
      const errorData = await response.json(); // Log detailed error response
      console.error("API error:", JSON.stringify(errorData, null, 2)); // Log error for debugging
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API response data:", data); // Log response for debugging
    let json = data.choices[0].message.content || JSON.stringify({
      text: "No offer found",
    });
    
    const message = JSON.parse(json).text;
    oldMessages.push({ role: "assistant", content: message });
    oldMessages.push({ role: "user", content: "Can you offer me something different?" });
    document.getElementById("offerBtn").innerText = "Offer me";
    return message;
  } catch (error) {
    console.error("Error offering some food with backend:", error);
    return "Error offering some food with backend";
  }
}

/**
 * @returns {string} The text content of the page
 */
function getPageContent() {
  const bodyText = document.body.innerText;
  return bodyText.replace(/\s+/g, " ").trim();
}
