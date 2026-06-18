/** True when the browser reports Ubuntu/Linux desktop or a Xiaomi-family mobile device. */
export function isUbuntuOrXiaomiMobile() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const ua = navigator.userAgent;
  const isLinuxDesktop = /Linux/i.test(ua) && !/Android/i.test(ua);
  const isUbuntu = /Ubuntu/i.test(ua) || isLinuxDesktop;
  const isXiaomiMobile =
    /Android/i.test(ua) && /Xiaomi|Redmi|MIUI|Poco|\bMi[\s-]/i.test(ua);

  return isUbuntu || isXiaomiMobile;
}
