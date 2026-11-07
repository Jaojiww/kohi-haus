(function () {
  "use strict";

  // ตรวจว่าใส่ Firebase Config แล้วหรือยัง
  if (
    !window.FIREBASE_CONFIG ||
    !window.FIREBASE_CONFIG.projectId ||
    window.FIREBASE_CONFIG.projectId.indexOf("ใส่_") === 0
  ) {
    throw new Error(
      "กรุณาใส่ Firebase Config ใน firebase-config.js ก่อน"
    );
  }

  // เริ่ม Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(window.FIREBASE_CONFIG);
  }

  // Firebase Auth
  window.auth = firebase.auth();

  // Firestore
  window.db = firebase.firestore();

  // ข้อความสถานะออเดอร์
  window.STATUS_TEXT = {
    new: "รับออเดอร์แล้ว",
    preparing: "กำลังทำ",
    ready: "ทำเสร็จแล้ว",
    closed: "ปิดออเดอร์"
  };

  // แสดงราคา
  window.baht = function (n) {
    return (
      new Intl.NumberFormat("th-TH", {
        maximumFractionDigits: 2
      }).format(Number(n) || 0) +
      " บาท"
    );
  };

  // แสดงวันที่เวลา
  window.timeText = function (ts) {
    if (!ts) {
      return "กำลังบันทึกเวลา...";
    }

    const d = ts.toDate
      ? ts.toDate()
      : new Date(ts);

    return d.toLocaleString("th-TH", {
      dateStyle: "short",
      timeStyle: "short"
    });
  };

  // ป้องกัน HTML injection
  window.esc = function (s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  };

  // วันที่ประเทศไทย YYYY-MM-DD
  window.bangkokDate = function () {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());
  };

  // เสียงแจ้งเตือน
  window.beep = function () {
    try {
      const AudioCtx =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioCtx) {
        return;
      }

      const ctx = new AudioCtx();

      const osc =
        ctx.createOscillator();

      const gain =
        ctx.createGain();

      osc.frequency.value = 880;

      gain.gain.setValueAtTime(
        0.0001,
        ctx.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.18,
        ctx.currentTime + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + 0.35
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();

      osc.stop(
        ctx.currentTime + 0.35
      );

    } catch (_) {
      // บางเบราว์เซอร์อาจบล็อกเสียง
    }
  };
})();