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

## Ô chọn ngôn ngữ: 17 mục, 2 mục của ta lên đầu

Ô chọn hiện **Tiếng Việt · 繁體中文** trước, rồi tới 15 ngôn ngữ của upstream.

**KHÔNG lọc xuống 4 được bằng cấu hình.** Tính năng *allowed languages* của
Zitadel so khớp **chính xác từng mã** với danh sách sinh từ tên file
`internal/api/ui/login/static/i18n/*.yaml` nằm trong binary lõi (đã đọc source
`v4.16.1`: `internal/i18n/languages.go` → `MustLoadSupportedLanguagesFromDir`,
`internal/command/restrictions.go` → `LanguagesAreSupported`). Danh sách đó
không có `vi`, cũng không có `zh-TW` (chỉ có `zh`) → gửi 2 mã này vào
restrictions là lỗi `Errors.Languages.NotSupported`.

Cắt bớt trong `LANGS` cũng đã thử và **bỏ**: nó làm hỏng 7 test gốc của
Zitadel và chặn luôn `ui_locales=de`, đổi lấy mỗi việc ô chọn ngắn hơn. Thừa
vài mục không hại ai. Muốn cắt thật thì sửa `LANGS` trong
`apps/login/src/lib/i18n.ts` và sửa theo bộ test gốc.

Vẫn nên đặt **ngôn ngữ mặc định của instance** hợp lý trong Console → Settings
→ General (chỉ chọn được trong danh sách lõi hỗ trợ, nên `en`): người dùng
không gửi `Accept-Language` khớp sẽ rơi về mặc định này.

## Bảo trì

### Hai nhánh, mỗi nhánh một việc

| Nhánh | Là gì | Dùng để |
|---|---|---|
| **`main`** (mặc định) | upstream `main` + commit i18n | Xem code, và **chạy workflow theo lịch** |
| **`vnpccc-i18n`** | **tag phát hành** của upstream + commit i18n | **Dựng image** |

Vì sao phải tách:

- Workflow `schedule` của GitHub **chỉ chạy từ nhánh mặc định** → file
  `vnpccc-sync-upstream.yml` bắt buộc có mặt trên `main`, nếu không lịch
  không bao giờ nổ.
- Image phải mang **đúng số hiệu bản phát hành** để khớp core Zitadel.
  `main` nằm giữa hai bản phát hành, `git describe` trên đó cho số hiệu sai
  (hoặc không có) → chỉ dựng image từ `vnpccc-i18n` đang bám tag.

**KHÔNG bao giờ đẩy ngược lên `zitadel/zitadel`.** Workflow chỉ `fetch` từ
upstream để lấy tag, không có bước push/PR nào về repo gốc.

Đổi logic workflow thì sửa trên `main` rồi áp sang `vnpccc-i18n` (hoặc ngược
lại) để hai bản không lệch nhau.

### Tắt bớt CI của upstream trên fork (làm 1 lần)

Đẩy lên `main` sẽ kích hoạt luôn workflow gốc của Zitadel. `CI` tự bỏ qua
trên fork, nhưng **`Code Scanning` (CodeQL) thì chạy thật** — quét cả kho Go
lẫn TypeScript, tốn hàng chục phút Actions mà chẳng để làm gì.

Tắt: repo → **Actions** → chọn **Code Scanning** ở cột trái → nút `⋯` →
**Disable workflow**. (Tắt luôn `CI` cho gọn cũng được — nó vốn đã tự bỏ qua.)
KHÔNG tắt 2 workflow `vnpccc — …`.

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
