// storageUtils.js

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
  try {
    data = JSON.stringify(data);
    await chrome.storage.local.set({ [key]: data });
    // console.log("Data saved successfully as", key);
  } catch (error) {
    console.error("Error saving data:", error.message);
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
    const result = await chrome.storage.local.get(key);
    if (chrome.runtime.lastError) {
      // In MV3, chrome.runtime.lastError is not set for storage.local.get failures.
      // Instead, the promise will reject. This check is more for MV2 or other APIs.
      console.error("Error loading data:", chrome.runtime.lastError.message);
      return undefined;
    }
    // console.log("Data loaded successfully for", key, result[key]);
    return result[key]; // result is an object like { 'key': value }, so return result[key]
  } catch (error) {
    console.error("Error loading data:", error.message);
    return undefined;
  }
}
