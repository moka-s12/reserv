/* =========================================
   ONE 面談予約システム
   script.js
========================================= */
/* =========================================
   API
========================================= */
const API_URL = "https://script.google.com/macros/s/AKfycbyMjw0fqtZdNDnlwyboXo-6gIsnOVAQcgU04yucgl9K1zofs8Y8XKXuYbrC718eGKBFkw/exec";
/* =========================================
   設定
========================================= */
const SLOT_CACHE_TTL = 45 * 1000;
const API_TIMEOUT = 30000;
const CONSULTATION_ITEMS = {
  "所属前面談": [
    "事務所について",
    "所属条件について",
    "報酬・還元率について",
    "配信の始め方・サポートについて",
    "その他"
  ],
  "イラスト作成面談": [
    "イラストの用途・種類",
    "キャラクター・デザインの希望",
    "参考画像・イメージ",
    "納期・制作の流れ",
    "修正について",
    "その他"
  ],
  "初回面談": [
    "配信について",
    "今後の目標・活動方針",
    "TikTok運用について",
    "イベント・ランクについて",
    "困っていること",
    "その他"
  ],
  "継続面談": [
    "活動状況の振り返り",
    "今後の目標・活動方針",
    "配信内容の改善",
    "TikTok運用について",
    "イベント・ランクについて",
    "困っていること",
    "その他"
  ]
};
const INTERVIEW_MINUTES = {
  "所属前面談": 15,
  "イラスト作成面談": 15,
  "初回面談": 30,
  "継続面談": 30
};
/* =========================================
   STATE
========================================= */
let selectedType = "";
let selectedDate = "";
let selectedSlot = null;
let availableSlots = [];
let completedBooking = null;
let cancelTargetBooking = null;
let cancelEntrySource = "top";
let slotCache = null;
let slotCacheAt = 0;
let slotFetchPromise = null;
// 日本時間の日付をカレンダーの基準にする。
const japanParts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p => [p.type,p.value]));
const today = new Date(Number(japanParts.year),Number(japanParts.month)-1,Number(japanParts.day));
let currentDate = new Date(
  today.getFullYear(),
  today.getMonth(),
  1
);
/* =========================================
   DOM
========================================= */
const steps =
  document.querySelectorAll(".step");
const typeCards =
  document.querySelectorAll(".type-card");
/* STEP 01 */
const openBookingManagementButton =
  document.getElementById(
    "open-booking-management"
  );
/* STEP 02 */
const selectedTypeText =
  document.getElementById(
    "selected-type-text"
  );
const calendarTitle =
  document.getElementById(
    "calendar-title"
  );
const calendarDays =
  document.getElementById(
    "calendar-days"
  );
const calendarLoading =
  document.getElementById(
    "calendar-loading"
  );
const calendarMessage =
  document.getElementById(
    "calendar-message"
  );
const prevMonthButton =
  document.getElementById(
    "prev-month"
  );
const nextMonthButton =
  document.getElementById(
    "next-month"
  );
const slotArea =
  document.getElementById(
    "slot-area"
  );
const slotDate =
  document.getElementById(
    "slot-date"
  );
const timeSlots =
  document.getElementById(
    "time-slots"
  );
const backToTypeButton =
  document.getElementById(
    "back-to-type"
  );
/* STEP 03 */
const infoType =
  document.getElementById(
    "info-type"
  );
const infoDate =
  document.getElementById(
    "info-date"
  );
const infoTime =
  document.getElementById(
    "info-time"
  );
const activityNameInput =
  document.getElementById(
    "activity-name"
  );
const tiktokIdInput =
  document.getElementById(
    "tiktok-id"
  );
const consultationOptions =
  document.getElementById(
    "consultation-options"
  );
const preMessageInput =
  document.getElementById(
    "pre-message"
  );
const preMessageCount =
  document.getElementById(
    "pre-message-count"
  );
const formError =
  document.getElementById(
    "form-error"
  );
const goConfirmButton =
  document.getElementById(
    "go-confirm"
  );
const backToDateButton =
  document.getElementById(
    "back-to-date"
  );
/* STEP 04 */
const confirmType =
  document.getElementById(
    "confirm-type"
  );
