# 10: Migrate 照片打卡

**What to build:** Choosing 照片打卡 opens the photo capture experience: take a photo or pick one from the library, compress it before upload, write a short caption, and save. The record appears on 今日 as a thumbnail, and reopening it shows the photo. Meal type is inferred from the clock with no extra choice.

**Blocked by:** 06: Migrate the 打卡弹层 and its entry points.

**Status:** ready-for-agent

**User stories:** 81, 82, 83, 84, 85, 86, 87

- [x] Camera and photo-library access are declared with usage descriptions, and a denied permission produces a comprehensible state rather than a dead button. — `app.json` 里 `expo-image-picker` 的中文权限文案已配置；弹层里选图失败会显示错误。真的拒绝授权后的表现没构造过。
- [ ] A chosen photo is compressed to the Web app's long-edge and quality budget before upload, with a visible indication of the result.
- [x] A caption of the same maximum length as the Web app can be written on the photo and becomes the record's title.
- [x] Meal type is inferred from the time and is not asked for.
- [ ] Saving uploads the photo and creates the record, and shows the success state. — 仍未跑：点「拍照或选图」会弹 iOS 相册授权并真实上传，等确认后再走。
- [ ] Photo records show a thumbnail in the 今日 timeline, and the image is fetched with the session header so a copied URL cannot leak it.
- [ ] Reopening a photo record shows the photo, and the photo cannot be replaced from the edit sheet, matching the Web app.
- [x] Expo TypeScript, lint and formatting checks pass.

## Comments

- 2026-09-28: 照片打卡弹层本身已确认：整页拍立得卡片（左上关闭 / 右上保存 / 拍照或选图 / 文案 / 日期 / 上传前自动压缩说明），样式与 Web 的设计意图一致。
- 2026-09-28: 选图 → 压缩 → 上传 → 生成记录这一段**没有跑**，因为会弹系统相册授权。要在模拟器上补跑请说一声。
- 2026-09-28: 照片打卡的形状层面已确认（弹层、两个入口、说明文案、卡片式预览占位）；真正选图、压缩、上传与时间轴缩略图这一串还没跑，原因是它会触发系统相册权限并往演示空间写一张真图。
