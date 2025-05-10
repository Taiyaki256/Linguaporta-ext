// ウェブサイトに埋め込むボタンを作成する関数
function createInPageButton(text, id, actionValue) {
  const button = document.createElement("button");
  button.textContent = text;
  button.id = id;
  // ボタンのスタイルを調整 相対位置
  button.style.position = "relative";
  button.style.zIndex = "10000"; // 他の要素より手前に表示
  button.style.padding = "10px";
  button.style.border = "1px solid #ccc";
  button.style.backgroundColor = "#f9f9f9";
  button.style.cursor = "pointer";

  button.addEventListener("click", (event) => {
    event.stopImmediatePropagation(); // 他のリスナーが実行されるのを防ぐ

    let payload = "action=" + actionValue;

    if (actionValue == "check") {
      console.log("checkボタンがクリックされました。");
      payload += "&check_time=" + (Math.floor(Date.now() / 1000) - 10);
      // "answer[0]" というキー名でペイロードに追加します。
      // サーバー側が期待する形式に合わせて調整が必要な場合があります。
      // 例: payload.answer = ["a"];
      payload += "&answer[0]=a";
    }

    // 現在のページのURLにPOSTリクエストを送信します。
    // 必要に応じて、特定のAPIエンドポイントURLに変更してください。
    const postUrl = window.location.href;

    fetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded", // JSONではなく、フォームデータとして指定
        // 必要に応じて他のヘッダー（CSRFトークンなど）を追加
      },
      body: payload, // payload は既にURLエンコードされた文字列
    })
      .then((response) => {
        if (response.ok) {
          console.log("Payload sent successfully.");
          // POSTリクエスト成功後、ページをリロードして変更を反映させるか、
          // サーバーからのレスポンスに基づいて次のアクションを決定します。
          // ここでは例としてページをリロードします。
          //   window.location.reload();
          // 例: サーバーが更新されたコンテンツをHTMLとして返す場合
          return response.text().then((html) => {
            // ドキュメント全体のHTMLを置き換える
            document.documentElement.innerHTML = html;
            dash(); // 再度 dash() を呼び出してボタンを再追加
            console.log("ページが更新されました。");
          });
        } else {
          console.error(
            "Failed to send payload. Status:",
            response.status,
            response.statusText
          );
          // エラーレスポンスを処理
          return response.text().then((text) => {
            throw new Error(text || response.statusText);
          });
        }
      })
      .catch((error) => {
        console.error("Error sending payload:", error);
        // ネットワークエラーなどを処理
      });
  });

  return button;
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
    // ボタンのスタイルを調整 (例: 固定表示ではなく、question_area内の配置に依存)
    problemArea.appendChild(inPageCheckButton);
    // 「Answer」ボタンを作成してページに追加
    const inPageAnswerButton = createInPageButton(
      "Answer",
      "inPageAnswerButton",
      "answer"
    );
    // ボタンのスタイルを調整 (例: 固定表示ではなく、question_area内の配置に依存)
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

dash();