const confirmDate =
  document.getElementById(
    "confirm-date"
  );
const confirmTime =
  document.getElementById(
    "confirm-time"
  );
const confirmStaff =
  document.getElementById(
    "confirm-staff"
  );
const confirmName =
  document.getElementById(
    "confirm-name"
  );
const confirmTiktok =
  document.getElementById(
    "confirm-tiktok"
  );
const confirmConsultation =
  document.getElementById(
    "confirm-consultation"
  );
const confirmPreMessage =
  document.getElementById(
    "confirm-pre-message"
  );
const bookingError =
  document.getElementById(
    "booking-error"
  );
const submitBookingButton =
  document.getElementById(
    "submit-booking"
  );
const backToInfoButton =
  document.getElementById(
    "back-to-info"
  );
/* STEP 05 */
const completeDate =
  document.getElementById(
    "complete-date"
  );
const completeTime =
  document.getElementById(
    "complete-time"
  );
const completeType =
  document.getElementById(
    "complete-type"
  );
const completeBookingId =
  document.getElementById(
    "complete-booking-id"
  );
const completeCancelToken =
  document.getElementById(
    "complete-cancel-token"
  );
const copyBookingIdButton =
  document.getElementById(
    "copy-booking-id"
  );
const copyCancelTokenButton =
  document.getElementById(
    "copy-cancel-token"
  );
const openCancelButton =
  document.getElementById(
    "open-cancel"
  );
/* STEP 06 */
const cancelBookingIdInput =
  document.getElementById(
    "cancel-booking-id"
  );
const cancelTokenInput =
  document.getElementById(
    "cancel-token"
  );
const cancelError =
  document.getElementById(
    "cancel-error"
  );
const cancelSubmitButton =
  document.getElementById(
    "cancel-submit"
  );
const backFromCancelButton =
  document.getElementById(
    "back-from-cancel"
  );
/* STEP 07 */
const cancelConfirmId =
  document.getElementById(
    "cancel-confirm-id"
  );
const cancelConfirmDate =
  document.getElementById(
    "cancel-confirm-date"
  );
const cancelConfirmTime =
  document.getElementById(
    "cancel-confirm-time"
  );
const cancelConfirmType =
  document.getElementById(
    "cancel-confirm-type"
  );
const cancelConfirmError =
  document.getElementById(
    "cancel-confirm-error"
  );
const cancelConfirmSubmitButton =
  document.getElementById(
    "cancel-confirm-submit"
  );
const backToCancelButton =
  document.getElementById(
    "back-to-cancel"
  );
/* STEP 08 */
const cancelCompleteId =
  document.getElementById(
    "cancel-complete-id"
  );
const backToTopButton =
  document.getElementById(
    "back-to-top"
  );
