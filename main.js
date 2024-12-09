const RECENT_DAYS = 90; // 最近幾天內的甄試歷程不會被顯示
const url = "https://api.airtable.com/v0/appY6JshgsUQDvyJF/blacklist";
const apiKey = GM_getValue("API_KEY"); // 替換為你的 API 密鑰

const userName =
  document.querySelector('[data-qa-id="UserName"]').innerHTML || "未知使用者";

fetch(url, {
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
})
  .then((response) => response.json())
  .then((result) => {
    const codeList = result.records.map((record) => record.fields.Code);
    document.querySelectorAll(".resume-card").forEach((resumeCard) => {
      // 抓取姓名
      const name = resumeCard.querySelector(".name").textContent.trim();

      // 抓取使用者代碼
      const code = resumeCard
        .querySelector(".code")
        .textContent.split("：")[1]
        .trim();

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
        // 創建新的按鈕
        const newButton = document.createElement("button");
        newButton.className =
          "btn btn-danger btn--md btn--wide btn--wide--icon btn--icon";
        newButton.style =
          "letter-spacing: 32px; text-indent: 32px; padding: 6px !important";
        newButton.innerHTML = `
              <i style="font-size:16px;" class="vip-icon-custom"></i>
              <span style="margin-left: -32px; margin-right: -32px;">封鎖</span>
            `;

        newButton.addEventListener("click", () => {
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
            });
        });

        // 找到「儲存」按鈕
        const saveButton = buttonContainer.querySelector("button:nth-child(2)");

        // 在「儲存」按鈕之後插入新按鈕
        buttonContainer.insertBefore(newButton, saveButton);
      });
    });
  });
