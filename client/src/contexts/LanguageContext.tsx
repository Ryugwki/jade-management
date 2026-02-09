"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/contexts/AuthContext";

export type LanguageCode = "vi" | "en";

type TranslationMap = Record<string, string>;

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const translations: Record<LanguageCode, TranslationMap> = {
  vi: {
    "common.loading": "\u0110ang t\u1ea3i...",
    "common.loadingShort": "...",
    "common.placeholder": "\u2014",
    "common.unknown": "Kh\u00f4ng r\u00f5",
    "common.save": "L\u01b0u",
    "common.saving": "\u0110ang l\u01b0u...",
    "common.cancel": "H\u1ee7y",
    "common.select": "Ch\u1ecdn",
    "common.view": "Xem",
    "common.yes": "C\u00f3",
    "common.close": "\u0110\u00f3ng",
    "common.email": "Email",
    "common.role": "Vai tr\u00f2",
    "common.phone": "S\u1ed1 \u0111i\u1ec7n tho\u1ea1i",
    "common.address": "\u0110\u1ecba ch\u1ec9",
    "common.password": "M\u1eadt kh\u1ea9u",
    "common.currentPassword": "M\u1eadt kh\u1ea9u hi\u1ec7n t\u1ea1i",
    "common.newPassword": "M\u1eadt kh\u1ea9u m\u1edbi",
    "common.confirmPassword": "X\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u",
    "common.update": "C\u1eadp nh\u1eadt",
    "common.profile": "H\u1ed3 s\u01a1",
    "common.language": "Ng\u00f4n ng\u1eef",
    "common.timezone": "M\u00fai gi\u1edd",

    "brand.name": "Jade Store",
    "brand.subtitle": "H\u1ec7 th\u1ed1ng qu\u1ea3n l\u00fd",
    "brand.copyright": "\u00a9 {year} Jade Management",

    "nav.dashboard": "T\u1ed5ng quan",
    "nav.inventory": "Kho s\u1ea3n ph\u1ea9m",
    "nav.permissions": "Ph\u00e2n quy\u1ec1n",
    "nav.overview": "T\u1ed5ng quan",
    "nav.products": "S\u1ea3n ph\u1ea9m",
    "nav.accessControl": "Ki\u1ec3m so\u00e1t truy c\u1eadp",
    "nav.currentUser": "Ng\u01b0\u1eddi d\u00f9ng hi\u1ec7n t\u1ea1i",
    "nav.userFallback": "T\u00e0i kho\u1ea3n",
    "nav.userInitial": "U",
    "nav.settings": "C\u00e0i \u0111\u1eb7t",
    "nav.messages": "Tin nh\u1eafn",
    "nav.notifications": "Th\u00f4ng b\u00e1o",
    "nav.unreadCount": "{count} ch\u01b0a \u0111\u1ecdc",
    "nav.noNotifications": "Ch\u01b0a c\u00f3 th\u00f4ng b\u00e1o",
    "nav.refresh": "L\u00e0m m\u1edbi",
    "nav.markAllRead": "\u0110\u00e1nh d\u1ea5u \u0111\u00e3 \u0111\u1ecdc",
    "nav.profile": "H\u1ed3 s\u01a1",
    "nav.logout": "\u0110\u0103ng xu\u1ea5t",

    "feedback.title.success": "Th\u00e0nh c\u00f4ng",
    "feedback.title.error": "C\u00f3 l\u1ed7i",
    "feedback.title.warning": "C\u1ea3nh b\u00e1o",
    "feedback.title.info": "Th\u00f4ng tin",

    "auth.signIn": "\u0110\u0103ng nh\u1eadp",
    "auth.email": "Email",
    "auth.password": "M\u1eadt kh\u1ea9u",
    "auth.emailPlaceholder": "ban@example.com",
    "auth.passwordPlaceholder":
      "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    "auth.invalidCredentials":
      "Th\u00f4ng tin \u0111\u0103ng nh\u1eadp kh\u00f4ng h\u1ee3p l\u1ec7. Vui l\u00f2ng th\u1eed l\u1ea1i.",
    "auth.guestFailed":
      "\u0110\u0103ng nh\u1eadp kh\u00e1ch th\u1ea5t b\u1ea1i. Vui l\u00f2ng th\u1eed l\u1ea1i.",
    "auth.signingIn": "\u0110ang \u0111\u0103ng nh\u1eadp...",
    "auth.login": "\u0110\u0103ng nh\u1eadp",
    "auth.loginGuest": "\u0110\u0103ng nh\u1eadp kh\u00e1ch",
    "auth.enteringGuest":
      "\u0110ang v\u00e0o ch\u1ebf \u0111\u1ed9 kh\u00e1ch...",
    "auth.loginSuccess": "\u0110\u0103ng nh\u1eadp th\u00e0nh c\u00f4ng.",

    "settings.title": "T\u00f9y ch\u1ec9nh & b\u1ea3o m\u1eadt",
    "settings.subtitle":
      "C\u1ea5u h\u00ecnh ng\u00f4n ng\u1eef, m\u00fai gi\u1edd v\u00e0 b\u1ea3o m\u1eadt m\u1eadt kh\u1ea9u.",
    "settings.badge": "C\u1ea5u h\u00ecnh h\u1ec7 th\u1ed1ng",
    "settings.card.preferences": "Ng\u00f4n ng\u1eef v\u00e0 m\u00fai gi\u1edd",
    "settings.card.password": "M\u1eadt kh\u1ea9u",
    "settings.savePreferences": "L\u01b0u t\u00f9y ch\u1ec9nh",
    "settings.preferencesSaved": "\u0110\u00e3 l\u01b0u t\u00f9y ch\u1ec9nh.",
    "settings.preferencesFailed":
      "Kh\u00f4ng th\u1ec3 l\u01b0u t\u00f9y ch\u1ec9nh.",
    "settings.passwordUpdate": "C\u1eadp nh\u1eadt m\u1eadt kh\u1ea9u",
    "settings.passwordUpdated":
      "\u0110\u00e3 c\u1eadp nh\u1eadt m\u1eadt kh\u1ea9u.",
    "settings.passwordFailed":
      "Kh\u00f4ng th\u1ec3 c\u1eadp nh\u1eadt m\u1eadt kh\u1ea9u.",
    "settings.passwordMissing":
      "Vui l\u00f2ng nh\u1eadp m\u1eadt kh\u1ea9u hi\u1ec7n t\u1ea1i v\u00e0 m\u1edbi.",
    "settings.passwordMismatch":
      "X\u00e1c nh\u1eadn m\u1eadt kh\u1ea9u kh\u00f4ng kh\u1edbp.",
    "settings.timezone.hcm": "Ch\u00e2u \u00c1/TP H\u1ed3 Ch\u00ed Minh",
    "settings.timezone.bangkok": "Ch\u00e2u \u00c1/Bangkok",
    "settings.timezone.shanghai": "Ch\u00e2u \u00c1/Shanghai",

    "settings.section.preferences.title":
      "Ng\u00f4n ng\u1eef & m\u00fai gi\u1edd",
    "settings.section.preferences.subtitle":
      "Thi\u1ebft l\u1eadp giao di\u1ec7n v\u00e0 th\u1eddi gian hi\u1ec3n th\u1ecb.",
    "settings.section.security.title": "B\u1ea3o m\u1eadt t\u00e0i kho\u1ea3n",
    "settings.section.security.subtitle":
      "C\u1eadp nh\u1eadt m\u1eadt kh\u1ea9u \u0111\u1ecbnh k\u1ef3.",
    "settings.section.summary.title": "T\u00f3m t\u1eaft c\u1ea5u h\u00ecnh",
    "settings.section.summary.subtitle":
      "\u00c1p d\u1ee5ng ngay sau khi l\u01b0u thay \u0111\u1ed5i.",
    "settings.section.summary.language": "Ng\u00f4n ng\u1eef",
    "settings.section.summary.timezone": "M\u00fai gi\u1edd",
    "settings.section.summary.note":
      "M\u1eb9o: \u0110\u1ed3ng b\u1ed9 theo thi\u1ebft b\u1ecb \u0111\u1ec3 tr\u00e1nh l\u1ec7ch th\u1eddi gian.",
    "settings.section.support.title": "H\u1ed7 tr\u1ee3 nhanh",
    "settings.section.support.subtitle":
      "G\u1ee3i \u00fd gi\u1eef t\u00e0i kho\u1ea3n an to\u00e0n.",
    "settings.section.support.tip1":
      "\u0110\u1ed5i m\u1eadt kh\u1ea9u m\u1ed7i 90 ng\u00e0y.",
    "settings.section.support.tip2":
      "B\u1eadt MFA cho quy\u1ec1n qu\u1ea3n tr\u1ecb.",
    "settings.section.support.tip3":
      "\u0110\u0103ng xu\u1ea5t thi\u1ebft b\u1ecb l\u1ea1.",

    "dashboard.badge": "T\u1ed5ng quan v\u1eadn h\u00e0nh",
    "dashboard.title": "B\u1ea3ng \u0111i\u1ec1u khi\u1ec3n",
    "dashboard.subtitle":
      "Theo d\u00f5i t\u1ed3n kho, tr\u1ea1ng th\u00e1i ki\u1ec3m \u0111\u1ecbnh v\u00e0 xu h\u01b0\u1edbng m\u1edbi nh\u1ea5t.",

    "dashboard.section.snapshot.title": "T\u1ed5ng quan nhanh",
    "dashboard.section.snapshot.subtitle":
      "C\u00e1c KPI ch\u00ednh h\u00f4m nay.",
    "dashboard.section.inventory.title": "D\u00f2ng s\u1ea3n ph\u1ea9m",
    "dashboard.section.inventory.subtitle":
      "Hi\u1ec7u su\u1ea5t kho v\u00e0 bi\u1ebfn \u0111\u1ed9ng.",
    "dashboard.section.breakdown.title":
      "T\u1ef7 l\u1ec7 ki\u1ec3m \u0111\u1ecbnh",
    "dashboard.section.breakdown.subtitle":
      "Ph\u00e2n b\u1ed5 tr\u1ea1ng th\u00e1i ch\u1ee9ng th\u01b0.",

    "dashboard.action.viewInventory": "Xem kho",
    "dashboard.action.manageProducts": "Qu\u1ea3n l\u00fd s\u1ea3n ph\u1ea9m",

    "dashboard.products": "S\u1ea3n ph\u1ea9m",
    "dashboard.productsTotal": "T\u1ed5ng s\u1ed1 s\u1ea3n ph\u1ea9m",
    "dashboard.certificates": "Ki\u1ec3m \u0111\u1ecbnh",
    "dashboard.certificatesVerified": "\u0110\u00e3 ki\u1ec3m \u0111\u1ecbnh",
    "dashboard.status": "Tr\u1ea1ng th\u00e1i",
    "dashboard.pending": "\u0110ang ch\u1edd",
    "dashboard.unverified": "Ch\u01b0a ki\u1ec3m \u0111\u1ecbnh",
    "dashboard.latestProducts": "S\u1ea3n ph\u1ea9m m\u1edbi nh\u1ea5t",
    "dashboard.table.gemstone": "Ch\u1ea5t",
    "dashboard.table.jewelry": "Ki\u1ec3u trang s\u1ee9c",
    "dashboard.table.certificate": "Ki\u1ec3m \u0111\u1ecbnh",
    "dashboard.noProducts": "Kh\u00f4ng c\u00f3 s\u1ea3n ph\u1ea9m.",
    "dashboard.breakdown": "T\u1ef7 l\u1ec7 ki\u1ec3m \u0111\u1ecbnh",
    "dashboard.loadFailed":
      "Kh\u00f4ng th\u1ec3 t\u1ea3i d\u1eef li\u1ec7u dashboard.",

    "jewelry.bracelet": "V\u00f2ng b\u1ea3n",
    "jewelry.beadedBracelet": "V\u00f2ng chu\u1ed7i",
    "jewelry.pendant": "M\u1eb7t d\u00e2y",
    "jewelry.earrings": "B\u00f4ng tai",
    "jewelry.rings": "Nh\u1eabn",

    "gemstone.nuo": "N\u1ebfp",
    "gemstone.nuoTransformation": "N\u1ebfp h\u00f3a",
    "gemstone.nuoIce": "N\u1ebfp b\u0103ng",
    "gemstone.ice": "B\u0103ng",
    "gemstone.highIce": "Cao b\u0103ng",
    "gemstone.glass": "Th\u1ee7y tinh",

    "certificate.verified": "\u0110\u00e3 ki\u1ec3m \u0111\u1ecbnh",
    "certificate.pending": "\u0110ang ch\u1edd",
    "certificate.unverified": "Ch\u01b0a ki\u1ec3m \u0111\u1ecbnh",

    "permission.loading": "\u0110ang t\u1ea3i ph\u00e2n quy\u1ec1n...",
    "permission.restricted":
      "Truy c\u1eadp b\u1ecb h\u1ea1n ch\u1ebf. \u0110ang chuy\u1ec3n h\u01b0\u1edbng...",
    "permission.header.badge": "Trung t\u00e2m ph\u00e2n quy\u1ec1n",
    "permission.header.title":
      "B\u1ea3o m\u1eadt truy c\u1eadp theo vai tr\u00f2",
    "permission.header.subtitle":
      "Quy \u0111\u1ecbnh ai \u0111\u01b0\u1ee3c qu\u1ea3n l\u00fd gi\u00e1, ki\u1ec3m \u0111\u1ecbnh v\u00e0 v\u1eadn h\u00e0nh. Gi\u1eef h\u00e0nh \u0111\u1ed9ng nh\u1ea1y c\u1ea3m \u0111\u01b0\u1ee3c ki\u1ec3m so\u00e1t v\u00e0 minh b\u1ea1ch.",
    "permission.header.policy": "Ch\u00ednh s\u00e1ch v3.4",
    "permission.header.review":
      "R\u00e0 so\u00e1t l\u1ea7n cu\u1ed1i 06/02/2026",
    "permission.header.audit": "S\u1eb5n s\u00e0ng ki\u1ec3m tra",
    "permission.action.review": "Xem thay \u0111\u1ed5i",
    "permission.action.export": "Xu\u1ea5t ch\u00ednh s\u00e1ch",

    "permission.section.overview.title": "T\u1ed5ng quan",
    "permission.section.overview.subtitle":
      "Ch\u1ec9 s\u1ed1 truy c\u1eadp theo vai tr\u00f2.",
    "permission.section.roles.title": "Vai tr\u00f2",
    "permission.section.roles.subtitle":
      "\u0110\u1ecbnh ngh\u0129a quy\u1ec1n theo c\u1ea5p.",
    "permission.section.roles.cardTitle": "H\u1ed3 s\u01a1 vai tr\u00f2",
    "permission.section.roles.cardSubtitle":
      "Ph\u00e2n quy\u1ec1n r\u00f5 r\u00e0ng theo nh\u00f3m ch\u1ee9c n\u0103ng.",
    "permission.section.policy.title": "Ch\u00ednh s\u00e1ch",
    "permission.section.policy.subtitle":
      "R\u00e0o ch\u1eafn v\u00e0 truy c\u1eadp kh\u1ea9n c\u1ea5p.",
    "permission.section.access.title": "Qu\u1ea3n tr\u1ecb truy c\u1eadp",
    "permission.section.access.subtitle":
      "Ng\u01b0\u1eddi d\u00f9ng v\u00e0 ma tr\u1eadn quy\u1ec1n.",
    "permission.section.access.summaryTitle": "T\u00f3m t\u1eaft truy c\u1eadp",
    "permission.section.access.summarySubtitle":
      "Tr\u1ea1ng th\u00e1i \u0111\u1ed3ng b\u1ed9 ch\u00ednh s\u00e1ch.",
    "permission.section.access.totalUsers":
      "T\u1ed5ng ng\u01b0\u1eddi d\u00f9ng",
    "permission.section.access.policyStatus":
      "Tr\u1ea1ng th\u00e1i ch\u00ednh s\u00e1ch",
    "permission.section.access.syncing": "\u0110ang \u0111\u1ed3ng b\u1ed9",
    "permission.section.access.synced": "\u0110\u00e3 \u0111\u1ed3ng b\u1ed9",
    "permission.section.governance.title": "Qu\u1ea3n tr\u1ecb",
    "permission.section.governance.subtitle":
      "Ph\u00ea duy\u1ec7t v\u00e0 nh\u1eadt k\u00fd.",
    "permission.section.governance.auditTitle":
      "Theo d\u00f5i ki\u1ec3m to\u00e1n",
    "permission.section.governance.auditSubtitle":
      "Xem l\u1ecbch s\u1eed thay \u0111\u1ed5i.",
    "permission.section.governance.auditNote":
      "Ki\u1ec3m tra \u0111\u1ecbnh k\u1ef3 \u0111\u1ec3 \u0111\u1ea3m b\u1ea3o tu\u00e2n th\u1ee7.",
    "permission.section.governance.openAudit": "M\u1edf nh\u1eadt k\u00fd",

    "permission.highlight.roles":
      "Vai tr\u00f2 \u0111ang ho\u1ea1t \u0111\u1ed9ng",
    "permission.highlight.critical": "Quy\u1ec1n quan tr\u1ecdng",
    "permission.highlight.pending": "Y\u00eau c\u1ea7u \u0111ang ch\u1edd",

    "permission.guardrails.title": "R\u00e0o ch\u1eafn",
    "permission.guardrails.subtitle":
      "L\u1edbp ki\u1ec3m so\u00e1t cho h\u00e0nh \u0111\u1ed9ng nh\u1ea1y c\u1ea3m.",
    "permission.guardrails.nextAudit":
      "K\u1ef3 ki\u1ec3m tra ti\u1ebfp theo: 12/03/2026",
    "permission.guardrail.mfa.title": "B\u1eaft bu\u1ed9c MFA",
    "permission.guardrail.mfa.desc":
      "T\u1ea5t c\u1ea3 Admin ph\u1ea3i b\u1eadt x\u00e1c th\u1ef1c \u0111a y\u1ebfu t\u1ed1.",
    "permission.guardrail.privileged.title":
      "H\u00e0nh \u0111\u1ed9ng \u0111\u1eb7c quy\u1ec1n",
    "permission.guardrail.privileged.desc":
      "Thay \u0111\u1ed5i quan tr\u1ecdng c\u1ea7n hai ng\u01b0\u1eddi ph\u00ea duy\u1ec7t.",
    "permission.guardrail.integrity.title":
      "T\u00ednh to\u00e0n v\u1eb9n ki\u1ec3m \u0111\u1ecbnh",
    "permission.guardrail.integrity.desc":
      "Kh\u00e1ch kh\u00f4ng th\u1ec3 s\u1eeda ch\u1ee9ng th\u01b0 \u0111\u00e3 ki\u1ec3m \u0111\u1ecbnh.",

    "permission.access.title": "Truy c\u1eadp & ph\u00e2n quy\u1ec1n",
    "permission.access.subtitle":
      "Qu\u1ea3n l\u00fd ng\u01b0\u1eddi d\u00f9ng v\u00e0 ma tr\u1eadn quy\u1ec1n t\u1eadp trung.",
    "permission.access.helper":
      "T\u1ea1o truy c\u1eadp cho nh\u00e2n s\u1ef1 tin c\u1eady b\u1eb1ng email v\u00e0 m\u1eadt kh\u1ea9u \u0111\u00e3 x\u00e1c th\u1ef1c.",

    "permission.users.add": "Th\u00eam ng\u01b0\u1eddi d\u00f9ng",
    "permission.users.addSubtitle":
      "T\u1ea1o t\u00e0i kho\u1ea3n m\u1edbi b\u1eb1ng email v\u00e0 m\u1eadt kh\u1ea9u.",

    "profile.section.personal.title": "Th\u00f4ng tin c\u00e1 nh\u00e2n",
    "profile.section.personal.subtitle":
      "C\u1eadp nh\u1eadt h\u1ed3 s\u01a1 li\u00ean h\u1ec7.",
    "profile.section.avatar.title": "\u1ea2nh \u0111\u1ea1i di\u1ec7n",
    "profile.section.avatar.subtitle":
      "Hi\u1ec3n th\u1ecb tr\u00ean b\u1ea3ng \u0111i\u1ec1u khi\u1ec3n v\u00e0 h\u1ed3 s\u01a1.",
    "permission.users.loading":
      "\u0110ang t\u1ea3i ng\u01b0\u1eddi d\u00f9ng...",
    "permission.users.empty": "Kh\u00f4ng c\u00f3 ng\u01b0\u1eddi d\u00f9ng.",
    "permission.users.fallbackName": "Ng\u01b0\u1eddi d\u00f9ng",
    "permission.users.noEmail": "Ch\u01b0a c\u00f3 email",
    "permission.users.selectRole": "Ch\u1ecdn vai tr\u00f2",
    "permission.users.editPermissions": "S\u1eeda quy\u1ec1n",
    "permission.users.delete": "X\u00f3a",
    "permission.users.loadFailed":
      "Kh\u00f4ng th\u1ec3 t\u1ea3i ng\u01b0\u1eddi d\u00f9ng.",
    "permission.users.required":
      "Email v\u00e0 m\u1eadt kh\u1ea9u l\u00e0 b\u1eaft bu\u1ed9c.",
    "permission.users.createFailed":
      "Kh\u00f4ng th\u1ec3 t\u1ea1o ng\u01b0\u1eddi d\u00f9ng.",
    "permission.users.deleteFailed":
      "Kh\u00f4ng th\u1ec3 x\u00f3a ng\u01b0\u1eddi d\u00f9ng.",
    "permission.users.cannotDeleteSelf":
      "Kh\u00f4ng th\u1ec3 x\u00f3a ch\u00ednh t\u00e0i kho\u1ea3n c\u1ee7a b\u1ea1n.",
    "permission.users.deleteConfirm": "X\u00f3a {name} ?",
    "permission.users.thisUser": "ng\u01b0\u1eddi d\u00f9ng n\u00e0y",
    "permission.users.emailPlaceholder": "person@example.com",
    "permission.users.passwordPlaceholder":
      "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    "permission.users.create": "T\u1ea1o ng\u01b0\u1eddi d\u00f9ng",

    "permission.matrix.title": "Ma tr\u1eadn quy\u1ec1n",
    "permission.matrix.subtitle":
      "Gi\u1eef nh\u1ea5t qu\u00e1n quy\u1ec1n hi\u1ec3n th\u1ecb gi\u1eefa s\u1ea3n ph\u1ea9m, ki\u1ec3m \u0111\u1ecbnh v\u00e0 b\u1ea3o m\u1eadt.",
    "permission.matrix.syncing":
      "\u0110ang \u0111\u1ed3ng b\u1ed9 c\u1eadp nh\u1eadt ch\u00ednh s\u00e1ch...",
    "permission.matrix.area": "Khu v\u1ef1c",
    "permission.matrix.description": "M\u00f4 t\u1ea3",
    "permission.matrix.caption":
      "D\u00f9ng danh s\u00e1ch \u0111\u1ec3 ch\u1ecdn m\u1ee9c quy\u1ec1n. C\u1eadp nh\u1eadt \u00e1p d\u1ee5ng ngay cho s\u1ea3n ph\u1ea9m v\u00e0 ki\u1ec3m \u0111\u1ecbnh.",
    "permission.matrix.updated": "\u0110\u00e3 c\u1eadp nh\u1eadt",

    "permission.area.inventory": "S\u1ea3n ph\u1ea9m & t\u1ed3n kho",
    "permission.area.certificates": "Ki\u1ec3m \u0111\u1ecbnh",
    "permission.area.users": "Qu\u1ea3n l\u00fd ng\u01b0\u1eddi d\u00f9ng",
    "permission.area.pricing": "Gi\u00e1 & thanh to\u00e1n",
    "permission.area.security": "B\u1ea3o m\u1eadt",
    "permission.area.audit": "Nh\u1eadt k\u00fd ki\u1ec3m tra",

    "permission.desc.inventory":
      "T\u1ea1o, s\u1eeda v\u00e0 qu\u1ea3n l\u00fd gi\u00e1",
    "permission.desc.certificates":
      "X\u00e1c minh, c\u1ea5p v\u00e0 thu h\u1ed3i",
    "permission.desc.users":
      "M\u1eddi, v\u00f4 hi\u1ec7u h\u00f3a v\u00e0 g\u00e1n vai tr\u00f2",
    "permission.desc.pricing":
      "Gi\u00e1 nh\u1eadp, chi tr\u1ea3 v\u00e0 h\u00f3a \u0111\u01a1n",
    "permission.desc.security":
      "SSO, MFA v\u00e0 th\u1ef1c thi ch\u00ednh s\u00e1ch",
    "permission.desc.audit":
      "Xu\u1ea5t v\u00e0 theo d\u00f5i ho\u1ea1t \u0111\u1ed9ng",

    "permission.level.full": "To\u00e0n quy\u1ec1n",
    "permission.level.manage": "Qu\u1ea3n l\u00fd",
    "permission.level.read": "Ch\u1ec9 xem",
    "permission.level.limited": "Gi\u1edbi h\u1ea1n",
    "permission.level.none": "Kh\u00f4ng",

    "permission.approvals.title": "H\u00e0ng ch\u1edd ph\u00ea duy\u1ec7t",
    "permission.approvals.subtitle":
      "C\u00e1c y\u00eau c\u1ea7u c\u1ea7n x\u1eed l\u00fd h\u00f4m nay.",
    "permission.approvals.loading": "\u0110ang t\u1ea3i y\u00eau c\u1ea7u...",
    "permission.approvals.requestedBy": "Y\u00eau c\u1ea7u b\u1edfi {name}",
    "permission.approvals.empty": "Kh\u00f4ng c\u00f3 y\u00eau c\u1ea7u.",
    "permission.approvals.showPending": "Ch\u1ec9 xem \u0111ang ch\u1edd",
    "permission.approvals.viewAll": "Xem t\u1ea5t c\u1ea3",
    "permission.approvals.approve": "Duy\u1ec7t \u0111\u00e3 ch\u1ecdn",
    "permission.approvals.delete": "X\u00f3a \u0111\u00e3 ch\u1ecdn",
    "permission.approval.waiting": "Ch\u1edd Admin",
    "permission.approval.needsSuper": "C\u1ea7n Super Admin",
    "permission.approval.approved": "\u0110\u00e3 duy\u1ec7t",
    "permission.approval.rejected": "T\u1eeb ch\u1ed1i",

    "permission.emergency.title": "Truy c\u1eadp kh\u1ea9n c\u1ea5p",
    "permission.emergency.subtitle":
      "Ch\u1ec9 Super Admin m\u1edf kh\u00f3a h\u00e0nh \u0111\u1ed9ng quan tr\u1ecdng.",
    "permission.emergency.note":
      "Ch\u1ec9 d\u00f9ng khi c\u1ea7n. M\u1ecdi h\u00e0nh \u0111\u1ed9ng \u0111\u01b0\u1ee3c ghi l\u1ea1i v\u00e0 t\u1ef1 h\u1ebft h\u1ea1n sau 60 ph\u00fat.",
    "permission.emergency.request": "Y\u00eau c\u1ea7u m\u1edf kh\u00f3a",
    "permission.emergency.cancel":
      "H\u1ee7y y\u00eau c\u1ea7u m\u1edf kh\u00f3a",
    "permission.emergency.viewAudit": "Xem nh\u1eadt k\u00fd",
    "permission.emergency.status": "Tr\u1ea1ng th\u00e1i kh\u00f3a",
    "permission.emergency.status.enforced": "\u0110ang kh\u00f3a",
    "permission.emergency.status.requested":
      "\u0110ang y\u00eau c\u1ea7u m\u1edf",
    "permission.emergency.expires": "H\u1ebft h\u1ea1n m\u1edf kh\u00f3a",

    "permission.review.title": "Xem thay \u0111\u1ed5i",
    "permission.review.subtitle":
      "C\u1eadp nh\u1eadt quy\u1ec1n trong phi\u00ean n\u00e0y.",
    "permission.audit.title": "Nh\u1eadt k\u00fd ki\u1ec3m tra",
    "permission.audit.subtitle":
      "Theo d\u00f5i h\u00e0nh \u0111\u1ed9ng trong phi\u00ean n\u00e0y.",
    "permission.audit.loading": "\u0110ang t\u1ea3i nh\u1eadt k\u00fd...",
    "permission.audit.empty": "Ch\u01b0a c\u00f3 ho\u1ea1t \u0111\u1ed9ng.",
    "permission.audit.emptyChanges":
      "Ch\u01b0a ghi nh\u1eadn thay \u0111\u1ed5i.",
    "permission.audit.unknown": "Kh\u00f4ng r\u00f5",

    "permission.audit.permissionChange":
      "{role} \u1edf {area} thay \u0111\u1ed5i t\u1eeb {from} sang {to}.",
    "permission.audit.exportedPolicy":
      "\u0110\u00e3 xu\u1ea5t ch\u00ednh s\u00e1ch ph\u00e2n quy\u1ec1n.",
    "permission.audit.createdUser":
      "\u0110\u00e3 t\u1ea1o ng\u01b0\u1eddi d\u00f9ng {name}.",
    "permission.audit.updatedRole":
      "\u0110\u00e3 c\u1eadp nh\u1eadt vai tr\u00f2 cho {name}.",
    "permission.audit.updateRoleFailed":
      "Kh\u00f4ng th\u1ec3 c\u1eadp nh\u1eadt vai tr\u00f2.",
    "permission.audit.deletedUser":
      "\u0110\u00e3 x\u00f3a ng\u01b0\u1eddi d\u00f9ng {name}.",
    "permission.audit.updatedPermissions":
      "\u0110\u00e3 c\u1eadp nh\u1eadt quy\u1ec1n cho {name}.",
    "permission.audit.updatePermissionsFailed":
      "Kh\u00f4ng th\u1ec3 c\u1eadp nh\u1eadt quy\u1ec1n.",

    "permission.edit.title": "Ch\u1ec9nh s\u1eeda quy\u1ec1n",
    "permission.edit.subtitle":
      "\u0110i\u1ec1u ch\u1ec9nh quy\u1ec1n cho {name}.",
    "permission.edit.selectLevel": "Ch\u1ecdn m\u1ee9c quy\u1ec1n",
    "permission.edit.reset": "Kh\u00f4i ph\u1ee5c theo vai tr\u00f2",
    "permission.edit.save": "L\u01b0u quy\u1ec1n",

    "permission.role.superAdmin.title": "Si\u00eau qu\u1ea3n tr\u1ecb",
    "permission.role.superAdmin.subtitle": "Qu\u1ea3n tr\u1ecb",
    "permission.role.superAdmin.badge": "C\u1ea5p ch\u1ee7 s\u1edf h\u1eefu",
    "permission.role.superAdmin.perk1":
      "S\u1edf h\u1eefu quy\u1ebft \u0111\u1ecbnh ch\u00ednh s\u00e1ch v\u00e0 kh\u00f3a quan tr\u1ecdng",
    "permission.role.superAdmin.perk2":
      "To\u00e0n quy\u1ec1n v\u1edbi thanh to\u00e1n, ng\u01b0\u1eddi d\u00f9ng v\u00e0 nh\u1eadt k\u00fd ki\u1ec3m tra",
    "permission.role.superAdmin.perk3":
      "C\u00f3 th\u1ec3 c\u1ea5p quy\u1ec1n kh\u1ea9n c\u1ea5p v\u00e0 thu h\u1ed3i ngay",

    "permission.role.admin.title": "Qu\u1ea3n tr\u1ecb vi\u00ean",
    "permission.role.admin.subtitle": "V\u1eadn h\u00e0nh",
    "permission.role.admin.badge": "Truy c\u1eadp c\u1ed1t l\u00f5i",
    "permission.role.admin.perk1":
      "Qu\u1ea3n l\u00fd s\u1ea3n ph\u1ea9m, ki\u1ec3m \u0111\u1ecbnh v\u00e0 gi\u00e1",
    "permission.role.admin.perk2": "M\u1eddi kh\u00e1ch v\u00e0 giao vi\u1ec7c",
    "permission.role.admin.perk3":
      "Duy\u1ec7t y\u00eau c\u1ea7u thay \u0111\u1ed5i v\u00e0 ph\u00ea duy\u1ec7t",

    "permission.role.guest.title": "Kh\u00e1ch",
    "permission.role.guest.subtitle": "Quan s\u00e1t",
    "permission.role.guest.badge": "Gi\u1edbi h\u1ea1n",
    "permission.role.guest.perk1":
      "Xem t\u1ed3n kho v\u00e0 chi ti\u1ebft ki\u1ec3m \u0111\u1ecbnh",
    "permission.role.guest.perk2":
      "G\u1eedi y\u00eau c\u1ea7u thay \u0111\u1ed5i \u0111\u1ec3 ph\u00ea duy\u1ec7t",
    "permission.role.guest.perk3":
      "Kh\u00f4ng truy c\u1eadp gi\u00e1 mua ho\u1eb7c thanh to\u00e1n",

    "profile.save": "L\u01b0u h\u1ed3 s\u01a1",
    "profile.details": "Th\u00f4ng tin h\u1ed3 s\u01a1",
    "profile.displayName": "T\u00ean hi\u1ec3n th\u1ecb",
    "profile.avatar": "\u1ea2nh \u0111\u1ea1i di\u1ec7n",
    "profile.phonePlaceholder": "0900 000 000",
    "profile.addressPlaceholder": "Qu\u1eadn, th\u00e0nh ph\u1ed1",
    "profile.avatarHint":
      "PNG ho\u1eb7c JPG. N\u00ean d\u00f9ng \u1ea3nh vu\u00f4ng.",
    "profile.chooseFiles": "Ch\u1ecdn t\u1ec7p",
    "profile.noFile": "Ch\u01b0a ch\u1ecdn t\u1ec7p",
    "profile.updated": "\u0110\u00e3 c\u1eadp nh\u1eadt h\u1ed3 s\u01a1.",
    "profile.updateFailed":
      "Kh\u00f4ng th\u1ec3 c\u1eadp nh\u1eadt h\u1ed3 s\u01a1.",
    "profile.notesTitle": "Ghi ch\u00fa nhanh",
    "profile.note1":
      "C\u1eadp nh\u1eadt th\u00f4ng tin li\u00ean h\u1ec7 \u0111\u1ec3 ph\u00ea duy\u1ec7t ch\u00ednh x\u00e1c.",
    "profile.note2":
      "\u1ea2nh \u0111\u1ea1i di\u1ec7n s\u1ebd hi\u1ec7n tr\u00ean thanh tr\u00ean sau khi l\u01b0u.",
    "profile.note3":
      "Email v\u00e0 vai tr\u00f2 do qu\u1ea3n tr\u1ecb vi\u00ean qu\u1ea3n l\u00fd.",

    "product.title": "S\u1ea3n ph\u1ea9m",
    "product.search": "T\u00ecm ki\u1ebfm s\u1ea3n ph\u1ea9m...",
    "product.loading": "\u0110ang t\u1ea3i s\u1ea3n ph\u1ea9m...",
    "product.empty.title": "Kh\u00f4ng c\u00f3 s\u1ea3n ph\u1ea9m",
    "product.filter.all": "T\u1ea5t c\u1ea3",
    "product.filter.jewelry": "Ki\u1ec3u trang s\u1ee9c",
    "product.filter.gemstone": "Ch\u1ea5t",
    "product.filter.price": "Gi\u00e1",
    "product.noFile": "Ch\u01b0a ch\u1ecdn t\u1ec7p",
    "product.filesSelected": "\u0110\u00e3 ch\u1ecdn {count} t\u1ec7p",
    "product.request.sent":
      "\u0110\u00e3 g\u1eedi y\u00eau c\u1ea7u. \u0110ang ch\u1edd ph\u00ea duy\u1ec7t.",
    "product.request.failed":
      "G\u1eedi y\u00eau c\u1ea7u th\u1ea5t b\u1ea1i. Vui l\u00f2ng th\u1eed l\u1ea1i.",
    "product.request.sending": "\u0110ang g\u1eedi y\u00eau c\u1ea7u...",
    "product.request.cta": "Y\u00eau c\u1ea7u xem gi\u00e1 nh\u1eadp",
    "product.request.title": "Y\u00eau c\u1ea7u xem gi\u00e1 nh\u1eadp",
    "product.error.missing": "Thiếu dữ liệu sản phẩm.",
    "product.error.load": "Không thể tải sản phẩm.",
    "product.error.upload": "Không thể tải ảnh lên.",
    "product.error.save": "Không thể lưu sản phẩm.",
    "product.error.delete": "Không thể xóa sản phẩm.",
    "product.noPricingAccess": "Bạn không có quyền truy cập dữ liệu này",
    "product.empty.hint":
      "Th\u1eed \u0111i\u1ec1u ch\u1ec9nh t\u1eeb kh\u00f3a t\u00ecm ki\u1ebfm",
    "product.empty.addFirst":
      "Th\u00eam s\u1ea3n ph\u1ea9m \u0111\u1ea7u ti\u00ean",
    "product.dialog.add": "Th\u00eam s\u1ea3n ph\u1ea9m",
    "product.dialog.edit": "Ch\u1ec9nh s\u1eeda s\u1ea3n ph\u1ea9m",
    "product.image.label": "H\u00ecnh \u1ea3nh",
    "product.image.choose": "Ch\u1ecdn t\u1ec7p",
    "product.image.uploading": "\u0110ang t\u1ea3i \u1ea3nh l\u00ean...",
    "product.image.defaultFirst":
      "\u1ea2nh m\u1eb7c \u0111\u1ecbnh (\u1ea3nh \u0111\u1ea7u ti\u00ean)",
    "product.image.none": "Ch\u01b0a c\u00f3 \u1ea3nh",
    "product.image.alt": "\u1ea2nh s\u1ea3n ph\u1ea9m",
    "product.image.altIndex": "\u1ea2nh s\u1ea3n ph\u1ea9m {index}",
    "product.image.primary": "\u1ea2nh ch\u00ednh",
    "product.image.remove": "X\u00f3a \u1ea3nh",

    "product.header.title": "Qu\u1ea3n l\u00fd s\u1ea3n ph\u1ea9m",
    "product.header.subtitle":
      "Qu\u1ea3n l\u00fd trang s\u1ee9c v\u00e0 th\u00f4ng tin chi ti\u1ebft",
    "product.add": "Th\u00eam s\u1ea3n ph\u1ea9m",
    "product.adminOnly": "Ch\u1ec9 Admin",
    "product.summary.total": "T\u1ed5ng",
    "product.summary.inventoryTotal":
      "T\u1ed5ng s\u1ed1 s\u1ea3n ph\u1ea9m trong kho",
    "product.summary.certifiedPercentage": "% trong kho",
    "product.summary.awaitingVerification": "Ch\u1edd ki\u1ec3m \u0111\u1ecbnh",
    "product.summary.needsVerification": "C\u1ea7n ki\u1ec3m \u0111\u1ecbnh",
    "product.info.basicInformation": "Th\u00f4ng tin c\u01a1 b\u1ea3n",
    "product.info.dimensions": "K\u00edch th\u01b0\u1edbc & K\u1ef9 thu\u1eadt",
    "product.info.pricing": "Th\u00f4ng tin gi\u00e1",
    "product.info.certification":
      "Ki\u1ec3m \u0111\u1ecbnh & X\u00e1c th\u1ef1c",
    "product.action.requestAccess": "Y\u00eau c\u1ea7u truy c\u1eadp",
    "product.buyLabel": "Gi\u00e1 nh\u1eadp:",
    "product.description.empty": "Kh\u00f4ng c\u00f3 m\u00f4 t\u1ea3",
    "product.action.view": "Xem s\u1ea3n ph\u1ea9m",
    "product.action.edit": "Ch\u1ec9nh s\u1eeda",
    "product.action.delete": "X\u00f3a",
    "product.action.viewDetails": "Xem chi ti\u1ebft",
    "product.feedback.created": "\u0110\u00e3 th\u00eam s\u1ea3n ph\u1ea9m.",
    "product.feedback.updated":
      "\u0110\u00e3 c\u1eadp nh\u1eadt s\u1ea3n ph\u1ea9m.",
    "product.feedback.deleted": "\u0110\u00e3 x\u00f3a s\u1ea3n ph\u1ea9m.",
    "product.view.grid": "D\u1ea1ng l\u01b0\u1edbi",
    "product.view.table": "D\u1ea1ng b\u1ea3ng",

    "product.label.gemstone": "Ch\u1ea5t",
    "product.label.jewelry": "Ki\u1ec3u trang s\u1ee9c",
    "product.label.color": "M\u00e0u",
    "product.label.image": "H\u00ecnh \u1ea3nh",
    "product.label.dimension": "K\u00edch th\u01b0\u1edbc",
    "product.label.buyingPrice": "Gi\u00e1 thu",
    "product.label.sellingPrice": "Gi\u00e1 b\u00e1n",
    "product.label.certificateStatus":
      "T\u00ecnh tr\u1ea1ng ki\u1ec3m \u0111\u1ecbnh",
    "product.label.certificateId": "M\u00e3 ki\u1ec3m \u0111\u1ecbnh",
    "product.label.certificateAuthority": "N\u01a1i ki\u1ec3m \u0111\u1ecbnh",
    "product.label.certificateImage":
      "H\u00ecnh \u1ea3nh ki\u1ec3m \u0111\u1ecbnh",
    "product.label.actions": "H\u00e0nh \u0111\u1ed9ng",
    "product.label.description": "M\u00f4 t\u1ea3",
    "product.table.image": "H\u00ecnh \u1ea3nh",

    "product.placeholder.gemstone": "Ch\u1ecdn ch\u1ea5t",
    "product.placeholder.jewelry": "Ch\u1ecdn ki\u1ec3u trang s\u1ee9c",
    "product.placeholder.certificateStatus": "Ch\u1ecdn tr\u1ea1ng th\u00e1i",
    "product.placeholder.bangleProfile":
      "B\u1ea3n \u0111\u0169a / b\u1ea3n h\u1eb9",
    "product.placeholder.bangleShape": "V\u00f2ng tr\u00f2n / oval",
    "product.placeholder.earringType": "Ki\u1ec3u b\u00f4ng tai",
    "product.placeholder.innerDiameter": "Ni (mm)",
    "product.placeholder.width": "B\u1ec1 ngang (mm)",
    "product.placeholder.thickness": "\u0110\u1ed9 d\u00e0y (mm)",
    "product.placeholder.beadSize": "Size bi (mm)",
    "product.placeholder.beadMax": "Bi l\u1edbn nh\u1ea5t (mm)",
    "product.placeholder.beadMin": "Bi nh\u1ecf nh\u1ea5t (mm)",
    "product.placeholder.beadCount": "S\u1ed1 l\u01b0\u1ee3ng bi",
    "product.placeholder.beadLength": "Chi\u1ec1u d\u00e0i chu\u1ed7i (mm)",
    "product.placeholder.length": "Chi\u1ec1u d\u00e0i (mm)",
    "product.placeholder.ringSize": "Size nh\u1eabn",
    "product.placeholder.ringWidth": "B\u1ea3n nh\u1eabn (mm)",

    "product.dim.ni": "Ni",
    "product.dim.width": "Ngang",
    "product.dim.thickness": "D\u00e0y",
    "product.dim.beadSize": "Size bi",
    "product.dim.beadRange": "Bi",
    "product.dim.beadCount": "S\u1ed1 bi",
    "product.dim.length": "D\u00e0i",
    "product.dim.size": "Size",

    "product.jewelry.bracelet": "V\u00f2ng tay",
    "product.jewelry.beadedBracelet": "Chu\u1ed7i",
    "product.jewelry.pendant": "M\u1eb7t d\u00e2y",
    "product.jewelry.earrings": "B\u00f4ng tai",
    "product.jewelry.rings": "Nh\u1eabn",

    "product.earring.stud": "B\u00f4ng tai \u0111inh",
    "product.earring.drop": "B\u00f4ng tai gi\u1ecdt",
    "product.earring.hoop": "B\u00f4ng tai v\u00f2ng",
    "product.earring.dangle": "B\u00f4ng tai d\u00e0i",

    "product.bangle.profileRound": "B\u1ea3n \u0111\u0169a",
    "product.bangle.profileFlat": "B\u1ea3n h\u1eb9",
    "product.bangle.shapeRound": "V\u00f2ng tr\u00f2n",
    "product.bangle.shapeOval": "Oval (qu\u00fd phi)",

    "product.price.lt50": "< 50 tri\u1ec7u",
    "product.price.50to100": "50-100 tri\u1ec7u",
    "product.price.100to200": "100-200 tri\u1ec7u",
    "product.price.200to500": "200-500 tri\u1ec7u",

    "role.superAdmin": "Super Admin",
    "role.admin": "Admin",
    "role.guest": "Guest",

    "language.vi": "Ti\u1ebfng Vi\u1ec7t",
    "language.en": "Ti\u1ebfng Anh",
  },
  en: {
    "common.loading": "Loading...",
    "common.loadingShort": "...",
    "common.placeholder": "\u2014",
    "common.save": "Save",
    "common.saving": "Saving...",
    "common.cancel": "Cancel",
    "common.select": "Select",
    "common.view": "View",
    "common.yes": "Yes",
    "common.close": "Close",
    "common.email": "Email",
    "common.role": "Role",
    "common.phone": "Phone",
    "common.address": "Address",
    "common.password": "Password",
    "common.currentPassword": "Current password",
    "common.newPassword": "New password",
    "common.confirmPassword": "Confirm password",
    "common.update": "Update",
    "common.profile": "Profile",
    "common.language": "Language",
    "common.timezone": "Timezone",

    "brand.name": "Jade Store",
    "brand.subtitle": "Management System",
    "brand.copyright": "\u00a9 {year} Jade Management",

    "nav.dashboard": "Dashboard",
    "nav.inventory": "Inventory",
    "nav.permissions": "Permissions",
    "nav.overview": "Overview",
    "nav.products": "Products",
    "nav.accessControl": "Access Control",
    "nav.currentUser": "Current User",
    "nav.userFallback": "User",
    "nav.userInitial": "U",
    "nav.settings": "Settings",
    "nav.messages": "Messages",
    "nav.notifications": "Notifications",
    "nav.unreadCount": "{count} unread",
    "nav.noNotifications": "No notifications yet",
    "nav.refresh": "Refresh",
    "nav.markAllRead": "Mark all read",
    "nav.profile": "Profile",
    "nav.logout": "Logout",

    "feedback.title.success": "Success",
    "feedback.title.error": "Error",
    "feedback.title.warning": "Warning",
    "feedback.title.info": "Info",

    "auth.signIn": "Sign in",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.emailPlaceholder": "you@example.com",
    "auth.passwordPlaceholder":
      "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    "auth.invalidCredentials": "Invalid credentials. Please try again.",
    "auth.guestFailed": "Guest login failed. Please try again.",
    "auth.signingIn": "Signing in...",
    "auth.login": "Login",
    "auth.loginGuest": "Login as guest",
    "auth.enteringGuest": "Entering as guest...",
    "auth.loginSuccess": "Signed in successfully.",

    "settings.title": "Preferences & security",
    "settings.subtitle": "Configure language, timezone, and password security.",
    "settings.badge": "Workspace settings",
    "settings.card.preferences": "Language & timezone",
    "settings.card.password": "Password",
    "settings.savePreferences": "Save preferences",
    "settings.preferencesSaved": "Preferences saved.",
    "settings.preferencesFailed": "Failed to save preferences.",
    "settings.passwordUpdate": "Update password",
    "settings.passwordUpdated": "Password updated.",
    "settings.passwordFailed": "Failed to update password.",
    "settings.passwordMissing": "Enter current and new password.",
    "settings.passwordMismatch": "New password confirmation does not match.",
    "settings.timezone.hcm": "Asia/Ho Chi Minh",
    "settings.timezone.bangkok": "Asia/Bangkok",
    "settings.timezone.shanghai": "Asia/Shanghai",

    "settings.section.preferences.title": "Language & timezone",
    "settings.section.preferences.subtitle":
      "Set interface language and time display.",
    "settings.section.security.title": "Account security",
    "settings.section.security.subtitle": "Refresh passwords regularly.",
    "settings.section.summary.title": "Configuration summary",
    "settings.section.summary.subtitle": "Applies immediately after save.",
    "settings.section.summary.language": "Language",
    "settings.section.summary.timezone": "Timezone",
    "settings.section.summary.note":
      "Tip: Sync per device to avoid time drift.",
    "settings.section.support.title": "Quick support",
    "settings.section.support.subtitle": "Ways to keep your account safe.",
    "settings.section.support.tip1": "Rotate passwords every 90 days.",
    "settings.section.support.tip2": "Enable MFA for admin roles.",
    "settings.section.support.tip3": "Sign out of unknown devices.",

    "dashboard.badge": "Operational overview",
    "dashboard.title": "Executive dashboard",
    "dashboard.subtitle":
      "Track inventory, certification status, and recent performance at a glance.",

    "dashboard.section.snapshot.title": "Snapshot",
    "dashboard.section.snapshot.subtitle": "Today's core KPIs.",
    "dashboard.section.inventory.title": "Inventory lanes",
    "dashboard.section.inventory.subtitle": "Stock health and movement.",
    "dashboard.section.breakdown.title": "Verification mix",
    "dashboard.section.breakdown.subtitle": "Certificate status distribution.",

    "dashboard.action.viewInventory": "View inventory",
    "dashboard.action.manageProducts": "Manage products",

    "dashboard.products": "Products",
    "dashboard.productsTotal": "Total items in inventory",
    "dashboard.certificates": "Certificates",
    "dashboard.certificatesVerified": "Verified",
    "dashboard.status": "Status",
    "dashboard.pending": "Pending",
    "dashboard.unverified": "Unverified",
    "dashboard.latestProducts": "Latest products",
    "dashboard.table.gemstone": "Gemstone",
    "dashboard.table.jewelry": "Jewelry type",
    "dashboard.table.certificate": "Certificate",
    "dashboard.noProducts": "No products found.",
    "dashboard.breakdown": "Certificate breakdown",
    "dashboard.loadFailed": "Failed to load dashboard data.",

    "jewelry.bracelet": "Bangle",
    "jewelry.beadedBracelet": "Beaded bracelet",
    "jewelry.pendant": "Pendant",
    "jewelry.earrings": "Earrings",
    "jewelry.rings": "Ring",

    "gemstone.nuo": "Nuo",
    "gemstone.nuoTransformation": "Nuo transformation",
    "gemstone.nuoIce": "Nuo ice",
    "gemstone.ice": "Ice",
    "gemstone.highIce": "High ice",
    "gemstone.glass": "Glass",

    "certificate.verified": "Verified",
    "certificate.pending": "Pending",
    "certificate.unverified": "Unverified",

    "permission.loading": "Loading permissions...",
    "permission.restricted": "Access restricted. Redirecting...",
    "permission.header.badge": "Permission Center",
    "permission.header.title": "Secure access across roles",
    "permission.header.subtitle":
      "Define who can manage pricing, certificates, and operational controls. Keep sensitive actions gated and visible.",
    "permission.header.policy": "Policy v3.4",
    "permission.header.review": "Last review Feb 6, 2026",
    "permission.header.audit": "Audit ready",
    "permission.action.review": "Review changes",
    "permission.action.export": "Export policy",

    "permission.section.overview.title": "Overview",
    "permission.section.overview.subtitle": "Role-based access signals.",
    "permission.section.roles.title": "Roles",
    "permission.section.roles.subtitle": "Define authority tiers.",
    "permission.section.roles.cardTitle": "Role profiles",
    "permission.section.roles.cardSubtitle": "Clear access boundaries by team.",
    "permission.section.policy.title": "Policy",
    "permission.section.policy.subtitle": "Guardrails and emergency access.",
    "permission.section.access.title": "Access management",
    "permission.section.access.subtitle": "Users and permission matrix.",
    "permission.section.access.summaryTitle": "Access summary",
    "permission.section.access.summarySubtitle": "Policy sync health.",
    "permission.section.access.totalUsers": "Total users",
    "permission.section.access.policyStatus": "Policy status",
    "permission.section.access.syncing": "Syncing",
    "permission.section.access.synced": "Synced",
    "permission.section.governance.title": "Governance",
    "permission.section.governance.subtitle": "Approvals and audit trails.",
    "permission.section.governance.auditTitle": "Audit pulse",
    "permission.section.governance.auditSubtitle": "Review recent changes.",
    "permission.section.governance.auditNote":
      "Schedule routine reviews to stay compliant.",
    "permission.section.governance.openAudit": "Open audit log",

    "permission.highlight.roles": "Active roles",
    "permission.highlight.critical": "Critical permissions",
    "permission.highlight.pending": "Pending approvals",

    "permission.guardrails.title": "Guardrails",
    "permission.guardrails.subtitle":
      "Safety checks applied to every privileged action.",
    "permission.guardrails.nextAudit": "Next audit scheduled: March 12, 2026",
    "permission.guardrail.mfa.title": "MFA required",
    "permission.guardrail.mfa.desc":
      "All admins must enable multi-factor authentication.",
    "permission.guardrail.privileged.title": "Privileged actions",
    "permission.guardrail.privileged.desc":
      "Critical changes require two-person approval.",
    "permission.guardrail.integrity.title": "Certificate integrity",
    "permission.guardrail.integrity.desc":
      "Verified certificates cannot be edited by guests.",

    "permission.access.title": "Access & permissions",
    "permission.access.subtitle":
      "Manage users and tune the permission matrix in one place.",
    "permission.access.helper":
      "Create access for trusted staff with verified email and password credentials.",

    "permission.users.add": "Add user",
    "permission.users.addSubtitle":
      "Create a new user with email and password credentials.",

    "profile.section.personal.title": "Personal details",
    "profile.section.personal.subtitle": "Update contact information.",
    "profile.section.avatar.title": "Profile photo",
    "profile.section.avatar.subtitle": "Displayed on dashboards and profile.",
    "permission.users.loading": "Loading users...",
    "permission.users.empty": "No users found.",
    "permission.users.fallbackName": "User",
    "permission.users.noEmail": "No email",
    "permission.users.selectRole": "Select role",
    "permission.users.editPermissions": "Edit permissions",
    "permission.users.delete": "Delete",
    "permission.users.loadFailed": "Failed to load users.",
    "permission.users.required": "Email and password are required.",
    "permission.users.createFailed": "Failed to create user.",
    "permission.users.deleteFailed": "Failed to delete user.",
    "permission.users.cannotDeleteSelf": "You cannot delete your own account.",
    "permission.users.deleteConfirm": "Delete {name}?",
    "permission.users.thisUser": "this user",
    "permission.users.emailPlaceholder": "person@example.com",
    "permission.users.passwordPlaceholder": "••••••••",
    "permission.users.create": "Create user",

    "permission.matrix.title": "Permission matrix",
    "permission.matrix.subtitle":
      "Keep visibility consistent across products, certificates, and security settings.",
    "permission.matrix.syncing": "Syncing policy updates...",
    "permission.matrix.area": "Area",
    "permission.matrix.description": "Description",
    "permission.matrix.caption":
      "Use the dropdowns to select permission levels. Updates apply immediately to the product and certificate flows.",
    "permission.matrix.updated": "Updated",

    "permission.area.inventory": "Inventory & products",
    "permission.area.certificates": "Certificates",
    "permission.area.users": "User management",
    "permission.area.pricing": "Pricing & billing",
    "permission.area.security": "Security settings",
    "permission.area.audit": "Audit logs",

    "permission.desc.inventory": "Create, edit, and control pricing",
    "permission.desc.certificates": "Verify, issue, and revoke",
    "permission.desc.users": "Invite, deactivate, and assign roles",
    "permission.desc.pricing": "Buying costs, payouts, and invoices",
    "permission.desc.security": "SSO, MFA, and policy enforcement",
    "permission.desc.audit": "Export and monitor activity",

    "permission.level.full": "Full",
    "permission.level.manage": "Manage",
    "permission.level.read": "Read",
    "permission.level.limited": "Limited",
    "permission.level.none": "None",

    "permission.approvals.title": "Approval queue",
    "permission.approvals.subtitle":
      "Pending requests that need attention today.",
    "permission.approvals.loading": "Loading approvals...",
    "permission.approvals.requestedBy": "Requested by {name}",
    "permission.approvals.empty": "No approvals found.",
    "permission.approvals.showPending": "Show pending",
    "permission.approvals.viewAll": "View all requests",
    "permission.approvals.approve": "Approve selected",
    "permission.approvals.delete": "Delete selected",
    "permission.approval.waiting": "Waiting for admin",
    "permission.approval.needsSuper": "Needs Super Admin",
    "permission.approval.approved": "Approved",
    "permission.approval.rejected": "Rejected",

    "permission.emergency.title": "Emergency access",
    "permission.emergency.subtitle":
      "Only Super Admins can unlock critical actions.",
    "permission.emergency.note":
      "Use sparingly. Emergency elevation logs every action and expires after 60 minutes.",
    "permission.emergency.request": "Request override",
    "permission.emergency.cancel": "Cancel override request",
    "permission.emergency.viewAudit": "View audit log",
    "permission.emergency.status": "Current lock status",
    "permission.emergency.status.enforced": "Enforced",
    "permission.emergency.status.requested": "Override requested",
    "permission.emergency.expires": "Override expires",

    "permission.review.title": "Review changes",
    "permission.review.subtitle": "Recent permission updates in this session.",
    "permission.audit.title": "Audit log",
    "permission.audit.subtitle": "Tracking actions taken during this session.",
    "permission.audit.loading": "Loading audit history...",
    "permission.audit.empty": "No audit activity yet.",
    "permission.audit.emptyChanges": "No changes recorded yet.",
    "permission.audit.unknown": "Unknown",

    "permission.audit.permissionChange":
      "{role} permission for {area} changed from {from} to {to}.",
    "permission.audit.exportedPolicy": "Exported permission policy.",
    "permission.audit.createdUser": "Created user {name}.",
    "permission.audit.updatedRole": "Updated role for {name}.",
    "permission.audit.updateRoleFailed": "Failed to update user role.",
    "permission.audit.deletedUser": "Deleted user {name}.",
    "permission.audit.updatedPermissions": "Updated permissions for {name}.",
    "permission.audit.updatePermissionsFailed":
      "Failed to update user permissions.",

    "permission.edit.title": "Edit permissions",
    "permission.edit.subtitle": "Adjust access overrides for {name}.",
    "permission.edit.selectLevel": "Select level",
    "permission.edit.reset": "Reset to role defaults",
    "permission.edit.save": "Save permissions",

    "permission.role.superAdmin.title": "Super Admin",
    "permission.role.superAdmin.subtitle": "Governance",
    "permission.role.superAdmin.badge": "Owner tier",
    "permission.role.superAdmin.perk1":
      "Owns policy decisions and critical locks",
    "permission.role.superAdmin.perk2":
      "Full access to billing, users, and audit trails",
    "permission.role.superAdmin.perk3":
      "Can grant emergency access and revoke instantly",

    "permission.role.admin.title": "Admin",
    "permission.role.admin.subtitle": "Operations",
    "permission.role.admin.badge": "Core access",
    "permission.role.admin.perk1":
      "Manages products, certificates, and pricing",
    "permission.role.admin.perk2": "Invites guests and assigns tasks",
    "permission.role.admin.perk3": "Reviews change requests and approvals",

    "permission.role.guest.title": "Guest",
    "permission.role.guest.subtitle": "Observer",
    "permission.role.guest.badge": "Limited",
    "permission.role.guest.perk1": "Views inventory and certificate details",
    "permission.role.guest.perk2": "Submits change requests for approval",
    "permission.role.guest.perk3": "No access to buying prices or billing",

    "profile.save": "Save profile",
    "profile.details": "Profile details",
    "profile.displayName": "Display name",
    "profile.avatar": "Avatar",
    "profile.phonePlaceholder": "0900 000 000",
    "profile.addressPlaceholder": "District, city",
    "profile.avatarHint": "PNG or JPG. Recommended square image.",
    "profile.chooseFiles": "Choose files",
    "profile.noFile": "No file chosen",
    "profile.updated": "Profile updated.",
    "profile.updateFailed": "Failed to update profile.",
    "profile.notesTitle": "Quick notes",
    "profile.note1": "Update your contact details to keep approvals accurate.",
    "profile.note2": "Avatar changes appear in the top bar after saving.",
    "profile.note3": "Email and role are managed by administrators.",

    "product.title": "Products",
    "product.search": "Search products...",
    "product.loading": "Loading products...",
    "product.empty.title": "No products found",
    "product.filter.all": "All",
    "product.filter.jewelry": "Jewelry type",
    "product.filter.gemstone": "Gemstone",
    "product.filter.price": "Price",
    "product.noFile": "No file chosen",
    "product.filesSelected": "{count} files selected",
    "product.request.sent": "Request sent. Awaiting approval.",
    "product.request.failed": "Request failed. Please try again.",
    "product.request.sending": "Sending request...",
    "product.request.cta": "Request buying price access",
    "product.request.title": "Request to view buying price",
    "product.noPricingAccess": "You don't have permission to access this data",
    "product.error.missing": "Missing product data.",
    "product.error.load": "Failed to load products.",
    "product.error.upload": "Failed to upload image.",
    "product.error.save": "Failed to save product.",
    "product.error.delete": "Failed to delete product.",
    "product.empty.hint": "Try adjusting your search terms",
    "product.empty.addFirst": "Add your first product",
    "product.dialog.add": "Add product",
    "product.dialog.edit": "Edit product",
    "product.image.label": "Images",
    "product.image.choose": "Choose files",
    "product.image.uploading": "Uploading image...",
    "product.image.defaultFirst": "Default image (first)",
    "product.image.none": "No image",
    "product.image.alt": "Product image",
    "product.image.altIndex": "Product image {index}",
    "product.image.primary": "Primary",
    "product.image.remove": "Remove image",

    "product.header.title": "Product management",
    "product.header.subtitle": "Manage your gemstone products and details",
    "product.add": "Add product",
    "product.adminOnly": "Admin only",
    "product.summary.total": "Total",
    "product.summary.inventoryTotal": "Total items in inventory",
    "product.summary.certifiedPercentage": "% of inventory",
    "product.summary.awaitingVerification": "Awaiting verification",
    "product.summary.needsVerification": "Needs verification",
    "product.info.basicInformation": "Basic Information",
    "product.info.dimensions": "Dimensions & Specifications",
    "product.info.pricing": "Pricing Information",
    "product.info.certification": "Certification & Authenticity",
    "product.action.requestAccess": "Request Access",
    "product.buyLabel": "Buy:",
    "product.description.empty": "No description",
    "product.action.view": "View product",
    "product.action.edit": "Edit",
    "product.action.delete": "Delete",
    "product.action.viewDetails": "View details",
    "product.feedback.created": "Product created.",
    "product.feedback.updated": "Product updated.",
    "product.feedback.deleted": "Product deleted.",
    "product.view.grid": "Grid view",
    "product.view.table": "Table view",

    "product.label.gemstone": "Gemstone",
    "product.label.jewelry": "Jewelry type",
    "product.label.color": "Color",
    "product.label.image": "Images",
    "product.label.dimension": "Dimensions",
    "product.label.buyingPrice": "Buying price",
    "product.label.sellingPrice": "Selling price",
    "product.label.certificateStatus": "Certificate status",
    "product.label.certificateId": "Certificate ID",
    "product.label.certificateAuthority": "Certificate authority",
    "product.label.certificateImage": "Certificate image",
    "product.label.actions": "Actions",
    "product.label.description": "Description",
    "product.table.image": "Image",

    "product.placeholder.gemstone": "Select gemstone",
    "product.placeholder.jewelry": "Select jewelry type",
    "product.placeholder.certificateStatus": "Select status",
    "product.placeholder.bangleProfile": "Round / flat",
    "product.placeholder.bangleShape": "Round / oval",
    "product.placeholder.earringType": "Earring type",
    "product.placeholder.innerDiameter": "Inner diameter (mm)",
    "product.placeholder.width": "Width (mm)",
    "product.placeholder.thickness": "Thickness (mm)",
    "product.placeholder.beadSize": "Bead size (mm)",
    "product.placeholder.beadMax": "Max bead (mm)",
    "product.placeholder.beadMin": "Min bead (mm)",
    "product.placeholder.beadCount": "Bead count",
    "product.placeholder.beadLength": "Bracelet length (mm)",
    "product.placeholder.length": "Length (mm)",
    "product.placeholder.ringSize": "Ring size",
    "product.placeholder.ringWidth": "Ring width (mm)",

    "product.dim.ni": "Inner",
    "product.dim.width": "Width",
    "product.dim.thickness": "Thickness",
    "product.dim.beadSize": "Bead size",
    "product.dim.beadRange": "Bead",
    "product.dim.beadCount": "Beads",
    "product.dim.length": "Length",
    "product.dim.size": "Size",

    "product.jewelry.bracelet": "Bracelet",
    "product.jewelry.beadedBracelet": "Beaded bracelet",
    "product.jewelry.pendant": "Pendant",
    "product.jewelry.earrings": "Earrings",
    "product.jewelry.rings": "Ring",

    "product.earring.stud": "Stud",
    "product.earring.drop": "Drop",
    "product.earring.hoop": "Hoop",
    "product.earring.dangle": "Dangle",

    "product.bangle.profileRound": "Round profile",
    "product.bangle.profileFlat": "Flat profile",
    "product.bangle.shapeRound": "Round",
    "product.bangle.shapeOval": "Oval",

    "product.price.lt50": "< 50 million",
    "product.price.50to100": "50-100 million",
    "product.price.100to200": "100-200 million",
    "product.price.200to500": "200-500 million",

    "role.superAdmin": "Super Admin",
    "role.admin": "Admin",
    "role.guest": "Guest",

    "language.vi": "Vietnamese",
    "language.en": "English",
  },
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

const isLanguageCode = (value?: string): value is LanguageCode =>
  value === "vi" || value === "en";

const detectBrowserLanguage = (): LanguageCode => {
  if (typeof navigator === "undefined") return "vi";
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "vi";
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const hasStoredPreference = useRef(false);
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("gm_language");
    if (isLanguageCode(stored)) {
      hasStoredPreference.current = true;
      setLanguageState(stored);
      return;
    }
    setLanguageState(detectBrowserLanguage());
  }, []);

  useEffect(() => {
    if (!user?.language || hasStoredPreference.current) return;
    if (isLanguageCode(user.language)) {
      setLanguageState(user.language);
    }
  }, [user?.language]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("gm_language", lang);
      hasStoredPreference.current = true;
    }
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    const template =
      translations[language]?.[key] || translations.en[key] || key;
    if (!params) return template;
    return Object.keys(params).reduce((result, paramKey) => {
      const value = String(params[paramKey]);
      return result.replaceAll(`{${paramKey}}`, value);
    }, template);
  };

  const value = useMemo(() => ({ language, setLanguage, t }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useTranslation must be used within LanguageProvider");
  }
  return ctx;
}
