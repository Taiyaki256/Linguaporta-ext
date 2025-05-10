// filepath: d:\git\my-chrome-extension\src\popup\popup.js
document.addEventListener("DOMContentLoaded", function () {
  const inputField = document.getElementById("inputField");
  const submitButton = document.getElementById("submitButton");
  const resultArea = document.getElementById("resultArea");
  const answerButton = document.getElementById("answerButton"); // 追加
  const nextProblemButton = document.getElementById("nextProblemButton"); // 追加

  submitButton.addEventListener("click", function () {
    const userInput = inputField.value;

    // Send the user input to the content script
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      // Ensure tabs[0] and tabs[0].id exist before sending a message
      if (tabs && tabs.length > 0 && tabs[0].id) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          { input: userInput },
          function (response) {
            // Check chrome.runtime.lastError for potential errors
            if (chrome.runtime.lastError) {
              resultArea.textContent =
                "Error: " + chrome.runtime.lastError.message;
              console.error(chrome.runtime.lastError.message);
            } else if (response && response.result) {
              resultArea.textContent = response.result;
            } else {
              resultArea.textContent =
                "No response or invalid response from content script.";
            }
          }
        );
      } else {
        resultArea.textContent = "Could not find active tab.";
        console.error("Could not find active tab.");
      }
    });
  });

  // 新しい関数: 現在のタブを指定されたクエリパラメータで更新する
  function navigateTabWithAction(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs.length > 0 && tabs[0].id) {
        const currentTab = tabs[0];
        if (currentTab.url) {
          try {
            const url = new URL(currentTab.url);
            url.search = `?action=${action}`; // クエリパラメータを設定 (既存のものを置き換える)
            chrome.tabs.update(currentTab.id, { url: url.toString() });
          } catch (e) {
            console.error("Invalid URL:", currentTab.url, e);
            resultArea.textContent = "Error: Invalid current tab URL.";
          }
        } else {
          resultArea.textContent = "Current tab has no URL.";
          console.error("Current tab has no URL.");
        }
      } else {
        resultArea.textContent = "Could not find active tab.";
        console.error("Could not find active tab.");
      }
    });
  }

  // 回答ボタンのクリックリスナー
  answerButton.addEventListener("click", function () {
    navigateTabWithAction("answer");
  });

  // 次の問題ボタンのクリックリスナー
  nextProblemButton.addEventListener("click", function () {
    navigateTabWithAction("次の問題");
  });
});
