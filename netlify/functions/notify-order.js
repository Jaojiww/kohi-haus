
import admin from "firebase-admin";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const SERVICE_ACCOUNT_JSON = process.env.FIREBASE_SERVICE_ACCOUNT;
const ALLOWED_ORIGIN = "https://peppy-boba-036bc7.netlify.app";

function jsonResponse(data, status = 200, origin = ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Vary": "Origin"
    }
  });
}

function initializeFirebase() {
  if (admin.apps.length) return;

  if (!PROJECT_ID || !SERVICE_ACCOUNT_JSON) {
    throw new Error("Firebase environment variables are missing");
  }

  const serviceAccount = JSON.parse(SERVICE_ACCOUNT_JSON);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: PROJECT_ID
  });
}

export default async (req) => {
  const origin = req.headers.get("origin") || "";

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Vary": "Origin"
      }
    });
  }

  if (origin !== ALLOWED_ORIGIN) {
    return jsonResponse({ error: "Origin not allowed" }, 403);
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    initializeFirebase();

    const authorization = req.headers.get("authorization") || "";
    const match = authorization.match(/^Bearer (.+)$/);

    if (!match) {
      return jsonResponse({ error: "Missing authentication" }, 401);
    }

    const decoded = await admin.auth().verifyIdToken(match[1]);
    const body = await req.json();
    const orderId = body.orderId;

    if (typeof orderId !== "string" || !orderId.trim()) {
      return jsonResponse({ error: "Missing orderId" }, 400);
    }

    const db = admin.firestore();
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnapshot = await orderRef.get();

    if (!orderSnapshot.exists) {
      return jsonResponse({ error: "Order not found" }, 404);
    }

    const order = orderSnapshot.data();

    if (order.customerUid !== decoded.uid) {
      return jsonResponse({ error: "Not your order" }, 403);
    }

    if (order.status !== "new") {
      return jsonResponse({ error: "Order is not new" }, 400);
    }

    const devices = await db.collection("shopDevices").get();
    const tokens = [
      ...new Set(
        devices.docs
          .map((doc) => doc.data().token)
          .filter((token) => typeof token === "string" && token.length > 0)
      )
    ];

    if (tokens.length === 0) {
      return jsonResponse({ error: "No shop device tokens found" }, 404);
    }

    const message = {
      tokens,
      data: {
        title: "🔔 มีออเดอร์ใหม่!",
        body: `ออเดอร์ ${String(order.orderNumber || orderId)} ยอด ${String(order.total ?? 0)} บาท`,
        url: "/shop.html"
      },
      webpush: {
        headers: {
          Urgency: "high"
        }
      }
    };

    const result = await admin.messaging().sendEachForMulticast(message);

    return jsonResponse({
      success: result.successCount > 0,
      sent: result.successCount,
      failed: result.failureCount
    });
  } catch (error) {
    console.error("notify-order error:", error);
    return jsonResponse({
      error: "Notification failed",
      code: error.code || "internal"
    }, 500);
  }
};
