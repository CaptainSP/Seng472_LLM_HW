document.getElementById("summarizeBtn").addEventListener("click", async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        function: summarizePageContent,
      },
      async (results) => {
        if (results && results[0].result) {
          const summarizedText = await summarizeWithBackend(results[0].result);
          document.getElementById("summary").value = summarizedText;
        } else {
          document.getElementById("summary").value =
            "Could not extract or summarize the page content.";
        }
      }
    );
  });
});

async function summarizeWithBackend(text) {
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
        text: "I recommend you to try the pizza with extra cheese in the ... restaurant. It is delicious!"
      },

      do not forget to offer different food types to the user. Good luck!
      `,
    },{ role: "user", content: text }],
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
      text: "No summary found",
    });
    return JSON.parse(json).text;
  } catch (error) {
    console.error("Error summarizing with backend:", error);
    return "Error summarizing the text";
  }
}

function summarizePageContent() {
  const bodyText = document.body.innerText;
  return bodyText.replace(/\s+/g, " ").trim();
}
