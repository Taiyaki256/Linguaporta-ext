const background = () => {
    // 拡張機能の初期化処理
    console.log("拡張機能が起動しました");

    // メッセージリスナーの設定
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "performAction") {
            // ここで必要な処理を実行
            console.log("アクションを実行中:", request.data);
            sendResponse({ status: "success" });
        }
    });
};

// 拡張機能のライフサイクル管理
background();