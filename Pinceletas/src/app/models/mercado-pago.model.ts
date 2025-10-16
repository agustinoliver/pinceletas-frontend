export interface MercadoPagoResponse {
  id: string;
  initPoint: string;
  sandboxInitPoint: string;
}

export interface MercadoPagoPreference {
  items: MercadoPagoItem[];
  back_urls: {
    success: string;
    failure: string;
    pending: string;
  };
  auto_return: string;
  external_reference: string;
  notification_url: string;
}

export interface MercadoPagoItem {
  id: string;
  title: string;
  description: string;
  picture_url: string;
  category_id: string;
  quantity: number;
  currency_id: string;
  unit_price: number;
}