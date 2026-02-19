/**
 * Shiprocket API Integration
 *
 * Features:
 * - Automatic AWB generation
 * - Rate calculation across multiple couriers
 * - Shipment creation and tracking
 * - Pickup scheduling
 *
 * Documentation: https://apidocs.shiprocket.in/
 */

interface ShiprocketAuth {
  token: string;
  expiresAt: number;
}

interface ShiprocketOrderItem {
  name: string;
  sku: string;
  units: number;
  selling_price: number;
  discount?: number;
  tax?: number;
  hsn?: number;
}

interface ShiprocketAddress {
  name: string;
  address: string;
  address_2?: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email?: string;
}

interface ShiprocketShipmentRequest {
  order_id: string;
  order_date: string;
  pickup_location: string;
  billing_customer_name: string;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_pincode: string;
  billing_phone: string;
  billing_email?: string;
  shipping_is_billing: boolean;
  shipping_customer_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  shipping_phone?: string;
  order_items: ShiprocketOrderItem[];
  payment_method: 'Prepaid' | 'COD';
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

interface ShiprocketCourier {
  courier_company_id: number;
  courier_name: string;
  freight_charge: number;
  estimated_delivery_days: string;
  cod_charges: number;
  rate: number;
}

class ShiprocketService {
  private baseUrl = 'https://apiv2.shiprocket.in/v1/external';
  private auth: ShiprocketAuth | null = null;
  private email: string;
  private password: string;

  constructor() {
    this.email = process.env.SHIPROCKET_EMAIL || '';
    this.password = process.env.SHIPROCKET_PASSWORD || '';
  }

