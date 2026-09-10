# Fork vnpccc — màn đăng nhập Zitadel 4 ngôn ngữ

Fork này chỉ tồn tại vì MỘT lý do: thêm **Tiếng Việt** và **繁體中文** vào
màn đăng nhập (Login v2) của Zitadel. Mọi thứ khác giữ nguyên upstream.

Dùng cho [vnpccc.com](https://vnpccc.com) — nền tảng pháp luật PCCC song ngữ
Việt–Trung phục vụ khối FDI Đài Loan.

## Vì sao phải fork (đã kiểm, không phải suy đoán)

API `SetHostedLoginTranslation` của Zitadel cho phép nạp bản dịch tuỳ ý, nhưng
**chỉ ghi đè nội dung cho ngôn ngữ đã có sẵn**. Danh sách ngôn ngữ chọn được là
hằng số `LANGS` trong chính app login (`apps/login/src/lib/i18n.ts`), và cài
đặt *allowed languages* của instance chỉ **lọc bớt** trong danh sách đó chứ
không thêm được. Nạp 295 chuỗi tiếng Việt qua API vẫn không bao giờ hiện, vì
`vi` không nằm trong `LANGS`.

Thêm nữa, upstream cắt `Accept-Language` tại dấu `-` đầu tiên (`zh-TW` → `zh`),
nên người dùng Đài Loan luôn nhận **giản thể**.

## 4 ngôn ngữ cam kết

| Mã | Tên | Nguồn |
|---|---|---|
| `en` | English | upstream (bản tham chiếu) |
| `zh` | 简体中文 | upstream |
| `zh-TW` | 繁體中文 | **vnpccc dịch**, dụng ngữ Đài Loan |
| `vi` | Tiếng Việt | **vnpccc dịch** |

11 ngôn ngữ còn lại của upstream vẫn giữ nguyên nhưng **không được bảo trì** —
một số bản đang thiếu chuỗi hoặc lệch placeholder từ trước.

## Đã sửa gì (7 file)

| File | Sửa |
|---|---|
| `apps/login/src/lib/i18n.ts` | Thêm `zh-TW` + `vi` vào `LANGS`; thêm `matchLanguage()` và `resolveLocaleFromHeader()` để khớp biến thể vùng/chữ viết |
| `apps/login/src/i18n/request.ts` | Chọn locale qua `resolveLocaleFromHeader` / `matchLanguage` thay vì cắt chuỗi tại `-` |
| `apps/login/src/lib/auth-utils.ts` | `ui_locales` dùng chung `matchLanguage` |
| `apps/login/src/app/(login)/layout.tsx` | Khớp *allowed languages* không phân biệt hoa thường |
| `apps/login/locales/vi.json` | **MỚI** — 295 chuỗi |
| `apps/login/locales/zh-TW.json` | **MỚI** — 295 chuỗi |
| `apps/login/locales/zh.json` | Vá 1 lỗi upstream: `device.request.disclaimer` mất `{appName}` |

Quy tắc khớp ngôn ngữ sau khi sửa:

```
zh-TW, zh-Hant, zh-HK, zh-MO  → zh-TW  (繁體)
zh-CN, zh-Hans, zh-SG, zh     → zh     (简体)
vi-VN, vi                     → vi
de-CH → de, en-US → en …             (như cũ)
```

## Chỉ hiện 4 ngôn ngữ trong ô chọn (KHÔNG cần sửa code)

`LANGS` giữ nguyên 15 ngôn ngữ của upstream; muốn ô chọn chỉ còn 4 thì dùng
đúng tính năng có sẵn của Zitadel — *restrictions* lọc bớt trong `LANGS`:

```bash
curl -X PUT "https://id.vnpccc.com/admin/v1/restrictions" \
  -H "Authorization: Bearer $PAT_IAM_OWNER" \
  -H "Content-Type: application/json" \
  -d '{"allowedLanguages":{"list":["vi","zh-TW","zh","en"]}}'
```

Đặt luôn ngôn ngữ mặc định của instance là `vi` trong Console → Settings →
General. Không xoá bớt `LANGS` trong code: xoá là tự nhận thêm điểm đụng độ
khi rebase, trong khi cấu hình làm được y hệt.

## Bảo trì

### Nhánh
`vnpccc-i18n` = tag ổn định của upstream + các commit i18n ở trên. Không bao
giờ merge vào `main`; `main` giữ nguyên để đối chiếu.

### Tự bám bản mới
`.github/workflows/vnpccc-sync-upstream.yml` chạy 09:00 giờ VN mỗi ngày:

1. Tìm tag `vX.Y.Z` ổn định mới nhất của `zitadel/zitadel`.
2. Rebase `vnpccc-i18n` lên tag đó.
3. Chạy cổng kiểm bản dịch + test i18n.
4. Push → kích hoạt build image.

Đụng độ rebase, hoặc bản mới có chuỗi chưa dịch → **mở issue** (nhãn
`vnpccc-sync`), không tự đoán. Ép chạy tay: Actions → *vnpccc — bám bản
Zitadel mới* → Run workflow (điền `target_tag` nếu muốn tag cụ thể).

Hai cái bẫy của GitHub Actions đã tính tới:

- **Push bằng `GITHUB_TOKEN` không kích hoạt workflow khác** (chặn đệ quy) →
  workflow sync gọi thẳng build qua `createWorkflowDispatch`, vì
  `workflow_dispatch` là ngoại lệ duy nhất vẫn chạy được với token đó.
- **Workflow theo lịch bị tắt sau 60 ngày không có commit** (repo công khai).
  Zitadel ra bản mới đều đặn nên hiếm khi chạm ngưỡng, nhưng nếu tab Actions
  báo *"This scheduled workflow is disabled"* thì bấm **Enable workflow**.

### Image
`.github/workflows/vnpccc-login-image.yml` đẩy lên:

```
ghcr.io/tq89/zitadel-login:<tag upstream>   # vd v4.16.1
ghcr.io/tq89/zitadel-login:latest
```

Đa kiến trúc `linux/amd64` + `linux/arm64`. Package đang **public** (đã kiểm
2026-09-10: pull ẩn danh được) → VPS không cần `docker login`. Nếu về sau
package chuyển thành private thì hoặc mở lại public (Packages →
`zitadel-login` → Package settings → Change visibility), hoặc
`docker login ghcr.io -u <user> -p <PAT có read:packages>` trên VPS.

⚠️ **Tag image phải TRÙNG version của core Zitadel.** Trên VPS đổi cả hai:

```yaml
zitadel:        image: ghcr.io/zitadel/zitadel:v4.16.1
zitadel-login:  image: ghcr.io/tq89/zitadel-login:v4.16.1   # thay ghcr.io/zitadel/zitadel-login
```

### Kiểm tại chỗ

```bash
pnpm install --frozen-lockfile
node .github/scripts/vnpccc-check-locales.mjs          # đủ khoá + đúng placeholder
cd apps/login && npx vitest --run src/lib/i18n.test.ts src/lib/auth-utils.test.ts
```

Build image cần `buf generate` tải plugin từ buf.build — chạy trong GitHub
Actions, không chạy được sau proxy chặn egress.

### Khi upstream thêm chuỗi mới
`next-intl` gộp `en.json` → `{locale}.json` → bản dịch từ API, nên chuỗi thiếu
tự rơi về tiếng Anh (không vỡ trang). Cổng kiểm sẽ chặn build và mở issue liệt
kê khoá còn thiếu để bổ sung vào `vi.json` / `zh-TW.json`.
