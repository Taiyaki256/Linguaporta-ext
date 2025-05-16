let unitNumber = "default-unit"; // デフォルトのユニット番号
let category = "default-category"; // デフォルトのカテゴリ
let questionNumber = "-1"; // デフォルトの問題番号
let questionSequence = "-1"; // デフォルトの問題シーケンス

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
        const storedData = await window.storageUtils.loadData(
          unitNumber,
          category
        );
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
      let anslen = 0;
      if (data["q" + questionNumber]) {
        ans = data["q" + questionNumber].Answers[0];
        anslen = data["q" + questionNumber].Answers.length;
      }
      if (anslen == 1) {
        // random 70 ~ 20
        const randomNum = Math.floor(Math.random() * 60) + 10;
        payload += "&check_time=" + (Math.floor(Date.now() / 1000) - randomNum);
        payload += "&answer[0]=" + ans;

        console.log("回答した答え:", ans);
      } else {
        let answer = "";
        for (let i = 0; i < anslen; i++) {
          answer += data["q" + questionNumber].Answers[i] + "<>";
        }
        payload += "&answer=" + answer;
        console.log("回答した答え:", answer);
      }
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
          return response.text().then(async (html) => {
            document.documentElement.innerHTML = html;
            createConsoleDiv();
            await main();
            dash();
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

function createConsoleDiv() {
  const problemArea = document.getElementById("problem-area");
  if (problemArea) {
    const consoleDiv = document.createElement("div");
    consoleDiv.id = "consoleDiv";
    consoleDiv.style.position = "relative";
    consoleDiv.style.backgroundColor = "#fff";
    consoleDiv.style.border = "1px solid #ccc";
    consoleDiv.style.width = "100%";
    consoleDiv.style.padding = "10px";
    consoleDiv.style.zIndex = "10000"; // 他の要素より手前に表示
    problemArea.appendChild(consoleDiv);
  }
}
function dash() {
  const problemArea = document.getElementById("problem-area");

  if (problemArea) {
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
    // Auto Check
    console.log(
      `Dash ユニット番号: ${unitNumber}, カテゴリ: ${category}, 問題番号: ${questionNumber}`
    );
    const inPageAutoButton =
      questionSequence == 1
        ? createInPageButton("Auto1", "inPageAuto", "check")
        : questionSequence == 2
        ? createInPageButton("Auto2", "inPageAuto", "次の問題")
        : createInPageButton("Auto0", "inPageAuto", "answer");
    problemArea.appendChild(inPageAutoButton);
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
  questionSequence = "-1";

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
      } else if (innerHTML.includes("単語・語句の意味")) {
        category = "word-meaning";
      } else if (innerHTML.includes("単語並び替え")) {
        category = "word-sort";
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
  console.log("unitNumber:", unitNumber);
  console.log("category:", category);
  console.log("questionNumber:", questionNumber);

  let consoleDiv = document.getElementById("consoleDiv");
  if (consoleDiv) {
    console.log("consoleDivが見つかりました。");
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
  if (category == "word-sort") {
    let segments = null;
    try {
      const header = document.querySelector("head");
      const scriptContent =
        header.querySelector("script:not([src])").textContent;
      // console.log("scriptContent:", scriptContent);
      const segmentsMatch = scriptContent.match(
        /var Segments = new Array\(\);(.*?);/s
      );
      if (segmentsMatch) {
        const segmentsText = segmentsMatch[1];
        // console.log("segmentsText:", segmentsText);
        const segmentMatches = scriptContent.match(
          /Segments\[\d+\]\[0\] = '((?:[^'\\]|\\.)*)';\s*Segments\[\d+\]\[1\] = (\d+)/g
        );
        // console.log("segmentMatches:", segmentMatches);
        if (segmentMatches) {
          segments = segmentMatches.map((match) => {
            const textMatch = match.match(
              /Segments\[\d+\]\[0\] = '((?:[^'\\]|\\.)*)'/
            );
            // const numberMatch = match.match(/Segments\[\d+\]\[1\] = (\d+)/);
            // console.log("textMatch:", textMatch);
            if (textMatch) {
              // エスケープされた文字を元に戻す
              return textMatch[1].replace(/\\(['\\])/g, "$1");
            }
            return "";
          });
        }
      }

      console.log("Segments:", segments);
      let Text = "";
      let answers = [];
      let sound = null;
      let comment = null;
      if (data["q" + questionNumber]) {
        Text = data["q" + questionNumber].Text;
        answers = data["q" + questionNumber].Answers;
        sound = data["q" + questionNumber].Sound;
        comment = data["q" + questionNumber].Comment;
      }
      data["q" + questionNumber] = {
        Text: Text,
        Answers: answers,
        Sound: sound,
        Comment: comment,
        Segments: segments,
      };
      await window.storageUtils.saveData(unitNumber, category, data);
      console.log("word-sortのデータを保存しました。");
    } catch (error) {
      console.log("Segments配列の取得に失敗しました:", error);
    }
  }
  const qu03Element = document.querySelector(".qu03");
  if (qu03Element) {
    questionSequence = 1;
    if (category == "word-sort") {
      let qu03Data = qu03Element.innerHTML;
      let Text = "";
      let answers = [];
      let clearAnswers = [];
      if (qu03Data) {
        // タグと&nbsp;を削除
        qu03Data = qu03Data.replaceAll(/<[^>]+>/g, "");
        qu03Data = qu03Data.replaceAll(/&nbsp;/g, "");
        answers = qu03Data.split(" ");
        // 一つずつ足していって、Segmentsの中にあればclearAnswersに追加
        let tmp = "";
        let i = 0;
        while (i < answers.length) {
          if (tmp != "") {
            tmp += " ";
          }
          tmp += answers[i];
          console.log("tmp:", tmp);

          // 現在のtmpと完全一致するセグメントを探す
          let exactMatch = null;
          for (const segment of data["q" + questionNumber].Segments) {
            if (tmp === segment) {
              exactMatch = segment;
              break;
            }
          }

          // 完全一致するセグメントが見つかった場合
          if (exactMatch) {
            // 次の単語を追加して確認
            if (i + 1 < answers.length) {
              const nextTmp = tmp + " " + answers[i + 1];
              let hasNextMatch = false;
              for (const segment of data["q" + questionNumber].Segments) {
                if (segment.startsWith(nextTmp)) {
                  hasNextMatch = true;
                  break;
                }
              }
              if (!hasNextMatch) {
                clearAnswers.push(tmp);
                console.log("clearAnswers:", clearAnswers);
                tmp = "";
              }
            } else {
              // 次の単語がない場合は追加
              clearAnswers.push(tmp);
              console.log("clearAnswers:", clearAnswers);
              tmp = "";
            }
          }
          i++;
        }
        let seg = null;
        if (data["q" + questionNumber].Segments) {
          seg = data["q" + questionNumber].Segments;
        }
        // データを保存
        data["q" + questionNumber] = {
          Text: Text,
          Answers: clearAnswers,
          Sound: null,
          Comment: null,
          Segments: seg,
        };
        await window.storageUtils.saveData(unitNumber, category, data);
        console.log("main関数でword-sortのデータを保存しました。");
      }
      const qu02Element = document.getElementById("qu02");
      if (qu02Element) {
        Text = qu02Element.innerHTML;
      }
      // segmentがあれば
      let segments = null;
      if (data["q" + questionNumber].Segments) {
        segments = data["q" + questionNumber].Segments;
        console.log("segmentsある");
      }
      data["q" + questionNumber] = {
        Text: Text,
        Answers: clearAnswers,
        Sound: null,
        Comment: null,
        Segments: segments,
      };
      console.log("data:", data);
      await window.storageUtils.saveData(unitNumber, category, data);
    } else if (category == "fill-in-the-blank" || category == "dictation") {
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
        Comment: comment,
      };
      await window.storageUtils.saveData(unitNumber, category, data);
      console.log(
        "main関数でfill-in-the-blank,dictationのデータを保存しました。"
      );
    }
  } else {
    console.log("qu03要素は見つかりませんでした。");
  }
  const drillform = document.getElementById("drill_form");
  if (drillform) {
    // 中にinputがあれば sequence = 0 なければ sequence = 1
    const input = drillform.querySelector("input");
    if (input) {
      questionSequence = 0;
      // for="answer_0_0" の label を取得
      const label = document.querySelector('label[for="answer_0_0"]');
    } else {
      console.log("drillformにinputが見つかりませんでした。");
      questionSequence = 1;
      // drillformのinnerHTMLの 正解：以降のテキストを取得
      let correctAnswer = drillform.innerHTML.match(/正解：(.*)/)[1];
      // nbspとタグを削除
      correctAnswer = correctAnswer.replaceAll(/&nbsp;/g, "");
      correctAnswer = correctAnswer.replaceAll(/<[^>]+>/g, "");
      console.log("正解:", correctAnswer);
      let Text = "";
      const qu02Element = document.getElementById("qu02");
      if (qu02Element) {
        Text = qu02Element.innerHTML;
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

      data["q" + questionNumber] = {
        Text: Text,
        Answers: [correctAnswer],
        Sound: url,
        Comment: comment,
      };
      await window.storageUtils.saveData(unitNumber, category, data);
    }
  }
  const truemsg = document.getElementById("true_msg");
  if (truemsg) {
    questionSequence = 2;
  }
  console.log("questionSequence:", questionSequence);
}

async function yobi() {
  createConsoleDiv();
  await main();
  dash();
}

yobi();