  /**
   * Authenticate with Shiprocket and get access token
   */
  private async authenticate(): Promise<string> {
    // Return cached token if still valid
    if (this.auth && this.auth.expiresAt > Date.now()) {
      return this.auth.token;
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email,
          password: this.password,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Shiprocket auth failed: ${error.message || response.statusText}`);
      }

      const data = await response.json();

      // Cache token for 9 days (tokens expire after 10 days)
      this.auth = {
        token: data.token,
        expiresAt: Date.now() + (9 * 24 * 60 * 60 * 1000),
      };

      return data.token;
    } catch (error) {
      console.error('[Shiprocket] Authentication error:', error);
      throw error;
    }
  }

  /**
   * Make authenticated request to Shiprocket API
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = await this.authenticate();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Shiprocket API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a new shipment order
   */
  async createOrder(orderData: ShiprocketShipmentRequest) {
    try {
      const response = await this.request<any>('/orders/create/adhoc', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });

      return {
        success: true,
        orderId: response.order_id,
        shipmentId: response.shipment_id,
        message: 'Order created successfully',
      };
    } catch (error: any) {
      console.error('[Shiprocket] Create order error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get available couriers and rates for a shipment
   */
  async getServiceability(params: {
    pickup_postcode: string;
    delivery_postcode: string;
    weight: number; // in kg
    cod: 0 | 1;
    declared_value?: number;
  }) {
    try {
      const queryParams = new URLSearchParams({
        pickup_postcode: params.pickup_postcode,
        delivery_postcode: params.delivery_postcode,
        weight: params.weight.toString(),
        cod: params.cod.toString(),
        ...(params.declared_value && { declared_value: params.declared_value.toString() }),
      });

      const response = await this.request<any>(`/courier/serviceability/?${queryParams}`);

      if (!response.data || response.data.available_courier_companies?.length === 0) {
        return {
          success: false,
          error: 'No couriers available for this route',
        };
      }

      const couriers: ShiprocketCourier[] = response.data.available_courier_companies.map((c: any) => ({
        courier_company_id: c.courier_company_id,
        courier_name: c.courier_name,
        freight_charge: c.freight_charge,
        estimated_delivery_days: c.estimated_delivery_days,
        cod_charges: c.cod_charges || 0,
        rate: c.rate,
      }));

      // Sort by cheapest rate
      couriers.sort((a, b) => a.rate - b.rate);

      return {
        success: true,
        couriers,
        recommendedCourier: couriers[0], // Cheapest option
      };
    } catch (error: any) {
      console.error('[Shiprocket] Serviceability check error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate AWB (Air Waybill) for a shipment
   */
  async generateAWB(shipmentId: number, courierId: number) {
    try {
      const response = await this.request<any>('/courier/assign/awb', {
        method: 'POST',
        body: JSON.stringify({
          shipment_id: shipmentId,
          courier_id: courierId,
        }),
      });

      return {
        success: true,
        awbCode: response.response.data.awb_code,
        courierId: response.response.data.courier_company_id,
        courierName: response.response.data.courier_name,
      };
    } catch (error: any) {
      console.error('[Shiprocket] AWB generation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Schedule pickup for a shipment
   */
  async schedulePickup(shipmentId: number, pickupDate: string) {
    try {
      const response = await this.request<any>('/courier/generate/pickup', {
        method: 'POST',
        body: JSON.stringify({
          shipment_id: [shipmentId],
          pickup_date: pickupDate, // Format: YYYY-MM-DD
        }),
      });

      return {
        success: true,
        pickupScheduled: true,
        message: 'Pickup scheduled successfully',
      };
    } catch (error: any) {
      console.error('[Shiprocket] Pickup scheduling error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Track shipment by AWB or Order ID
   */
  async trackShipment(awbCode: string) {
    try {
      const response = await this.request<any>(`/courier/track/awb/${awbCode}`);

      const tracking = response.tracking_data;

      return {
        success: true,
        awbCode: tracking.awb_code,
        courierName: tracking.courier_name,
        currentStatus: tracking.shipment_status,
        deliveredDate: tracking.delivered_date,
        estimatedDeliveryDate: tracking.edd,
        trackingData: tracking.shipment_track || [],
      };
    } catch (error: any) {
      console.error('[Shiprocket] Tracking error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel a shipment
   */
  async cancelShipment(orderIds: number[]) {
    try {
      const response = await this.request<any>('/orders/cancel', {
        method: 'POST',
        body: JSON.stringify({ ids: orderIds }),
      });

      return {
        success: true,
        message: 'Shipment cancelled successfully',
      };
    } catch (error: any) {
      console.error('[Shiprocket] Cancellation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get all pickup locations
   */
  async getPickupLocations() {
    try {
      const response = await this.request<any>('/settings/company/pickup');

      const locations = response.data.shipping_address.map((loc: any) => ({
        id: loc.id,
        pickupLocation: loc.pickup_location,
        name: loc.name,
        address: loc.address,
        city: loc.city,
        state: loc.state,
        pincode: loc.pin_code,
        phone: loc.phone,
        email: loc.email,
      }));

      return {
        success: true,
        locations,
      };
    } catch (error: any) {
      console.error('[Shiprocket] Get pickup locations error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Helper: Convert our order format to Shiprocket format
   */
  formatOrderForShiprocket(order: any, pickupLocation: string = 'Primary'): ShiprocketShipmentRequest {
    const items: ShiprocketOrderItem[] = order.items.map((item: any) => ({
      name: item.name || 'Product',
      sku: item.productId || 'SKU001',
      units: item.quantity || 1,
      selling_price: item.price || 0,
      discount: 0,
      tax: 0,
    }));

    return {
      order_id: order.order_number,
      order_date: new Date(order.created_at).toISOString().split('T')[0],
      pickup_location: pickupLocation,
      billing_customer_name: order.delivery_address.name,
      billing_address: order.delivery_address.addressLine1,
      billing_city: order.delivery_address.city,
      billing_state: order.delivery_address.state,
      billing_pincode: order.delivery_address.pincode,
      billing_phone: order.delivery_address.phone,
      billing_email: order.delivery_address.email || '',
      shipping_is_billing: true,
      order_items: items,
      payment_method: 'Prepaid',
      sub_total: order.amount / 100, // Convert paisa to rupees
      length: 30, // Default dimensions in cm
      breadth: 20,
      height: 10,
      weight: 0.5, // Default weight in kg
    };
  }
}

// Export singleton instance
export const shiprocketService = new ShiprocketService();
