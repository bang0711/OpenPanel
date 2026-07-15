export type AlertRule = {
  id: string;
  metric: string;
  op: string;
  threshold: number;
  target: string | null;
  channelId: string | null;
  enabled: boolean;
  firing: boolean;
};

export type AlertChannel = {
  id: string;
  name: string;
};

export type AlertsData = {
  rules: AlertRule[];
  channels: AlertChannel[];
};

export type CreateAlertBody = {
  metric: string;
  op: string;
  threshold: number;
  target?: string;
  channelId?: string;
};
