export interface Client {
  c_code: string;
  c_name: string;
  c_status?: string;
  email: string;
  mobile?: string;
  pan?: string;
  address?: string;
  street?: string;
  area?: string;
  city?: string;
  pincode?: string;
  state?: string;
  phone1?: string;
  phone2?: string;
  fax?: string;
  bank_name?: string;
  bse_code?: string;
  display_name?: string;
  bank_name_1?: string;
  acc_no_1?: string;
  micr_1?: string;
  ifsc_1?: string;
  bank_name_2?: string;
  acc_no_2?: string;
  micr_2?: string;
  ifsc_2?: string;
  dpid?: string;
  dpname?: string;
  client_id?: string;
  rm_code?: string;
  rm_name?: string;
  user_id?: number;
}

export interface AMC {
  id: string;
  amc_name: string;
  is_active: boolean;
}

export interface SchemeType {
  id: string;
  type_name: string;
  is_active: boolean;
}

export interface Scheme {
  s_code: string;
  s_name: string;
  type: string;
  amc: string;
  is_active: boolean;
  created_at?: string;
}

export interface CartItem {
  id: number;
  user_id: number;
  client_code: string;
  transaction_type: string;
  scheme_code: string;
  scheme_to_code?: string;
  amount: number;
  units: number;
  frequency?: string;
  sip_day?: number;
  start_date?: string;
  mandate_id?: string;
  folio_no?: string;
  all_units: boolean;
  comment?: string;
  created_at: string;
  scheme_name?: string;
  scheme_amc?: string;
  // New fields
  client_name?: string;
  portfolio?: string;
  amc_name?: string;
  scheme_type_field?: string;
  isin?: string;
  bse_scheme?: boolean;
  current_value?: number;
  bal_unit?: number;
  txn_type?: string; // Fresh / Additional
  start_date_field?: string;
  end_date?: string;
  keep_client_blocked?: boolean;
  keep_scheme_blocked?: boolean;
  // SIP fields
  installment_amount?: number;
  no_of_installments?: number;
  sip_date_day_allowed?: string;
  first_order_flag?: boolean;
  sip_start_date?: string;
  // SPREAD fields
  redemption_amount?: number;
  redemption_date?: string;
  bank_name?: string;
  tin_type?: string;
  // STP fields
  stp_amount?: number;
  stp_frequency?: string;
  stp_no_of_installments?: number;
  stp_start_date?: string;
  stp_end_date?: string;
  target_scheme?: string;
  source_scheme?: string;
  // SWP fields
  withdrawal_amount?: number;
  quantity?: number;
  swp_frequency?: string;
  swp_no_of_installments?: number;
  swp_start_date?: string;
  swp_end_date?: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  client_code: string;
  transaction_type: string;
  scheme_code: string;
  scheme_to_code?: string;
  amount: number;
  units: number;
  frequency?: string;
  sip_day?: number;
  start_date?: string;
  mandate_id?: string;
  folio_no?: string;
  all_units: boolean;
  comment?: string;
  transaction_date: string;
  status: string;
  created_at: string;
  scheme_name?: string;
  scheme_amc?: string;
  scheme_type?: string;
  // New fields
  client_name?: string;
  portfolio?: string;
  amc_name?: string;
  scheme_type_field?: string;
  isin?: string;
  bse_scheme?: boolean;
  current_value?: number;
  bal_unit?: number;
  txn_type?: string; // Fresh / Additional
  start_date_field?: string;
  end_date?: string;
  keep_client_blocked?: boolean;
  keep_scheme_blocked?: boolean;
  // SIP fields
  installment_amount?: number;
  no_of_installments?: number;
  sip_date_day_allowed?: string;
  first_order_flag?: boolean;
  sip_start_date?: string;
  // SPREAD fields
  redemption_amount?: number;
  redemption_date?: string;
  bank_name?: string;
  tin_type?: string;
  // STP fields
  stp_amount?: number;
  stp_frequency?: string;
  stp_no_of_installments?: number;
  stp_start_date?: string;
  stp_end_date?: string;
  target_scheme?: string;
  source_scheme?: string;
  // SWP fields
  withdrawal_amount?: number;
  quantity?: number;
  swp_frequency?: string;
  swp_no_of_installments?: number;
  swp_start_date?: string;
  swp_end_date?: string;
}

export interface Reminder {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  reminder_date: string;
  reminder_time?: string;
  color: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface BSEScheme {
  ID: number;
  Unique_No?: string;
  Scheme_Code: string;
  RTA_Scheme_Code?: string;
  AMC_Scheme_Code?: string;
  ISIN: string;
  AMC_Code: string;
  Scheme_Name: string;
  Purchase_Transaction_mode?: string;
  Minimum_Purchase_Amount?: number;
  Additional_Purchase_Amount_Multiple?: number;
  Maximum_Purchase_Amount?: number;
  Purchase_Allowed?: string;
  Purchase_Cutoff_Time?: string;
  Redemption_Transaction_Mode?: string;
  Minimum_Redemption_Qty?: number;
  Redemption_Qty_Multiplier?: number;
  Maximum_Redemption_Qty?: number;
  Redemption_Allowed?: string;
  Redemption_Cut_off_Time?: string;
  RTA_Agent_Code?: string;
  AMC_Active_Flag?: number;
  Dividend_Reinvestment_Flag?: string;
  Scheme_Type?: string;
  SIP_FLAG?: string;
  STP_FLAG?: string;
  SWP_FLAG?: string;
  SETTLEMENT_TYPE?: string;
  Purchase_Amount_Multiplier?: number;
  TDate?: Date;
  SIP_Trigger?: string;
  STP_Trigger?: string;
  SWP_Trigger?: string;
  SchemePlan?: string;
  AMC_IND?: string;
  FaceValue?: number;
  StartDate?: Date;
  EndDate?: Date;
  ExitLoadFlag?: string;
  ExitLoad?: string;
  LockinPeriodFlag?: string;
  LockinPeriod?: string;
  ChannelPartnerCode?: string;
}
