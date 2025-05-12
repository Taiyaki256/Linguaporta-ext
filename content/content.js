let unitNumber = "default-unit"; // デフォルトのユニット番号
let category = "default-category"; // デフォルトのカテゴリ
let questionNumber = "-1"; // デフォルトの問題番号

// ウェブサイトに埋め込むボタンを作成する関数
function createInPageButton(text, id, actionValue) {
  const button = document.createElement("button");
  button.textContent = text;
  button.id = id;
  button.style.position = "relative";
  button.style.zIndex = "10000"; // 他の要素より手前に表示
  button.style.padding = "10px";
  button.style.border = "1px solid #ccc";
  button.style.backgroundColor = "#f9f9f9";
  button.style.cursor = "pointer";

  button.addEventListener("click", async (event) => {
    event.stopImmediatePropagation();
    let ans = "a";
    let payload = "action=" + actionValue;
    if (actionValue == "check") {
      console.log("checkボタンがクリックされました。");
      let data = {};
      try {
        const storedData = await window.storageUtils.loadData(unitNumber, category);
        console.log("保存されたデータ:", storedData);
        if (storedData) {
          data = storedData;
          console.log("保存されたデータ:", data);
        } else {
          console.log("保存されたデータはありません。");
        }
      } catch (error) {
        console.error("Error in main function:", error);
      }
      // dataのunitNumberに基づいて、data["q" + questionNumber]が存在する場合はその内容を表示
      if (data["q" + questionNumber]) {
        ans = data["q" + questionNumber].Answers[0];
        console.log("回答した答え:", ans);
      }

      // random 140 ~ 20
      const randomNum = Math.floor(Math.random() * 121) + 20;
      payload += "&check_time=" + (Math.floor(Date.now() / 1000) - randomNum);
      payload += "&answer[0]=" + ans;
    }
    const postUrl = window.location.href;

    fetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
    })
      .then((response) => {
        if (response.ok) {
          console.log("Payload sent successfully.");
          return response.text().then((html) => {
            document.documentElement.innerHTML = html;
            dash();
            main();
            console.log("ページが更新されました。");
          });
        } else {
          console.error(
            "Failed to send payload. Status:",
            response.status,
            response.statusText
          );
          return response.text().then((text) => {
            throw new Error(text || response.statusText);
          });
        }
      })
      .catch((error) => {
        console.error("Error sending payload:", error);
      });
  });

  return button;
}

function dash() {
  const problemArea = document.getElementById("problem-area");

  if (problemArea) {
    // console div
    const consoleDiv = document.createElement("div");
    consoleDiv.id = "consoleDiv";
    consoleDiv.style.position = "relative";
    consoleDiv.style.backgroundColor = "#fff";
    consoleDiv.style.border = "1px solid #ccc";
    consoleDiv.style.width = "100%";
    consoleDiv.style.padding = "10px";
    consoleDiv.style.zIndex = "10000"; // 他の要素より手前に表示
    problemArea.appendChild(consoleDiv);
    // 「Check」ボタンを作成してページに追加
    const inPageCheckButton = createInPageButton(
      "Check",
      "inPageCheckButton",
      "check"
    );
    problemArea.appendChild(inPageCheckButton);
    // 「Answer」ボタンを作成してページに追加
    const inPageAnswerButton = createInPageButton(
      "Answer",
      "inPageAnswerButton",
      "answer"
    );
    problemArea.appendChild(inPageAnswerButton);
    // 「Next Problem」ボタンを作成してページに追加
    const inPageNextProblemButton = createInPageButton(
      "Next Problem",
      "inPageNextProblemButton",
      "次の問題"
    );
    problemArea.appendChild(inPageNextProblemButton);
    console.log(
      "コンテンツスクリプトがロードされ、ボタンが #question_area に追加されました。"
    );
  } else {
    console.warn(
      "コンテンツスクリプト: #question_area がページに見つかりませんでした。ボタンは追加されません。"
    );
  }
}

