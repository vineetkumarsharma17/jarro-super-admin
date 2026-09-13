# 📢 JARRo Push Notification Matrix & Audit Report

This document defines all push notification events, specifications, triggers, target roles, rich media attachments, dynamic action buttons, and deep-link routing for **Admin** and **Waiter** applications.

---

## 🎯 Push Notification Matrix

### 1. Restaurant Admin Notifications

| Event ID | Event Trigger | Recipient Role | Notification Title | Message Body | Image / Attachment | Dynamic Action Buttons | Deep Link Target | Sound |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ADMIN_NEW_ORDER` | Customer/Waiter places a new order | `admin` | 🚨 **New Order Alert #{orderNumber}** | Table {tableNumber} • ₹{grandTotal} ({itemCount} items) | ❌ | `["ACCEPT", "DECLINE"]` | `/orders` | `order_chime` |
| `ADMIN_PAYMENT_VERIFY` | Customer submits digital payment / UPI proof | `admin` | 💳 **Payment Verification Required** | Table {tableNumber} • ₹{amount} submitted via {paymentMethod} | 🖼️ Payment Screenshot | `["VERIFY_PAYMENT", "REJECT"]` | `/tables` | `order_chime` |
| `ADMIN_LOW_INVENTORY` | Item stock falls below threshold | `admin` | ⚠️ **Low Inventory Warning** | {itemName} stock is down to {stockCount} {unit} | ❌ | `["UPDATE_STOCK"]` | `/menu` | `default` |
| `ADMIN_DAILY_SUMMARY` | End-of-day revenue summary | `admin` | 📊 **Daily Sales Report** | Total Revenue: ₹{totalRevenue} across {totalOrders} orders | 📊 Summary Chart | `["VIEW_ANALYTICS"]` | `/AdminDashboardScreen` | `default` |
| `ADMIN_SYSTEM_NOTICE` | Platform alert / Broadcast from Super Admin | `admin` | 📢 **{customTitle}** | {customBody} | 🖼️ Optional Banner | Custom Actions | `{screen}` | `default` |

---

### 2. Waiter & Staff Notifications

| Event ID | Event Trigger | Recipient Role | Notification Title | Message Body | Image / Attachment | Dynamic Action Buttons | Deep Link Target | Sound |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `WAITER_NEW_ORDER` | Customer places digital QR order at Table {tableNumber} | `waiter` | 🔔 **New Table Order #{orderNumber}** | Table {tableNumber} • {itemCount} items placed | ❌ | `["VIEW_ORDER"]` | `/orders` | `order_chime` |
| `WAITER_KITCHEN_READY` | Kitchen marks order status as `ready` | `waiter` | 👨‍🍳 **Order Ready to Serve #{orderNumber}** | Table {tableNumber} is ready for pickup! | ❌ | `["SERVED"]` | `/orders` | `order_chime` |
| `WAITER_CALL_WAITER` | Customer taps "Call Waiter" button on digital menu | `waiter` | 🙋‍♂️ **Customer Assistance Required** | Table {tableNumber} is requesting assistance | ❌ | `["ACKNOWLEDGE"]` | `/tables` | `order_chime` |
| `WAITER_BILL_REQUEST` | Customer requests final bill at table | `waiter` | 🧾 **Bill Requested for Table {tableNumber}** | Total Amount: ₹{grandTotal} | ❌ | `["PRINT_BILL"]` | `/ManualBilling` | `order_chime` |

---

## 🔍 Audit of Existing Push Notifications & Unnecessary Payload Check

### ⚠️ Current System Discrepancies & Recommendations

1. **Missing Waiter FCM Trigger on New Order (`backend-jaaro`):**
   - **Current State:** Socket.IO notifies connected waiter browsers, but FCM push notification is only sent to order status updates (`orderControllers.js:475`), NOT to waiters when a customer places a new QR order!
   - **Fix Required:** Add automated FCM dispatch in `userOrderController.js` targeting waiters assigned to the restaurant/table when a new order is placed.

2. **Unnecessary Topic-Based Notification Endpoints:**
   - **Current State:** `notificationController.js` contains legacy `sendTopicNotification` using hardcoded icon `/uploads/icons/notification-icon.svg`.
   - **Fix Required:** Deprecate topic-based endpoints in favor of role-based and token-based FCM v1 API (`sendNotificationToTokens`), reducing payload overhead and avoiding failed topic subscriptions.

3. **Inconsistent Sound Parameter:**
   - **Current State:** Mobile Android/iOS uses `order_chime.wav` while Web ignores sound parameters in some background FCM payloads.
   - **Fix Required:** Standardize `sound: "order_chime"` across all Admin and Waiter backend push builders (`notificationHelper.js`).

---

## 🛡️ Production Deployment Checklist & Plan

1. **Backend FCM v1 Payload Consolidation:**
   - Ensure all automated triggers (`new_order`, `payment_submit`, `kitchen_ready`) use `notificationHelper.js` with structured `data` (`actions`, `screen`, `imageUrl`, `sound`).
2. **Super Admin Dispatcher Security:**
   - Restrict broadcast notification authorization to authenticated Super Admin JWT sessions.
3. **App Distribution & Environment Flags:**
   - Confirm production Firebase credentials (`vfoods88`) and VAPID settings across `jarro`, `backend-jaaro`, and `jarro-super-admin`.
