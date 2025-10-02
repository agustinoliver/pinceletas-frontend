export interface Country {
  code: string;
  name: string;
  flag: string;
  continent: string;
  currency: string;
  phoneCode: string;
}

export interface State {
  code: string;
  name: string;
  countryCode: string;
  type: string;
}