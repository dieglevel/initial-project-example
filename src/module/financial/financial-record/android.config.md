# Android Notification Listener Payload Configuration

## Endpoints

### Option 1: URL với API Key trong Body hoặc Header `x-api-key`
- **URL**: `POST https://<Domain>/api/financial-record/record`
- **Header**: `x-api-key: wapi_xxx...` (hoặc truyền `"apiKey": "wapi_xxx..."` trong body)

### Option 2: URL có sẵn API Key trên Path
- **URL**: `POST https://<Domain>/api/financial-record/record/wapi_xxx...`

---

## Sample Request Body (JSON)

```json
{
  "apiKey": "wapi_e823f990141f23...",
  "title": "{not_title}",
  "ticker": "{not_ticker}",
  "notification": "{v=handle_notification}",
  "sub_text": "{not_sub_text}",
  "app_package": "{not_app_package}",
  "channel": "{not_channel}"
}
```

---

## Supported Bank Adapters (`app_package`)

1. **VietinBank iPay**: `com.vietinbank.ipay`
2. **Vietcombank (VCB Digibank)**: `com.vcb.bank` / `vn.vcb.bank`
3. **MB Bank**: `com.mbmobile`
4. **TPBank**: `com.tpb.mbanking`
5. **Generic Adapter (Fallback)**: Hỗ trợ tự động trích xuất các gói ngân hàng khác theo cú pháp tiền tệ `+` / `-` và các từ khóa tiếng Việt.

---

## Quy trình Xử lý (Workflow)

1. Server nhận request từ app Android qua `apiKey`.
2. Kiểm tra `apiKey` ứng với ví tiền (`FinancialWallet`).
3. Khớp `app_package` với Adapter ngân hàng tương ứng.
4. Trích xuất **Số tiền (amount)** và **Loại giao dịch (INCOME / EXPENSE)**.
5. Tạo bản ghi giao dịch mới (`FinancialTransactionEntity`) với `status = PENDING`.
6. Lưu bản ghi lịch sử `FinancialRecordEntity` để đối soát.