async function main() {
  unitNumber = "default-unit"; // デフォルトのユニット番号
  category = "default-category"; // デフォルトのカテゴリ
  questionNumber = "-1"; // デフォルトの問題番号

  let consoleDiv = document.getElementById("consoleDiv");

  const titleElements = document.querySelectorAll(".page-title");
  if (titleElements && titleElements.length > 0) {
    titleElements.forEach((element) => {
      const innerHTML = element.innerHTML;
      const match = innerHTML.match(/Unit\s*(\d+)/i);
      if (match && match[1]) {
        unitNumber = match[1];
        console.log("抽出されたユニット番号:", unitNumber);
      }
      if (innerHTML.includes("音声を聞いて書き取り")) {
        category = "dictation";
      } else if (innerHTML.includes("空所補充")) {
        category = "fill-in-the-blank";
      }
    });
  }
  const questionNumberElement = document.getElementById("question_td");
  if (questionNumberElement) {
    const questionNumberText = questionNumberElement.innerHTML;
    const match = questionNumberText.match(/問題番号：(\d+)/);
    if (match && match[1]) {
      questionNumber = match[1];
      console.log("抽出された問題番号:", questionNumber);
    }
  }

  if (category == "default-category") {
    return;
  }

  let data = {};
  try {
    const storedData = await window.storageUtils.loadData(unitNumber, category);
    console.log("保存されたデータ:", storedData);
    if (storedData) {
      data = storedData;
      console.log("保存されたデータ:", data);
    } else {
      console.log("保存されたデータはありません。");
    }
  } catch (error) {
    console.error("Error in main function:", error);
  }

  if (consoleDiv) {
    const unitInfo = document.createElement("p");
    unitInfo.innerText = `ユニット番号: ${unitNumber}, カテゴリ: ${category}, 問題番号: ${questionNumber}`;
    consoleDiv.appendChild(unitInfo);
    if (data["q" + questionNumber]) {
      const dataInfo = document.createElement("p");
      dataInfo.innerText = `保存されたデータ: ${JSON.stringify(
        data["q" + questionNumber]
      )}`;
      consoleDiv.appendChild(dataInfo);
    } else {
      const noDataInfo = document.createElement("p");
      noDataInfo.innerText = "保存されたデータはありません。";
      consoleDiv.appendChild(noDataInfo);
    }
  }

  const qu03Element = document.querySelector(".qu03");
  if (qu03Element) {
    const qu03Data = qu03Element.innerHTML;
    let cleanedData = qu03Data.replaceAll(/<br>/g, "");
    cleanedData = cleanedData.replaceAll(/\n/g, "");
    cleanedData = cleanedData.replaceAll(/<[^>]+>/g, "<>");
    cleanedData = cleanedData.replaceAll(/&nbsp;/g, "");
    const valueRegex = /value="([^"]*)"/g;
    let matches;
    const answers = [];
    while ((matches = valueRegex.exec(qu03Data)) !== null) {
      answers.push(matches[1].trim());
    }
    const soundElement = document.getElementById("sound");
    const soundSrc = soundElement ? soundElement.getAttribute("src") : null;
    let url = null;
    if (soundSrc) {
      url = new URL(soundSrc, window.location.origin).href;
      console.log("音声ファイルのURL:", url);
    } else {
      console.log("音声ファイルは見つかりませんでした。");
    }

    // id commentaryのテキストを取得
    const commentaryElement = document.getElementById("commentary");
    let comment = "";
    if (commentaryElement) {
      comment = commentaryElement.innerText;
    }


    


    console.log("本文:", cleanedData);
    console.log("答え:", answers);
    data["q" + questionNumber] = {
      Text: cleanedData,
      Answers: answers,
      Sound: url,
      Comment: comment
    };
    await window.storageUtils.saveData(unitNumber, category, data);
  } else {
    console.log("qu03要素は見つかりませんでした。");
  }
}

dash();
main();
