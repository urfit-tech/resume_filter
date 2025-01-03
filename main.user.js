// ==UserScript==
// @name        resume_filter
// @namespace   vip104
// @version     0.0.7
// @description filter resume by blacklist
// @author      kk
// @match       https://vip.104.com.tw/search/searchResult*
// @grant       GM_getValue
// ==/UserScript==

const url = "https://api.airtable.com/v0/appY6JshgsUQDvyJF/blacklist";
const RECENT_DAYS = Number(GM_getValue("RECENT_DAYS")) || 90; // 最近幾天內的甄試歷程不會被顯示
const apiKey = GM_getValue("API_KEY"); // 替換為你的 API 密鑰

const processedCodeList = [];

(function () {
  "use strict";

  showLoadingOverlay();

  setTimeout(() => {
    const userName =
      document.querySelector('[data-qa-id="UserName"]').innerHTML ||
      "未知使用者";

    fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((result) => {
        hideLoadingOverlay();
        const codeList = result.records.map((record) => record.fields.Code);
        setInterval(() => {
          filterResume(userName, codeList);
        }, 3000);
      });
  }, 3000);
})();

function filterResume(userName, codeList) {
  document.querySelectorAll(".resume-card").forEach((resumeCard) => {
    // 抓取姓名
    const name = resumeCard.querySelector(".name").textContent.trim();

    // 抓取使用者代碼
    const code = resumeCard
      .querySelector(".code")
      .textContent.split("：")[1]
      .trim();

    if (processedCodeList.includes(code)) return;
    else processedCodeList.push(code);

    // 抓取居住地
    const residence = resumeCard
      .querySelector('.info-item[data-qa-id="cardResidence"] span')
      .textContent.split(" : ")[1]
      .trim();

    // 抓取最近一次甄試歷程的時間
    const historyItems = resumeCard.querySelectorAll(
      ".history-list__collapse .list-txt"
    );
    const latestHistory = historyItems[0]?.textContent.trim().split(" ")[0];

    const recentDays = Math.round(
      (new Date() - new Date(latestHistory)) / (1000 * 60 * 60 * 24)
    );

    if (codeList.includes(code) || recentDays < RECENT_DAYS) {
      resumeCard.remove();
      return;
    }

    resumeCard.querySelectorAll(".combo-btns").forEach((buttonContainer) => {
      // 找到「儲存」按鈕
      const saveButton = buttonContainer.querySelector("button:nth-child(2)");

      // 創建新的按鈕
      const blockButton = saveButton.cloneNode(true);
      blockButton.className =
        "btn btn-danger btn--md btn--wide btn--wide--icon btn--icon";
      blockButton.querySelector("i").className = "vip-icon-delete";
      blockButton.querySelector("span").textContent = "封鎖";

      blockButton.addEventListener("click", () => {
        const data = {
          records: [
            {
              fields: {
                Name: name,
                Code: code,
                ReportedBy: userName,
                ReportedAt: new Date().toISOString(),
              },
            },
          ],
        };

        showLoadingOverlay();
        fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((result) => {
            resumeCard.remove();
            alert("封鎖成功");
          })
          .catch((error) => {
            console.error("Error:", error);
            alert("封鎖失敗: " + error);
          })
          .finally(() => {
            hideLoadingOverlay();
          });
      });

      // 在「儲存」按鈕之後插入新按鈕
      buttonContainer.insertBefore(blockButton, saveButton);
    });
  });
}

// 創建 overlay 和 loading 元素
function createLoadingOverlay() {
  // 創建 overlay 容器
  const overlay = document.createElement("div");
  overlay.id = "loading-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)"; // 半透明背景
  overlay.style.zIndex = "9999"; // 保證覆蓋最上層
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.fontSize = "1.5rem";
  overlay.style.color = "#fff";
  overlay.style.fontFamily = "Arial, sans-serif";

  // 創建 loading 文本
  const loadingText = document.createElement("div");
  loadingText.textContent = "Loading...";
  loadingText.style.animation = "fade 1s infinite"; // 添加簡單動畫

  // 可選：添加動畫樣式
  const style = document.createElement("style");
  style.textContent = `
      @keyframes fade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
      }
  `;
  document.head.appendChild(style);

  // 將文本添加到 overlay
  overlay.appendChild(loadingText);

  // 添加到頁面
  document.body.appendChild(overlay);
}

// 顯示 overlay
function showLoadingOverlay() {
  const overlay = document.getElementById("loading-overlay");
  if (!overlay) {
    createLoadingOverlay();
  } else {
    overlay.style.display = "flex"; // 顯示 overlay
  }
}

// 隱藏 overlay
function hideLoadingOverlay() {
  const overlay = document.getElementById("loading-overlay");
  if (overlay) {
    overlay.style.display = "none"; // 隱藏 overlay
  }
}
