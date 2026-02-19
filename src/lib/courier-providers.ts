// Courier Provider Configuration
// List of supported courier companies with tracking URL patterns

export interface CourierProvider {
  id: string;
  name: string;
  trackingUrlPattern: string; // Use {trackingNumber} as placeholder
  description?: string;
}

export const COURIER_PROVIDERS: CourierProvider[] = [
  {
    id: 'india-post',
    name: 'India Post',
    trackingUrlPattern: 'https://www.indiapost.gov.in/_layouts/15/dop.portal.tracking/trackconsignment.aspx?consignmentnumber={trackingNumber}',
    description: 'Government postal service',
  },
  {
    id: 'dtdc',
    name: 'DTDC',
    trackingUrlPattern: 'https://www.dtdc.in/tracking.asp?trackingNumber={trackingNumber}',
    description: 'DTDC Express Limited',
  },
  {
    id: 'bluedart',
    name: 'Blue Dart',
    trackingUrlPattern: 'https://www.bluedart.com/web/guest/trackdartresult?trackFor=0&trackNo={trackingNumber}',
    description: 'Blue Dart Express',
  },
  {
    id: 'delhivery',
    name: 'Delhivery',
    trackingUrlPattern: 'https://www.delhivery.com/track/package/{trackingNumber}',
    description: 'Delhivery Limited',
  },
  {
    id: 'ecom-express',
    name: 'Ecom Express',
    trackingUrlPattern: 'https://ecomexpress.in/tracking/?awb_field={trackingNumber}',
    description: 'Ecom Express Logistics',
  },
  {
    id: 'fedex',
    name: 'FedEx',
    trackingUrlPattern: 'https://www.fedex.com/fedextrack/?tracknumbers={trackingNumber}',
    description: 'FedEx India',
  },
  {
    id: 'dhl',
    name: 'DHL',
    trackingUrlPattern: 'https://www.dhl.com/in-en/home/tracking.html?tracking-id={trackingNumber}',
    description: 'DHL Express India',
  },
  {
    id: 'aramex',
    name: 'Aramex',
    trackingUrlPattern: 'https://www.aramex.com/in/en/track/shipments?ShipmentNumber={trackingNumber}',
    description: 'Aramex India',
  },
  {
    id: 'xpressbees',
    name: 'XpressBees',
    trackingUrlPattern: 'https://www.xpressbees.com/shipment/tracking?awbNo={trackingNumber}',
    description: 'XpressBees Logistics',
  },
  {
    id: 'shadowfax',
    name: 'Shadowfax',
    trackingUrlPattern: 'https://www.shadowfax.in/track?tracking_id={trackingNumber}',
    description: 'Shadowfax Logistics',
  },
  {
    id: 'other',
    name: 'Other',
    trackingUrlPattern: '',
    description: 'Other courier service (manual tracking)',
  },
];

/**
 * Get tracking URL for a courier company
 * @param courierId - Courier provider ID
 * @param trackingNumber - AWB or tracking number
 * @returns Complete tracking URL
 */
export function getTrackingUrl(courierId: string, trackingNumber: string): string {
  const provider = COURIER_PROVIDERS.find(p => p.id === courierId);
  if (!provider || !provider.trackingUrlPattern) {
    return '';
  }
  return provider.trackingUrlPattern.replace('{trackingNumber}', trackingNumber);
}

/**
 * Get courier provider by ID
 */
export function getCourierProvider(courierId: string): CourierProvider | undefined {
  return COURIER_PROVIDERS.find(p => p.id === courierId);
}

/**
 * Get courier provider name by ID
 */
export function getCourierName(courierId: string): string {
  const provider = getCourierProvider(courierId);
  return provider?.name || courierId;
}
