
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyAaqxo1kSnMBCN1rfqKLp_svZIqkvZSPRI",
  authDomain: "qr-orders-b2749.firebaseapp.com",
  projectId: "qr-orders-b2749",
  storageBucket: "qr-orders-b2749.firebasestorage.app",
  messagingSenderId: "571408703927",
  appId: "1:571408703927:web:44c7a3d74f7b1458b18832",
  measurementId: "G-Q2YLL7B3TJ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title =
    payload.data?.title ||
    payload.notification?.title ||
    "มีออเดอร์ใหม่!";

  const options = {
    body:
      payload.data?.body ||
      payload.notification?.body ||
      "ร้านของคุณได้รับออเดอร์ใหม่",
    icon: "/icon-192.png",
    data: payload.data || {}
  };

  self.registration.showNotification(title, options);
});
