declare const AD_NETWORK: string;

declare const ExitApi: { exit(): void } | undefined;
declare const mraid: { open(url: string): void } | undefined;
declare const FbPlayableAd: { onCTAClick(): void } | undefined;

let _ctaUrl = '';

export function setCtaUrl(url: string): void {
  _ctaUrl = url;
}

export function triggerCta(): void {
  if (typeof AD_NETWORK !== 'undefined') {
    switch (AD_NETWORK) {
      case 'google':
        if (typeof ExitApi !== 'undefined') ExitApi.exit();
        return;
      case 'mraid':
        if (typeof mraid !== 'undefined') mraid.open(_ctaUrl);
        return;
      case 'facebook':
        if (typeof FbPlayableAd !== 'undefined') FbPlayableAd.onCTAClick();
        return;
    }
  }
  // Fallback: open URL in new tab (dev mode)
  if (_ctaUrl) window.open(_ctaUrl, '_blank');
}
