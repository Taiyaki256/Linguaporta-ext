// storageUtils.js

// GASのAPIエンドポイント
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxj9TcZSvpMgSg798M7vyVvh7-64zNgecmyRwOasqYVzzWiXsMRMx6jUcuTBbadnecc/exec';

// データの有効期限（ミリ秒）
const DATA_EXPIRY = 20 * 60 * 1000; // 20分

/**
 * ローカルストレージのデータが有効かどうかをチェックします
 * @param {Object} data - チェックするデータ
 * @returns {boolean} データが有効な場合はtrue
 */
function isLocalDataValid(data) {
  if (!data || !data.timestamp) return false;
  const now = Date.now();
  return (now - data.timestamp) < DATA_EXPIRY;
}

/**
 * データをローカルストレージに保存します
 * @param {string} key - 保存するキー
 * @param {any} data - 保存するデータ
 */
async function saveToLocal(key, data) {
  try {
    await chrome.storage.local.set({ [key]: JSON.stringify(data) });
  } catch (error) {
    console.error("ローカルストレージへの保存エラー:", error.message);
    throw error;
  }
}

/**
 * データをGASに保存します
 * @param {string} unit - ユニット名
 * @param {string} category - カテゴリ名
 * @param {any} data - 保存するデータ
 */
async function saveToGAS(unit, category, data) {
  try {
    const response = await fetch(
      `${GAS_API_URL}?action=save&unitNumber=${unit}&category=${category}&data=${encodeURIComponent(JSON.stringify(data))}`
    );
    const result = await response.json();
    if (!result.success) {
      throw new Error('GASへの保存に失敗しました');
    }
  } catch (error) {
    console.error("GASへの保存エラー:", error.message);
    throw error;
  }
}

/**
 * 指定されたunitとcategoryでデータを保存します。
 * @param {string} unit - ユニット名
 * @param {string} category - カテゴリ名
 * @param {any} data - 保存するデータ
 * @returns {Promise<void>} 保存が完了したら解決されるPromise
 */
async function saveData(unit, category, data) {
  if (!unit || !category) {
    return Promise.reject(new Error("Unit and category are required."));
  }

  const key = `${unit}/${category}/data.json`;
  const dataWithTimestamp = {
    ...data,
    timestamp: Date.now()
  };

  try {
    // ローカルストレージに保存
    await saveToLocal(key, dataWithTimestamp);

    // データが有効な場合のみGASに保存
    if (isLocalDataValid(dataWithTimestamp)) {
      await saveToGAS(unit, category, dataWithTimestamp);
    }
  } catch (error) {
    console.error("データの保存中にエラーが発生しました:", error.message);
    return Promise.reject(error);
  }
}

/**
 * 指定されたunitとcategoryのデータを取得します。
 * @param {string} unit - ユニット名
 * @param {string} category - カテゴリ名
 * @returns {Promise<any>} 取得したデータ、またはデータが存在しない場合はundefined
 */
async function loadData(unit, category) {
  if (!unit || !category) {
    return Promise.reject(new Error("Unit and category are required."));
  }

  const key = `${unit}/${category}/data.json`;

  try {
    // まずローカルストレージから取得を試みる
    console.log("ローカルストレージからデータを取得します");
    const localResult = await chrome.storage.local.get(key);
    let data = localResult[key] ? JSON.parse(localResult[key]) : null;

    // ローカルデータが無効な場合、GASから取得を試みる
    if (!isLocalDataValid(data)) {
      console.log("ローカルデータが無効なのでGASからデータを取得します");
      const response = await fetch(
        `${GAS_API_URL}?action=get&unitNumber=${unit}&category=${category}`
      );
      const gasData = await response.json();
      console.log(response);
      
      if (gasData) {
        console.log("GASからデータを取得しました");
        console.log(gasData);
        data = gasData;
        // GASから取得したデータをローカルストレージに保存（タイムスタンプ付き）
        await saveToLocal(key, {
          ...data,
          timestamp: Date.now()
        });
      }
    }

    return data;
  } catch (error) {
    console.error("データの取得中にエラーが発生しました:", error.message);
    return undefined;
  }
}

// グローバルオブジェクトに公開
window.storageUtils = {
  saveData,
  loadData
};
