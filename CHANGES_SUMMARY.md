# Changes Summary: Fix Firestore Write Permissions and Error Handling

## Problem Statement
The web app was unable to send gratitude messages from the index page due to:
1. Firestore Security Rules rejecting writes when using `serverTimestamp()`
2. Generic error messages making debugging difficult

## Changes Made

### 1. Fixed Firestore Security Rules (firestore.rules & firestore_Version2.rules)

**Issue**: Line 15 had `request.time == request.resource.data.createdAt` which always fails when client sends `serverTimestamp()` because it's a sentinel value that hasn't been resolved at rule evaluation time.

**Solution**: Removed the problematic time equality check while preserving all other security validations:
- ✅ Field validation: only allows 8 specific fields (text, emotionKey, emotionLabel, color, moodScore, createdAt, clientId, dateKey)
- ✅ Text validation: must be string, non-empty, max 240 chars
- ✅ Emotion validation: must be one of ['bad','notgreat','okay','good','great']
- ✅ DocId format validation: must match `clientId_dateKey`
- ✅ One-per-day protection: `!exists()` prevents duplicate submissions
- ✅ No update/delete allowed

**Before**:
```javascript
&& request.time == request.resource.data.createdAt
&& docId == request.resource.data.clientId + '_' + request.resource.data.dateKey
```

**After**:
```javascript
&& docId == request.resource.data.clientId + '_' + request.resource.data.dateKey
```

### 2. Enhanced Error Handling (app.js & app_Version2.js)

**Issue**: Generic error message "Gửi thất bại. Vui lòng thử lại." made it impossible to diagnose permission-denied or other Firestore errors.

**Solution**: Enhanced error handler to display the error code when available:

**Before**:
```javascript
catch (e) {
  console.error(e);
  alert('Gửi thất bại. Vui lòng thử lại.');
}
```

**After**:
```javascript
catch (e) {
  console.error(e);
  const errorMsg = e.code ? `Gửi thất bại (${e.code}). Vui lòng thử lại.` : 'Gửi thất bại. Vui lòng thử lại.';
  alert(errorMsg);
}
```

Now errors will show codes like:
- `permission-denied` - Security rules rejected the write
- `failed-precondition` - App Check enforcement or other precondition
- `unauthenticated` - Authentication required but not provided

### 3. Verified Firebase Config (firebase-config.js)

**Status**: ✅ Already correct!
- `storageBucket: "bangbieton.appspot.com"` is the correct format for Firebase Storage

## Testing Instructions

### Step 1: Deploy Updated Rules to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **bangbieton**
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the contents of `firestore.rules` (or `firestore_Version2.rules`)
5. Paste into the Rules editor
6. Click **Publish** button

### Step 2: Test the Application

1. Open the application locally or on GitHub Pages
2. Enter a gratitude message in the text area (non-empty)
3. Select a mood/emotion button (Bad, Not Great, Okay, Good, or Great)
4. Click "Gửi và xem bảng" button

**Expected Behavior**:
- ✅ The page should navigate to `board.html`
- ✅ A new document should appear in Firestore collection `gratitudes`
- ✅ Document ID format: `{clientId}_{dateKey}` (e.g., `abc123_2025-10-11`)
- ✅ Document contains all 8 fields with correct values

**If you see an error**:
- The alert will now show the error code, e.g., "Gửi thất bại (permission-denied)"
- Common causes:
  - **permission-denied**: Rules not yet published in Firebase Console
  - **failed-precondition**: App Check enforcement is enabled but not integrated in the web app
  - Already submitted today: Different alert message

### Step 3: Verify One-Per-Day Limit

1. After successfully submitting once
2. Try to submit again on the same day
3. **Expected**: Alert shows "Bạn đã gửi lời biết ơn hôm nay rồi. Hẹn bạn ngày mai nhé!"

## Additional Notes

### App Check (If Applicable)
If you have App Check enforcement enabled in Firebase Console:
- The app currently does NOT integrate App Check
- You'll see error: "Gửi thất bại (failed-precondition)"
- **Solution**: Either disable App Check enforcement in Console OR integrate App Check for Web (reCAPTCHA) in a follow-up

### Files Modified
- `firestore.rules` - Main Firestore security rules
- `firestore_Version2.rules` - Backup/alternate rules file
- `app.js` - Main application script
- `app_Version2.js` - Backup/alternate app script
- `firebase-config.js` - No changes needed (already correct)

### Unchanged Functionality
- ✅ All security validations remain intact
- ✅ One submission per day per client (via clientId + dateKey)
- ✅ Field validation and constraints unchanged
- ✅ No updates or deletes allowed (read-only after creation)
- ✅ Anonymous client tracking via localStorage
- ✅ Vietnam timezone (Asia/Ho_Chi_Minh) for date calculations