/* =========================================
   STEP切り替え
========================================= */
function showStep(stepId) {
  steps.forEach((step) => {
    step.classList.remove("active");
  });
  const target =
    document.getElementById(stepId);
  if (!target) {
    return;
  }
  target.classList.add("active");
  const reduceMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
  window.scrollTo({
    top: 0,
    behavior:
      reduceMotion
        ? "auto"
        : "smooth"
  });
}
/* =========================================
   API FETCH
========================================= */
async function fetchJson(
  url,
  options = {}
) {
  const controller =
    new AbortController();
  const timeout =
    setTimeout(
      () => {
        controller.abort();
      },
      API_TIMEOUT
    );
  try {
    const response =
      await fetch(
        url,
        {
          ...options,
          signal:
            controller.signal
        }
      );
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }
    const data =
      await response.json();
    return data;
  } catch (error) {
    if (
      error.name ===
      "AbortError"
    ) {
      throw new Error(
        "通信に時間がかかっています。電波状況をご確認のうえ、もう一度お試しください。"
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
/* =========================================
   空き枠キャッシュ
========================================= */
function isSlotCacheValid() {
  if (!slotCache) {
    return false;
  }
  return (
    Date.now() -
    slotCacheAt
  ) < SLOT_CACHE_TTL;
}
function invalidateSlotCache() {
  slotCache = null;
  slotCacheAt = 0;
}
/* =========================================
   空き枠取得
========================================= */
async function fetchAvailableSlots(
  force = false
) {
  if (
    !force &&
    isSlotCacheValid()
  ) {
    availableSlots =
      slotCache;
    return availableSlots;
  }
  if (
    !force &&
    slotFetchPromise
  ) {
    return slotFetchPromise;
  }
  slotFetchPromise =
    (async () => {
      try {
        const url =
          `${API_URL}?action=slots`;
        const data =
          await fetchJson(
            url,
            {
              method: "GET"
            }
          );
        if (
          data.success === false
        ) {
          throw new Error(
            data.message ||
            "空き枠を取得できませんでした。"
          );
        }
        const slots =
          Array.isArray(data.slots)
            ? data.slots
            : [];
        availableSlots =
          slots;
        slotCache =
          slots;
        slotCacheAt =
          Date.now();
        return slots;
      } finally {
        slotFetchPromise =
          null;
      }
    })();
  return slotFetchPromise;
}
/* =========================================
   ページ表示時に先読み
========================================= */
function prefetchAvailableSlots() {
  fetchAvailableSlots()
    .catch((error) => {
      /*
        先読みなので、
        この時点ではユーザーに
        エラー表示しない。
      */
      console.warn(
        "Slot prefetch failed:",
        error
      );
    });
}
/* =========================================
   面談種類
========================================= */
typeCards.forEach(
  (card) => {
    card.addEventListener(
      "click",
      async () => {
        selectedType =
          card.dataset.type || "";
        selectedDate = "";
        selectedSlot = null;
        selectedTypeText.textContent =
          selectedType;
        currentDate =
          new Date(
            today.getFullYear(),
            today.getMonth(),
            1
          );
        slotArea.classList.remove(
          "visible"
        );
        timeSlots.innerHTML = "";
        showStep("step-date");
        await loadAvailableSlots();
      }
    );
  }
);
/* =========================================
   空き枠表示
========================================= */
async function loadAvailableSlots(
  force = false
) {
  calendarLoading.classList.remove(
    "loaded"
  );
  calendarMessage.textContent =
    "空き枠を読み込んでいます...";
  try {
    await fetchAvailableSlots(
      force
    );
    renderCalendar();
    calendarLoading.classList.add(
      "loaded"
    );
    if (
      availableSlots.length === 0
    ) {
      calendarMessage.textContent =
        "現在予約可能な面談枠はありません。";
    } else {
      calendarMessage.textContent =
        "予約可能な日付を選択してください";
    }
  } catch (error) {
    console.error(error);
    availableSlots = [];
    renderCalendar();
    calendarLoading.classList.add(
      "loaded"
    );
    calendarMessage.textContent =
      error.message ||
      "空き枠の読み込みに失敗しました。";
  }
}
/* =========================================
   カレンダー
========================================= */
function renderCalendar() {
  calendarDays.innerHTML = "";
  slotArea.classList.remove(
    "visible"
  );
  const year =
    currentDate.getFullYear();
  const month =
    currentDate.getMonth();
  calendarTitle.textContent =
    `${year}年 ${month + 1}月`;
  const firstDay =
    new Date(
      year,
      month,
      1
    ).getDay();
  const lastDate =
    new Date(
      year,
      month + 1,
      0
    ).getDate();
  for (
    let i = 0;
    i < firstDay;
    i++
  ) {
    const empty =
      document.createElement(
        "span"
      );
    empty.className =
      "calendar-day empty";
    calendarDays.appendChild(
      empty
    );
  }
  for (
    let day = 1;
    day <= lastDate;
    day++
  ) {
    const date =
      new Date(
        year,
        month,
        day
      );
    const dateKey =
      formatDateKey(date);
    const hasSlots =
      getBookableSlots().some(
        (slot) =>
          normalizeDate(
            slot.date
          ) === dateKey
      );
    const element =
      document.createElement(
        hasSlots
          ? "button"
          : "span"
      );
    element.className =
      "calendar-day";
    element.textContent =
      day;
    if (hasSlots) {
      element.type =
        "button";
      element.classList.add(
        "available"
      );
      if (
        selectedDate ===
        dateKey
      ) {
        element.classList.add(
          "selected"
        );
      }
      element.addEventListener(
        "click",
        () => {
          selectedDate =
            dateKey;
          selectedSlot =
            null;
          renderCalendar();
          renderTimeSlots(
            dateKey
          );
        }
      );
    }
    calendarDays.appendChild(
      element
    );
  }
}
/* =========================================
   日付変換
========================================= */
function formatDateKey(date) {
  const year =
    date.getFullYear();
  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );
  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );
  return (
    `${year}-${month}-${day}`
  );
}
function normalizeDate(value) {
  if (!value) {
    return "";
  }
  const text =
    String(value).trim();
  const directMatch =
    text.match(
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/
    );
  if (directMatch) {
    return (
      `${directMatch[1]}-` +
      `${String(directMatch[2]).padStart(2, "0")}-` +
      `${String(directMatch[3]).padStart(2, "0")}`
    );
  }
  const date =
    new Date(value);
  if (
    !Number.isNaN(
      date.getTime()
    )
  ) {
    return formatDateKey(
      date
    );
  }
  return text;
}
/* =========================================
   表示用日付
========================================= */
function formatDisplayDate(
  dateValue
) {
  const normalized =
    normalizeDate(
      dateValue
    );
  const parts =
    normalized.split("-");
  if (
    parts.length !== 3
  ) {
    return dateValue || "―";
  }
  const year =
    Number(parts[0]);
  const month =
    Number(parts[1]);
  const day =
    Number(parts[2]);
  const date =
    new Date(
      year,
      month - 1,
      day
    );
  const weekdays =
    [
      "日",
      "月",
      "火",
      "水",
      "木",
      "金",
      "土"
    ];
  return (
    `${year}年` +
    `${month}月` +
    `${day}日` +
    `（${weekdays[date.getDay()]}）`
  );
}
/* =========================================
   時刻整形
========================================= */
function normalizeTime(value) {
  if (!value) {
    return "";
  }
  const text =
    String(value).trim();
  const match =
    text.match(
      /(\d{1,2}):(\d{2})/
    );
  if (match) {
    return (
      `${String(match[1]).padStart(2, "0")}:` +
      `${match[2]}`
    );
  }
  return text;
}
/* =========================================
   時間枠
========================================= */
function getBookableSlots() {
  const minutes = INTERVIEW_MINUTES[selectedType];
  const toMinute = value => { const [h,m] = normalizeTime(value).split(':').map(Number); return h*60+m; };
  const valid = availableSlots.filter(s => toMinute(s.end)-toMinute(s.start) === 15 && toMinute(s.start)%15===0 && Date.parse(normalizeDate(s.date)+'T'+normalizeTime(s.start)+':00+09:00')>Date.now());
  return valid.flatMap(first => {
    if(minutes===15) return [{...first, slotIds:[first.slotId]}];
    if(minutes!==30) return [];
    const next = valid.find(s => s.slotId!==first.slotId && normalizeDate(s.date)===normalizeDate(first.date) && String(s.staff||'')===String(first.staff||'') && normalizeTime(s.start)===normalizeTime(first.end));
    return next ? [{...first,end:next.end,endTime:next.end,slotIds:[first.slotId,next.slotId]}] : [];
  });
}
function renderTimeSlots(
  dateKey
) {
  const slots =
    getBookableSlots()
      .filter(
        (slot) =>
          normalizeDate(
            slot.date
          ) === dateKey
      )
      .sort(
        (a, b) =>
          normalizeTime(
            a.start
          ).localeCompare(
            normalizeTime(
              b.start
            )
          )
      );
  slotDate.textContent =
    formatDisplayDate(
      dateKey
    );
  timeSlots.innerHTML = "";
  if (
    slots.length === 0
  ) {
    timeSlots.innerHTML =
      "<p>空き時間がありません。</p>";
    slotArea.classList.add(
      "visible"
    );
    return;
  }
  slots.forEach(
    (slot) => {
      const button =
        document.createElement(
          "button"
        );
      button.type =
        "button";
      button.className =
        "time-slot";
      button.textContent =
        `${normalizeTime(slot.start)}〜${normalizeTime(slot.end)}（${INTERVIEW_MINUTES[selectedType]}分）${slot.staff ? " / " + slot.staff : ""}`;
      button.addEventListener(
        "click",
        () => {
          selectedSlot =
            slot;
          showInfoStep();
        }
      );
      timeSlots.appendChild(
        button
      );
    }
  );
  slotArea.classList.add(
    "visible"
  );
}
/* =========================================
   カレンダー月移動
========================================= */
prevMonthButton.addEventListener(
  "click",
  () => {
    currentDate =
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      );
    renderCalendar();
  }
);
nextMonthButton.addEventListener(
  "click",
  () => {
    currentDate =
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      );
    renderCalendar();
  }
);
/* =========================================
   STEP03表示
========================================= */
function showInfoStep() {
  if (!selectedSlot) {
    return;
  }
  infoType.textContent =
    selectedType;
  infoDate.textContent =
    formatDisplayDate(
      selectedSlot.date
    );
  infoTime.textContent =
    `${normalizeTime(selectedSlot.start)}〜${normalizeTime(selectedSlot.end)}`;
  renderConsultationOptions();
  formError.textContent =
    "";
  showStep(
    "step-info"
  );
}
/* =========================================
   相談内容
========================================= */
function renderConsultationOptions() {
  consultationOptions.innerHTML =
    "";
  const items =
    CONSULTATION_ITEMS[
      selectedType
    ] || [];
  items.forEach(
    (item, index) => {
      const label =
        document.createElement(
          "label"
        );
      label.className =
        "consultation-option";
      const input =
        document.createElement(
          "input"
        );
      input.type =
        "checkbox";
      input.name =
        "consultation";
      input.value =
        item;
      input.id =
        `consultation-${index}`;
      const content =
        document.createElement(
          "span"
        );
      content.className =
        "consultation-option-content";
      const check =
        document.createElement(
          "span"
        );
      check.className =
        "consultation-check";
      const text =
        document.createElement(
          "span"
        );
      text.className =
        "consultation-option-text";
      text.textContent =
        item;
      content.appendChild(
        check
      );
      content.appendChild(
        text
      );
      label.appendChild(
        input
      );
      label.appendChild(
        content
      );
      consultationOptions.appendChild(
        label
      );
    }
  );
}
/* =========================================
   選択された相談内容
========================================= */
function getSelectedConsultations() {
  return Array.from(
    document.querySelectorAll(
      'input[name="consultation"]:checked'
    )
  ).map(
    (input) =>
      input.value
  );
}
/* =========================================
   文字数カウント
========================================= */
preMessageInput.addEventListener(
  "input",
  () => {
    preMessageCount.textContent =
      preMessageInput.value.length;
  }
);
/* =========================================
   STEP03 → STEP04
========================================= */
goConfirmButton.addEventListener(
  "click",
  () => {
    formError.textContent =
      "";
    const activityName =
      activityNameInput.value.trim();
    const tiktokId =
      normalizeTikTokId(
        tiktokIdInput.value
      );
    const consultations =
      getSelectedConsultations();
    const preMessage =
      preMessageInput.value.trim();
    if (!activityName) {
      formError.textContent =
        "活動名を入力してください。";
      activityNameInput.focus();
      return;
    }
    if (!tiktokId) {
      formError.textContent =
        "TikTok IDを入力してください。";
      tiktokIdInput.focus();
      return;
    }
    if (
      consultations.length === 0
    ) {
      formError.textContent =
        "相談したいことを1つ以上選択してください。";
      consultationOptions.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      return;
    }
    confirmType.textContent =
      selectedType;
    confirmDate.textContent =
      formatDisplayDate(
        selectedSlot.date
      );
    confirmTime.textContent =
      `${normalizeTime(selectedSlot.start)}〜${normalizeTime(selectedSlot.end)}`;
    confirmStaff.textContent =
      selectedSlot.staff ||
      "ONE運営";
    confirmName.textContent =
      activityName;
    confirmTiktok.textContent =
      `@${tiktokId}`;
    confirmConsultation.textContent =
      consultations.join("、");
    confirmPreMessage.textContent =
      preMessage ||
      "なし";
    bookingError.textContent =
      "";
    showStep(
      "step-confirm"
    );
  }
);
/* =========================================
   TikTok ID整形
========================================= */
function normalizeTikTokId(value) {
  return String(
    value || ""
  )
    .trim()
    .replace(
      /^@+/,
      ""
    );
}
/* =========================================
   予約確定
========================================= */
submitBookingButton.addEventListener(
  "click",
  async () => {
    if (!selectedSlot) {
      return;
    }
    bookingError.textContent =
      "";
    const activityName =
      activityNameInput.value.trim();
    const tiktokId =
      normalizeTikTokId(
        tiktokIdInput.value
      );
    const consultations =
      getSelectedConsultations();
    const preMessage =
      preMessageInput.value.trim();
    if (
      !activityName ||
      !tiktokId ||
      consultations.length === 0
    ) {
      bookingError.textContent =
        "入力内容をもう一度ご確認ください。";
      return;
    }
    submitBookingButton.disabled =
      true;
    showStep(
      "step-loading"
    );
    try {
      const bookingData = {
        action:
          "createBooking",
        slotId:
          selectedSlot.slotId,
        interviewType:
          selectedType,
        activityName:
          activityName,
        tiktokId:
          tiktokId,
        consultationTopics:
          consultations,
        preMessage:
          preMessage
      };
      bookingData.requestId = getRequestId(bookingData);
      const response =
        await fetchJson(
          API_URL,
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "text/plain;charset=utf-8"
            },
            body:
              JSON.stringify(
                bookingData
              )
          }
        );
      if (
        !response.success
      ) {
        throw new Error(
          response.message ||
          "予約に失敗しました。"
        );
      }
      completedBooking =
        response.booking ||
        response.data ||
        response;
      invalidateSlotCache();
      displayBookingComplete(
        completedBooking
      );
      /*
        次の操作に備えて
        バックグラウンドで
        最新の空き枠を再取得
      */
      fetchAvailableSlots(true)
        .catch(() => {});
    } catch (error) {
      console.error(error);
      invalidateSlotCache();
      /*
        枠が他の方に予約された可能性も
        あるため最新状態を取得
      */
      fetchAvailableSlots(true)
        .catch(() => {});
      bookingError.textContent =
        error.message ||
        "予約に失敗しました。もう一度お試しください。";
      showStep(
        "step-confirm"
      );
    } finally {
      submitBookingButton.disabled =
        false;
    }
  }
);
/* =========================================
   予約完了表示
========================================= */
function getRequestId(data) {
  const signature = JSON.stringify(data);
  const stored = sessionStorage.getItem('one-pending-booking');
  if(stored) { try { const old = JSON.parse(stored); if(old.signature===signature) return old.id; } catch {} }
  const id = crypto.randomUUID();
  sessionStorage.setItem('one-pending-booking',JSON.stringify({signature,id}));
  return id;
}
function displayBookingComplete(
  booking
) {
  const date =
    booking.date ||
    booking.interviewDate ||
    selectedSlot?.date ||
    "";
  const start =
    booking.start ||
    booking.startTime ||
    selectedSlot?.start ||
    "";
  const end =
    booking.end ||
    booking.endTime ||
    selectedSlot?.end ||
    "";
  const type =
    booking.interviewType ||
    selectedType;
  const bookingId =
    booking.bookingId ||
    booking.id ||
    "";
  const cancelToken =
    booking.cancelToken ||
    booking.cancellationToken ||
    booking.token ||
    "";
  completeDate.textContent =
    formatDisplayDate(
      date
    );
  completeTime.textContent =
    `${normalizeTime(start)}〜${normalizeTime(end)}`;
  completeType.textContent =
    type;
  completeBookingId.textContent =
    bookingId;
  completeCancelToken.textContent =
    cancelToken;
  showStep(
    "step-complete"
  );
}
/* =========================================
   コピー
========================================= */
async function copyText(
  text,
  button
) {
  if (!text) {
    return;
  }
  try {
    await navigator.clipboard.writeText(
      text
    );
    const original =
      button.textContent;
    button.textContent =
      "COPIED";
    setTimeout(
      () => {
        button.textContent =
          original;
      },
      1200
    );
  } catch (error) {
    /*
      clipboard APIが使えない
      ブラウザ用のフォールバック
    */
    const textarea =
      document.createElement(
        "textarea"
      );
    textarea.value =
      text;
    textarea.style.position =
      "fixed";
    textarea.style.opacity =
      "0";
    document.body.appendChild(
      textarea
    );
    textarea.select();
    document.execCommand(
      "copy"
    );
    textarea.remove();
    const original =
      button.textContent;
    button.textContent =
      "COPIED";
    setTimeout(
      () => {
        button.textContent =
          original;
      },
      1200
    );
  }
}
copyBookingIdButton.addEventListener(
  "click",
  () => {
    copyText(
      completeBookingId.textContent.trim(),
      copyBookingIdButton
    );
  }
);
copyCancelTokenButton.addEventListener(
  "click",
  () => {
    copyText(
      completeCancelToken.textContent.trim(),
      copyCancelTokenButton
    );
  }
);
/* =========================================
   予約済みの方
========================================= */
openBookingManagementButton.addEventListener(
  "click",
  () => {
    cancelEntrySource =
      "top";
    cancelBookingIdInput.value =
      "";
    cancelTokenInput.value =
      "";
    cancelError.textContent =
      "";
    showStep(
      "step-cancel"
    );
  }
);
/* =========================================
   予約完了 → キャンセル
========================================= */
openCancelButton.addEventListener(
  "click",
  () => {
    cancelEntrySource =
      "complete";
    cancelError.textContent =
      "";
    if (completedBooking) {
      cancelBookingIdInput.value =
        completedBooking.bookingId ||
        completedBooking.id ||
        completeBookingId.textContent.trim();
      cancelTokenInput.value =
        completedBooking.cancelToken ||
        completedBooking.cancellationToken ||
        completedBooking.token ||
        completeCancelToken.textContent.trim();
    }
    showStep(
      "step-cancel"
    );
  }
);
/* =========================================
   予約情報取得
========================================= */
cancelSubmitButton.addEventListener(
  "click",
  async () => {
    cancelError.textContent =
      "";
    const bookingId =
      cancelBookingIdInput.value
        .trim()
        .toUpperCase();
    const cancelToken =
      cancelTokenInput.value
        .trim()
        .toUpperCase();
    if (!bookingId) {
      cancelError.textContent =
        "予約番号を入力してください。";
      cancelBookingIdInput.focus();
      return;
    }
    if (!cancelToken) {
      cancelError.textContent =
        "キャンセルコードを入力してください。";
      cancelTokenInput.focus();
      return;
    }
    cancelSubmitButton.disabled =
      true;
    try {
      const response = await fetchJson(API_URL, {method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'getBooking',bookingId,cancelToken})});
      if (
        !response.success
      ) {
        throw new Error(
          response.message ||
          "予約情報を確認できませんでした。"
        );
      }
      cancelTargetBooking =
        response.booking ||
        response.data ||
        response;
      displayCancelConfirmation(
        cancelTargetBooking,
        bookingId
      );
    } catch (error) {
      console.error(error);
      cancelError.textContent =
        error.message ||
        "予約情報を確認できませんでした。";
    } finally {
      cancelSubmitButton.disabled =
        false;
    }
  }
);
/* =========================================
   キャンセル確認表示
========================================= */
function displayCancelConfirmation(
  booking,
  fallbackBookingId = ""
) {
  const bookingId =
    booking.bookingId ||
    booking.id ||
    fallbackBookingId;
  const date =
    booking.date ||
    booking.interviewDate ||
    "";
  const start =
    booking.start ||
    booking.startTime ||
    "";
  const end =
    booking.end ||
    booking.endTime ||
    "";
  const type =
    booking.interviewType ||
    booking.type ||
    "―";
  cancelConfirmId.textContent =
    bookingId;
  cancelConfirmDate.textContent =
    formatDisplayDate(
      date
    );
  cancelConfirmTime.textContent =
    `${normalizeTime(start)}〜${normalizeTime(end)}`;
  cancelConfirmType.textContent =
    type;
  document.getElementById('manage-name').textContent = booking.activityName || '―';
  document.getElementById('manage-tiktok').textContent = booking.tiktokId || '―';
  document.getElementById('manage-staff').textContent = booking.staff || '―';
  document.getElementById('manage-topics').textContent = booking.consultationText || (booking.consultationTopics||[]).join(' / ') || '―';
  document.getElementById('manage-message').textContent = booking.preMessage || 'なし';
  cancelConfirmSubmitButton.disabled = booking.status === 'キャンセル';
  cancelConfirmError.textContent = booking.status === 'キャンセル' ? 'この予約はキャンセル済みです。' : '';
  showStep(
    "step-cancel-confirm"
  );
}
/* =========================================
   キャンセル確定
========================================= */
cancelConfirmSubmitButton.addEventListener(
  "click",
  async () => {
    cancelConfirmError.textContent =
      "";
    const bookingId =
      cancelBookingIdInput.value
        .trim()
        .toUpperCase();
    const cancelToken =
      cancelTokenInput.value
        .trim()
        .toUpperCase();
    if (
      !bookingId ||
      !cancelToken
    ) {
      cancelConfirmError.textContent =
        "予約情報が確認できません。";
      return;
    }
    cancelConfirmSubmitButton.disabled =
      true;
    showStep(
      "step-cancel-loading"
    );
    try {
      const response =
        await fetchJson(
          API_URL,
          {
            method:
              "POST",
            headers: {
              "Content-Type":
                "text/plain;charset=utf-8"
            },
            body:
              JSON.stringify({
                action:
                  "cancelBooking",
                bookingId:
                  bookingId,
                cancelToken:
                  cancelToken
              })
          }
        );
      if (
        !response.success
      ) {
        throw new Error(
          response.message ||
          "キャンセルに失敗しました。"
        );
      }
      invalidateSlotCache();
      cancelCompleteId.textContent =
        bookingId;
      showStep(
        "step-cancel-complete"
      );
      /*
        キャンセルした枠が
        空き枠へ戻るので再取得
      */
      fetchAvailableSlots(true)
        .catch(() => {});
    } catch (error) {
      console.error(error);
      cancelConfirmError.textContent =
        error.message ||
        "キャンセルに失敗しました。";
      showStep(
        "step-cancel-confirm"
      );
    } finally {
      cancelConfirmSubmitButton.disabled =
        false;
    }
  }
);
/* =========================================
   BACK BUTTONS
========================================= */
backToTypeButton.addEventListener(
  "click",
  () => {
    showStep(
      "step-type"
    );
  }
);
backToDateButton.addEventListener(
  "click",
  () => {
    showStep(
      "step-date"
    );
  }
);
backToInfoButton.addEventListener(
  "click",
  () => {
    showStep(
      "step-info"
    );
  }
);
backFromCancelButton.addEventListener(
  "click",
  () => {
    if (
      cancelEntrySource ===
      "complete"
    ) {
      showStep(
        "step-complete"
      );
    } else {
      showStep(
        "step-type"
      );
    }
  }
);
backToCancelButton.addEventListener(
  "click",
  () => {
    showStep(
      "step-cancel"
    );
  }
);
/* =========================================
   TOPへ戻る
========================================= */
document.getElementById('complete-back-to-top').addEventListener('click', () => {
  resetBookingFlow();
  showStep('step-type');
});
backToTopButton.addEventListener(
  "click",
  () => {
    resetBookingFlow();
    showStep(
      "step-type"
    );
  }
);
/* =========================================
   RESET
========================================= */
function resetBookingFlow() {
  sessionStorage.removeItem('one-pending-booking');
  selectedType = "";
  selectedDate = "";
  selectedSlot = null;
  completedBooking = null;
  cancelTargetBooking = null;
  cancelEntrySource =
    "top";
  currentDate =
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
  selectedTypeText.textContent =
    "";
  slotArea.classList.remove(
    "visible"
  );
  timeSlots.innerHTML =
    "";
  activityNameInput.value =
    "";
  tiktokIdInput.value =
    "";
  consultationOptions.innerHTML =
    "";
  preMessageInput.value =
    "";
  preMessageCount.textContent =
    "0";
  formError.textContent =
    "";
  bookingError.textContent =
    "";
  cancelError.textContent =
    "";
  cancelConfirmError.textContent =
    "";
  cancelBookingIdInput.value =
    "";
  cancelTokenInput.value =
    "";
  cancelCompleteId.textContent =
    "―";
}
/* =========================================
   初期化
========================================= */
function initialize() {
  /*
    画面表示直後から
    空き枠を裏で先読みする。
  */
  prefetchAvailableSlots();
}
initialize();
