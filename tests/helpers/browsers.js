export function detectIE() {
  let userAgent = navigator.userAgent;
  return userAgent.indexOf("MSIE ") !== -1 || userAgent.indexOf("Trident/") !== -1 || userAgent.indexOf('Edge/') !== -1;
}
